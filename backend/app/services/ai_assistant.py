import requests
from typing import List, Dict
from app.core.config import settings

AGRONOMY_SYSTEM_PROMPT = """You are 'KisanMitra AI Expert Agronomist', an intelligent agricultural assistant built to empower Indian farmers, agronomists, and agri-entrepreneurs.
You provide precise, practical, eco-friendly, and scientifically grounded farming guidance on:
- Crop selection, sowing dates, and seed treatment
- Soil health, pH management, NPK fertilizer dosing, and organic compost
- Drip and sprinkler irrigation scheduling
- Integrated Pest Management (IPM), bio-pesticides, and chemical treatments
- Plant pathology and disease prevention
- Harvesting, post-harvest storage, and mandi market strategy.

Tone: Respectful, clear, encouraging, structured with practical bullet points.
Always include practical tips suitable for Indian agro-climatic conditions.
"""

KNOWLEDGE_RESPONSES = {
    "urea": "Urea (46-0-0) is the most concentrated source of nitrogen. **Best Practice:** Apply in 2 to 3 split doses (basal, tillering, panicle initiation). Never broadcast urea on standing water or hot dry soil without immediate light irrigation, as volatilization loss can exceed 30%.",
    "dap": "Di-Ammonium Phosphate (DAP 18-46-0) supplies primary phosphorus and starter nitrogen. **Best Practice:** Place DAP 4-5 cm below and to the side of seed placement at sowing. Avoid top-dressing DAP later in the season as phosphorus is immobile in soil.",
    "rice": "For paddy/rice cultivation: Maintain 2-3 cm standing water during transplanting. Use SRI (System of Rice Intensification) to save up to 40% irrigation water. Watch out for stem borer and blast disease during vegetative growth.",
    "wheat": "Wheat requires cool climate during tillering and warm dry weather during maturity. Critical irrigation stages: 1) Crown Root Initiation (21 days), 2) Tillering (45 days), 3) Late jointing (65 days), 4) Flowering (85 days), 5) Milking stage (105 days).",
    "tomato": "Tomato requires well-drained loamy soil with pH 6.0-7.0. Staking indeterminate varieties improves fruit aeration and prevents early blight soil splash. Apply calcium nitrate to prevent blossom end rot.",
    "pest": "For Integrated Pest Management (IPM): 1) Install yellow sticky traps (15-20/acre) for whiteflies/aphids. 2) Use pheromone traps (5/acre) for bollworms/fruit borers. 3) Spray 5% Neem Seed Kernel Extract (NSKE) or Azadirachtin 1500 ppm for bio-control before using chemical pesticides.",
    "soil": "Soil testing is recommended every 2 years. Maintain soil organic carbon above 0.75% by incorporating green manures (Dhaincha/Sunn hemp), crop residues, and farmyard manure (FYM @ 5 tons/acre).",
    "drip": "Drip irrigation saves 40-70% water and increases fertilizer use efficiency by 30-50% through fertigation. Clean filters weekly and flush lateral lines monthly with dilute acid to remove calcium carbonate scale."
}

def ask_agronomist_ai(user_message: str, chat_history: List[Dict[str, str]] = None) -> str:
    msg_lower = user_message.lower()
    
    # Try Gemini API if key is provided
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            contents = []
            if chat_history:
                for h in chat_history[-6:]:
                    role = "user" if h.get("sender") == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": h.get("text", "")}]})
            contents.append({"role": "user", "parts": [{"text": f"{AGRONOMY_SYSTEM_PROMPT}\n\nFarmer Query: {user_message}"}]})
            
            res = requests.post(url, json={"contents": contents}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
        except Exception:
            pass
            
    # Smart Expert Agricultural Engine Fallback
    matched_topics = [ans for kw, ans in KNOWLEDGE_RESPONSES.items() if kw in msg_lower]
    if matched_topics:
        response_text = "\n\n".join(matched_topics)
        response_text += "\n\n### 🌾 Recommended Field Actions:\n- Check soil moisture before any foliar or soil application.\n- Maintain proper spacing for adequate sunlight penetration.\n- Consult local Krishi Vigyan Kendra (KVK) for specific regional recommendations."
        return response_text
        
    return f"""Hello Kisan Mitra! Regarding your query on **"{user_message}"**:

### 💡 Agronomic Best Practices:
1. **Soil & Nutrition**: Ensure balanced NPK application based on a recent soil health card. Add 5 tons/acre well-decomposed FYM (cow dung compost) to enhance microbial activity.
2. **Water Management**: Practice precision irrigation (drip or sprinkler). Avoid water stagnation around root zones to prevent root rot.
3. **Pest & Disease Defense**: Inspect the underside of leaves weekly. Utilize neem oil (3-5 ml/L) as a first-line preventive spray against sucking pests.
4. **Crop Care**: Maintain timely weeding and mulching to conserve moisture and suppress competing weeds.

*Feel free to ask more specific questions about any crop, pest symptom, fertilizer dose, or market price!*"""
