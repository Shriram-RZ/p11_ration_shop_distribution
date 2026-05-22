from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from app.models.stock import TransactionType


class CommodityBase(BaseModel):
    name: str
    unit: str = "kg"
    description: Optional[str] = None
    is_active: bool = True


class CommodityCreate(CommodityBase):
    pass


class CommodityUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CommodityResponse(CommodityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# StockItem schemas
class StockItemBase(BaseModel):
    commodity_id: int
    warehouse_id: int
    shop_id: Optional[int] = None
    quantity: float = 0.0
    minimum_quantity: float = 0.0
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    cost_per_unit: float = 0.0


class StockItemCreate(StockItemBase):
    pass


class StockItemUpdate(BaseModel):
    shop_id: Optional[int] = None
    quantity: Optional[float] = None
    minimum_quantity: Optional[float] = None
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    cost_per_unit: Optional[float] = None


class StockAdjustRequest(BaseModel):
    quantity: float
    notes: Optional[str] = None
    transaction_type: TransactionType = TransactionType.adjusted


class StockItemResponse(StockItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    commodity: Optional[CommodityResponse] = None
    is_low_stock: bool = False


class StockItemListResponse(BaseModel):
    items: List[StockItemResponse]
    total: int
    page: int
    size: int
    pages: int


# StockTransaction schemas
class StockTransactionBase(BaseModel):
    stock_item_id: int
    transaction_type: TransactionType
    quantity: float
    reference_id: Optional[str] = None
    notes: Optional[str] = None


class StockTransactionCreate(StockTransactionBase):
    pass


class StockTransactionResponse(StockTransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by: Optional[int] = None
    created_at: datetime


class StockTransactionListResponse(BaseModel):
    items: List[StockTransactionResponse]
    total: int
    page: int
    size: int
    pages: int
