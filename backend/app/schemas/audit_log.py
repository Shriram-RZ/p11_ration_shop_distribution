from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    action: str
    resource: str
    resource_id: Optional[int] = None
    details: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int
    pages: int
