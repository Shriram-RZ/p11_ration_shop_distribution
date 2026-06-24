from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.dependencies import get_current_active_user, log_audit, get_client_ip
from app.models.user import User
from app.models.beneficiary import RationCard, RationCardStatus
from app.models.stock import Commodity, StockItem
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import (
    ProductResponse, OrderCreate, OrderResponse,
    CardInfoResponse, QuotaLine,
)
from app.core import ration_rules

router = APIRouter(prefix="/store", tags=["Storefront"])

# Fallback unit price used when a commodity has no priced stock yet.
DEFAULT_PRICE = 50.0


def _active_card(user: User) -> RationCard:
    """The customer's linked, active ration card — or 403."""
    card = user.ration_card
    if not card:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No ration card linked to this account.")
    if card.status != RationCardStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your ration card is not active.")
    return card


def _available_stock(commodity_id: int, db: Session) -> float:
    items = db.query(StockItem).filter(StockItem.commodity_id == commodity_id).all()
    return sum(si.quantity for si in items)


def _unit_price(commodity_id: int, db: Session) -> float:
    items = db.query(StockItem).filter(StockItem.commodity_id == commodity_id).all()
    priced = [si.cost_per_unit for si in items if si.cost_per_unit > 0]
    return round(max(priced) if priced else DEFAULT_PRICE, 2)


@router.get("/products", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Commodities the customer's category is eligible for, with price, stock and quota."""
    card = _active_card(current_user)
    category = card.holder.category.value

    out: list[ProductResponse] = []
    for c in db.query(Commodity).filter(Commodity.is_active == True).all():
        if not ration_rules.is_eligible(category, c.name):
            continue
        out.append(ProductResponse(
            commodity_id=c.id,
            name=c.name,
            unit=c.unit,
            description=c.description,
            price=_unit_price(c.id, db),
            available_quantity=round(_available_stock(c.id, db), 2),
            allocated_quota=ration_rules.allocated(category, c.name),
            remaining_quota=round(
                ration_rules.quota_remaining(db, current_user.id, category, c.id, c.name), 2
            ),
        ))
    return out


@router.get("/me/card", response_model=CardInfoResponse)
def my_card(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Card profile + per-commodity monthly quota for the logged-in customer."""
    card = _active_card(current_user)
    holder = card.holder
    category = holder.category.value

    quota: list[QuotaLine] = []
    for c in db.query(Commodity).filter(Commodity.is_active == True).all():
        if not ration_rules.is_eligible(category, c.name):
            continue
        used = ration_rules.quota_used(db, current_user.id, c.id)
        allocated = ration_rules.allocated(category, c.name)
        quota.append(QuotaLine(
            commodity_id=c.id, name=c.name, unit=c.unit,
            allocated=allocated, used=round(used, 2),
            remaining=round(max(0.0, allocated - used), 2),
        ))

    return CardInfoResponse(
        card_number=card.card_number,
        aadhaar_number=holder.aadhaar_number,
        family_name=holder.full_name,
        family_members=card.family_size,
        category=category,
        status=card.status.value,
        district=holder.district,
        state=holder.state,
        quota=quota,
    )


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    request: Request,
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Place an order: validate card, eligibility, quota and stock. Status starts pending.

    Stock is NOT deducted here — it leaves inventory only when an admin marks the
    order delivered (see routers/orders.py).
    """
    card = _active_card(current_user)
    category = card.holder.category.value

    order_number = f"ORD-{datetime.utcnow():%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        order_number=order_number,
        customer_id=current_user.id,
        status=OrderStatus.pending,
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
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {line.commodity_id} not found")

        if not ration_rules.is_eligible(category, commodity.name):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"{commodity.name} is not available for {category} ration cards.",
            )

        remaining = ration_rules.quota_remaining(
            db, current_user.id, category, commodity.id, commodity.name
        )
        if line.quantity > remaining:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Quota exceeded for {commodity.name}: {round(remaining, 2)} {commodity.unit} "
                f"remaining this month, {line.quantity} requested.",
            )

        available = _available_stock(commodity.id, db)
        if available < line.quantity:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Insufficient stock for {commodity.name}: {round(available, 2)} {commodity.unit} "
                f"available, {line.quantity} requested.",
            )

        unit_price = _unit_price(commodity.id, db)
        subtotal = round(unit_price * line.quantity, 2)
        total += subtotal
        db.add(OrderItem(
            order_id=order.id,
            commodity_id=commodity.id,
            commodity_name=commodity.name,
            unit=commodity.unit,
            quantity=line.quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        ))

    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)

    log_audit(
        db=db, user_id=current_user.id, action="PLACE_ORDER", resource="order",
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
