import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, Date, Text
from sqlalchemy.orm import relationship
from app.database import Base


class TransactionType(str, enum.Enum):
    received = "received"
    distributed = "distributed"
    transferred = "transferred"
    adjusted = "adjusted"
    expired = "expired"


class Commodity(Base):
    __tablename__ = "commodities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    stock_items = relationship("StockItem", back_populates="commodity")


class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, nullable=False, default=0.0)
    minimum_quantity = Column(Float, nullable=False, default=0.0)
    expiry_date = Column(Date, nullable=True)
    batch_number = Column(String(100), nullable=True)
    cost_per_unit = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    commodity = relationship("Commodity", back_populates="stock_items")
    warehouse = relationship("Warehouse", back_populates="stock_items")
    shop = relationship("Shop", back_populates="stock_items")
    transactions = relationship("StockTransaction", back_populates="stock_item")


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    stock_item_id = Column(Integer, ForeignKey("stock_items.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    reference_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    stock_item = relationship("StockItem", back_populates="transactions")
    created_by_user = relationship("User", back_populates="stock_transactions")
