from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime, date
from app.models.beneficiary import RationCardCategory, RationCardStatus


class RationCardHolderBase(BaseModel):
    aadhaar_number: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: str
    district: str
    state: str
    pincode: str
    category: RationCardCategory = RationCardCategory.BPL
    is_active: bool = True

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar(cls, v: str) -> str:
        v = v.strip().replace(" ", "")
        if not v.isdigit() or len(v) != 12:
            raise ValueError("Aadhaar number must be exactly 12 digits")
        return v

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Pincode must be exactly 6 digits")
        return v


class RationCardHolderCreate(RationCardHolderBase):
    pass


class RationCardHolderUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    category: Optional[RationCardCategory] = None
    is_active: Optional[bool] = None


class RationCardHolderResponse(RationCardHolderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class RationCardHolderListResponse(BaseModel):
    items: List[RationCardHolderResponse]
    total: int
    page: int
    size: int
    pages: int


# Family Member schemas
class FamilyMemberBase(BaseModel):
    name: str
    aadhaar: Optional[str] = None
    relation: str
    age: Optional[int] = None


class FamilyMemberCreate(FamilyMemberBase):
    card_id: int


class FamilyMemberResponse(FamilyMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    card_id: int
    created_at: datetime


# Ration Card schemas
class RationCardBase(BaseModel):
    card_number: str
    holder_id: int
    shop_id: Optional[int] = None
    family_size: int = 1
    monthly_entitlement_rice: float = 0.0
    monthly_entitlement_wheat: float = 0.0
    monthly_entitlement_sugar: float = 0.0
    monthly_entitlement_oil: float = 0.0
    status: RationCardStatus = RationCardStatus.active
    issued_date: date
    expiry_date: Optional[date] = None


class RationCardCreate(RationCardBase):
    pass


class RationCardUpdate(BaseModel):
    shop_id: Optional[int] = None
    family_size: Optional[int] = None
    monthly_entitlement_rice: Optional[float] = None
    monthly_entitlement_wheat: Optional[float] = None
    monthly_entitlement_sugar: Optional[float] = None
    monthly_entitlement_oil: Optional[float] = None
    status: Optional[RationCardStatus] = None
    expiry_date: Optional[date] = None


class RationCardStatusUpdate(BaseModel):
    status: RationCardStatus


class RationCardResponse(RationCardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    holder: Optional[RationCardHolderResponse] = None
    family_members: Optional[List[FamilyMemberResponse]] = None


class RationCardListResponse(BaseModel):
    items: List[RationCardResponse]
    total: int
    page: int
    size: int
    pages: int
