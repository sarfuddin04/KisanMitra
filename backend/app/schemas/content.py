from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Farming Tip
class FarmingTipBase(BaseModel):
    title: str
    category: str
    summary: str
    detailed_content: str
    season: Optional[str] = "All Seasons"
    image_url: Optional[str] = None
    author: Optional[str] = "KisanMitra Agronomy Team"
    is_published: Optional[bool] = True

class FarmingTipCreate(FarmingTipBase):
    pass

class FarmingTipUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    detailed_content: Optional[str] = None
    season: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    is_published: Optional[bool] = None

class FarmingTipOut(FarmingTipBase):
    id: int
    views_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Notification
class NotificationBase(BaseModel):
    user_id: Optional[int] = None
    title: str
    message: str
    notification_type: Optional[str] = "ALERT"
    link_url: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationOut(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Banner
class BannerBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = "/marketplace"
    button_text: Optional[str] = "Explore Now"
    display_order: Optional[int] = 1
    is_active: Optional[bool] = True

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    button_text: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class BannerOut(BannerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# FAQ
class FAQBase(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "General"
    display_order: Optional[int] = 1
    is_active: Optional[bool] = True

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class FAQOut(FAQBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Contact
class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class ContactOut(ContactCreate):
    id: int
    is_resolved: bool
    admin_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# System Setting
class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    is_public: Optional[bool] = False

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None
    is_public: Optional[bool] = None

class SettingOut(SettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

# Audit Log
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
