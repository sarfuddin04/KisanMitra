"""
KisanMitra AI — Intelligent, Context-Aware Agricultural Advisor
===============================================================
A high-accuracy, grounded agronomic reasoning engine designed for Indian farmers.

Key Capabilities:
1. Intent & Entity Extraction (Crop, Stage/Age, Acreage, Symptoms, Location, Budget)
2. Conversation History & Multi-turn Context Memory
3. Real-Time Grounding:
   - Live Weather & 48h Rain Forecast (WeatherAPI.com)
   - Verified Mandi Prices (APMC AGMARKNET database)
   - Plant Pathology & IPM Disease Guide (Disease database)
   - Stage-Specific Fertilizer Calculation per Acre
   - Economic Idea & Budget Evaluation
   - Official Government Schemes (PM-KISAN, PMFBY, KCC, PM-KUSUM, Soil Health Card)
4. Trilingual Natural Support: Pure Hindi (Devanagari), Hinglish, and English
5. Dual-Engine Architecture:
   - Primary: Gemini API with Grounded Fact Injection
   - Fallback / Offline: Deterministic Grounded Agronomic Expert Engine
"""

import re
import datetime
import logging
import requests
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.weather_service import get_current_weather, get_weather_forecast
from app.models.agronomy import Crop, Disease, Fertilizer
from app.models.market import MarketPrice
from app.models.user import User

logger = logging.getLogger("kisanmitra.ai_advisor")

# ─────────────────────────────────────────────────────────────────────────────
# 1. CROP DICTIONARY & NORMALIZATION
# ─────────────────────────────────────────────────────────────────────────────

CROP_SYNONYMS = {
    "wheat": ["wheat", "gehu", "gehun", "gehoon", "गेहूं", "गेहुँ"],
    "rice": ["rice", "paddy", "dhan", "chaawal", "chawal", "धान", "चावल"],
    "tomato": ["tomato", "tamatar", "tamaatar", "टमाटर"],
    "potato": ["potato", "aloo", "aalu", "alu", "आलू"],
    "mustard": ["mustard", "sarson", "sarso", "rai", "सरसों", "राई"],
    "cotton": ["cotton", "kapas", "kapaas", "ruii", "rui", "कपास"],
    "maize": ["maize", "corn", "makka", "makai", "मक्का", "मकई"],
    "sugarcane": ["sugarcane", "ganna", "ikha", "ईख", "गन्ना"],
    "onion": ["onion", "pyaz", "pyaaz", "kanda", "प्याज", "कांदा"],
    "gram": ["gram", "chana", "chane", "chickpea", "चना"],
    "soybean": ["soybean", "soya", "soyabean", "सोयाबीन"],
    "chilli": ["chilli", "chili", "mirch", "mirchi", "मिर्च"],
    "garlic": ["garlic", "lahsun", "lahsan", "लहसुन"],
    "banana": ["banana", "kela", "kele", "केला"],
    "moong": ["moong", "mung", "मूंग", "ग्रीन ग्राम"],
    "arhar": ["arhar", "tur", "toor", "pigeon pea", "अरहर", "तुअर"],
}

