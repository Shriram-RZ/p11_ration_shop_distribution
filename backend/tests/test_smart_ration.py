"""End-to-end check of the smart ration card auth + quota flow on in-memory SQLite.

Run: `python -m tests.test_smart_ration` (or `pytest`). No Postgres needed — we
build a fresh app with just the relevant routers and an overridden DB session so
the Postgres-specific startup seed never runs.
"""
from datetime import date

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.beneficiary import RationCardHolder, RationCard, RationCardCategory, RationCardStatus
from app.models.warehouse import Warehouse
from app.models.stock import Commodity, StockItem
from app.routers import auth, storefront, orders

# Ensure every model is registered before create_all.
import app.models  # noqa: F401

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(engine)


def _override_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.include_router(auth.router)
app.include_router(storefront.router)
app.include_router(orders.router)
app.dependency_overrides[get_db] = _override_db
client = TestClient(app)


def _seed():
    db = TestSession()
    wh = Warehouse(name="WH", location="X", capacity=1000.0, is_active=True)
    db.add(wh); db.flush()
    for name, unit, price in [("Rice", "kg", 15.0), ("Kerosene", "L", 65.0)]:
        c = Commodity(name=name, unit=unit, is_active=True)
        db.add(c); db.flush()
        db.add(StockItem(commodity_id=c.id, warehouse_id=wh.id, quantity=1000.0, cost_per_unit=price))
    holder = RationCardHolder(
        aadhaar_number="111122223333", full_name="Test Family", phone="9000000000",
        address="addr", district="Chennai", state="TN", pincode="600001",
        category=RationCardCategory.AAY, is_active=True,
    )
    db.add(holder); db.flush()
    db.add(RationCard(
        card_number="RF-TEST-0001", holder_id=holder.id, family_size=4,
        status=RationCardStatus.active, issued_date=date(2024, 1, 1),
    ))
    db.add(User(
        email="admin@test.gov", full_name="Admin", role=UserRole.admin, is_active=True,
        hashed_password=get_password_hash("admin123"),
    ))
    db.commit(); db.close()


def run():
    _seed()

    # 1. Registration verifies the card.
    bad = client.post("/auth/register", json={
        "aadhaar_number": "999988887777", "card_number": "RF-TEST-0001",
        "phone": "9000000000", "password": "pass123"})
    assert bad.status_code == 400, bad.text  # aadhaar mismatch

    ok = client.post("/auth/register", json={
        "aadhaar_number": "111122223333", "card_number": "RF-TEST-0001",
        "phone": "9000000000", "password": "pass123"})
    assert ok.status_code == 201, ok.text
    assert ok.json()["category"] == "AAY"
    assert ok.json()["card_number"] == "RF-TEST-0001"

    dup = client.post("/auth/register", json={
        "aadhaar_number": "111122223333", "card_number": "RF-TEST-0001",
        "phone": "9000000000", "password": "pass123"})
    assert dup.status_code == 400, "second account on same card must be rejected"

    # 2. Login by card number.
    login = client.post("/auth/login", json={"identifier": "RF-TEST-0001", "password": "pass123"})
    assert login.status_code == 200, login.text
    cust = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # 3. AAY sees Rice AND Kerosene, each with full remaining quota.
    products = client.get("/store/products", headers=cust).json()
    by_name = {p["name"]: p for p in products}
    assert "Kerosene" in by_name, "AAY must see Kerosene"
    assert by_name["Rice"]["remaining_quota"] == 35.0
    assert by_name["Kerosene"]["allocated_quota"] == 3.0

    rice_id = by_name["Rice"]["commodity_id"]

    # 4. Order exactly the quota → ok; one more → blocked.
    r1 = client.post("/store/orders", headers=cust, json={"items": [{"commodity_id": rice_id, "quantity": 35.0}]})
    assert r1.status_code == 201, r1.text
    assert r1.json()["status"] == "pending"

    r2 = client.post("/store/orders", headers=cust, json={"items": [{"commodity_id": rice_id, "quantity": 1.0}]})
    assert r2.status_code == 400, "ordering beyond remaining quota must be rejected"

    # remaining quota now reflects the placed order
    rice_after = next(p for p in client.get("/store/products", headers=cust).json() if p["name"] == "Rice")
    assert rice_after["remaining_quota"] == 0.0

    # 5. Admin sees the order with card/aadhaar/category, and delivery deducts stock.
    alogin = client.post("/auth/login", json={"identifier": "admin@test.gov", "password": "admin123"})
    admin = {"Authorization": f"Bearer {alogin.json()['access_token']}"}
    admin_orders = client.get("/orders", headers=admin).json()
    assert len(admin_orders) == 1
    assert admin_orders[0]["card_number"] == "RF-TEST-0001"
    assert admin_orders[0]["aadhaar_number"] == "111122223333"
    assert admin_orders[0]["category"] == "AAY"

    oid = admin_orders[0]["id"]
    delivered = client.patch(f"/orders/{oid}/status", headers=admin, json={"status": "delivered"})
    assert delivered.status_code == 200 and delivered.json()["status"] == "delivered", delivered.text

    # stock dropped by the delivered 35 kg of rice (1000 -> 965)
    db = TestSession()
    rice_stock = db.query(StockItem).filter(StockItem.commodity_id == rice_id).first().quantity
    db.close()
    assert rice_stock == 965.0, rice_stock

    # 6. Filtering by a different category returns nothing.
    assert client.get("/orders?category=APL", headers=admin).json() == []

    print("smart ration flow self-check OK")


if __name__ == "__main__":
    run()
