import os
import joblib
import numpy as np
from app.core.config import PROJECT_ROOT
from typing import Dict, Any

MODEL_PATH = os.path.join(PROJECT_ROOT, "ml", "crop_recommendation", "crop_model.joblib")

_loaded_model_bundle = None

def get_crop_model():
    global _loaded_model_bundle
    if _loaded_model_bundle is None:
        if os.path.exists(MODEL_PATH):
            _loaded_model_bundle = joblib.load(MODEL_PATH)
        else:
            # Train on the fly if model file not found
            from ml.crop_recommendation.train import train_model
            model, metrics = train_model()
            _loaded_model_bundle = joblib.load(MODEL_PATH)
    return _loaded_model_bundle

CROP_CULTIVATION_TIPS = {
    "Rice": "Requires standing water during early vegetative stages. Ensure pH 5.5-7.0 and maintain split nitrogen application.",
    "Wheat": "Best sown in Nov-Dec. Ensure 4-6 irrigations at critical crown root initiation and flowering stages.",
    "Maize": "Requires well-drained loamy soil. Avoid waterlogging during seedling stage.",
    "Chickpea": "Deep taproot system; drought tolerant. Avoid excessive vegetative growth by balancing nitrogen.",
    "Kidney Beans": "Needs moderate moisture and light, well-drained soils rich in organic matter.",
    "Pigeonpeas": "Deep rooted pulse crop. Excellent for intercropping with sorghum or cotton.",
    "Mothbeans": "Highly drought tolerant arid legume. Ideal for sandy and marginal soils.",
    "Mungbean": "Short-duration summer/kharif crop. Great for soil nitrogen fixation.",
    "Blackgram": "Prefers warm and humid climate. Harvest when 80% pods turn dark brown.",
    "Lentil": "Cool-season legume. Thrives in moisture-retentive loamy soils.",
    "Pomegranate": "Thrives in semi-arid conditions. Pruning and regulated drip irrigation enhance fruit quality.",
    "Banana": "High potassium feeder. Maintain high soil organic matter and sheltered micro-climate.",
    "Mango": "Deep well-drained alluvial soil. Protect blossoms from powdery mildew and hoppers.",
    "Grapes": "Requires high potassium and phosphorus. Regular trellis training and canopy aeration essential.",
    "Watermelon": "Needs high temperature and sandy loam. Avoid overhead irrigation during fruit ripening.",
    "Muskmelon": "Warm sunny weather improves sugar brix content. Mulching recommended for moisture control.",
    "Apple": "Chilling hours required during dormancy. Well-drained fertile mountain loams ideal.",
    "Orange": "Sensitive to waterlogging. Apply micronutrient foliar spray (Zinc, Boron, Manganese).",
    "Papaya": "Fast growing tropical fruit. Sensitive to frost and water stagnant conditions.",
    "Coconut": "Coastal alluvial or laterite soils. Mulch with coconut husks for moisture retention.",
    "Cotton": "Black cotton soil (vertisol) ideal. Monitor for bollworm and whitefly during square formation.",
    "Jute": "Warm and humid climate with abundant rainfall. Requires retting in clean slow-moving water.",
    "Coffee": "Shade-grown tropical highland crop. Requires rich acidic volcanic/forest loam."
}

def predict_crop(n: float, p: float, k: float, temp: float, humidity: float, ph: float, rainfall: float) -> Dict[str, Any]:
    bundle = get_crop_model()
    model = bundle["model"]
    classes = bundle["classes"]
    
    features = np.array([[n, p, k, temp, humidity, ph, rainfall]])
    predicted_class = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    class_prob_map = list(zip(classes, probabilities))
    class_prob_map.sort(key=lambda x: x[1], reverse=True)
    
    top_crop, top_confidence = class_prob_map[0]
    alternatives = [crop for crop, prob in class_prob_map[1:4] if prob > 0.05]
    
    cultivation_tip = CROP_CULTIVATION_TIPS.get(
        top_crop,
        f"Ensure balanced fertilization and optimal irrigation scheduling for healthy {top_crop} yield."
    )
    
    return {
        "recommended_crop": top_crop,
        "confidence": round(float(top_confidence), 3),
        "suitable_conditions": {
            "nitrogen_input": n,
            "phosphorus_input": p,
            "potassium_input": k,
            "temperature_c": temp,
            "humidity_pct": humidity,
            "soil_ph": ph,
            "rainfall_mm": rainfall
        },
        "alternative_crops": alternatives,
        "cultivation_tips": cultivation_tip
    }