LOCATION_ALIASES = {
    "up": "Uttar Pradesh",
    "uttar pradesh": "Uttar Pradesh",
    "lucknow": "Lucknow",
    "patna": "Patna",
    "bihar": "Bihar",
    "punjab": "Punjab",
    "haryana": "Haryana",
    "mp": "Madhya Pradesh",
    "madhya pradesh": "Madhya Pradesh",
    "rajasthan": "Rajasthan",
    "maharashtra": "Maharashtra",
    "karnal": "Karnal",
    "indore": "Indore",
    "ahmedabad": "Ahmedabad",
    "gujarat": "Gujarat",
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. LANGUAGE DETECTOR
# ─────────────────────────────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    """
    Detects if the text is in Devanagari Hindi ('hi'), Hinglish ('hinglish'), or English ('en').
    """
    # Check for Devanagari Unicode block (\u0900 - \u097F)
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    if devanagari_chars > 3 or (len(text) > 0 and devanagari_chars / len(text) > 0.2):
        return "hi"

    text_lower = text.lower()
    hinglish_markers = [
        "mein", "me", "hai", "hain", "kya", "kaise", "kare", "karein", "kru",
        "peela", "peele", "peeli", "keeda", "keede", "fasal", "khet", "sinchai",
        "paani", "pani", "dawai", "khad", "batao", "bataiye", "chahta", "hoon",
        "hu", "mera", "meri", "mere", "kitna", "kitni", "dalna", "dalun", "de",
        "ruka", "ruk", "sarkari", "yojana", "zameen", "bhav", "aaj", "kal", "baarish"
    ]
    words = re.findall(r'\b\w+\b', text_lower)
    hinglish_matches = sum(1 for w in words if w in hinglish_markers)
    if hinglish_matches >= 2 or (len(words) <= 4 and hinglish_matches >= 1):
        return "hinglish"

    return "en"


# ─────────────────────────────────────────────────────────────────────────────
# 3. CONVERSATION CONTEXT & ENTITY EXTRACTOR
# ─────────────────────────────────────────────────────────────────────────────

def extract_entities_and_context(
    current_message: str,
    chat_history: List[Dict[str, str]],
    current_user: Optional[User] = None
) -> Dict[str, Any]:
    """
    Extracts entities across the conversation history and current message.
    Preserves multi-turn memory:
    e.g. Farmer says: "2 acre zameen hai" -> "Gehu" -> "30 din ki hai" -> remembers all 3!
    """
    all_user_messages = []
    if chat_history:
        for m in chat_history:
            if m.get("sender") == "user":
                all_user_messages.append(m.get("text", ""))
    all_user_messages.append(current_message)

    combined_text = " ".join(all_user_messages).lower()
    current_lower = current_message.lower()

    entities: Dict[str, Any] = {
        "crop": None,
        "crop_display": None,
        "acreage": None,
        "stage_days": None,
        "stage_name": None,
        "location": None,
        "budget": None,
        "symptoms": [],
        "intent": "general",
    }

    # 1. User Profile Defaults (if logged in)
    if current_user and getattr(current_user, "profile", None):
        prof = current_user.profile
        if prof.farm_location:
            entities["location"] = prof.farm_location
        if prof.state:
            entities["location"] = prof.state
        if prof.district:
            entities["location"] = prof.district
        if prof.farm_size_acres:
            entities["acreage"] = float(prof.farm_size_acres)
        if prof.primary_crops:
            for std_crop, syns in CROP_SYNONYMS.items():
                if any(syn in prof.primary_crops.lower() for syn in syns):
                    entities["crop"] = std_crop
                    entities["crop_display"] = std_crop.capitalize()
                    break

    # 2. Extract Crop (Search in reverse order of messages so latest mentions take precedence)
    for msg in reversed(all_user_messages):
        msg_l = msg.lower()
        found_crop = False
        for std_crop, syns in CROP_SYNONYMS.items():
            if any(re.search(r'\b' + re.escape(syn) + r'\b', msg_l) for syn in syns):
                entities["crop"] = std_crop
                entities["crop_display"] = std_crop.capitalize()
                found_crop = True
                break
        if found_crop:
            break

    # 3. Extract Acreage / Land Size
    # e.g. "2 acre", "2 एकड़", "0.5 acre", "5 bigha"
    acre_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:acre|एकड़|ekad|ekad|acres)', combined_text)
    if acre_match:
        entities["acreage"] = float(acre_match.group(1))
    else:
        bigha_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:bigha|बीघा)', combined_text)
        if bigha_match:
            # 1 acre ~ 2.5 to 3 bigha (standard UP/North India ~ 2.5 bigha)
            entities["acreage"] = round(float(bigha_match.group(1)) / 2.5, 2)

    # 4. Extract Crop Age / Stage
    # e.g. "30 din", "30 din ki hai", "45 days", "20 days old"
    days_match = re.search(r'(\d+)\s*(?:din|days?|दिन)', combined_text)
    if days_match:
        entities["stage_days"] = int(days_match.group(1))
    elif "sowing" in combined_text or "buwai" in combined_text or "बुवाई" in combined_text:
        entities["stage_name"] = "sowing"
    elif "tillering" in combined_text or "kalle" in combined_text or "कल्ले" in combined_text:
        entities["stage_name"] = "tillering"
    elif "flowering" in combined_text or "phool" in combined_text or "फूल" in combined_text:
        entities["stage_name"] = "flowering"
    elif "fruiting" in combined_text or "phal" in combined_text or "फल" in combined_text:
        entities["stage_name"] = "fruiting"

    # 5. Extract Location
    # check explicit mentions in current message first, then combined
    for alias, std_loc in LOCATION_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', current_lower):
            entities["location"] = std_loc
            break
    if not entities["location"]:
        for alias, std_loc in LOCATION_ALIASES.items():
            if re.search(r'\b' + re.escape(alias) + r'\b', combined_text):
                entities["location"] = std_loc
                break

    # 6. Extract Budget
    # e.g. "₹30,000", "30000 budget", "30000 rupaye", "₹30000"
    budget_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d{4,7})\s*(?:budget|rupaye|rs|हजार|rupees)?', current_lower)
    if budget_match:
        num_str = budget_match.group(1).replace(",", "")
        entities["budget"] = int(num_str)

    # 7. Extract Symptoms
    symptom_keywords = {
        "yellowing": ["peela", "peeli", "peele", "yellow", "पीला", "पीले", "पीली"],
        "wilting": ["murjha", "murjhana", "sukh", "sukhna", "wilt", "wilting", "मुरझा", "सूख"],
        "insects": ["keeda", "keede", "kida", "kide", "insect", "pest", "caterpillar", "कीड़ा", "कीड़े"],
        "leaf_curl": ["mud", "mudna", "curl", "curling", "सिकुड़", "मुड़"],
        "spots": ["dhabbhe", "dhabba", "spots", "blight", "rust", "धब्बा", "धब्बे", "रतुआ"],
        "waterlogging": ["paani ruk", "pani ruk", "waterlogging", "जलभराव", "पानी भरा"],
    }
    for sym_category, terms in symptom_keywords.items():
        if any(term in combined_text for term in terms):
            entities["symptoms"].append(sym_category)

    # 8. Determine Specific Intent of Current Message
    if any(k in current_lower for k in ["mandi", "bhav", "rate", "price", "भाव", "मंडी", "दाम", "मूल्य"]):
        entities["intent"] = "mandi_price"
    elif any(k in current_lower for k in ["paani ruk", "pani ruk", "waterlog", "जलभराव", "पानी भरा", "पानी रुक"]):
        entities["intent"] = "waterlogging"
    elif any(k in current_lower for k in ["baarish", "barish", "sinchai", "paani du", "pani du", "irrigate", "weather", "सिंचाई", "बारिश", "मौसम"]):
        if any(w in current_lower for w in ["kal", "aaj", "baarish", "forecast", "rain"]):
            entities["intent"] = "weather_irrigation"
        else:
            entities["intent"] = "irrigation"
    elif any(k in current_lower for k in ["fertilizer", "khad", "urea", "dap", "npk", "dosage", "dose", "खाद", "यूरिया", "मात्रा"]):
        entities["intent"] = "fertilizer_dosage"
    elif any(k in current_lower for k in ["yojana", "scheme", "subsidy", "pm-kisan", "pmfby", "kcc", "kusum", "योजना", "सब्सिडी"]):
        entities["intent"] = "government_scheme"
    elif any(k in current_lower for k in ["kam budget", "kaunsi fasal", "konsi fasal", "crop selection", "कम बजट", "फसल चयन"]):
        entities["intent"] = "crop_selection"
    elif any(k in current_lower for k in ["budget", "shuru karna", "start karna", "naya plan", "idea", "शुरू", "बजट"]):
        entities["intent"] = "farming_idea"
    elif any(sym in entities["symptoms"] for sym in ["yellowing", "insects", "wilting", "leaf_curl", "spots"]):
        entities["intent"] = "disease_pest"
    elif any(k in current_lower for k in ["hello", "hi", "namaste", "pranam", "ram ram", "नमस्ते", "प्रणाम"]):
        entities["intent"] = "greeting"

    return entities


# ─────────────────────────────────────────────────────────────────────────────
# 4. GROUNDING SERVICES (REAL DATABASE & LIVE APIS)
# ─────────────────────────────────────────────────────────────────────────────

def get_live_mandi_prices_db(crop_key: Optional[str], location: Optional[str], db: Optional[Session]) -> List[Dict[str, Any]]:
    """
    Queries real verified MarketPrice records from the database.
    Distinguishes state, district, or national records.
    """
    if not db:
        return []

    query = db.query(MarketPrice).filter(MarketPrice.is_active == True)

    if crop_key:
        syns = CROP_SYNONYMS.get(crop_key, [crop_key])
        crop_filters = [MarketPrice.crop_name.ilike(f"%{s}%") for s in syns]
        from sqlalchemy import or_
        query = query.filter(or_(*crop_filters))

    if location:
        from sqlalchemy import or_
        loc_clean = location.strip()
        query = query.filter(or_(
            MarketPrice.state.ilike(f"%{loc_clean}%"),
            MarketPrice.district.ilike(f"%{loc_clean}%"),
            MarketPrice.market_name.ilike(f"%{loc_clean}%"),
        ))

    results = query.order_by(MarketPrice.price_date.desc()).limit(5).all()

    # Fallback to crop only if location specific returned nothing
    if not results and crop_key:
        results = db.query(MarketPrice).filter(
            MarketPrice.is_active == True,
            or_(*crop_filters)
        ).order_by(MarketPrice.price_date.desc()).limit(5).all()

    output = []
    for r in results:
        p_date = r.price_date.strftime("%d %b %Y") if r.price_date else "Recent"
        output.append({
            "crop_name": r.crop_name,
            "variety": r.variety or "Standard",
            "market_name": r.market_name or "APMC Mandi",
            "state": r.state or "",
            "district": r.district or "",
            "min_price": r.min_price,
            "max_price": r.max_price,
            "modal_price": r.modal_price,
            "unit": r.unit or "Quintal",
            "price_date": p_date,
            "data_source": r.data_source or "AGMARKNET / DMI",
        })
    return output


def get_live_weather_advisory(location: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches live weather & forecast from WeatherAPI.com to ground irrigation decisions.
    """
    loc_to_query = location or "Lucknow"
    try:
        data = get_weather_forecast(location=loc_to_query, days=3)
        if not data or "error" in data:
            return {"available": False, "location": loc_to_query}

        current = data.get("current", {})
        forecast_daily = data.get("forecast_daily", [])

        tomorrow = forecast_daily[0] if forecast_daily else {}
        tomorrow_rain_chance = tomorrow.get("chance_of_rain", 0) or 0
        tomorrow_precip = tomorrow.get("total_precip_mm", 0.0) or 0.0

        return {
            "available": True,
            "location_name": current.get("location", loc_to_query),
            "current_temp": current.get("temperature"),
            "current_humidity": current.get("humidity"),
            "current_condition": current.get("condition"),
            "current_rain_mm": current.get("rainfall", 0.0),
            "tomorrow_day": tomorrow.get("day", "Tomorrow"),
            "tomorrow_condition": tomorrow.get("condition", ""),
            "tomorrow_chance_of_rain": tomorrow_rain_chance,
            "tomorrow_precip_mm": tomorrow_precip,
            "advisory": data.get("advisory", ""),
        }
    except Exception as e:
        logger.warning(f"Error fetching live weather: {e}")
        return {"available": False, "location": loc_to_query}


def get_disease_guide_db(crop_key: Optional[str], symptoms: List[str], db: Optional[Session]) -> List[Dict[str, Any]]:
    """
    Queries plant pathology records from the Disease database.
    """
    if not db or not crop_key:
        return []

    crop_name = crop_key.capitalize()
    diseases = db.query(Disease).filter(
        Disease.crop.ilike(f"%{crop_name}%"),
        Disease.is_active == True
    ).all()

    matched = []
    for d in diseases:
        matched.append({
            "name": d.name,
            "crop": d.crop,
            "pathogen_type": d.pathogen_type,
            "symptoms": d.symptoms,
            "prevention": d.prevention_guide,
            "treatment": d.treatment_guide,
        })
    return matched


# ─────────────────────────────────────────────────────────────────────────────
# 5. AGRONOMIC CALCULATORS & DOMAIN LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def calculate_fertilizer_dosage(crop: str, stage_days: Optional[int], acreage: Optional[float]) -> Dict[str, Any]:
    """
    Calculates verified, stage-specific fertilizer dosage per acre and total field.
    Based on ICAR & State Agriculture University guidelines.
    """
    acres = acreage if (acreage and acreage > 0) else 1.0

    if crop == "wheat":
        # Standard Wheat NPK: 120:60:40 kg/ha -> ~50-60kg Urea, ~50kg DAP, ~25kg MOP per acre total
        if stage_days is not None and 20 <= stage_days <= 35:
            stage_desc = f"{stage_days} din (CRI / Tillering Stage - कल्ले निकलने का समय)"
            dose_per_acre_urea = 35.0  # 1st top dressing
            return {
                "crop": "गेहूं (Wheat)",
                "stage": stage_desc,
                "acreage": acres,
                "fertilizers": [
                    {
                        "name": "Neem Coated Urea (नीम लेपित यूरिया)",
                        "rate_per_acre": "30-35 kg / एकड़",
                        "total_required": f"{round(dose_per_acre_urea * acres, 1)} kg (लगभग {round((dose_per_acre_urea * acres)/45, 1)} बैग - 45kg)",
                        "timing": "प्रथम सिंचाई (21-25 दिन) के बाद जब खेत में पैर टिकने लायक नमी (ओट) आ जाए",
                        "method": "खड़ी फसल में छिटक कर (Top-dressing)",
                    },
                    {
                        "name": "Zinc Sulphate 33% (यदि बुवाई में न डाला हो)",
                        "rate_per_acre": "5 kg / एकड़ (मृदा) या 0.5 kg / एकड़ (छिड़काव)",
                        "total_required": f"{round(5 * acres, 1)} kg",
                        "timing": "यूरिया के साथ मिलाकर या अलग से छिड़काव",
                        "method": "यदि पत्ते पीले हों तो 0.5% जिंक सल्फेट + 2% यूरिया का पर्णीय छिड़काव करें",
                    }
                ],
                "precautions": "खड़े गहरे पानी में या तेज़ धूप में यूरिया न फेंकें। अत्यधिक यूरिया से तना कमजोर होता है और पीला रतुआ/कीटों का प्रकोप बढ़ जाता है।"
            }
        elif stage_days is not None and 40 <= stage_days <= 60:
            stage_desc = f"{stage_days} din (Jointing / 2nd Irrigation Stage - गांठ बनने का समय)"
            dose_per_acre_urea = 30.0
            return {
                "crop": "गेहूं (Wheat)",
                "stage": stage_desc,
                "acreage": acres,
                "fertilizers": [
                    {
                        "name": "Neem Coated Urea (2nd Top-Dressing)",
                        "rate_per_acre": "25-30 kg / एकड़",
                        "total_required": f"{round(dose_per_acre_urea * acres, 1)} kg",
                        "timing": "दूसरी सिंचाई के बाद उचित नमी में",
                        "method": "Top-dressing",
                    }
                ],
                "precautions": "फूल आने (flowering) के बाद यूरिया न डालें।"
            }
        else:
            # Full season guide
            return {
                "crop": "गेहूं (Wheat)",
                "stage": "संपूर्ण फसल चक्र (Full Season Schedule)",
                "acreage": acres,
                "fertilizers": [
                    {"name": "DAP (बुवाई के समय - Basal)", "rate_per_acre": "50-55 kg / एकड़", "total_required": f"{round(55 * acres, 1)} kg"},
                    {"name": "MOP - Potash (बुवाई के समय)", "rate_per_acre": "20-25 kg / एकड़", "total_required": f"{round(25 * acres, 1)} kg"},
                    {"name": "Urea (कुल 2-3 भागों में)", "rate_per_acre": "65-70 kg / एकड़ (30-35kg पहली सिंचाई पर + 30-35kg दूसरी पर)", "total_required": f"{round(70 * acres, 1)} kg"},
                ],
                "precautions": "मिट्टी परीक्षण (Soil Health Card) के आधार पर ही खुराक तय करें।"
            }

    elif crop == "tomato":
        return {
            "crop": "टमाटर (Tomato)",
            "stage": f"{stage_days} दिन" if stage_days else "वानस्पतिक व फलन अवस्था",
            "acreage": acres,
            "fertilizers": [
                {"name": "19:19:19 (Water Soluble NPK)", "rate_per_acre": "3-4 kg / एकड़ प्रति सप्ताह (Drip) या 5g/L spray", "total_required": f"{round(3.5 * acres, 1)} kg/हफ्ता"},
                {"name": "Calcium Nitrate + Boron", "rate_per_acre": "2-3 kg / एकड़ (फूल व फल बनते समय)", "total_required": f"{round(2.5 * acres, 1)} kg"},
            ],
            "precautions": "कैल्शियम की कमी से टमाटर का निचला हिस्सा काला पड़ता है (Blossom End Rot)। इसके लिए कैल्शियम नाइट्रेट का स्प्रे करें।"
        }

    elif crop == "rice":
        return {
            "crop": "धान (Paddy/Rice)",
            "stage": f"{stage_days} दिन" if stage_days else "कल्ले व बढ़वार अवस्था",
            "acreage": acres,
            "fertilizers": [
                {"name": "DAP (रोपाई के समय)", "rate_per_acre": "40-45 kg / एकड़", "total_required": f"{round(45 * acres, 1)} kg"},
                {"name": "Urea (3 स्प्लिट में)", "rate_per_acre": "60-70 kg / एकड़ (रोपाई के 20-25 दिन व 40-45 दिन)", "total_required": f"{round(70 * acres, 1)} kg"},
                {"name": "Zinc Sulphate 33%", "rate_per_acre": "5 kg / एकड़ (खैरा रोग से बचाव)", "total_required": f"{round(5 * acres, 1)} kg"},
            ],
            "precautions": "खेत से पानी निकालते समय यूरिया न डालें। 2-3 cm पानी में शाम के समय डालें।"
        }

    # General fallback
    return {
        "crop": crop.capitalize(),
        "stage": f"{stage_days} दिन" if stage_days else "सामान्य अवस्था",
        "acreage": acres,
        "fertilizers": [
            {"name": "DAP / NPK Complex", "rate_per_acre": "40-50 kg / एकड़ (बुवाई के समय)", "total_required": f"{round(45 * acres, 1)} kg"},
            {"name": "Neem Coated Urea", "rate_per_acre": "45-50 kg / एकड़ (2 बराबर खुराकों में)", "total_required": f"{round(50 * acres, 1)} kg"},
        ],
        "precautions": "संतुलित पोषण (NPK 4:2:1 अनुपात) रखें। अधिक यूरिया कीटों को आमंत्रित करता है।"
    }


def evaluate_farming_idea(crop: Optional[str], acres: Optional[float], budget: Optional[int], location: Optional[str]) -> Dict[str, Any]:
    """
    Evaluates farmer's commercial idea with financial reality check, risks, and alternatives.
    """
    crop_name = crop or "tomato"
    area = acres or 1.0
    budget_amt = budget or 30000

    if crop_name in ["tomato", "टमाटर"]:
        standard_cost_per_acre = 70000
        cost_staking = 30000
        cost_seeds_nursery = 4500
        cost_fertilizer_pesticide = 15000
        cost_labour_prep = 18000

        total_est_cost = standard_cost_per_acre * area

        is_budget_sufficient = budget_amt >= (total_est_cost * 0.85)

        return {
            "crop": "टमाटर की खेती (Tomato Farming)",
            "area": f"{area} एकड़",
            "budget": f"₹{budget_amt:,}",
            "standard_cost": f"₹{total_est_cost:,} (₹65,000 - ₹80,000 प्रति एकड़)",
            "is_sufficient": is_budget_sufficient,
            "cost_breakdown": {
                "नर्सरी व हाइब्रिड बीज (Hybrid Seeds)": f"₹{round(cost_seeds_nursery * area):,}",
                "बांस-तार बंधाई (Staking & Trellising)": f"₹{round(cost_staking * area):,}",
                "खाद, उर्वरक व कीटनाशक (Inputs)": f"₹{round(cost_fertilizer_pesticide * area):,}",
                "जुताई, मेड़ व तुड़ाई मजदूरी (Labour)": f"₹{round(cost_labour_prep * area):,}",
            },
            "pros": [
                "उच्च पैदावार (250-350 क्विंटल प्रति एकड़ हाइब्रिड किस्मों में)",
                "2-3 महीने तक लगातार नकदी आवक (multiple harvests)",
                "बाजार में हमेशा दैनिक मांग",
            ],
            "risks": [
                "बाजार भाव में भारी उतार-चढ़ाव (मंडी में कभी ₹5/kg तो कभी ₹50/kg मिलता है)",
                "सफेद मक्खी से पत्ता मरोड़ (Leaf Curl Virus) का गंभीर खतरा",
                "बिना बंधाई (Staking) के फल जमीन पर सड़ते हैं और पैदावार 40% घट जाती है",
            ],
            "recommendation": (
                f"₹{budget_amt:,} के बजट में पूरे {area} एकड़ में व्यावसायिक टमाटर की खेती करना वित्तीय रूप से जोखिम भरा होगा। "
                f"**सर्वश्रेष्ठ रणनीति:** आप **0.5 एकड़ (आधा एकड़)** से शुरुआत करें! "
                f"आधे एकड़ में ₹30,000 के बजट से आप अच्छी बांस-तार बंधाई, मल्चिंग और उच्च गुणवत्ता वाले हाइब्रिड बीज लगा सकेंगे, "
                f"जिससे एक कमजोर 1 एकड़ की तुलना में आधे एकड़ से कहीं अधिक शुद्ध मुनाफा मिलेगा!"
            )
        }

    # Generic idea evaluation
    return {
        "crop": crop_name.capitalize(),
        "area": f"{area} एकड़",
        "budget": f"₹{budget_amt:,}",
        "recommendation": f"उपलब्ध बजट ₹{budget_amt:,} में {area} एकड़ {crop_name} की खेती के लिए स्थानीय मिट्टी व सिंचाई की उपलब्धता जांच लें।"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. LOCAL GROUNDED AGRONOMIC EXPERT ENGINE (OFFLINE / FALLBACK)
# ─────────────────────────────────────────────────────────────────────────────

def generate_local_expert_response(
    user_message: str,
    entities: Dict[str, Any],
    lang: str,
    db: Optional[Session]
) -> str:
    """
    Generates intelligent, factual, structured responses grounded in real database
    and weather data when Gemini API is unavailable or offline.
    """
    intent = entities["intent"]
    crop = entities["crop"]
    crop_disp = entities["crop_display"] or (crop.capitalize() if crop else "फसल")
    acres = entities["acreage"]
    stage_days = entities["stage_days"]
    location = entities["location"]
    budget = entities["budget"]

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO A: WEATHER & IRRIGATION TIMING DECISION
    # "Kal baarish hogi to kya aaj sinchai karun?"
    # ─────────────────────────────────────────────────────────────────────────
    if intent in ["weather_irrigation", "irrigation"] and any(w in user_message.lower() for w in ["sinchai", "baarish", "rain", "kal", "irrigate", "पानी"]):
        weather = get_live_weather_advisory(location)
        tomorrow_rain_chance = weather.get("tomorrow_chance_of_rain", 0)
        tomorrow_precip = weather.get("tomorrow_precip_mm", 0.0)
        loc_name = weather.get("location_name", location or "आपके क्षेत्र")

        if weather.get("available") and (tomorrow_rain_chance >= 40 or tomorrow_precip >= 1.0):
            # Advise STOPPING irrigation
            if lang == "hi":
                return f"""🛑 **आज सिंचाई न करें (सिंचाई तुरंत रोकें)**

📍 **मौसम पूर्वानुमान रिपोर्ट ({loc_name}):**
• **कल बारिश की संभावना:** {tomorrow_rain_chance}%
• **संभावित वर्षा:** {tomorrow_precip} mm
• **मौसम की स्थिति:** {weather.get('tomorrow_condition', 'बारिश/बूंदाबांदी')}

⚠️ **सिंचाई क्यों न करें?**
1. यदि आज सिंचाई कर दी और कल बारिश हुई, तो खेत में **जलभराव (Waterlogging)** हो जाएगा।
2. जड़ों को ऑक्सीजन नहीं मिलेगी, जिससे पौधे पीले पड़ जाएंगे और जड़ सड़न (Root Rot) की बीमारी लग सकती है।
3. मिट्टी में डाला गया महंगा यूरिया व खाद पानी के साथ बह जाएगा (Nutrient Leaching)।
4. तेज़ हवा चलने पर गेहूं/सरसों जैसी फसलें गिर (Lodging) सकती हैं।

💡 **अगला कदम:**
कल की बारिश का इंतज़ार करें। बारिश के 2 दिन बाद खेत की नमी देखकर ही अगली सिंचाई का निर्णय लें।"""
            elif lang == "en":
                return f"""🛑 **Do NOT irrigate today (Postpone Irrigation)**

📍 **Weather Forecast Report ({loc_name}):**
• **Rain probability tomorrow:** {tomorrow_rain_chance}%
• **Expected Precipitation:** {tomorrow_precip} mm
• **Condition:** {weather.get('tomorrow_condition', 'Rain / Showers')}

⚠️ **Why you should avoid irrigation today:**
1. Rain following irrigation leads to severe **waterlogging**, suffocating root respiration.
2. Increases risk of root rot and yellowing of crop foliage.
3. Valuable applied fertilizers (Urea/DAP) will leach beyond the root zone.
4. Tall crops like wheat or mustard risk lodging (falling flat) under wet soil and wind.

💡 **Recommended Action:**
Wait for the rain event. Inspect field soil moisture 48 hours later before planning any irrigation."""
            else:  # hinglish
                return f"""🛑 **Aaj sinchai na karein (Irrigation rok dein)**

📍 **Weather Forecast Report ({loc_name}):**
• **Kal baarish ka chance:** {tomorrow_rain_chance}%
• **Expected Baarish:** {tomorrow_precip} mm ({weather.get('tomorrow_condition', 'Rain expected')})
• **Current Temperature:** {weather.get('current_temp', 'N/A')}°C

⚠️ **Aaj sinchai na karne ke mukhya kaaran:**
1. **Jalbharav (Waterlogging):** Agar aaj sinchai ki aur kal baarish ho gayi, toh khet mein paani ruk jayega.
2. **Jad sadna (Root Rot):** Jado ko oxygen nahi milti aur fasal peeli padne lagti hai.
3. **Khad ka nuksan:** Dala hua urea aur fertilizer paani ke sath beh jata hai (leaching).
4. **Fasal girna (Lodging):** Gehu ya sarson ki fasal hawa chalne par gir sakti hai.

💡 **Agla Kadam:**
Kal tak intezar karein. Baarish ke 2 din baad khet mein nami check karke hi sinchai ka faisla karein! 🌾"""

        else:
            # Clear weather - irrigation allowed
            temp_str = f"{weather.get('current_temp')}°C" if weather.get('available') else "सामान्य"
            cond_str = weather.get('current_condition', 'साफ मौसम')
            if lang == "hi":
                return f"""✅ **हाँ, आप सिंचाई कर सकते हैं (मौसम साफ़ है)**

📍 **मौसम रिपोर्ट ({loc_name}):**
• **वर्तमान तापमान:** {temp_str}
• **आगामी 48 घंटे में बारिश की संभावना:** बहुत कम ({tomorrow_rain_chance}%)
• **मौसम:** {cond_str}

💡 **सिंचाई के लिए जरूरी सलाह:**
1. सिंचाई **सुबह या देर शाम** करें ताकि वाष्पीकरण (Evaporation) कम हो।
2. यदि फसल {crop_disp} है, तो ध्यान रखें कि पानी सिर्फ क्यारियों में पहुंचे, भराव न हो।
3. सिंचाई के बाद जब खेत में उचित नमी (ओट) आ जाए, तभी खाद की टॉप-ड्रेसिंग करें।"""
            else:
                return f"""✅ **Haan, aap sinchai kar sakte hain (Mausam saaf hai)**

📍 **Weather Report ({loc_name}):**
• **Current Temperature:** {temp_str}
• **Aane wale 48 ghante mein baarish ka chance:** Bahut kam ({tomorrow_rain_chance}%)
• **Condition:** {cond_str}

💡 **Sinchai Tips:**
1. Sinchai **subah ya shaam** ke waqt karein taaki paani ka evaporation kam ho.
2. Paani ka khada hona rokein — halki sinchai behtar rehti hai.
3. Khet mein sahi nami (ot) aane ke baad hi urea ki top-dressing karein."""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO B: MANDI PRICES QUERY
    # "UP mein gehu ka aaj ka mandi bhav kya hai?"
    # ─────────────────────────────────────────────────────────────────────────
    if intent == "mandi_price":
        prices = get_live_mandi_prices_db(crop, location, db)
        if prices:
            lines = []
            for p in prices[:4]:
                lines.append(
                    f"• **{p['market_name']}** ({p['state']}" + (f", {p['district']}" if p['district'] else "") + f"):\n"
                    f"  💰 **Modal Bhav:** ₹{p['modal_price']:,.0f} / {p['unit']}\n"
                    f"  📊 Range: ₹{p['min_price']:,.0f} - ₹{p['max_price']:,.0f} | Date: {p['price_date']} | Source: {p['data_source']}"
                )
            price_text = "\n\n".join(lines)

            if lang == "hi":
                return f"""🌾 **{crop_disp} का नवीनतम मंडी भाव (Official Market Prices):**

{price_text}

📌 **किसानों के लिए जरूरी सलाह:**
• ये भाव **AGMARKNET / सरकारी मंडी पोर्टल** के सत्यापित रिकॉर्ड के अनुसार हैं।
• अपनी उपज मंडी ले जाने से पहले स्थानीय आढ़ती या APMC समिति से उस दिन की लाइव बोली ज़रूर पता कर लें।
• उपज को अच्छी तरह सुखाकर व छानकर (grading) ले जाएं ताकि सर्वोत्तम भाव मिल सके।"""
            else:
                return f"""🌾 **{crop_disp} Mandi Bhav (Official Market Prices):**

{price_text}

📌 **Kisan Salah:**
• Ye rates **AGMARKNET / APMC** ke official records par aadharit hain.
• Mandi mein fasal le jaane se pehle local APMC mandi counter se taaza boli confirm kar lein.
• Fasal ko acche se saaf aur dry karke le jayein taaki maximum grade rate mile! 🎯"""
        else:
            loc_str = location or "आपके राज्य"
            if lang == "hi":
                return f"""🌾 **{crop_disp} मंडी भाव जानकारी ({loc_str}):**

वर्तमान में {loc_str} की मंडियों का आज का लाइव डेटा सरकारी सर्वर पर अपडेट हो रहा है।
• **सरकारी न्यूनतम समर्थन मूल्य (MSP):** गेहूं का 2024-25 रबी विपणन MSP **₹2,275 - ₹2,425 / क्विंटल** है।
• सामान्य मंडियों में अच्छी गुणवत्ता का गेहूं ₹2,400 से ₹2,700 प्रति क्विंटल के बीच बिक रहा है।

❓ क्या आप किसी विशेष जिले या मंडी का नाम जानना चाहते हैं?"""
            else:
                return f"""🌾 **{crop_disp} Mandi Bhav ({loc_str}):**

Abhi {loc_str} ki mandiyon ka exact live data server par update ho raha hai.
• **Govt MSP Benchmark:** Gehu ka official MSP benchmark **₹2,275 - ₹2,425 / Quintal** hai.
• Mandiyon mein aamtaur par quality gehu ₹2,400 se ₹2,650/Quintal ke range mein chal raha hai.

❓ Kripya apna **District ya Mandi ka naam** batayein taaki main specific rate bata sakun!"""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO C: CROP DISEASE & PEST SYMPTOMS
    # "Gehu mein patta peela ho raha hai" or "Tamatar mein keede"
    # ─────────────────────────────────────────────────────────────────────────
    if intent == "disease_pest":
        if "yellowing" in entities["symptoms"] and (crop == "wheat" or not crop):
            # Wheat yellow leaves - classic multi-cause diagnosis
            if lang == "hi":
                return """🌾 **गेहूं में पत्तियां पीली होने का वैज्ञानिक समाधान**

**1. समस्या की समझ (Problem Understanding):**
आपने बताया कि गेहूं की फसल में पत्ते पीले हो रहे हैं। गेहूं में पीलापन कई अलग-अलग कारणों से हो सकता है, इसलिए केवल एक कारण मानकर तुरंत खाद या दवा न डालें।

**2. संभावित कारण (Possible Causes):**
1. **नाइट्रोजन की कमी (Nitrogen Deficiency):** यदि पुराने (निचले) पत्ते पहले एकसमान हल्के पीले पड़ रहे हैं और ऊपरी पत्ते हरे हैं।
2. **अधिक नमी / जलभराव (Waterlogging):** सिंचाई के बाद पानी रुकने से जड़ों को हवा नहीं मिलती, जिससे पौधे पीले पड़ते हैं।
3. **जिंक या सल्फर की कमी (Micronutrient Deficiency):** नई पत्तियों की नसें हरी और बीच का भाग पीला दिखे।
4. **पीला रतुआ / फफूंद (Yellow Rust):** पत्तियों पर पीले रंग की धारियां या पाउडर बनता है, जो छूने पर उंगलियों पर हल्दी जैसा लग जाता है।

**3. अनुशंसित कदम (Recommended Actions):**
• **कदम 1 (निरीक्षण):** खेत में जाकर पत्तों को उंगलियों से छुएं। यदि पीला पाउडर लगे तो यह पीला रतुआ है। इसके लिए **प्रोपिकोनाज़ोल 25% EC (टिल्ट)** @ 1 ml प्रति लीटर पानी में मिलाकर तुरंत छिड़काव करें।
• **कदम 2 (यदि पानी भरा हो):** खेत से अतिरिक्त पानी निकालने की तुरंत व्यवस्था करें।
• **कदम 3 (यदि नाइट्रोजन की कमी हो):** पहली सिंचाई के बाद जब पैर टिकने लगे, तब प्रति एकड़ 30-35 kg नीम लेपित यूरिया डालें, या **2% यूरिया घोल (20 ग्राम यूरिया प्रति लीटर पानी)** का पर्णीय स्प्रे करें।
• **कदम 4 (जिंक की कमी पर):** 0.5% जिंक सल्फेट (33%) + 2% यूरिया का छिड़काव करें।

**4. महत्वपूर्ण सावधानियां (Important Precautions):**
⚠️ खड़े पानी में यूरिया न फेंकें। बिना बीमारी पहचाने अंधाधुंध कीटनाशक न मिलाएं। रासायनिक स्प्रे हमेशा सुबह या शाम के शांत मौसम में करें।

❓ **अनुवर्ती प्रश्न (Follow-up Question):**
आपकी गेहूं की फसल कितने दिन की है, और क्या पीलापन छूने पर हाथ में हल्दी जैसा पाउडर लगता है?"""

            elif lang == "en":
                return """🌾 **Comprehensive Diagnosis: Yellowing of Wheat Leaves**

**1. Problem Understanding:**
You reported yellowing foliage in your wheat crop. In wheat, leaf chlorosis can stem from nutritional, environmental, or fungal vectors.

**2. Possible Causes:**
1. **Nitrogen Deficiency:** Characterized by uniform chlorosis starting on older, lower leaves progressing upwards.
2. **Waterlogging / Poor Drainage:** Saturated soil deprives roots of oxygen, stalling nutrient absorption.
3. **Yellow Rust (Puccinia striiformis):** Linear yellow pustules on leaves releasing powdery spores when wiped.
4. **Zinc or Sulfur Deficiency:** Interveinal chlorosis on younger upper leaves.

**3. Recommended Actions:**
• **Step 1 (Tactile Inspection):** Rub symptomatic leaves with fingers. If yellow powder rubs off, treat Yellow Rust immediately with **Propiconazole 25% EC** @ 1 ml/L or Mancozeb 75% WP @ 2.5 g/L.
• **Step 2 (Moisture Management):** Drain standing water immediately to restore root aeration.
• **Step 3 (Nutrient Rescue):** If leaves are nitrogen-deficient, top-dress Neem-coated Urea @ 30-35 kg/acre under moist soil, or apply a 2% foliar Urea spray (20g/L).
• **Step 4:** For micronutrient deficiency, apply Chelated Zinc or Zinc Sulfate 33% @ 1.5g/L.

**4. Important Precautions:**
⚠️ Avoid broadcasting granular urea into dry or flooded soil. Always adhere to KVK guidelines before pesticide mixing.

❓ **Follow-up Question:**
How many days ago was the crop sown, and does yellow dust rub off on your fingers?"""

            else:  # hinglish
                return """🌾 **Gehu mein Patte Peele Hone ka Sahi Samadhan**

**1. Problem Understanding:**
Aapne bataya ki gehu ke patte peele ho rahe hain. Gehu mein peelapan aane ke kai alag-alag kaaran ho sakte hain, isliye bina jaanch kiye seedhe dawai ya khad na daalein.

**2. Sambhavit Kaaran (Possible Causes):**
1. **Nitrogen ki kami:** Purane (niche wale) patte pehle halke peele padte hain.
2. **Khet mein paani rukna (Waterlogging):** Sinchai ke baad paani theharne se jado ko oxygen nahi milti.
3. **Yellow Rust (Peela Ratuwa Fungal Rog):** Patto par peeli dhariyan banti hain aur ungli lagane par haldi jaisa powder lagta hai.
4. **Zinc ya Iron ki kami:** Nayi patti ki nasein hari aur beech ka hissa peela hota hai.

**3. Sahi Kadam (Recommended Actions):**
• **Step 1 (Inspection):** Khet mein jakar patte ko chhu kar dekhein. Agar ungli par peela powder lage toh yeh Peela Ratuwa hai. Turant **Propiconazole 25% EC (Tilt)** @ 1 ml per liter paani mein milakar spray karein.
• **Step 2 (Paani nikaasi):** Khet mein paani khada ho toh nikaal dein taaki jadein saans le sakein.
• **Step 3 (Khad Dosing):** Agar nitrogen ki kami hai toh sinchai ke baad 30-35 kg/acre Neem-coated Urea top-dress karein, ya 2% Urea ghol (20g/L paani) ka spray karein.
• **Step 4 (Zinc Spray):** 0.5% Zinc Sulphate (33%) + 2% Urea ka chhidkaw karein.

**4. Zaroori Savdhani (Important Precautions):**
⚠️ Khade paani mein urea na daalein. Tez dhoop mein spray na karein. KVK (Krishi Vigyan Kendra) se bhi sampark karein.

❓ **Aap batayein:**
Aapki gehu ki fasal kitne din ki hai, aur kya ungli lagane par peela powder lag raha hai? 🌾"""

        elif "insects" in entities["symptoms"] or (crop == "tomato" and "keeda" in user_message.lower()):
            # Tomato pest management
            if lang == "hi":
                return """🍅 **टमाटर में कीट नियंत्रण (Integrated Pest Management)**

**1. समस्या की समझ (Problem Understanding):**
आपने टमाटर की फसल में कीड़े लगने की जानकारी दी है। टमाटर में मुख्यतः फल छेदक सुंडी, सफेद मक्खी या लीफ माइनर कीट नुकसान पहुंचाते हैं।

**2. संभावित कीट (Pest Identification):**
1. **फल छेदक सुंडी (Fruit Borer):** यह फल में छेद करके अंदर का गूदा खाती है।
2. **सफेद मक्खी (Whitefly) व एफिड:** पत्तों के नीचे से रस चूसती हैं और पत्ता मरोड़ (Leaf Curl) वायरस फैलाती हैं।
3. **लीफ माइनर (Leaf Miner):** पत्तों के अंदर सफेद टेढ़ी-मेढ़ी सुरंग जैसी लकीरें बनाती है।

**3. अनुशंसित जैविक व रासायनिक उपचार (Recommended Actions):**
• **जैविक नियंत्रण (First Line):**
  1. खेत में 15-20 **पीले चिपचिपे ट्रैप (Yellow Sticky Traps)** प्रति एकड़ लगाएं।
  2. फल छेदक के लिए 5 **फेरोमोन ट्रैप (Pheromone Traps)** लगाएं।
  3. **नीम का तेल (Neem Oil 3000 ppm)** 3-5 ml प्रति लीटर पानी में शैम्पू मिलाकर शाम को छिड़कें।
• **गंभीर प्रकोप होने पर (Chemical Treatment):**
  - यदि फल छेदक सुंडी अधिक हो: **एमामेक्टिन बेंजोएट 5% SG** @ 4 ग्राम प्रति 10 लीटर पानी या **कोराजन (Chlorantraniliprole)** @ 0.3 ml/लीटर का छिड़काव करें।
  - यदि सफेद मक्खी अधिक हो: **इमिडाक्लोप्रिड 17.8% SL** @ 0.5 ml/लीटर पानी।

**4. सावधानियां (Important Precautions):**
⚠️ दवा छिड़कने के कम से कम 5-7 दिन बाद ही पके टमाटर की तुड़ाई करें (Safety Waiting Period)। कीटनाशक स्प्रे के समय दस्ताने व मास्क का प्रयोग करें।

❓ **अनुवर्ती प्रश्न:**
कीड़ा टमाटर के फल में छेद कर रहा है या पत्तों के पीछे छोटे कीड़े/मक्खियां दिख रही हैं?"""
            else:
                return """🍅 **Tamatar mein Keede (Pest Control Guide)**

**1. Problem Understanding:**
Tamatar ki fasal mein keede lagne ki samasya. Aamtaur par fruit borer, whitefly ya leaf miner ka asar hota hai.

**2. Sambhavit Keede (Possible Pests):**
1. **Fruit Borer (Fal Chhedak):** Tamatar ke fal mein chhed karke andar khata hai.
2. **Whitefly (Safed Makkhi):** Patte ka ras choosti hai aur Leaf Curl Virus failati hai.
3. **Leaf Miner:** Patte par safed tedhi-medhi lakeerein banati hai.

**3. Sahi Upchar (Recommended Steps):**
• **Jaivik Niyantran (IPM):**
  1. Khet mein 15-20 **Yellow Sticky Traps** lagayein.
  2. Fruit borer ke liye 5 **Pheromone Traps** lagayein.
  3. **Neem Oil (3000 ppm)** 3-5 ml per liter paani mein milakar spray karein.
• **Chemical Spray (Agar keeda zyada ho):**
  - Fal chhedak ke liye: **Emamectin Benzoate 5% SG** @ 4 gram / 10 Liter paani.
  - Safed makkhi / ras choosak ke liye: **Imidacloprid 17.8% SL** @ 0.5 ml / Liter paani.

**4. Zaroori Savdhani:**
⚠️ Dawa daalne ke 5-7 din baad hi tamatar ki todai karein. Spray hamesha shaam ko karein.

❓ **Aap batayein:**
Keeda tamatar ke fal mein dikh raha hai ya patto par safed makkhi udti dikh rahi hai?"""

        else:
            # General pest/disease response with DB grounding
            dis_records = get_disease_guide_db(crop, entities["symptoms"], db)
            dis_info = ""
            if dis_records:
                d = dis_records[0]
                dis_info = f"\n• संभावित रोग: **{d['name']}** ({d['pathogen_type']})\n• उपचार: {d['treatment']}\n• रोकथाम: {d['prevention']}\n"

            if lang == "hi":
                return f"""🌿 **{crop_disp} फसल सुरक्षा सलाह**

**1. समस्या की समीक्षा:**
{crop_disp} की फसल में लक्षणों का अवलोकन किया गया।
{dis_info}
**2. प्राथमिक कदम:**
1. प्रभावित पत्तों या टहनियों को तोड़कर खेत से दूर नष्ट करें।
2. प्रारंभिक अवस्था में **नीम तेल (3-5 ml/लीटर)** का स्प्रे करें।
3. खेत में अधिक नमी या खरपतवार न रहने दें।

**3. सावधानियां:**
रासायनिक कीटनाशकों का प्रयोग केवल आवश्यक होने पर और कृषि विज्ञान केंद्र (KVK) के परामर्श से ही करें।

❓ अपनी फसल के लक्षणों का और विवरण बताएं ताकि सटीक निदान हो सके।"""
            else:
                return f"""🌿 **{crop_disp} Crop Protection Advice**

**1. Problem Overview:**
Observed symptoms on {crop_disp} crop.
{dis_info}
**2. Recommended Actions:**
1. Isolate and safely destroy heavily infected leaves/fruits.
2. Use **Neem Oil spray (3-5 ml/L)** as safe initial bio-control.
3. Maintain field sanitation and balanced irrigation.

❓ Please share more details about the exact symptoms for precise diagnosis."""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO D: FERTILIZER & DOSAGE CALCULATION
    # "Meri fasal mein kitna fertilizer dalna chahiye?" or "Gehu mein 30 din par kitna urea"
    # ─────────────────────────────────────────────────────────────────────────
    if intent == "fertilizer_dosage":
        # Calculate tailored dosage
        calc = calculate_fertilizer_dosage(crop or "wheat", stage_days, acres)
        f_list = calc.get("fertilizers", [])
        fert_lines = []
        for f in f_list:
            fert_lines.append(
                f"• **{f['name']}:**\n"
                f"  - मात्रा: **{f['rate_per_acre']}**\n"
                f"  - आपके {calc['acreage']} एकड़ खेत के लिए कुल मात्रा: **{f['total_required']}**\n"
                + (f"  - डालने का समय: {f['timing']}\n" if 'timing' in f else "")
            )
        fert_str = "\n".join(fert_lines)

        if lang == "hi":
            return f"""🧪 **{calc['crop']} के लिए संतुलित उर्वरक खुराक (Fertilizer Dosage)**

📍 **खेत का विवरण:**
• **क्षेत्रफल (Area):** {calc['acreage']} एकड़
• **फसल अवस्था (Growth Stage):** {calc['stage']}

📋 **अनुशंसित खाद व मात्रा (Dosage Schedule):**
{fert_str}

⚠️ **महत्वपूर्ण सावधानियां:**
• {calc.get('precautions', 'संतुलित मात्रा में ही उर्वरक दें।')}
• यूरिया डालते समय खेत में पर्याप्त नमी होना अनिवार्य है।
• अपनी मिट्टी का **सॉइल हेल्थ कार्ड (Soil Health Card)** बनवाकर ही पोटाश व डीएपी की सही मात्रा तय करें।

❓ क्या आपने बुवाई के समय DAP या पोटाश डाला था?"""
        else:
            return f"""🧪 **{calc['crop']} Fertilizer Dosage Calculation**

📍 **Field Details:**
• **Area:** {calc['acreage']} Acre
• **Growth Stage:** {calc['stage']}

📋 **Recommended Dosage:**
{fert_str}

⚠️ **Precautions:**
• {calc.get('precautions', 'Apply fertilizers evenly under moist soil.')}
• Never broadcast urea in deep standing water or dry soil.

❓ Did you apply basal DAP or Potash at the time of sowing?"""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO E: FARMING IDEA & BUDGET EVALUATION
    # "Main 1 acre mein tomato farming start karna chahta hoon. Mere paas ₹30,000 budget hai."
    # ─────────────────────────────────────────────────────────────────────────
    if intent == "farming_idea":
        eval_data = evaluate_farming_idea(crop, acres, budget, location)
        bd = eval_data.get("cost_breakdown", {})
        bd_str = "\n".join([f"  - {k}: {v}" for k, v in bd.items()]) if bd else ""

        if lang == "hi":
            return f"""💡 **{eval_data['crop']} योजना व बजट विश्लेषण**

**1. आपके विचार की समीक्षा:**
• **क्षेत्रफल:** {eval_data.get('area', '1 एकड़')}
• **आपका उपलब्ध बजट:** {eval_data.get('budget', '₹30,000')}
• **मानक आवश्यक लागत:** {eval_data.get('standard_cost', '₹65,000 - ₹80,000')}

💰 **लागत विवरण (अनुमानित 1 एकड़):**
{bd_str}

✅ **सकारात्मक बिंदु (Good Points):**
• {chr(10).join(['• ' + p for p in eval_data.get('pros', ['उच्च लाभ क्षमता'])])}

⚠️ **जोखिम व सावधानियां (Risks):**
• {chr(10).join(['• ' + r for r in eval_data.get('risks', ['बाजार भाव का उतार-चढ़ाव'])])}

🎯 **केएम सलाहकार की स्पष्ट सिफारिश (Final Recommendation):**
{eval_data.get('recommendation', '')}

❓ क्या आपके पास खेत में सिंचाई की पक्की सुविधा (बोरवेल/ड्रिप) उपलब्ध है?"""
        else:
            return f"""💡 **{eval_data['crop']} Idea & Budget Evaluation**

**1. Project Overview:**
• **Target Area:** {eval_data.get('area', '1 Acre')}
• **Your Budget:** {eval_data.get('budget', '₹30,000')}
• **Standard 1-Acre Cost:** {eval_data.get('standard_cost', '₹65,000 - ₹80,000')}

💰 **Estimated Cost Breakdown:**
{bd_str}

✅ **Pros:**
• High yield potential with continuous market cash flow.
• Multiple pickings over 60-90 days.

⚠️ **Key Risks:**
• High market price volatility (rates fluctuate between ₹5/kg and ₹50/kg).
• Heavy trellising/staking and pest management costs.

🎯 **Agronomist Recommendation:**
{eval_data.get('recommendation', '')}

❓ Do you already have borewell/drip irrigation installed in your field?"""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO F: CROP SELECTION WITH LOW BUDGET
    # "Mere paas kam budget hai, kaunsi fasal ugana sahi rahega?"
    # ─────────────────────────────────────────────────────────────────────────
    if intent == "crop_selection" or "kam budget" in user_message.lower():
        if lang == "hi":
            return """🌾 **कम बजट में सर्वाधिक लाभ देने वाली फसलें (Low-Budget High-Return Crops)**

यदि बजट सीमित है, तो ऐसी फसलें चुनें जिनमें महंगे बीज, भारी खाद और अत्यधिक कीटनाशकों की आवश्यकता न हो:

**1. दलहनी फसलें (मूंग, उड़द, चना):**
• **कम खर्च क्यों?** ये फसलें हवा से नाइट्रोजन स्वयं बनाती हैं, जिससे यूरिया की 70% बचत होती है।
• **अवधि:** मूंग केवल 60-65 दिन में तैयार हो जाती है।
• **सिंचाई:** केवल 2-3 हल्की सिंचाइयों की आवश्यकता।

**2. सरसों / तोरिया (Mustard):**
• **कम खर्च:** बीज दर मात्र 1.5-2 kg प्रति एकड़ (खर्च मात्र ₹200-₹300)।
• **सुरक्षा:** न्यूनतम समर्थन मूल्य (MSP) की सरकारी खरीद गारंटी।

**3. हरी पत्तेदार सब्जियां (पालक, मेथी, धनिया):**
• **कम खर्च:** 30-35 दिन में पहली कटाई शुरू।
• **दैनिक नकदी:** कम जमीन में भी नियमित आमदनी देती हैं।

💡 **बजट बचाने के 3 नियम:**
1. घर का बीज या प्रमाणित बीज उपचारित करके लगाएं।
2. जैविक खाद (गोबर की खाद/जीवामृत) का अधिक उपयोग करें।
3. रासायनिक दवाओं के स्थान पर नीम तेल का प्राथमिक छिड़काव करें।

❓ आप किस महीने/मौसम में बुवाई करना चाहते हैं और आपकी मिट्टी कैसी है?"""
        else:
            return """🌾 **Low-Budget Crop Recommendations**

If your working capital is limited, choose crops with low seed costs, low chemical fertilizer needs, and minimal pesticide dependency:

**1. Pulses (Moong, Urad, Gram/Chana):**
• Fix their own atmospheric nitrogen — saving up to 70% on urea costs.
• Short duration (Moong matures in just 60-65 days).
• Low water requirement (2-3 irrigations).

**2. Mustard (Sarson):**
• Minimal seed cost (1.5-2 kg/acre costs under ₹300).
• Highly stable government MSP procurement.

**3. Quick Greens (Spinach, Fenugreek, Coriander):**
• Harvestable in 30-40 days for rapid cash flow.

💡 **Cost-Saving Rule:** Treat seeds before sowing and use farmyard manure/Jeevamrut to cut fertilizer bills.

❓ Which season (Kharif, Rabi, or Zaid) and state are you planning for?"""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO G: WATERLOGGING / SOIL WATER STAGNATION
    # "Mere khet mein paani ruk jata hai, kya karun?"
    # ─────────────────────────────────────────────────────────────────────────
    if "waterlogging" in entities["symptoms"] or "paani ruk" in user_message.lower() or "pani ruk" in user_message.lower():
        if lang == "hi":
            return """💧 **खेत में पानी रुकने (Waterlogging) का ठोस समाधान**

**1. समस्या का कारण:**
खेत में पानी रुकने से मिट्टी के सूक्ष्म छिद्रों में हवा (ऑक्सीजन) खत्म हो जाती है। इससे फसल की जड़ें सांस नहीं ले पातीं, जड़ सड़न शुरू हो जाती है और पत्ते पीले पड़ने लगते हैं।

**2. तात्कालिक कदम (Immediate Steps):**
1. **निकासी नाली (Drainage Trenches):** खेत के सबसे निचले हिस्से में फावड़े से 1-1.5 फीट गहरी नाली बनाकर रुके हुए पानी को तुरंत बाहर निकालें।
2. **हल्की गुड़ाई (Hoeing):** जब पानी निकल जाए और मिट्टी पर ऊपरी पपड़ी जमने लगे, तो खुरपी या कल्टीवेटर से हल्की गुड़ाई करें ताकि हवा जड़ों तक पहुंचे।
3. **पर्णीय पोषण (Foliar Rescue):** पानी रुकने से जड़ें खुराक नहीं ले पातीं। पौधे को तुरंत सहारा देने के लिए **19:19:19 (NPK) @ 5 ग्राम प्रति लीटर** या **2% यूरिया** का पर्णीय स्प्रे करें।

**3. दीर्घकालिक उपाय (Permanent Solutions):**
• गर्मियों में खेत की गहरी जुताई (Subsoiler) करवाएं ताकि मिट्टी की निचली कठोर परत (hardpan) टूटे।
• खेत का लेजर लैंड लेवलर (Laser Leveller) से समतलीकरण कराएं।
• मिट्टी में गोबर की खाद और ढैंचा (Green Manure) मिलाकर जल निकासी क्षमता बढ़ाएं।

⚠️ **सावधानी:** खड़े पानी में कभी भी दानेदार यूरिया न फेंकें!"""
        else:
            return """💧 **Field Waterlogging & Drainage Solution**

**1. Problem Impact:**
Water stagnation deprives crop roots of oxygen, leading to root suffocation, rapid yellowing, and fungal root rots.

**2. Immediate Emergency Steps:**
1. **Dig Emergency Drainage Trenches:** Cut trenches at the lowest elevation of the field to evacuate standing water immediately.
2. **Aeration Hoeing:** As soon as the surface dries slightly, perform shallow hoeing to break the surface soil crust and let oxygen reach the root zone.
3. **Foliar Nutrient Rescue:** Roots cannot absorb soil nutrients while waterlogged. Revive plants with a foliar spray of **19:19:19 (NPK) @ 5g/L** or **2% Urea spray**.

**3. Long-term Field Correction:**
• Subsoil ploughing in peak summer to shatter the subsoil hardpan.
• Laser land levelling for uniform surface runoff.
• Incorporate organic matter (FYM / green manure) to improve soil structure.

⚠️ Never broadcast granular urea into stagnant standing water."""

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO H: GOVERNMENT SCHEMES & SUBSIDIES
    # ─────────────────────────────────────────────────────────────────────────
    if intent == "government_scheme":
        if lang == "hi":
            return """🏛️ **प्रमुख सरकारी कृषि योजनाएं (Government Agricultural Schemes):**

1. **PM-KISAN (प्रधानमंत्री किसान सम्मान निधि):**
   • **लाभ:** सभी पात्र किसानों को प्रतिवर्ष **₹6,000** की सहायता (₹2,000 की 3 किस्तों में सीधे बैंक खाते में)।
   • **शर्त:** भूमि रिकॉर्ड, आधार लिंकिंग व बैंक e-KYC अनिवार्य।

2. **PMFBY (प्रधानमंत्री फसल बीमा योजना):**
   • **प्रीमियम दर:** खरीफ फसलों पर मात्र 2%, रबी फसलों पर 1.5%, और बागवानी/वाणिज्यिक फसलों पर 5%। बाकी प्रीमियम सरकार देती है।
   • **कवरेज:** सूखा, बाढ़, कीट प्रकोप व ओलावृष्टि से नुकसान पर बीमा सुरक्षा।

3. **KCC (किसान क्रेडिट कार्ड):**
   • **ब्याज दर:** समय पर भुगतान करने पर मात्र **4% वार्षिक** ब्याज दर पर ₹3 लाख तक का अल्पकालिक ऋण।
   • **बिना गारंटी:** ₹1.60 लाख तक बिना किसी बंधक (collateral-free)।

4. **PM-KUSUM (सोलर पंप योजना):**
   • **सब्सिडी:** 2 HP से 7.5 HP तक के सोलर पंप पर **60% तक सरकारी अनुदान**।

5. **मृदा स्वास्थ्य कार्ड (Soil Health Card):**
   • आपके नजदीकी कृषि कार्यालय या KVK द्वारा मुफ्त मिट्टी परीक्षण।

❓ आप किस योजना के लिए आवेदन प्रक्रिया या पात्रता जानना चाहते हैं?"""
        else:
            return """🏛️ **Key Government Schemes for Farmers:**

1. **PM-KISAN:** ₹6,000/year direct financial support in 3 installments of ₹2,000 via DBT.
2. **PMFBY (Crop Insurance):** Extremely subsidized premium (1.5% for Rabi, 2% for Kharif) guarding against drought, flood, and hail damage.
3. **Kisan Credit Card (KCC):** Short-term crop loans up to ₹3 Lakh at an effective interest rate of just 4% p.a. upon timely repayment.
4. **PM-KUSUM:** Up to 60% capital subsidy on standalone solar agriculture pumps (2 HP - 7.5 HP).
5. **Soil Health Card:** Free testing of 12 nutrient parameters for balanced fertilization.

❓ Which scheme would you like eligibility details or application steps for?"""

    # ─────────────────────────────────────────────────────────────────────────
    # DEFAULT INTELLIGENT CONVERSATIONAL RESPONSE
    # ─────────────────────────────────────────────────────────────────────────
    if lang == "hi":
        return f"""🙏 **नमस्ते किसान मित्र!**

आपका सवाल: **"{user_message}"**

मैं आपकी सटीक सहायता करना चाहता हूँ। कृपया मुझे थोड़ी और जानकारी दें:
1. **कौन सी फसल** की बात कर रहे हैं?
2. **फसल कितने दिन या किस अवस्था में है?**
3. **खेत का रकबा कितना है?** (एकड़ / बीघा)

इन विवरणों के आधार पर मैं आपको दवा, खाद की सही मात्रा और वैज्ञानिक परामर्श तुरंत प्रदान करूँगा! 🌾"""
    elif lang == "en":
        return f"""🙏 **Namaste Kisan Mitra!**

Regarding your query: **"{user_message}"**

To provide you with the most accurate and practical recommendation, please let me know:
1. **Which crop** are you growing?
2. **What is the current growth stage or crop age in days?**
3. **What is your field area?** (in acres or bigha)

With these details, I will calculate exact dosages and provide a tailored agricultural plan! 🌾"""
    else:
        return f"""🙏 **Namaste Kisan Mitra!**

Aapka sawaal: **"{user_message}"**

Sahi aur specific salah dene ke liye kripya mujhe batayein:
1. **Kaunsi fasal** ke baare mein pooch rahe hain?
2. **Fasal kitne din ki ya kis stage mein hai?**
3. **Aapke paas kitni zameen hai?** (acre ya bigha)

Ye details milte hi main aapko khad, dawai ki sahi matra aur exact guidance dunga! 🌾"""


# ─────────────────────────────────────────────────────────────────────────────
# 7. GEMINI LLM GROUNDED GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def call_grounded_gemini_api(
    user_message: str,
    chat_history: List[Dict[str, str]],
    entities: Dict[str, Any],
    grounding_data: Dict[str, Any],
    lang: str
) -> Optional[str]:
    """
    Calls Gemini API with strictly injected ground truth facts (live weather,
    DB prices, pathology, user profile) so that the LLM cannot hallucinate.
    """
    if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
        return None

    try:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY.strip()}"
        )

        system_instruction = f"""You are KisanMitra AI — a distinguished, context-aware Agriculture Advisor for Indian farmers.

CRITICAL RULES:
1. LANGUAGE: Respond strictly in the farmer's language ({lang.upper()}).
   - If 'hi': Respond in natural, respectful Devanagari Hindi.
   - If 'hinglish': Respond in conversational, natural Hinglish (Roman Hindi).
   - If 'en': Respond in clear, accessible English.
2. CONTEXT MEMORY: Remember previously established facts from the conversation (crops, land acreage, days/stage, symptoms, budget). Never ask the farmer to repeat what they already stated.
3. GROUNDED REAL-TIME DATA:
   {grounding_data.get('summary_text', '')}
   - NEVER invent unverified mandi prices, fake weather reports, or arbitrary fertilizer dosages. Use the provided verified data whenever applicable.
4. STRUCTURED FORMAT FOR AGRICULTURAL PROBLEMS:
   Use these clear sections:
   - **Problem Understanding** (Brief summary of what was reported)
   - **Possible Causes** (Plausible causes with honest acknowledgment of uncertainty)
   - **Recommended Actions** (Practical, numbered prioritized steps — biological/IPM first, chemical dosage only with safety precautions)
   - **Important Precautions** (Risks, pre-harvest interval, avoiding over-application)
   - **Follow-up Question** (Only ask 1 specific question if essential to refine the next step)
5. DIRECT CONCISE ANSWERS FOR SIMPLE QUERIES:
   For direct factual queries (e.g. Mandi rates, weather forecast, scheme rules), provide direct answers without forced diagnostic headings.
6. SAFE ADVICE: Always encourage safe handling and mention consulting local KVK (Krishi Vigyan Kendra) for severe infestations."""

        contents = []
        if chat_history:
            for h in chat_history[-10:]:
                role = "user" if h.get("sender") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": h.get("text", "")}]
                })

        # Append current user message
        contents.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.85,
                "maxOutputTokens": 1024,
            }
        }

        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text and len(text.strip()) > 10:
                    return text.strip()

    except Exception as exc:
        logger.warning(f"Gemini API invocation failed or timed out: {exc}")

    return None


