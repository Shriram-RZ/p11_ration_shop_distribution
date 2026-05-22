from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.shop import Shop
from app.models.beneficiary import RationCard
from app.models.stock import StockItem
from app.schemas.shop import ShopCreate, ShopUpdate, ShopResponse, ShopListResponse
from app.schemas.stock import StockItemResponse, StockItemListResponse
from app.schemas.beneficiary import RationCardResponse, RationCardListResponse

router = APIRouter(prefix="/shops", tags=["Shops"])


@router.get("", response_model=ShopListResponse)
def list_shops(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Shop)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Shop.name.ilike(term)) | (Shop.shop_code.ilike(term))
        )
    if district:
        query = query.filter(Shop.district.ilike(f"%{district}%"))
    if state:
        query = query.filter(Shop.state.ilike(f"%{state}%"))
    if is_active is not None:
        query = query.filter(Shop.is_active == is_active)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return ShopListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(
    request: Request,
    payload: ShopCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Shop).filter(Shop.shop_code == payload.shop_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shop with code '{payload.shop_code}' already exists",
        )

    shop = Shop(**payload.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)

    log_audit(
        db=db, user_id=current_user.id, action="CREATE", resource="shops",
        resource_id=shop.id, details={"name": shop.name, "code": shop.shop_code},
        ip_address=get_client_ip(request),
    )
    return shop


@router.get("/{shop_id}", response_model=ShopResponse)
def get_shop(
    shop_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    return shop


@router.put("/{shop_id}", response_model=ShopResponse)
def update_shop(
    shop_id: int,
    request: Request,
    payload: ShopUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shop, field, value)
    shop.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shop)

    log_audit(
        db=db, user_id=current_user.id, action="UPDATE", resource="shops",
        resource_id=shop_id, details=update_data, ip_address=get_client_ip(request),
    )
    return shop


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop(
    shop_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    shop.is_active = False
    shop.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db=db, user_id=current_user.id, action="DELETE", resource="shops",
        resource_id=shop_id, ip_address=get_client_ip(request),
    )


@router.get("/{shop_id}/stock", response_model=StockItemListResponse)
def get_shop_stock(
    shop_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    query = db.query(StockItem).options(
        joinedload(StockItem.commodity)
    ).filter(StockItem.shop_id == shop_id)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    result = []
    for item in items:
        item_dict = {
            "id": item.id, "commodity_id": item.commodity_id, "warehouse_id": item.warehouse_id,
            "shop_id": item.shop_id, "quantity": item.quantity, "minimum_quantity": item.minimum_quantity,
            "expiry_date": item.expiry_date, "batch_number": item.batch_number,
            "cost_per_unit": item.cost_per_unit, "created_at": item.created_at,
            "updated_at": item.updated_at, "commodity": item.commodity,
            "is_low_stock": item.quantity <= item.minimum_quantity,
        }
        result.append(StockItemResponse(**item_dict))

    return StockItemListResponse(items=result, total=total, page=page, size=size, pages=pages)


@router.get("/{shop_id}/beneficiaries", response_model=RationCardListResponse)
def get_shop_beneficiaries(
    shop_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    query = db.query(RationCard).options(
        joinedload(RationCard.holder),
        joinedload(RationCard.family_members),
    ).filter(RationCard.shop_id == shop_id)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return RationCardListResponse(items=items, total=total, page=page, size=size, pages=pages)
