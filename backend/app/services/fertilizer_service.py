from sqlalchemy.orm import Session
from typing import Dict, Any
from app.models.agronomy import Fertilizer, Crop

def recommend_fertilizer(crop_name: str, soil_n: float, soil_p: float, soil_k: float, soil_ph: float, db: Session) -> Dict[str, Any]:
    # 1. Fetch crop reference from DB if available
    crop = db.query(Crop).filter(Crop.name.ilike(f"%{crop_name}%")).first()
    
    target_n = (crop.min_n + crop.max_n) / 2 if crop else 80.0
    target_p = (crop.min_p + crop.max_p) / 2 if crop else 45.0
    target_k = (crop.min_k + crop.max_k) / 2 if crop else 40.0
    
    diff_n = target_n - soil_n
    diff_p = target_p - soil_p
    diff_k = target_k - soil_k
    
    # Identify primary deficiency
    deficiencies = []
    if diff_n > 15:
        deficiencies.append("Nitrogen (N)")
    if diff_p > 10:
        deficiencies.append("Phosphorus (P)")
    if diff_k > 10:
        deficiencies.append("Potassium (K)")
        
    deficiency_text = ", ".join(deficiencies) if deficiencies else "Balanced soil nutrients"
    
    # Match available fertilizers from PostgreSQL / DB
    active_fertilizers = db.query(Fertilizer).filter(Fertilizer.is_active == True).all()
    
    recommended_fertilizer = "NPK 19:19:19 (Complex Fertilizer)"
    dosage = 50.0
    schedule = "Apply in 2 split doses: 50% at basal sowing and 50% at active tillering stage."
    precautions = "Avoid applying fertilizer directly on wet foliage. Ensure adequate soil moisture before application."
    
    if diff_n > 25 and diff_p <= 10 and diff_k <= 10:
        urea = next((f for f in active_fertilizers if "Urea" in f.name), None)
        if urea:
            recommended_fertilizer = urea.name
            dosage = 45.0
            schedule = urea.application_guidance or "Apply 50% at basal and 50% top-dressed after first irrigation."
            precautions = urea.precautions or precautions
    elif diff_p > 20 and diff_n > 15:
        dap = next((f for f in active_fertilizers if "DAP" in f.name or "18-46" in f.name), None)
        if dap:
            recommended_fertilizer = dap.name
            dosage = 55.0
            schedule = dap.application_guidance or "Apply as basal placement 5 cm below seed level."
            precautions = dap.precautions or precautions
    elif diff_k > 20:
        mop = next((f for f in active_fertilizers if "MOP" in f.name or "Potash" in f.name), None)
        if mop:
            recommended_fertilizer = mop.name
            dosage = 35.0
            schedule = mop.application_guidance or "Apply basal or before flowering to boost grain filling and disease resistance."
            precautions = mop.precautions or precautions
    elif active_fertilizers:
        # Pick the most suitable complex fertilizer from DB
        npk_complex = next((f for f in active_fertilizers if "19:19:19" in f.name or "10:26:26" in f.name or "Complex" in f.name), active_fertilizers[0])
        recommended_fertilizer = npk_complex.name
        dosage = 50.0
        schedule = npk_complex.application_guidance or schedule
        precautions = npk_complex.precautions or precautions
        
    if soil_ph < 5.5:
        precautions += " Soil is acidic (pH < 5.5); apply agricultural lime @ 200 kg/acre to correct acidity."
    elif soil_ph > 8.2:
        precautions += " Soil is alkaline (pH > 8.2); incorporate gypsum or organic compost to improve nutrient bioavailability."
        
    return {
        "crop_name": crop_name,
        "recommended_fertilizer": recommended_fertilizer,
        "npk_deficiency": deficiency_text,
        "dosage_kg_per_acre": dosage,
        "application_schedule": schedule,
        "precautions": precautions
    }