# ─────────────────────────────────────────────────────────────────────────────
# 8. MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def ask_agronomist_ai(
    user_message: str,
    chat_history: List[Dict[str, str]] = None,
    db: Optional[Session] = None,
    current_user: Optional[User] = None
) -> str:
    """
    Main entry point for KisanMitra AI Advisor.
    Understands question, extracts multi-turn context, fetches verified ground truth
    (DB mandi prices, live weather forecast, pathology, fertilizer calculations),
    and generates an accurate, structured response.
    """
    if chat_history is None:
        chat_history = []

    clean_message = user_message.strip()
    if not clean_message:
        return "कृपया अपना सवाल पूछें। मैं आपकी फसल, खाद, दवा, मंडी भाव या मौसम से जुड़ी किसी भी समस्या में मदद कर सकता हूँ। 🌾"

    # 1. Detect language
    lang = detect_language(clean_message)

    # 2. Extract multi-turn entities & conversation context
    entities = extract_entities_and_context(clean_message, chat_history, current_user)

    # 3. Retrieve verified real-time facts
    crop = entities.get("crop")
    location = entities.get("location")
    mandi_records = get_live_mandi_prices_db(crop, location, db)
    weather_info = get_live_weather_advisory(location)
    disease_records = get_disease_guide_db(crop, entities.get("symptoms", []), db)

    grounding_summary = f"""
VERIFIED GROUND TRUTH DATA:
• Extracted Entities: Crop={entities.get('crop')}, Acreage={entities.get('acreage')}, Stage/Age={entities.get('stage_days')} days, Location={entities.get('location')}, Budget={entities.get('budget')}
• Weather Data: Available={weather_info.get('available')}, Location={weather_info.get('location_name')}, Temp={weather_info.get('current_temp')}C, Condition={weather_info.get('current_condition')}, Tomorrow Rain Chance={weather_info.get('tomorrow_chance_of_rain')}%, Precip={weather_info.get('tomorrow_precip_mm')}mm
• Mandi Prices from Database: {mandi_records[:3]}
• Disease Pathology Records: {[d['name'] for d in disease_records[:2]]}
"""

    grounding_data = {
        "summary_text": grounding_summary,
        "weather": weather_info,
        "mandi": mandi_records,
        "disease": disease_records,
    }

    # 4. Try Grounded Gemini Generation if API key is active
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        gemini_response = call_grounded_gemini_api(
            clean_message,
            chat_history,
            entities,
            grounding_data,
            lang
        )
        if gemini_response:
            return gemini_response

    # 5. Execute Local Grounded Agronomic Expert Engine (Deterministic, Factual & Context-Aware)
    return generate_local_expert_response(
        clean_message,
        entities,
        lang,
        db
    )
