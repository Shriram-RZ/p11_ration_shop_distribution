from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class MonthlyReportBase(BaseModel):
    shop_id: Optional[int] = None
    report_month: int
    report_year: int
    total_beneficiaries: int = 0
    total_rice_distributed: float = 0.0
    total_wheat_distributed: float = 0.0
    total_sugar_distributed: float = 0.0
    total_oil_distributed: float = 0.0
    total_transactions: int = 0


class MonthlyReportCreate(BaseModel):
    shop_id: Optional[int] = None
    report_month: int
    report_year: int


class MonthlyReportResponse(MonthlyReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    generated_by: Optional[int] = None
    created_at: datetime


class MonthlyReportListResponse(BaseModel):
    items: List[MonthlyReportResponse]
    total: int


class DashboardStats(BaseModel):
    total_beneficiaries: int
    total_ration_cards: int
    active_ration_cards: int
    total_shops: int
    active_shops: int
    total_warehouses: int
    total_stock_items: int
    low_stock_alerts: int
    distributions_this_month: int
    total_rice_distributed_this_month: float
    total_wheat_distributed_this_month: float
    total_sugar_distributed_this_month: float
    total_oil_distributed_this_month: float
    total_users: int
    unread_notifications: int


class StockSummaryItem(BaseModel):
    commodity_name: str
    unit: str
    total_quantity: float
    low_stock_count: int
    warehouse_count: int


class StockSummaryResponse(BaseModel):
    items: List[StockSummaryItem]
    total_value: float


class DistributionSummaryItem(BaseModel):
    shop_id: int
    shop_name: str
    month: int
    year: int
    total_cards_distributed: int
    rice: float
    wheat: float
    sugar: float
    oil: float


class DistributionSummaryResponse(BaseModel):
    items: List[DistributionSummaryItem]
    total: int
