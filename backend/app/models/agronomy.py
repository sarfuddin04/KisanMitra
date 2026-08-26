import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    category = Column(String(50), default="Cereal")  # Cereal, Pulses, Fruits, Cash Crop, Oilseeds
    season = Column(String(50), default="Kharif")  # Kharif, Rabi, Zaid, Year-round
    min_n = Column(Float, default=0.0)
    max_n = Column(Float, default=150.0)
    min_p = Column(Float, default=0.0)
    max_p = Column(Float, default=150.0)
    min_k = Column(Float, default=0.0)
    max_k = Column(Float, default=200.0)
    min_ph = Column(Float, default=5.0)
    max_ph = Column(Float, default=8.0)
    optimal_temp_c = Column(String(50), default="20-30")
    optimal_rainfall_mm = Column(String(50), default="100-200")
    duration_days = Column(Integer, default=120)
    description = Column(Text, nullable=True)
    cultivation_guide = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    suitable_soil = Column(String(200), nullable=True)  # e.g. "Loamy, Clay Loam"
    ph_range = Column(String(50), nullable=True)  # e.g. "6.0-7.5"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user_crops = relationship("UserCrop", back_populates="crop", cascade="all, delete-orphan")


class Fertilizer(Base):
    __tablename__ = "fertilizers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, index=True, nullable=False)
    formula_or_ratio = Column(String(50), nullable=True)  # e.g., 46-0-0, 18-46-0, 0-0-60
    category = Column(String(50), default="Inorganic")  # Chemical / Organic / Bio-fertilizer
    nitrogen_pct = Column(Float, default=0.0)
    phosphorus_pct = Column(Float, default=0.0)
    potassium_pct = Column(Float, default=0.0)
    suitable_crops = Column(String(255), default="All Crops")
    soil_condition_suitability = Column(String(255), nullable=True)
    application_guidance = Column(Text, nullable=True)
    precautions = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    crop = Column(String(100), index=True, nullable=False)
    pathogen_type = Column(String(50), default="Fungal")  # Fungal, Bacterial, Viral, Nutrient Deficiency, Healthy
    severity = Column(String(50), default="Moderate")
    symptoms = Column(Text, nullable=False)
    causes = Column(Text, nullable=True)
    prevention_guide = Column(Text, nullable=False)
    treatment_guide = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    n = Column(Float, nullable=False)
    p = Column(Float, nullable=False)
    k = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    recommended_crop = Column(String(100), nullable=False)
    confidence = Column(Float, default=0.95)
    alternative_crops = Column(String(255), nullable=True)
    cultivation_tips = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="crop_recommendations")

class DiseasePrediction(Base):
    __tablename__ = "disease_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    crop_selected = Column(String(100), nullable=True)
    image_filename = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)
    predicted_disease = Column(String(150), nullable=False)
    pathogen_type = Column(String(50), nullable=True)
    severity = Column(String(50), nullable=True)
    confidence = Column(Float, default=0.90)
    symptoms = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    prevention = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="disease_predictions")

class FertilizerRecommendation(Base):
    __tablename__ = "fertilizer_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    crop_name = Column(String(100), nullable=False)
    soil_n = Column(Float, nullable=False)
    soil_p = Column(Float, nullable=False)
    soil_k = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    soil_condition = Column(String(100), nullable=True)
    recommended_fertilizer = Column(String(150), nullable=False)
    npk_deficiency = Column(String(100), nullable=True)
    dosage_kg_per_acre = Column(Float, default=50.0)
    application_schedule = Column(Text, nullable=True)
    precautions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="fertilizer_recommendations")
