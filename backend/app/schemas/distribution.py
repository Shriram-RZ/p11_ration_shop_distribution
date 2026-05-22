from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.distribution import DistributionStatus


class DistributionBase(BaseModel):
    card_id: int
    shop_id: int
    distribution_month: int
    distribution_year: int
    rice_quantity: float = 0.0
    wheat_quantity: float = 0.0
    sugar_quantity: float = 0.0
    oil_quantity: float = 0.0
    status: DistributionStatus = DistributionStatus.pending
    notes: Optional[str] = None

    @field_validator("distribution_month")
    @classmethod
    def validate_month(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("distribution_month must be between 1 and 12")
        return v

    @field_validator("distribution_year")
    @classmethod
    def validate_year(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("distribution_year must be between 2000 and 2100")
        return v


class DistributionCreate(DistributionBase):
    pass


class DistributionUpdate(BaseModel):
    rice_quantity: Optional[float] = None
    wheat_quantity: Optional[float] = None
    sugar_quantity: Optional[float] = None
    oil_quantity: Optional[float] = None
    status: Optional[DistributionStatus] = None
    notes: Optional[str] = None


class DistributionStatusUpdate(BaseModel):
    status: DistributionStatus


class DistributionResponse(DistributionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    distributed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class DistributionListResponse(BaseModel):
    items: List[DistributionResponse]
    total: int
    page: int
    size: int
    pages: int


class MonthlySummary(BaseModel):
    month: int
    year: int
    total_distributions: int
    total_rice: float
    total_wheat: float
    total_sugar: float
    total_oil: float
    completed: int
    pending: int
    partial: int
