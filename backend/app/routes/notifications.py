from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.content import Notification
from app.schemas.content import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user specific or broadcast (user_id is None) notifications
    notifs = db.query(Notification).filter(
        or_(Notification.user_id == current_user.id, Notification.user_id == None)
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return notifs

@router.put("/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        or_(Notification.user_id == current_user.id, Notification.user_id == None)
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read."}
