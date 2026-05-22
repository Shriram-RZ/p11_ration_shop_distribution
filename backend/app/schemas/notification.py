from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.info
    target_role: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_read: bool
    created_by: Optional[int] = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
