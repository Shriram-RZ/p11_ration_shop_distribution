import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base


class DistributionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    partial = "partial"


class Distribution(Base):
    __tablename__ = "distributions"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("ration_cards.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    distributed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    distribution_month = Column(Integer, nullable=False)
    distribution_year = Column(Integer, nullable=False)
    rice_quantity = Column(Float, nullable=False, default=0.0)
    wheat_quantity = Column(Float, nullable=False, default=0.0)
    sugar_quantity = Column(Float, nullable=False, default=0.0)
    oil_quantity = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(DistributionStatus), nullable=False, default=DistributionStatus.pending)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    ration_card = relationship("RationCard", back_populates="distributions")
    shop = relationship("Shop", back_populates="distributions")
    distributed_by_user = relationship("User", back_populates="distributions_made")
