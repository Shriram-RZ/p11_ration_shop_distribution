from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="SET NULL"), nullable=True)
    report_month = Column(Integer, nullable=False)
    report_year = Column(Integer, nullable=False)
    total_beneficiaries = Column(Integer, nullable=False, default=0)
    total_rice_distributed = Column(Float, nullable=False, default=0.0)
    total_wheat_distributed = Column(Float, nullable=False, default=0.0)
    total_sugar_distributed = Column(Float, nullable=False, default=0.0)
    total_oil_distributed = Column(Float, nullable=False, default=0.0)
    total_transactions = Column(Integer, nullable=False, default=0)
    generated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    shop = relationship("Shop", back_populates="monthly_reports")
    generated_by_user = relationship("User", back_populates="reports_generated")
