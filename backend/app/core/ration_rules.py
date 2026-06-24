"""Category-based eligibility + monthly quota rules.

Single source of truth for "what can this category buy and how much per month".
Mirrors the seed `entitlements` in app/main.py. Kept as a plain dict (ponytail:
promote to a DB table only if admins need to edit quotas at runtime).
"""
from datetime import datetime
from typing import Dict

# category -> { commodity name : monthly quota }. A commodity is *eligible* for a
# category iff it appears here. Kerosene is AAY-only (the "poor family" case);
# Dal is intentionally in no map, so it is hidden everywhere.
QUOTA: Dict[str, Dict[str, float]] = {
    "APL": {"Rice": 15.0, "Wheat": 10.0, "Sugar": 1.0, "Edible Oil": 0.5},
    "BPL": {"Rice": 25.0, "Wheat": 20.0, "Sugar": 2.0, "Edible Oil": 1.0},
    "AAY": {"Rice": 35.0, "Wheat": 25.0, "Sugar": 3.0, "Edible Oil": 2.0, "Kerosene": 3.0},
    "PHH": {"Rice": 5.0, "Wheat": 5.0, "Sugar": 1.0, "Edible Oil": 0.5},
}


def category_quota(category: str) -> Dict[str, float]:
    return QUOTA.get(category, {})


def is_eligible(category: str, commodity_name: str) -> bool:
    return commodity_name in QUOTA.get(category, {})


def allocated(category: str, commodity_name: str) -> float:
    return QUOTA.get(category, {}).get(commodity_name, 0.0)


def quota_used(db, customer_id: int, commodity_id: int, when: datetime | None = None) -> float:
    """Quantity already committed this month for one commodity by one customer.

    Counts every order line except those on rejected orders (rejected frees quota).
    """
    from sqlalchemy import func, extract
    from app.models.order import Order, OrderItem, OrderStatus

    when = when or datetime.utcnow()
    total = (
        db.query(func.coalesce(func.sum(OrderItem.quantity), 0.0))
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.customer_id == customer_id,
            OrderItem.commodity_id == commodity_id,
            Order.status != OrderStatus.rejected,
            extract("year", Order.created_at) == when.year,
            extract("month", Order.created_at) == when.month,
        )
        .scalar()
    )
    return float(total or 0.0)


def quota_remaining(db, customer_id: int, category: str, commodity_id: int,
                    commodity_name: str, when: datetime | None = None) -> float:
    return max(0.0, allocated(category, commodity_name) - quota_used(db, customer_id, commodity_id, when))


if __name__ == "__main__":
    # Self-check for the quota math (no DB needed).
    assert allocated("AAY", "Kerosene") == 3.0
    assert allocated("BPL", "Kerosene") == 0.0          # not eligible
    assert is_eligible("AAY", "Kerosene") and not is_eligible("BPL", "Kerosene")
    assert is_eligible("APL", "Rice") and not is_eligible("APL", "Dal (Lentils)")
    assert max(0.0, allocated("PHH", "Rice") - 4.0) == 1.0   # 5 allocated - 4 used = 1
    print("ration_rules self-check OK")
