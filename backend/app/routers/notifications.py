from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationListResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    is_read: Optional[bool] = Query(None),
    type: Optional[NotificationType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).order_by(Notification.created_at.desc())

    # Filter by role or all-role notifications
    query = query.filter(
        (Notification.target_role == None) | (Notification.target_role == current_user.role.value)
    )

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if type:
        query = query.filter(Notification.type == type)

    unread_count = db.query(Notification).filter(
        (Notification.target_role == None) | (Notification.target_role == current_user.role.value),
        Notification.is_read == False,
    ).count()

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return NotificationListResponse(items=items, total=total, unread_count=unread_count)


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    request: Request,
    payload: NotificationCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notification = Notification(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        target_role=payload.target_role,
        created_by=current_user.id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    log_audit(
        db=db, user_id=current_user.id, action="CREATE", resource="notifications",
        resource_id=notification.id, details={"title": notification.title},
        ip_address=get_client_ip(request),
    )
    return notification


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(
        (Notification.target_role == None) | (Notification.target_role == current_user.role.value),
        Notification.is_read == False,
    )
    count = query.count()
    query.update({"is_read": True}, synchronize_session=False)
    db.commit()

    return {"message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    db.delete(notification)
    db.commit()

    log_audit(
        db=db, user_id=current_user.id, action="DELETE", resource="notifications",
        resource_id=notification_id, ip_address=get_client_ip(request),
    )
