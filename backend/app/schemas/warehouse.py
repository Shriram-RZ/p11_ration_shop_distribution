from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class WarehouseBase(BaseModel):
    name: str
    location: str
    capacity: float = 0.0
    manager_id: Optional[int] = None
    phone: Optional[str] = None
    is_active: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[float] = None
    manager_id: Optional[int] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class WarehouseResponse(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class WarehouseListResponse(BaseModel):
    items: List[WarehouseResponse]
    total: int
    page: int
    size: int
    pages: int
