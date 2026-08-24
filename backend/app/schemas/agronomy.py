from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Crops
class CropBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = "Cereal"
    season: Optional[str] = "Kharif"
    min_n: Optional[float] = 0.0
    max_n: Optional[float] = 150.0
    min_p: Optional[float] = 0.0
    max_p: Optional[float] = 150.0
    min_k: Optional[float] = 0.0
    max_k: Optional[float] = 200.0
    min_ph: Optional[float] = 5.0
    max_ph: Optional[float] = 8.0
    optimal_temp_c: Optional[str] = "20-30"
    optimal_rainfall_mm: Optional[str] = "100-200"
    duration_days: Optional[int] = 120
    description: Optional[str] = None
    cultivation_guide: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = True

class CropCreate(CropBase):
    pass

class CropUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    season: Optional[str] = None
    min_n: Optional[float] = None
    max_n: Optional[float] = None
    min_p: Optional[float] = None
    max_p: Optional[float] = None
    min_k: Optional[float] = None
    max_k: Optional[float] = None
    min_ph: Optional[float] = None
    max_ph: Optional[float] = None
    optimal_temp_c: Optional[str] = None
    optimal_rainfall_mm: Optional[str] = None
    duration_days: Optional[int] = None
    description: Optional[str] = None
    cultivation_guide: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CropOut(CropBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Fertilizers
class FertilizerBase(BaseModel):
    name: str
    formula_or_ratio: Optional[str] = None
    category: Optional[str] = "Inorganic"
    nitrogen_pct: Optional[float] = 0.0
    phosphorus_pct: Optional[float] = 0.0
    potassium_pct: Optional[float] = 0.0
    suitable_crops: Optional[str] = "All Crops"
    soil_condition_suitability: Optional[str] = None
    application_guidance: Optional[str] = None
    precautions: Optional[str] = None
    is_active: Optional[bool] = True

class FertilizerCreate(FertilizerBase):
    pass

class FertilizerUpdate(BaseModel):
    name: Optional[str] = None
    formula_or_ratio: Optional[str] = None
    category: Optional[str] = None
    nitrogen_pct: Optional[float] = None
    phosphorus_pct: Optional[float] = None
    potassium_pct: Optional[float] = None
    suitable_crops: Optional[str] = None
    soil_condition_suitability: Optional[str] = None
    application_guidance: Optional[str] = None
    precautions: Optional[str] = None
    is_active: Optional[bool] = None

class FertilizerOut(FertilizerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Diseases
class DiseaseBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    crop: str
    pathogen_type: Optional[str] = "Fungal"
    severity: Optional[str] = "Moderate"
    symptoms: str
    causes: Optional[str] = None
    prevention_guide: str
    treatment_guide: str
    image_url: Optional[str] = None
    is_active: Optional[bool] = True

class DiseaseCreate(DiseaseBase):
    pass

class DiseaseUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    crop: Optional[str] = None
    pathogen_type: Optional[str] = None
    severity: Optional[str] = None
    symptoms: Optional[str] = None
    causes: Optional[str] = None
    prevention_guide: Optional[str] = None
    treatment_guide: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class DiseaseOut(DiseaseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Recommendation Requests & Outputs
class CropRecommendationRequest(BaseModel):
    n: float = Field(..., ge=0, le=300, description="Nitrogen content in soil (mg/kg or kg/ha)")
    p: float = Field(..., ge=0, le=300, description="Phosphorus content in soil (mg/kg or kg/ha)")
    k: float = Field(..., ge=0, le=300, description="Potassium content in soil (mg/kg or kg/ha)")
    temperature: float = Field(..., ge=-10, le=60, description="Ambient temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value")
    rainfall: float = Field(..., ge=0, le=1000, description="Rainfall (mm)")

class CropRecommendationOut(BaseModel):
    id: Optional[int] = None
    recommended_crop: str
    confidence: float
    suitable_conditions: dict
    cultivation_tips: Optional[str] = None
    alternative_crops: Optional[List[str]] = []
    created_at: Optional[datetime] = None

class DiseasePredictionOut(BaseModel):
    id: Optional[int] = None
    crop_selected: Optional[str] = None
    predicted_disease: str
    scientific_name: Optional[str] = None
    pathogen_type: Optional[str] = None
    severity: Optional[str] = None
    confidence: float
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prevention: Optional[str] = None
    image_url: Optional[str] = None
    disclaimer: str = "AI-assisted prediction only. For serious crop disease, consult a qualified agricultural expert."
    created_at: Optional[datetime] = None

class FertilizerRecommendationRequest(BaseModel):
    crop_name: str
    soil_n: float
    soil_p: float
    soil_k: float
    soil_ph: float
    soil_condition: Optional[str] = "Normal"

class FertilizerRecommendationOut(BaseModel):
    id: Optional[int] = None
    crop_name: str
    recommended_fertilizer: str
    npk_deficiency: Optional[str] = None
    dosage_kg_per_acre: float
    application_schedule: Optional[str] = None
    precautions: Optional[str] = None
    created_at: Optional[datetime] = None
