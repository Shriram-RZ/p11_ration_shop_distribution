from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime


# ─── Catalog ──────────────────────────────────────────────────────────────────

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    commodity_id: int
    name: str
    unit: str
    description: Optional[str] = None
    price: float
    available_quantity: float


# ─── Orders ───────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    commodity_id: int
    quantity: float = Field(gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1)
    delivery_address: Optional[str] = None
    contact_phone: Optional[str] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    commodity_id: Optional[int] = None
    commodity_name: str
    unit: str
    quantity: float
    unit_price: float
    subtotal: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    customer_id: int
    total_amount: float
    status: str
    delivery_address: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse] = []
