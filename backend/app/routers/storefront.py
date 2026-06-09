from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid

from app.database import get_db
from app.dependencies import get_current_active_user, log_audit, get_client_ip
from app.models.user import User
from app.models.stock import Commodity, StockItem, StockTransaction, TransactionType
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import ProductResponse, OrderCreate, OrderResponse

router = APIRouter(prefix="/store", tags=["Storefront"])

# Fallback unit price used when a commodity has no priced stock yet.
DEFAULT_PRICE = 50.0


def _product_for(commodity: Commodity, db: Session) -> ProductResponse:
    stock_items = (
        db.query(StockItem).filter(StockItem.commodity_id == commodity.id).all()
    )
    available = sum(si.quantity for si in stock_items)
    priced = [si.cost_per_unit for si in stock_items if si.cost_per_unit > 0]
    price = max(priced) if priced else DEFAULT_PRICE
    return ProductResponse(
        commodity_id=commodity.id,
        name=commodity.name,
        unit=commodity.unit,
        description=commodity.description,
        price=round(price, 2),
        available_quantity=round(available, 2),
    )


@router.get("/products", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Catalog of purchasable commodities with price and available stock."""
    commodities = db.query(Commodity).filter(Commodity.is_active == True).all()
    return [_product_for(c, db) for c in commodities]


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    request: Request,
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Checkout the cart: validate stock, deduct it, and record the order."""
    order_number = f"ORD-{datetime.utcnow():%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        order_number=order_number,
        customer_id=current_user.id,
        status=OrderStatus.confirmed,
        delivery_address=payload.delivery_address,
        contact_phone=payload.contact_phone,
        total_amount=0.0,
    )
    db.add(order)
    db.flush()

    total = 0.0
    for line in payload.items:
        commodity = (
            db.query(Commodity)
            .filter(Commodity.id == line.commodity_id, Commodity.is_active == True)
            .first()
        )
        if not commodity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {line.commodity_id} not found",
            )

        # FIFO stock items for this commodity that still have quantity.
        stock_items = (
            db.query(StockItem)
            .filter(StockItem.commodity_id == commodity.id, StockItem.quantity > 0)
            .order_by(StockItem.id)
            .all()
        )
        available = sum(si.quantity for si in stock_items)
        if available < line.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {commodity.name}: "
                f"{available} {commodity.unit} available, {line.quantity} requested",
            )

        priced = [si.cost_per_unit for si in stock_items if si.cost_per_unit > 0]
        unit_price = max(priced) if priced else DEFAULT_PRICE

        # Deduct requested quantity across stock items (FIFO).
        remaining = line.quantity
        for si in stock_items:
            if remaining <= 0:
                break
            take = min(si.quantity, remaining)
            si.quantity -= take
            remaining -= take
            db.add(StockTransaction(
                stock_item_id=si.id,
                transaction_type=TransactionType.distributed,
                quantity=take,
                reference_id=order_number,
                notes=f"Customer order {order_number}",
                created_by=current_user.id,
            ))

        subtotal = round(unit_price * line.quantity, 2)
        total += subtotal
        db.add(OrderItem(
            order_id=order.id,
            commodity_id=commodity.id,
            commodity_name=commodity.name,
            unit=commodity.unit,
            quantity=line.quantity,
            unit_price=round(unit_price, 2),
            subtotal=subtotal,
        ))

    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="PLACE_ORDER",
        resource="order",
        resource_id=order.id,
        details={"order_number": order_number, "total": order.total_amount},
        ip_address=get_client_ip(request),
    )
    return order


@router.get("/orders", response_model=list[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """The current customer's order history (most recent first)."""
    return (
        db.query(Order)
        .filter(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
