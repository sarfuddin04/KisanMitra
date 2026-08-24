import os
import uuid
from typing import Dict, Any
from app.core.config import settings, PROJECT_ROOT
from ml.disease_detection.classifier import analyze_leaf_image

def process_disease_image(image_bytes: bytes, filename: str, crop_hint: str = None) -> Dict[str, Any]:
    # 1. Run ML leaf analyzer
    prediction = analyze_leaf_image(image_bytes, crop_hint=crop_hint)
    
    # 2. Persist image file safely to storage
    file_ext = os.path.splitext(filename)[1].lower() or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, "leaf_images", unique_filename)
    
    with open(saved_path, "wb") as f:
        f.write(image_bytes)
        
    prediction["saved_filename"] = unique_filename
    prediction["image_url"] = f"/api/static/leaf_images/{unique_filename}"
    prediction["predicted_disease"] = prediction.get("name")
    return prediction
