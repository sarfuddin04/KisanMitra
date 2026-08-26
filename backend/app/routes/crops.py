from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.agronomy import Crop
from app.schemas.agronomy import CropOut

router = APIRouter(prefix="/crops", tags=["Crops"])

@router.get("", response_model=List[CropOut])
def get_public_crops(db: Session = Depends(get_db)):
    """Fetch all active crops for registration and farmer profiles."""
    crops = db.query(Crop).filter(Crop.is_active == True).order_by(Crop.id.asc()).all()
    return crops

@router.get("/{crop_id}", response_model=CropOut)
def get_crop_by_id(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.is_active == True).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found"
        )
    return crop
