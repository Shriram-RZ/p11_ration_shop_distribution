from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    shop_code = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(500), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    phone = Column(String(20), nullable=True)
    license_number = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    manager = relationship("User", foreign_keys=[manager_id])
    staff = relationship("User", back_populates="shop", foreign_keys="User.shop_id")
    ration_cards = relationship("RationCard", back_populates="shop")
    stock_items = relationship("StockItem", back_populates="shop")
    distributions = relationship("Distribution", back_populates="shop")
    monthly_reports = relationship("MonthlyReport", back_populates="shop")
