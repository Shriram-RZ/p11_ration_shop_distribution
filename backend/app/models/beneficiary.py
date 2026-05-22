import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Date, Float
from sqlalchemy.orm import relationship
from app.database import Base


class RationCardCategory(str, enum.Enum):
    APL = "APL"
    BPL = "BPL"
    AAY = "AAY"
    PHH = "PHH"


class RationCardStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    cancelled = "cancelled"


class RationCardHolder(Base):
    __tablename__ = "ration_card_holders"

    id = Column(Integer, primary_key=True, index=True)
    aadhaar_number = Column(String(12), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    category = Column(Enum(RationCardCategory), nullable=False, default=RationCardCategory.BPL)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    ration_cards = relationship("RationCard", back_populates="holder")


class RationCard(Base):
    __tablename__ = "ration_cards"

    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String(50), unique=True, index=True, nullable=False)
    holder_id = Column(Integer, ForeignKey("ration_card_holders.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="SET NULL"), nullable=True)
    family_size = Column(Integer, nullable=False, default=1)
    monthly_entitlement_rice = Column(Float, nullable=False, default=0.0)
    monthly_entitlement_wheat = Column(Float, nullable=False, default=0.0)
    monthly_entitlement_sugar = Column(Float, nullable=False, default=0.0)
    monthly_entitlement_oil = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(RationCardStatus), nullable=False, default=RationCardStatus.active)
    issued_date = Column(Date, nullable=False, default=date.today)
    expiry_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    holder = relationship("RationCardHolder", back_populates="ration_cards")
    shop = relationship("Shop", back_populates="ration_cards")
    family_members = relationship("FamilyMember", back_populates="ration_card", cascade="all, delete-orphan")
    distributions = relationship("Distribution", back_populates="ration_card")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("ration_cards.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    aadhaar = Column(String(12), nullable=True)
    relation = Column(String(50), nullable=False)
    age = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ration_card = relationship("RationCard", back_populates="family_members")
