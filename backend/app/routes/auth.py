from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.core.deps import get_current_user
from app.models.user import User, Role, UserProfile, UserCrop
from app.models.agronomy import Crop
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut, UserProfileUpdate, PasswordChange
from app.schemas.agronomy import CropOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _format_user_crops(user: User):
    crops_list = []
    crop_ids = []
    if user.user_crops:
        for uc in user.user_crops:
            if uc.crop and uc.crop.is_active:
                crop_ids.append(uc.crop.id)
                crops_list.append(CropOut.model_validate(uc.crop))
    return crops_list, crop_ids

@router.post("/register", response_model=Token)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower() if req.email else ""
    clean_phone = req.phone.strip() if (req.phone and req.phone.strip()) else None
    clean_name = req.full_name.strip() if req.full_name else ""

    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required."
        )

    if req.confirm_password is not None and req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    clean_gender = (req.gender or "male").strip().lower()
    if clean_gender not in ["male", "female", "other"]:
        clean_gender = "other"

    # Check if email exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists. Please sign in or use a different email."
        )
    
    # Check phone if provided
    if clean_phone:
        existing_phone = db.query(User).filter(User.phone == clean_phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this mobile number already exists. Please use a different phone number."
            )
            
    # Resolve role
    role_name = (req.role_name or "FARMER").upper()
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = db.query(Role).filter(Role.name == "FARMER").first()
    if not role:
        role = Role(name="FARMER", description="Farmer / Producer")
        db.add(role)
        db.commit()
        db.refresh(role)
        
    # Validate crop_ids
    valid_crops = []
    if req.crop_ids:
        valid_crops = db.query(Crop).filter(Crop.id.in_(req.crop_ids), Crop.is_active == True).all()

    primary_crops_str = ", ".join([c.name for c in valid_crops]) if valid_crops else None

    try:
        new_user = User(
            role_id=role.id,
            full_name=clean_name,
            email=clean_email,
            phone=clean_phone,
            password_hash=hash_password(req.password),
            gender=clean_gender,
            is_active=True,
            is_verified=True,
            preferred_language=req.preferred_language or "en"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create profile
        profile = UserProfile(
            user_id=new_user.id,
            gender=clean_gender,
            farm_location=req.farm_location.strip() if req.farm_location else None,
            farm_size_acres=req.farm_size or 1.0,
            primary_crops=primary_crops_str
        )
        db.add(profile)

        # Save user_crops many-to-many relationship
        for crop in valid_crops:
            user_crop = UserCrop(user_id=new_user.id, crop_id=crop.id)
            db.add(user_crop)

        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )
    
    # Generate Token
    token = create_access_token(subject=new_user.id, role=role.name)
    crops_list, crop_ids = _format_user_crops(new_user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role.name,
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "phone": new_user.phone,
            "gender": new_user.gender,
            "role": role.name,
            "role_name": role.name,
            "preferred_language": new_user.preferred_language,
            "crop_ids": crop_ids,
            "crops": [c.model_dump() for c in crops_list]
        }
    }

@router.post("/login", response_model=Token)
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support."
        )
        
    role_name = user.role.name if user.role else "FARMER"
    token = create_access_token(subject=user.id, role=role_name)
    crops_list, crop_ids = _format_user_crops(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role_name,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "gender": user.gender,
            "role": role_name,
            "role_name": role_name,
            "preferred_language": user.preferred_language,
            "crop_ids": crop_ids,
            "crops": [c.model_dump() for c in crops_list]
        }
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    crops_list, crop_ids = _format_user_crops(current_user)
    user_out = UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        gender=current_user.gender,
        role_name=current_user.role.name if current_user.role else "FARMER",
        is_active=current_user.is_active,
        preferred_language=current_user.preferred_language,
        created_at=current_user.created_at,
        profile=current_user.profile,
        crops=crops_list,
        crop_ids=crop_ids
    )
    return user_out

@router.put("/profile", response_model=UserOut)
def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip() if req.phone.strip() else None
    if req.preferred_language is not None:
        current_user.preferred_language = req.preferred_language
    if req.gender is not None:
        clean_gender = req.gender.strip().lower()
        if clean_gender in ["male", "female", "other"]:
            current_user.gender = clean_gender
        
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        
    if req.gender is not None:
        profile.gender = current_user.gender
    if req.farm_location is not None:
        profile.farm_location = req.farm_location.strip() if req.farm_location else None
    if req.farm_size_acres is not None:
        profile.farm_size_acres = req.farm_size_acres
    if req.primary_crops is not None:
        profile.primary_crops = req.primary_crops
    if req.soil_type is not None:
        profile.soil_type = req.soil_type
    if req.irrigation_source is not None:
        profile.irrigation_source = req.irrigation_source
    if req.state is not None:
        profile.state = req.state
    if req.district is not None:
        profile.district = req.district
    if req.bio is not None:
        profile.bio = req.bio

    # Update crop_ids if passed
    if req.crop_ids is not None:
        # Delete existing
        db.query(UserCrop).filter(UserCrop.user_id == current_user.id).delete()
        valid_crops = db.query(Crop).filter(Crop.id.in_(req.crop_ids), Crop.is_active == True).all() if req.crop_ids else []
        for c in valid_crops:
            db.add(UserCrop(user_id=current_user.id, crop_id=c.id))
        profile.primary_crops = ", ".join([c.name for c in valid_crops]) if valid_crops else None
        
    db.commit()
    db.refresh(current_user)
    
    crops_list, crop_ids = _format_user_crops(current_user)
    return UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        gender=current_user.gender,
        role_name=current_user.role.name if current_user.role else "FARMER",
        is_active=current_user.is_active,
        preferred_language=current_user.preferred_language,
        created_at=current_user.created_at,
        profile=current_user.profile,
        crops=crops_list,
        crop_ids=crop_ids
    )

@router.post("/change-password")
def change_password(
    req: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password updated successfully."}
