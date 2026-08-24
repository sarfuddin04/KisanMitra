from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.core.deps import get_current_user
from app.models.user import User, Role, UserProfile
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut, UserProfileUpdate, PasswordChange

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Check phone
    if req.phone:
        existing_phone = db.query(User).filter(User.phone == req.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )
            
    # Resolve role
    role_name = (req.role_name or "FARMER").upper()
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = db.query(Role).filter(Role.name == "FARMER").first()
        
    new_user = User(
        role_id=role.id,
        full_name=req.full_name,
        email=req.email.lower(),
        phone=req.phone,
        password_hash=hash_password(req.password),
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
        farm_location=req.farm_location,
        farm_size_acres=req.farm_size or 1.0,
        preferred_language=req.preferred_language or "en"
    )
    db.add(profile)
    db.commit()
    
    # Generate Token
    token = create_access_token(subject=new_user.id, role=role.name)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role.name,
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "phone": new_user.phone,
            "role": role.name,
            "preferred_language": new_user.preferred_language
        }
    }

@router.post("/login", response_model=Token)
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
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
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role_name,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": role_name,
            "preferred_language": user.preferred_language
        }
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    user_out = UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role_name=current_user.role.name if current_user.role else "FARMER",
        is_active=current_user.is_active,
        preferred_language=current_user.preferred_language,
        created_at=current_user.created_at,
        profile=current_user.profile
    )
    return user_out

@router.put("/profile", response_model=UserOut)
def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name:
        current_user.full_name = req.full_name
    if req.phone:
        current_user.phone = req.phone
    if req.preferred_language:
        current_user.preferred_language = req.preferred_language
        
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        
    if req.farm_location is not None:
        profile.farm_location = req.farm_location
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
        
    db.commit()
    db.refresh(current_user)
    
    return UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role_name=current_user.role.name if current_user.role else "FARMER",
        is_active=current_user.is_active,
        preferred_language=current_user.preferred_language,
        created_at=current_user.created_at,
        profile=current_user.profile
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
