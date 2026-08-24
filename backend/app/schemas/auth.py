from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: dict

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    farm_location: Optional[str] = None
    farm_size: Optional[float] = 1.0
    preferred_language: Optional[str] = "en"
    role_name: Optional[str] = "FARMER"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileOut(BaseModel):
    id: Optional[int] = None
    farm_location: Optional[str] = None
    farm_size_acres: Optional[float] = None
    primary_crops: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_source: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role_name: Optional[str] = None
    is_active: bool
    preferred_language: str
    created_at: datetime
    profile: Optional[UserProfileOut] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    farm_location: Optional[str] = None
    farm_size_acres: Optional[float] = None
    primary_crops: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_source: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    preferred_language: Optional[str] = None
    bio: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
