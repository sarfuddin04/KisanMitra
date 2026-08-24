import json
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_optional_user, get_current_user
from app.models.user import User
from app.models.agronomy import CropRecommendation, Crop
from app.schemas.agronomy import CropRecommendationRequest, CropRecommendationOut
from app.services.crop_ml import predict_crop
from app.services.pdf_service import generate_crop_pdf_report

router = APIRouter(prefix="/recommendations", tags=["Crop Recommendation"])

@router.post("/crop", response_model=CropRecommendationOut)
def get_crop_recommendation(
    req: CropRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    # Run ML Model
    prediction_result = predict_crop(
        n=req.n,
        p=req.p,
        k=req.k,
        temp=req.temperature,
        humidity=req.humidity,
        ph=req.ph,
        rainfall=req.rainfall
    )
    
    # Save recommendation to DB
    rec_obj = CropRecommendation(
        user_id=current_user.id if current_user else None,
        n=req.n,
        p=req.p,
        k=req.k,
        temperature=req.temperature,
        humidity=req.humidity,
        ph=req.ph,
        rainfall=req.rainfall,
        recommended_crop=prediction_result["recommended_crop"],
        confidence=prediction_result["confidence"],
        alternative_crops=", ".join(prediction_result.get("alternative_crops", [])),
        cultivation_tips=prediction_result.get("cultivation_tips", "")
    )
    db.add(rec_obj)
    db.commit()
    db.refresh(rec_obj)
    
    return CropRecommendationOut(
        id=rec_obj.id,
        recommended_crop=rec_obj.recommended_crop,
        confidence=rec_obj.confidence,
        suitable_conditions=prediction_result["suitable_conditions"],
        cultivation_tips=rec_obj.cultivation_tips,
        alternative_crops=prediction_result.get("alternative_crops", []),
        created_at=rec_obj.created_at
    )

@router.get("/history", response_model=List[CropRecommendationOut])
def get_recommendation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(CropRecommendation).filter(
        CropRecommendation.user_id == current_user.id
    ).order_by(CropRecommendation.created_at.desc()).limit(50).all()
    
    results = []
    for r in records:
        alts = [c.strip() for c in r.alternative_crops.split(",")] if r.alternative_crops else []
        results.append(CropRecommendationOut(
            id=r.id,
            recommended_crop=r.recommended_crop,
            confidence=r.confidence,
            suitable_conditions={
                "n": r.n, "p": r.p, "k": r.k,
                "temperature": r.temperature, "humidity": r.humidity,
                "ph": r.ph, "rainfall": r.rainfall
            },
            cultivation_tips=r.cultivation_tips,
            alternative_crops=alts,
            created_at=r.created_at
        ))
    return results

@router.get("/{rec_id}/pdf")
def download_crop_recommendation_pdf(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    rec = db.query(CropRecommendation).filter(CropRecommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation record not found.")
        
    farmer_name = current_user.full_name if current_user else "Farmer / Guest User"
    farm_location = current_user.profile.farm_location if (current_user and current_user.profile) else "National Agronomy Grid"
    
    crop_data = {
        "recommended_crop": rec.recommended_crop,
        "confidence": rec.confidence,
        "cultivation_tips": rec.cultivation_tips,
        "alternative_crops": [c.strip() for c in rec.alternative_crops.split(",")] if rec.alternative_crops else []
    }
    inputs = {
        "n": rec.n, "p": rec.p, "k": rec.k,
        "ph": rec.ph, "temperature": rec.temperature,
        "humidity": rec.humidity, "rainfall": rec.rainfall
    }
    
    pdf_bytes = generate_crop_pdf_report(
        farmer_name=farmer_name,
        farm_location=farm_location,
        crop_data=crop_data,
        inputs=inputs
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=KisanMitra_Crop_Report_{rec.id}.pdf"
        }
    )
