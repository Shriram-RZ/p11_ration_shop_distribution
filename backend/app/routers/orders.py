from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_active_user, log_audit, get_client_ip
from app.models.user import User, UserRole
from app.models.beneficiary import RationCard, RationCardHolder
from app.models.order import Order, OrderItem, OrderStatus
from app.models.stock import StockItem, StockTransaction, TransactionType
from app.schemas.order import AdminOrderResponse, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Admin Orders"])

STAFF_ROLES = {UserRole.admin, UserRole.shop_manager, UserRole.distribution_staff}


def require_staff(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff privileges required")
    return current_user


def _to_admin_response(order: Order) -> AdminOrderResponse:
    customer = order.customer
    card = customer.ration_card if customer else None
    holder = card.holder if card else None
    return AdminOrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_name=customer.full_name if customer else "—",
        card_number=card.card_number if card else None,
        aadhaar_number=holder.aadhaar_number if holder else None,
        category=holder.category.value if holder else None,
        total_amount=order.total_amount,
        total_quantity=round(sum(i.quantity for i in order.items), 2),
        status=order.status.value,
        created_at=order.created_at,
        items=order.items,
    )


@router.get("", response_model=list[AdminOrderResponse])
def list_orders(
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """All customer orders with card/aadhaar/category, newest first."""
    query = (
        db.query(Order)
        .outerjoin(User, Order.customer_id == User.id)
        .outerjoin(RationCard, User.card_id == RationCard.id)
        .outerjoin(RationCardHolder, RationCard.holder_id == RationCardHolder.id)
    )
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if category:
        query = query.filter(RationCardHolder.category == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(
            RationCard.card_number.ilike(like),
            RationCardHolder.aadhaar_number.ilike(like),
        ))
    orders = query.order_by(Order.created_at.desc()).all()
    return [_to_admin_response(o) for o in orders]


@router.patch("/{order_id}/status", response_model=AdminOrderResponse)
def update_status(
    request: Request,
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Advance an order through the approval lifecycle.

    On `delivered` the ordered quantities are deducted from stock (FIFO) and
    recorded as distribution transactions.
    """
    try:
        new_status = OrderStatus(payload.status)
    except ValueError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid status")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    already_delivered = order.status == OrderStatus.delivered
    if new_status == OrderStatus.delivered and not already_delivered:
        _deduct_stock(db, order, current_user.id)

    order.status = new_status
    db.commit()
    db.refresh(order)

    log_audit(
        db=db, user_id=current_user.id, action="ORDER_STATUS", resource="order",
        resource_id=order.id, details={"status": new_status.value},
        ip_address=get_client_ip(request),
    )
    return _to_admin_response(order)


def _deduct_stock(db: Session, order: Order, user_id: int) -> None:
    """FIFO-deduct each ordered line from stock, recording transactions."""
    for item in order.items:
        if not item.commodity_id:
            continue
        stock_items = (
            db.query(StockItem)
            .filter(StockItem.commodity_id == item.commodity_id, StockItem.quantity > 0)
            .order_by(StockItem.id)
            .all()
        )
        remaining = item.quantity
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
                reference_id=order.order_number,
                notes=f"Customer order {order.order_number}",
                created_by=user_id,
            ))
        if remaining > 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Insufficient stock to deliver {item.commodity_name} "
                f"({round(remaining, 2)} {item.unit} short).",
            )
