from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_manager_or_admin, require_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.stock import Commodity, StockItem, StockTransaction, TransactionType
from app.schemas.stock import (
    CommodityCreate, CommodityUpdate, CommodityResponse,
    StockItemCreate, StockItemUpdate, StockItemResponse, StockItemListResponse,
    StockAdjustRequest,
    StockTransactionCreate, StockTransactionResponse, StockTransactionListResponse,
)

router = APIRouter(prefix="/stock", tags=["Stock Management"])


# ---- Commodities ----

@router.get("/commodities", response_model=list[CommodityResponse])
def list_commodities(
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Commodity)
    if is_active is not None:
        query = query.filter(Commodity.is_active == is_active)
    return query.order_by(Commodity.name).all()


@router.post("/commodities", response_model=CommodityResponse, status_code=status.HTTP_201_CREATED)
def create_commodity(
    request: Request,
    payload: CommodityCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Commodity).filter(Commodity.name.ilike(payload.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Commodity '{payload.name}' already exists",
        )
    commodity = Commodity(**payload.model_dump())
    db.add(commodity)
    db.commit()
    db.refresh(commodity)

    log_audit(
        db=db, user_id=current_user.id, action="CREATE", resource="commodities",
        resource_id=commodity.id, details={"name": commodity.name}, ip_address=get_client_ip(request),
    )
    return commodity


@router.put("/commodities/{commodity_id}", response_model=CommodityResponse)
def update_commodity(
    commodity_id: int,
    request: Request,
    payload: CommodityUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    commodity = db.query(Commodity).filter(Commodity.id == commodity_id).first()
    if not commodity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commodity not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(commodity, field, value)
    db.commit()
    db.refresh(commodity)
    return commodity


# ---- Stock Items ----

@router.get("/items", response_model=StockItemListResponse)
def list_stock_items(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = Query(None),
    shop_id: Optional[int] = Query(None),
    commodity_id: Optional[int] = Query(None),
    low_stock_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(StockItem).options(joinedload(StockItem.commodity))

    if warehouse_id:
        query = query.filter(StockItem.warehouse_id == warehouse_id)
    if shop_id:
        query = query.filter(StockItem.shop_id == shop_id)
    if commodity_id:
        query = query.filter(StockItem.commodity_id == commodity_id)
    if low_stock_only:
        query = query.filter(StockItem.quantity <= StockItem.minimum_quantity)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    # Annotate is_low_stock
    result = []
    for item in items:
        item_dict = {
            "id": item.id,
            "commodity_id": item.commodity_id,
            "warehouse_id": item.warehouse_id,
            "shop_id": item.shop_id,
            "quantity": item.quantity,
            "minimum_quantity": item.minimum_quantity,
            "expiry_date": item.expiry_date,
            "batch_number": item.batch_number,
            "cost_per_unit": item.cost_per_unit,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "commodity": item.commodity,
            "is_low_stock": item.quantity <= item.minimum_quantity,
        }
        result.append(StockItemResponse(**item_dict))

    return StockItemListResponse(items=result, total=total, page=page, size=size, pages=pages)


@router.post("/items", response_model=StockItemResponse, status_code=status.HTTP_201_CREATED)
def add_stock_item(
    request: Request,
    payload: StockItemCreate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    commodity = db.query(Commodity).filter(Commodity.id == payload.commodity_id).first()
    if not commodity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commodity not found")

    item = StockItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)

    # Record a "received" transaction
    txn = StockTransaction(
        stock_item_id=item.id,
        transaction_type=TransactionType.received,
        quantity=item.quantity,
        notes="Initial stock entry",
        created_by=current_user.id,
    )
    db.add(txn)
    db.commit()

    log_audit(
        db=db, user_id=current_user.id, action="CREATE", resource="stock_items",
        resource_id=item.id, details={"commodity_id": item.commodity_id, "quantity": item.quantity},
        ip_address=get_client_ip(request),
    )

    # Reload with relationship
    db.refresh(item)
    item_dict = {
        "id": item.id, "commodity_id": item.commodity_id, "warehouse_id": item.warehouse_id,
        "shop_id": item.shop_id, "quantity": item.quantity, "minimum_quantity": item.minimum_quantity,
        "expiry_date": item.expiry_date, "batch_number": item.batch_number,
        "cost_per_unit": item.cost_per_unit, "created_at": item.created_at,
        "updated_at": item.updated_at, "commodity": item.commodity,
        "is_low_stock": item.quantity <= item.minimum_quantity,
    }
    return StockItemResponse(**item_dict)


@router.get("/items/{item_id}", response_model=StockItemResponse)
def get_stock_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    item = db.query(StockItem).options(joinedload(StockItem.commodity)).filter(StockItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock item not found")

    item_dict = {
        "id": item.id, "commodity_id": item.commodity_id, "warehouse_id": item.warehouse_id,
        "shop_id": item.shop_id, "quantity": item.quantity, "minimum_quantity": item.minimum_quantity,
        "expiry_date": item.expiry_date, "batch_number": item.batch_number,
        "cost_per_unit": item.cost_per_unit, "created_at": item.created_at,
        "updated_at": item.updated_at, "commodity": item.commodity,
        "is_low_stock": item.quantity <= item.minimum_quantity,
    }
    return StockItemResponse(**item_dict)


@router.put("/items/{item_id}", response_model=StockItemResponse)
def update_stock_item(
    item_id: int,
    request: Request,
    payload: StockItemUpdate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    item = db.query(StockItem).options(joinedload(StockItem.commodity)).filter(StockItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock item not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    log_audit(
        db=db, user_id=current_user.id, action="UPDATE", resource="stock_items",
        resource_id=item_id, details=update_data, ip_address=get_client_ip(request),
    )

    item_dict = {
        "id": item.id, "commodity_id": item.commodity_id, "warehouse_id": item.warehouse_id,
        "shop_id": item.shop_id, "quantity": item.quantity, "minimum_quantity": item.minimum_quantity,
        "expiry_date": item.expiry_date, "batch_number": item.batch_number,
        "cost_per_unit": item.cost_per_unit, "created_at": item.created_at,
        "updated_at": item.updated_at, "commodity": item.commodity,
        "is_low_stock": item.quantity <= item.minimum_quantity,
    }
    return StockItemResponse(**item_dict)


@router.post("/items/{item_id}/adjust", response_model=StockItemResponse)
def adjust_stock(
    item_id: int,
    request: Request,
    payload: StockAdjustRequest,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    item = db.query(StockItem).options(joinedload(StockItem.commodity)).filter(StockItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock item not found")

    if payload.transaction_type in [TransactionType.distributed, TransactionType.transferred, TransactionType.expired]:
        if item.quantity < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {item.quantity}, Requested: {payload.quantity}",
            )
        item.quantity -= payload.quantity
    else:
        item.quantity += payload.quantity

    item.updated_at = datetime.utcnow()

    txn = StockTransaction(
        stock_item_id=item_id,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
        notes=payload.notes,
        created_by=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(item)

    log_audit(
        db=db, user_id=current_user.id, action="ADJUST_STOCK", resource="stock_items",
        resource_id=item_id,
        details={"type": payload.transaction_type.value, "quantity": payload.quantity},
        ip_address=get_client_ip(request),
    )

    item_dict = {
        "id": item.id, "commodity_id": item.commodity_id, "warehouse_id": item.warehouse_id,
        "shop_id": item.shop_id, "quantity": item.quantity, "minimum_quantity": item.minimum_quantity,
        "expiry_date": item.expiry_date, "batch_number": item.batch_number,
        "cost_per_unit": item.cost_per_unit, "created_at": item.created_at,
        "updated_at": item.updated_at, "commodity": item.commodity,
        "is_low_stock": item.quantity <= item.minimum_quantity,
    }
    return StockItemResponse(**item_dict)


@router.get("/low-alerts", response_model=StockItemListResponse)
def get_low_stock_alerts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(StockItem)
        .options(joinedload(StockItem.commodity))
        .filter(StockItem.quantity <= StockItem.minimum_quantity)
    )

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
            "is_low_stock": True,
        }
        result.append(StockItemResponse(**item_dict))

    return StockItemListResponse(items=result, total=total, page=page, size=size, pages=pages)


# ---- Stock Transactions ----

@router.get("/transactions", response_model=StockTransactionListResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    stock_item_id: Optional[int] = Query(None),
    transaction_type: Optional[TransactionType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(StockTransaction).order_by(StockTransaction.created_at.desc())

    if stock_item_id:
        query = query.filter(StockTransaction.stock_item_id == stock_item_id)
    if transaction_type:
        query = query.filter(StockTransaction.transaction_type == transaction_type)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return StockTransactionListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("/transactions", response_model=StockTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    request: Request,
    payload: StockTransactionCreate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    item = db.query(StockItem).filter(StockItem.id == payload.stock_item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock item not found")

    if payload.transaction_type in [TransactionType.distributed, TransactionType.transferred, TransactionType.expired]:
        if item.quantity < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {item.quantity}",
            )
        item.quantity -= payload.quantity
    else:
        item.quantity += payload.quantity

    item.updated_at = datetime.utcnow()

    txn = StockTransaction(
        stock_item_id=payload.stock_item_id,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
        reference_id=payload.reference_id,
        notes=payload.notes,
        created_by=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    log_audit(
        db=db, user_id=current_user.id, action="CREATE", resource="stock_transactions",
        resource_id=txn.id,
        details={"type": txn.transaction_type.value, "quantity": txn.quantity},
        ip_address=get_client_ip(request),
    )
    return txn
