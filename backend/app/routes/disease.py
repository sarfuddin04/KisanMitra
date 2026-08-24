from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_optional_user, get_current_user
from app.models.user import User
from app.models.agronomy import DiseasePrediction, Disease
from app.schemas.agronomy import DiseasePredictionOut
from app.services.disease_service import process_disease_image
from app.services.pdf_service import generate_disease_pdf_report

router = APIRouter(prefix="/disease", tags=["Disease Detection"])

@router.post("/predict", response_model=DiseasePredictionOut)
async def predict_plant_disease(
    file: UploadFile = File(...),
    crop_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPEG, PNG, WEBP).")
        
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image file size exceeds maximum limit of 10 MB.")
        
    try:
        diag = process_disease_image(
            image_bytes=contents,
            filename=file.filename or "leaf.jpg",
            crop_hint=crop_name
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Treatment & Prevention formatting
    treatment_str = "\n".join(diag.get("treatment", [])) if isinstance(diag.get("treatment"), list) else str(diag.get("treatment", ""))
    prevention_str = "\n".join(diag.get("prevention", [])) if isinstance(diag.get("prevention"), list) else str(diag.get("prevention", ""))
    
    pred_obj = DiseasePrediction(
        user_id=current_user.id if current_user else None,
        crop_selected=crop_name or diag.get("crop", "General"),
        image_filename=diag.get("saved_filename"),
        image_url=diag.get("image_url"),
        predicted_disease=diag.get("name", "Unknown Disease"),
        pathogen_type=diag.get("pathogen_type", "Fungal"),
        severity=diag.get("severity", "Moderate"),
        confidence=diag.get("confidence", 0.90),
        symptoms=diag.get("symptoms", ""),
        treatment=treatment_str,
        prevention=prevention_str
    )
    db.add(pred_obj)
    db.commit()
    db.refresh(pred_obj)
    
    return DiseasePredictionOut(
        id=pred_obj.id,
        crop_selected=pred_obj.crop_selected,
        predicted_disease=pred_obj.predicted_disease,
        scientific_name=diag.get("scientific_name"),
        pathogen_type=pred_obj.pathogen_type,
        severity=pred_obj.severity,
        confidence=pred_obj.confidence,
        symptoms=pred_obj.symptoms,
        treatment=pred_obj.treatment,
        prevention=pred_obj.prevention,
        image_url=pred_obj.image_url,
        disclaimer=diag.get("disclaimer"),
        created_at=pred_obj.created_at
    )

@router.get("/history", response_model=List[DiseasePredictionOut])
def get_disease_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(DiseasePrediction).filter(
        DiseasePrediction.user_id == current_user.id
    ).order_by(DiseasePrediction.created_at.desc()).limit(50).all()
    
    return [
        DiseasePredictionOut(
            id=r.id,
            crop_selected=r.crop_selected,
            predicted_disease=r.predicted_disease,
            pathogen_type=r.pathogen_type,
            severity=r.severity,
            confidence=r.confidence,
            symptoms=r.symptoms,
            treatment=r.treatment,
            prevention=r.prevention,
            image_url=r.image_url,
            created_at=r.created_at
        ) for r in records
    ]

@router.get("/{pred_id}/pdf")
def download_disease_prediction_pdf(
    pred_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == pred_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Disease diagnosis record not found.")
        
    farmer_name = current_user.full_name if current_user else "Farmer / Guest User"
    farm_location = current_user.profile.farm_location if (current_user and current_user.profile) else "National Agronomy Grid"
    
    disease_data = {
        "crop": pred.crop_selected,
        "predicted_disease": pred.predicted_disease,
        "pathogen_type": pred.pathogen_type,
        "severity": pred.severity,
        "confidence": pred.confidence,
        "symptoms": pred.symptoms,
        "causes": "Favorable warm/humid micro-climate and pathogen spores in canopy.",
        "treatment": [t.strip() for t in pred.treatment.split("\n") if t.strip()] if pred.treatment else [],
        "prevention": [p.strip() for p in pred.prevention.split("\n") if p.strip()] if pred.prevention else []
    }
    
    pdf_bytes = generate_disease_pdf_report(
        farmer_name=farmer_name,
        farm_location=farm_location,
        disease_data=disease_data
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=KisanMitra_Disease_Report_{pred.id}.pdf"
        }
    )
