import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    shop_manager = "shop_manager"
    distribution_staff = "distribution_staff"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.distribution_staff)
    is_active = Column(Boolean, default=True, nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    shop = relationship("Shop", back_populates="staff", foreign_keys=[shop_id])
    notifications_created = relationship("Notification", back_populates="creator", foreign_keys="Notification.created_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    stock_transactions = relationship("StockTransaction", back_populates="created_by_user")
    distributions_made = relationship("Distribution", back_populates="distributed_by_user")
    reports_generated = relationship("MonthlyReport", back_populates="generated_by_user")
