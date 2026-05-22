from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.warehouse import Warehouse
from app.models.stock import StockItem
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse, WarehouseListResponse
from app.schemas.stock import StockItemResponse, StockItemListResponse

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.get("", response_model=WarehouseListResponse)
def list_warehouses(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Warehouse)
    if is_active is not None:
        query = query.filter(Warehouse.is_active == is_active)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return WarehouseListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    request: Request,
    payload: WarehouseCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    warehouse = Warehouse(**payload.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    log_audit(
        db=db, user_id=current_user.id, action="CREATE", resource="warehouses",
        resource_id=warehouse.id, details={"name": warehouse.name},
        ip_address=get_client_ip(request),
    )
    return warehouse


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    request: Request,
    payload: WarehouseUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(warehouse, field, value)
    warehouse.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(warehouse)

    log_audit(
        db=db, user_id=current_user.id, action="UPDATE", resource="warehouses",
        resource_id=warehouse_id, details=update_data, ip_address=get_client_ip(request),
    )
    return warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(
    warehouse_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    # Soft delete
    warehouse.is_active = False
    warehouse.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db=db, user_id=current_user.id, action="DELETE", resource="warehouses",
        resource_id=warehouse_id, ip_address=get_client_ip(request),
    )


@router.get("/{warehouse_id}/stock", response_model=StockItemListResponse)
def get_warehouse_stock(
    warehouse_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    query = db.query(StockItem).options(
        joinedload(StockItem.commodity)
    ).filter(StockItem.warehouse_id == warehouse_id)

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
