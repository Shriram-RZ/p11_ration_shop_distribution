from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import date
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.core.security import get_password_hash


def seed_initial_data(db: Session):
    """Seed initial data on first startup."""
    # Import models here to avoid circular imports
    from app.models.user import User, UserRole
    from app.models.warehouse import Warehouse
    from app.models.shop import Shop
    from app.models.stock import Commodity, StockItem
    from app.models.beneficiary import RationCardHolder, RationCard, RationCardCategory, RationCardStatus
    from app.models.notification import Notification, NotificationType

    # --- Admin user ---
    admin = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=settings.FIRST_ADMIN_EMAIL,
            full_name="System Administrator",
            hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.flush()
        print(f"✅ Admin created: {settings.FIRST_ADMIN_EMAIL}")

    # --- Default warehouse ---
    warehouse = db.query(Warehouse).first()
    if not warehouse:
        warehouse = Warehouse(
            name="Central Government Warehouse",
            location="Connaught Place, New Delhi",
            capacity=100000.0,
            phone="011-12345678",
            is_active=True,
        )
        db.add(warehouse)
        db.flush()
        print("✅ Default warehouse created")

    # --- Default shop ---
    shop = db.query(Shop).first()
    if not shop:
        shop = Shop(
            name="Government Fair Price Shop #1",
            shop_code="FPS-001",
            address="123 Main Street, Connaught Place",
            district="New Delhi",
            state="Delhi",
            pincode="110001",
            phone="011-87654321",
            license_number="FPS-LIC-2024-001",
            is_active=True,
        )
        db.add(shop)
        db.flush()
        print("✅ Default shop created")

    # --- Commodities ---
    commodities_data = [
        {"name": "Rice", "unit": "kg", "description": "Government allocated rice"},
        {"name": "Wheat", "unit": "kg", "description": "Government allocated wheat"},
        {"name": "Sugar", "unit": "kg", "description": "Government allocated sugar"},
        {"name": "Edible Oil", "unit": "L", "description": "Government allocated edible oil"},
        {"name": "Kerosene", "unit": "L", "description": "Government allocated kerosene"},
        {"name": "Dal (Lentils)", "unit": "kg", "description": "Government allocated lentils"},
    ]
    for c in commodities_data:
        if not db.query(Commodity).filter(Commodity.name == c["name"]).first():
            db.add(Commodity(**c, is_active=True))
    db.flush()
    print("✅ Commodities seeded")

    # --- Stock items ---
    stock_config = {
        "Rice":         {"quantity": 5000, "minimum_quantity": 500,  "cost_per_unit": 15.0},
        "Wheat":        {"quantity": 4000, "minimum_quantity": 400,  "cost_per_unit": 12.0},
        "Sugar":        {"quantity": 800,  "minimum_quantity": 100,  "cost_per_unit": 35.0},
        "Edible Oil":   {"quantity": 600,  "minimum_quantity": 80,   "cost_per_unit": 120.0},
        "Kerosene":     {"quantity": 200,  "minimum_quantity": 50,   "cost_per_unit": 65.0},
        "Dal (Lentils)":{"quantity": 1200, "minimum_quantity": 150,  "cost_per_unit": 80.0},
    }
    warehouse = db.query(Warehouse).first()
    for commodity in db.query(Commodity).all():
        exists = db.query(StockItem).filter(
            StockItem.commodity_id == commodity.id,
            StockItem.warehouse_id == warehouse.id
        ).first()
        if not exists and commodity.name in stock_config:
            cfg = stock_config[commodity.name]
            db.add(StockItem(
                commodity_id=commodity.id,
                warehouse_id=warehouse.id,
                batch_number=f"BATCH-2024-{commodity.name[:3].upper()}",
                **cfg,
            ))
    db.flush()
    print("✅ Stock items seeded")

    # --- Sample beneficiaries ---
    sample_data = [
        {"aadhaar": "123456789012", "name": "Rajesh Kumar",   "phone": "9876543210", "address": "12 Gandhi Nagar", "district": "New Delhi", "state": "Delhi", "pin": "110001", "cat": RationCardCategory.BPL, "card": "RF-2024-0001"},
        {"aadhaar": "234567890123", "name": "Priya Sharma",   "phone": "9876543211", "address": "45 Nehru Colony", "district": "New Delhi", "state": "Delhi", "pin": "110002", "cat": RationCardCategory.APL, "card": "RF-2024-0002"},
        {"aadhaar": "345678901234", "name": "Mohan Das",      "phone": "9876543212", "address": "78 Patel Street", "district": "New Delhi", "state": "Delhi", "pin": "110003", "cat": RationCardCategory.AAY, "card": "RF-2024-0003"},
        {"aadhaar": "456789012345", "name": "Sunita Devi",    "phone": "9876543213", "address": "23 Indira Vihar", "district": "New Delhi", "state": "Delhi", "pin": "110004", "cat": RationCardCategory.PHH, "card": "RF-2024-0004"},
        {"aadhaar": "567890123456", "name": "Arun Singh",     "phone": "9876543214", "address": "56 Ram Nagar",   "district": "New Delhi", "state": "Delhi", "pin": "110005", "cat": RationCardCategory.BPL, "card": "RF-2024-0005"},
        {"aadhaar": "678901234567", "name": "Kavita Patel",   "phone": "9876543215", "address": "89 Laxmi Nagar", "district": "New Delhi", "state": "Delhi", "pin": "110006", "cat": RationCardCategory.APL, "card": "RF-2024-0006"},
        {"aadhaar": "789012345678", "name": "Suresh Yadav",   "phone": "9876543216", "address": "11 Saket Block", "district": "New Delhi", "state": "Delhi", "pin": "110017", "cat": RationCardCategory.BPL, "card": "RF-2024-0007"},
        {"aadhaar": "890123456789", "name": "Meena Gupta",    "phone": "9876543217", "address": "34 Dwarka Sect", "district": "New Delhi", "state": "Delhi", "pin": "110075", "cat": RationCardCategory.AAY, "card": "RF-2024-0008"},
    ]
    entitlements = {
        RationCardCategory.BPL: {"rice": 25.0, "wheat": 20.0, "sugar": 2.0, "oil": 1.0},
        RationCardCategory.APL: {"rice": 15.0, "wheat": 10.0, "sugar": 1.0, "oil": 0.5},
        RationCardCategory.AAY: {"rice": 35.0, "wheat": 25.0, "sugar": 3.0, "oil": 2.0},
        RationCardCategory.PHH: {"rice": 5.0,  "wheat": 5.0,  "sugar": 1.0, "oil": 0.5},
    }
    shop = db.query(Shop).first()
    for s in sample_data:
        if not db.query(RationCardHolder).filter(RationCardHolder.aadhaar_number == s["aadhaar"]).first():
            holder = RationCardHolder(
                aadhaar_number=s["aadhaar"], full_name=s["name"], phone=s["phone"],
                address=s["address"], district=s["district"], state=s["state"],
                pincode=s["pin"], category=s["cat"], is_active=True,
            )
            db.add(holder)
            db.flush()
            ent = entitlements[s["cat"]]
            card = RationCard(
                card_number=s["card"], holder_id=holder.id, shop_id=shop.id,
                family_size=3, status=RationCardStatus.active,
                issued_date=date(2024, 1, 1),
                monthly_entitlement_rice=ent["rice"],
                monthly_entitlement_wheat=ent["wheat"],
                monthly_entitlement_sugar=ent["sugar"],
                monthly_entitlement_oil=ent["oil"],
            )
            db.add(card)
    db.flush()
    print("✅ Sample beneficiaries created")

    # --- Welcome notification ---
    if not db.query(Notification).first():
        db.add(Notification(
            title="Welcome to RationFlow",
            message="System initialized successfully. All services are operational.",
            type=NotificationType.success,
            created_by=admin.id if admin else None,
        ))

    db.commit()
    print("🚀 RationFlow ready!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🌾 Starting RationFlow API…")
    # Create all tables
    from app.models import (  # noqa: F401 – ensure all models are registered
        User, RationCardHolder, RationCard, FamilyMember,
        Commodity, StockItem, StockTransaction,
        Warehouse, Shop, Distribution,
        Notification, AuditLog, MonthlyReport,
    )
    Base.metadata.create_all(bind=engine)
    # The `userrole` enum may predate the `customer` role on existing databases;
    # add it idempotently (no-op on fresh installs that already include it).
    from sqlalchemy import text
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'customer'"))
    except Exception as e:
        print(f"⚠️  Could not ensure 'customer' role enum value: {e}")
    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception as e:
        print(f"⚠️  Seed error (non-fatal): {e}")
        db.rollback()
    finally:
        db.close()
    yield
    print("RationFlow shutting down…")


app = FastAPI(
    title="RationFlow API",
    description="Ration Shop Distribution & Stock Monitoring System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
from app.routers import (
    auth, users, beneficiaries, ration_cards,
    stock, distributions, warehouses, shops,
    notifications, reports, audit, storefront,
)

app.include_router(auth.router)
app.include_router(storefront.router)
app.include_router(users.router)
app.include_router(beneficiaries.router)
app.include_router(ration_cards.router)
app.include_router(stock.router)
app.include_router(distributions.router)
app.include_router(warehouses.router)
app.include_router(shops.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(audit.router)


@app.get("/", tags=["Health"])
def root():
    return {"app": "RationFlow", "version": "1.0.0", "status": "operational", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
