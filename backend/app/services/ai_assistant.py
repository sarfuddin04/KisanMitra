import requests
from typing import List, Dict
from app.core.config import settings

# ─────────────────────────────────────────────────────────────────────────────
# KisanMitra AI – Agriculture Advisor System Prompt
# Implements: Natural Conversation, Understand-Before-Advising, Personalized
# Advice, Farmer Idea Evaluation, Structured Problem Solving
# ─────────────────────────────────────────────────────────────────────────────

AGRONOMY_SYSTEM_PROMPT = """You are **KisanMitra AI** — a warm, knowledgeable, and practical Agriculture Advisor Chatbot designed specifically for Indian farmers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 1. NATURAL CONVERSATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Talk like a helpful, respectful agricultural advisor — not a robot.
- The farmer may write in Hindi, Hinglish, simple English, informal language, with spelling mistakes or incomplete sentences.
- ALWAYS understand the meaning even when the message is not grammatically correct.
- Reply in the SAME language the farmer uses. If they write in Hindi/Hinglish, reply in Hindi/Hinglish. If English, reply in English.
- Use simple words. Avoid jargon unless you explain it.
- Use emojis sparingly (🌾, ✅, ⚠️, 💡, 🎯) to make responses friendly and scannable.

Example understanding:
  Farmer: "mere aloo me patta murjha rha h kya kru"
  → Understand: Potato crop, leaves wilting, asking for solution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 2. UNDERSTAND BEFORE ADVISING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do NOT immediately give a generic solution. First understand:
  - Which crop?
  - What problem exactly?
  - Crop growth stage?
  - How long has the problem existed?
  - What symptoms are visible?
  - Irrigation condition?
  - Weather condition, if relevant?
  - Any fertilizer or pesticide already used?

If important information is missing, ask **1–2 simple follow-up questions** before giving detailed advice. Keep questions short and conversational.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 3. PERSONALIZED ADVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Give advice according to the farmer's EXACT situation. Do not give the same answer to every farmer.

For example, if a farmer says "Main tomato lagane wala hu", ask relevant details:
  - Location / region
  - Land size / field area
  - Season (Kharif / Rabi / Zaid)
  - Irrigation availability (borewell, canal, rainfed)

Then suggest suitable planning based on the information provided.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 4. FARMER'S OWN IDEA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the farmer says something like "Main ye karne ka soch raha hu…":

First understand the idea fully. Then respond with ALL of these:

  ✅ **Acche Points (Good Points):** What is good about the idea.
  ⚠️ **Possible Risks:** What could go wrong.
  💡 **Better Approach:** How the farmer can improve the idea.
  🎯 **Final Advice:** Clearly tell whether the idea seems suitable based on available info.

NEVER reject the farmer's idea without clearly explaining why.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 5. PROBLEM SOLVING FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For any farming problem, follow this thinking process:

  **Problem → Possible Causes → Questions → Analysis → Solution → Precautions**

Example:
  Farmer: "Gehu ke patte peele ho rahe hain."
  Do NOT immediately say "fertilizer daalo."
  
  Instead, consider possible causes:
  - Nutrient deficiency (nitrogen, iron, zinc)
  - Excess water / waterlogging
  - Lack of irrigation / drought stress
  - Disease (yellow rust, leaf blight)
  - Root damage from termites or nematodes
  
  Ask 1-2 clarifying questions, then give a structured diagnosis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 6. RESPONSE FORMATTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Keep responses concise but complete. Use bullet points and short paragraphs.
- For solutions, use numbered steps.
- Always end serious advice with a safety note: "Apne nazdeeki KVK (Krishi Vigyan Kendra) se bhi salah zaroor lein."
- If suggesting chemicals/pesticides, ALWAYS mention safety precautions and dosage.
- For market or price queries, remind farmers to check local APMC mandi rates.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 7. YOUR EXPERTISE AREAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are an expert in:
- Crop selection, sowing dates, seed varieties, and seed treatment
- Soil health, pH management, NPK dosing, organic composting
- Drip & sprinkler irrigation scheduling
- Integrated Pest Management (IPM), bio-pesticides, chemical treatments
- Plant pathology and disease identification & prevention
- Harvesting, post-harvest storage, and mandi market strategy
- Government schemes for farmers (PM-KISAN, PMFBY, KCC, etc.)
- Organic farming, zero-budget natural farming (ZBNF)
- Indian agro-climatic zones and region-specific practices

Always provide advice suitable for Indian agro-climatic conditions.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Expanded Knowledge Base for Offline / Fallback Mode
# ─────────────────────────────────────────────────────────────────────────────

KNOWLEDGE_RESPONSES = {
    # ── Fertilizers ──
    "urea": "🌾 **Urea (46-0-0)** — सबसे ज़्यादा nitrogen देने वाला fertilizer।\n\n**सही तरीका:**\n1. 2-3 बार में डालें (basal, tillering, panicle stage)\n2. खड़े पानी या तेज़ धूप में कभी मत डालें — 30% तक nitrogen उड़ जाती है\n3. डालने के बाद हल्की सिंचाई ज़रूर करें\n4. Neem-coated urea use करें — slow release होती है\n\n⚠️ **सावधानी:** ज़रूरत से ज़्यादा urea से फसल लंबी और कमजोर हो जाती है, कीड़े भी ज़्यादा लगते हैं।",
    
    "dap": "🌾 **DAP (18-46-0)** — Phosphorus का मुख्य source।\n\n**सही तरीका:**\n1. बुवाई के समय बीज से 4-5 cm नीचे और बगल में डालें\n2. Top-dressing में DAP मत डालें — phosphorus मिट्टी में move नहीं करता\n3. SSP (Single Super Phosphate) cheaper option है, Sulphur भी मिलता है\n\n💡 **Tip:** Soil test करवा लें — कई बार phosphorus पहले से काफी होता है मिट्टी में।",
    
    "npk": "🌾 **NPK Fertilizer** — तीनों मुख्य पोषक तत्व एक साथ।\n\n- **N (Nitrogen):** पत्तों की हरियाली और growth\n- **P (Phosphorus):** जड़ों और फूलों का विकास\n- **K (Potassium):** फल की quality और disease resistance\n\n**सही तरीका:** Soil health card के अनुसार ही NPK ratio चुनें। हर फसल की ज़रूरत अलग होती है।",

    # ── Crops ──
    "rice": "🌾 **धान/चावल की खेती:**\n\n1. रोपाई के समय 2-3 cm पानी रखें\n2. SRI (System of Rice Intensification) विधि से 40% तक पानी बचता है\n3. Stem borer और blast disease पर ध्यान रखें\n4. 20-25 दिन की seedling सबसे अच्छी होती है\n5. Line transplanting से yield 15-20% बढ़ता है\n\n💡 **Tip:** DSR (Direct Seeded Rice) से labour cost कम होती है।",
    
    "wheat": "🌾 **गेहूं की खेती:**\n\nCritical सिंचाई stages:\n1. Crown Root Initiation (21 दिन)\n2. Tillering (45 दिन)\n3. Late Jointing (65 दिन)\n4. Flowering (85 दिन)\n5. Milking Stage (105 दिन)\n\n⚠️ पहली और चौथी सिंचाई सबसे ज़रूरी है — छोड़ने से 20-30% तक yield कम होती है।\n\n💡 **Variety:** HD-3226, PBW-825, DBW-187 (उत्तर भारत के लिए अच्छी varieties)।",
    
    "tomato": "🍅 **टमाटर की खेती:**\n\n1. Well-drained loamy soil चाहिए, pH 6.0-7.0\n2. Staking करें — blight और soil splash से बचाव होगा\n3. Blossom end rot के लिए Calcium Nitrate spray करें\n4. Mulching से moisture बनी रहती है और weeds कम होते हैं\n5. पहला picking 60-70 दिन बाद शुरू\n\n⚠️ **रोग:** Early blight, late blight, leaf curl virus — Imidacloprid spray whitefly control के लिए।",
    
    "potato": "🥔 **आलू की खेती:**\n\n1. Sandy loam soil सबसे अच्छी, pH 5.5-6.5\n2. बीज आलू 30-40 gm का, 2-3 आँखों वाला\n3. बुवाई से पहले Mancozeb से seed treatment करें\n4. Late blight सबसे बड़ा खतरा — Metalaxyl + Mancozeb spray करें\n5. 80-90 दिन में फसल तैयार (early varieties)\n\n💡 **Variety:** Kufri Pukhraj, Kufri Jyoti, Kufri Bahar (उत्तर भारत)।",

    # ── Problems ──
    "pest": "🐛 **IPM (Integrated Pest Management):**\n\n1. Yellow sticky traps (15-20/acre) — whitefly, aphid\n2. Pheromone traps (5/acre) — bollworm, fruit borer\n3. Neem oil spray (3-5 ml/L) — sucking pests के लिए\n4. NSKE 5% spray — first line bio-control\n5. Chemical spray last option रखें\n\n⚠️ **सावधानी:** Spray सुबह या शाम को करें, तेज़ धूप में नहीं। Honey bee वाले area में ध्यान रखें।",
    
    "yellow": "🍂 **पत्ते पीले हो रहे हैं?**\n\nकई कारण हो सकते हैं:\n1. **Nitrogen deficiency** — पुराने पत्ते पहले पीले होते हैं\n2. **Iron/Zinc deficiency** — नई पत्तियां पीली, नसें हरी\n3. **Waterlogging** — जड़ों को oxygen नहीं मिल रहा\n4. **Disease** — yellow rust, leaf blight\n5. **Root damage** — termite या nematode\n\n❓ मुझे बताएं: कौन सी फसल है? कितने दिन से problem है? सिंचाई कैसी है?",
    
    "wilt": "🥀 **पौधा मुरझा रहा है?**\n\nPossible causes:\n1. **Fusarium/Verticillium Wilt** — fungal disease\n2. **Bacterial Wilt** — तना काटने पर brown ring दिखता है\n3. **पानी की कमी** — drought stress\n4. **Root rot** — ज़्यादा पानी से जड़ सड़ रही है\n5. **Nematode attack** — जड़ों में गांठें बनती हैं\n\n❓ मुझे बताएं: कौन सी फसल? सिंचाई कब की? तना काटकर देखा?",

    # ── Soil ──
    "soil": "🌍 **मिट्टी की सेहत:**\n\n1. हर 2 साल में soil test करवाएं\n2. Organic carbon 0.75% से ऊपर रखें\n3. Green manure (Dhaincha/Sunn hemp) उगाएं\n4. FYM (गोबर की खाद) 5 ton/acre डालें\n5. Crop rotation करें — एक ही फसल बार-बार न लगाएं\n6. Vermicompost excellent organic option है\n\n💡 **Tip:** Soil Health Card scheme से free testing होती है — अपने block agriculture office में संपर्क करें।",

    # ── Irrigation ──
    "drip": "💧 **Drip Irrigation:**\n\n1. 40-70% पानी बचता है\n2. Fertigation से fertilizer efficiency 30-50% बढ़ती है\n3. Filters हफ्ते में साफ करें\n4. Lateral lines monthly acid wash करें\n5. Government 55-80% subsidy देती है (PMKSY scheme)\n\n💡 **Tip:** Subsidy के लिए District Horticulture Officer से संपर्क करें।",
    
    "irrigation": "💧 **सिंचाई Management:**\n\n1. फसल की critical stages पर सिंचाई ज़रूरी है\n2. Sprinkler — गेहूं, सरसों, मूंगफली के लिए अच्छा\n3. Drip — सब्जी, फल, गन्ने के लिए best\n4. Mulching से 25-30% पानी बचता है\n5. Morning में सिंचाई करें — evaporation कम होता है\n\n⚠️ Over-irrigation से root rot, fungal diseases बढ़ती हैं।",

    # ── Government Schemes ──
    "scheme": "🏛️ **किसानों के लिए सरकारी योजनाएं:**\n\n1. **PM-KISAN:** ₹6,000/year (तीन किस्तों में)\n2. **PMFBY:** फसल बीमा (Premium: Kharif 2%, Rabi 1.5%)\n3. **KCC:** Kisan Credit Card — 4% ब्याज दर पर loan\n4. **PM-KUSUM:** Solar pump subsidy (60-90%)\n5. **PMKSY:** Micro-irrigation (drip/sprinkler) पर 55-80% subsidy\n6. **Soil Health Card:** Free soil testing\n\n💡 अपने नज़दीकी CSC Centre या Block Agriculture Office में apply करें।",

    # ── Organic Farming ──
    "organic": "🌿 **Organic / जैविक खेती:**\n\n1. **Jeevamrit:** गोबर 10kg + गोमूत्र 10L + गुड़ 2kg + बेसन 2kg + मिट्टी 1 मुट्ठी → 200L पानी में 7 दिन\n2. **Beejamrit:** बीज उपचार — गोबर 5kg + गोमूत्र 5L + चूना 50g + मिट्टी 1 मुट्ठी\n3. **Mulching:** पराली / सूखी घास बिछाएं\n4. **Green Manure:** Dhaincha 45 दिन में मिट्टी में मिला दें\n5. **Bio-pesticides:** Trichoderma, Beauveria bassiana, Pseudomonas\n\n🎯 Organic certification 3 साल में मिलता है — premium price 20-40% ज़्यादा मिलता है।",
}

# Common Hindi/Hinglish keywords to topic mapping for fallback matching
KEYWORD_TOPIC_MAP = {
    "murjha": "wilt", "murjhana": "wilt", "sukh": "wilt", "sukhna": "wilt",
    "peela": "yellow", "peele": "yellow", "peeli": "yellow", "yellow": "yellow",
    "keeda": "pest", "keede": "pest", "kida": "pest", "kide": "pest",
    "insect": "pest", "bug": "pest", "makhi": "pest", "illi": "pest",
    "mitti": "soil", "soil": "soil", "zameen": "soil",
    "paani": "irrigation", "pani": "irrigation", "sinchai": "irrigation",
    "sarkari": "scheme", "yojana": "scheme", "subsidy": "scheme", "pm-kisan": "scheme",
    "jaivik": "organic", "organic": "organic", "desi khad": "organic", "gobar": "organic",
    "khad": "npk", "fertilizer": "npk",
}


def _match_fallback_topics(msg_lower: str) -> list:
    """Match user message against knowledge base using direct and mapped keywords."""
    matched = set()

    # Direct knowledge base keyword match
    for kw in KNOWLEDGE_RESPONSES:
        if kw in msg_lower:
            matched.add(kw)

    # Mapped keyword match (Hindi/Hinglish → topic)
    for keyword, topic in KEYWORD_TOPIC_MAP.items():
        if keyword in msg_lower:
            matched.add(topic)

    return list(matched)


def ask_agronomist_ai(user_message: str, chat_history: List[Dict[str, str]] = None) -> str:
    """
    Main entry point for the AI agriculture advisor.
    Tries Gemini API first, falls back to curated knowledge base.
    """
    msg_lower = user_message.lower().strip()

    # ── Try Gemini API if key is configured ──
    if settings.GEMINI_API_KEY:
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
            )

            # Build conversation contents with system instruction
            contents = []

            # Include recent chat history for context (last 8 messages)
            if chat_history:
                for h in chat_history[-8:]:
                    role = "user" if h.get("sender") == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": h.get("text", "")}]
                    })

            # Current user message
            contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })

            payload = {
                "system_instruction": {
                    "parts": [{"text": AGRONOMY_SYSTEM_PROMPT}]
                },
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "topP": 0.9,
                    "maxOutputTokens": 1024,
                }
            }

            res = requests.post(url, json=payload, timeout=15)

            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text

        except Exception:
            pass  # Fall through to offline knowledge base

    # ── Smart Offline Fallback Engine ──
    matched_topics = _match_fallback_topics(msg_lower)

    if matched_topics:
        responses = [KNOWLEDGE_RESPONSES[t] for t in matched_topics if t in KNOWLEDGE_RESPONSES]
        response_text = "\n\n---\n\n".join(responses)
        response_text += (
            "\n\n---\n\n🌾 **और मदद चाहिए?** अपनी फसल, समस्या, या स्थिति के बारे में "
            "और details बताएं तो मैं और specific सलाह दे सकता हूँ।\n\n"
            "⚠️ *Chemical dosage और spraying से पहले अपने नज़दीकी KVK (Krishi Vigyan Kendra) "
            "से ज़रूर सलाह लें।*"
        )
        return response_text

    # ── Conversational Default — Ask for More Context ──
    return f"""🙏 **Namaste Kisan Mitra!**

Aapka sawaal samajh mein aaya — **"{user_message}"**

Aapki behtar madad karne ke liye, mujhe kuch aur jaankari chahiye:

❓ **Kuch sawaal:**
1. **Kaunsi fasal** ke baare mein pooch rahe hain?
2. **Kya problem** dikh rahi hai? (patte peele, keede, murjhana, etc.)
3. **Kitne dino** se ye problem hai?
4. **Sinchai** kaise hoti hai? (borewell, canal, barish)

In details se main aapko **sahi aur specific salah** de paunga! 🌾

---

💡 **Aap ye bhi pooch sakte hain:**
- Fasal ki bimari ka ilaaj
- Sahi khad aur dawai ka dose
- Beej ki variety
- Sarkari yojanaein (PM-KISAN, PMFBY, KCC)
- Organic/jaivik kheti ke tarike"""
