from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ==================== STATE ====================

class StateBase(BaseModel):
    name: str
    is_active: Optional[bool] = True


class StateCreate(StateBase):
    pass


class StateUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class StateOut(StateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== DISTRICT ====================

class DistrictBase(BaseModel):
    state_id: int
    name: str
    is_active: Optional[bool] = True


class DistrictCreate(DistrictBase):
    pass


class DistrictUpdate(BaseModel):
    state_id: Optional[int] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None


class DistrictOut(DistrictBase):
    id: int
    state_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== MANDI ====================

class MandiBase(BaseModel):
    district_id: int
    name: str
    address: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_number: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    mandi_type: Optional[str] = "APMC Mandi"
    image_url: Optional[str] = None
    is_active: Optional[bool] = True


class MandiCreate(MandiBase):
    pass


class MandiUpdate(BaseModel):
    district_id: Optional[int] = None
    name: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_number: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    mandi_type: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class MandiOut(MandiBase):
    id: int
    district_name: Optional[str] = None
    state_id: Optional[int] = None
    state_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
