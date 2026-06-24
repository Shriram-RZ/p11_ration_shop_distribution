from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class LoginRequest(BaseModel):
    # Email (staff/admin) or ration card number (customer).
    identifier: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: Optional[str] = None
    full_name: str
    role: str
    card_number: Optional[str] = None
    category: Optional[str] = None


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class RegisterRequest(BaseModel):
    """Customer self sign-up: verified against the ration card database."""
    aadhaar_number: str = Field(min_length=12, max_length=12)
    card_number: str
    phone: str
    password: str = Field(min_length=6)
