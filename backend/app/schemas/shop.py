from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class ShopBase(BaseModel):
    name: str
    shop_code: str
    address: str
    district: str
    state: str
    pincode: str
    manager_id: Optional[int] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    is_active: bool = True


class ShopCreate(ShopBase):
    pass


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    manager_id: Optional[int] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    is_active: Optional[bool] = None


class ShopResponse(ShopBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ShopListResponse(BaseModel):
    items: List[ShopResponse]
    total: int
    page: int
    size: int
    pages: int
