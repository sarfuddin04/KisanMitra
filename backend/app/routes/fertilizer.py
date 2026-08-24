from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_optional_user, get_current_user
from app.models.user import User
from app.models.agronomy import FertilizerRecommendation
from app.schemas.agronomy import FertilizerRecommendationRequest, FertilizerRecommendationOut
from app.services.fertilizer_service import recommend_fertilizer

router = APIRouter(prefix="/fertilizer", tags=["Fertilizer Recommendation"])

@router.post("/recommend", response_model=FertilizerRecommendationOut)
def get_fertilizer_recommendation(
    req: FertilizerRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    result = recommend_fertilizer(
        crop_name=req.crop_name,
        soil_n=req.soil_n,
        soil_p=req.soil_p,
        soil_k=req.soil_k,
        soil_ph=req.soil_ph,
        db=db
    )
    
    rec_obj = FertilizerRecommendation(
        user_id=current_user.id if current_user else None,
        crop_name=req.crop_name,
        soil_n=req.soil_n,
        soil_p=req.soil_p,
        soil_k=req.soil_k,
        soil_ph=req.soil_ph,
        soil_condition=req.soil_condition,
        recommended_fertilizer=result["recommended_fertilizer"],
        npk_deficiency=result["npk_deficiency"],
        dosage_kg_per_acre=result["dosage_kg_per_acre"],
        application_schedule=result["application_schedule"],
        precautions=result["precautions"]
    )
    db.add(rec_obj)
    db.commit()
    db.refresh(rec_obj)
    
    return FertilizerRecommendationOut(
        id=rec_obj.id,
        crop_name=rec_obj.crop_name,
        recommended_fertilizer=rec_obj.recommended_fertilizer,
        npk_deficiency=rec_obj.npk_deficiency,
        dosage_kg_per_acre=rec_obj.dosage_kg_per_acre,
        application_schedule=rec_obj.application_schedule,
        precautions=rec_obj.precautions,
        created_at=rec_obj.created_at
    )

@router.get("/history", response_model=List[FertilizerRecommendationOut])
def get_fertilizer_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(FertilizerRecommendation).filter(
        FertilizerRecommendation.user_id == current_user.id
    ).order_by(FertilizerRecommendation.created_at.desc()).limit(50).all()
    
    return [
        FertilizerRecommendationOut(
            id=r.id,
            crop_name=r.crop_name,
            recommended_fertilizer=r.recommended_fertilizer,
            npk_deficiency=r.npk_deficiency,
            dosage_kg_per_acre=r.dosage_kg_per_acre,
            application_schedule=r.application_schedule,
            precautions=r.precautions,
            created_at=r.created_at
        ) for r in records
    ]
