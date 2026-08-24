import datetime
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.user import Role, User, UserProfile
from app.models.agronomy import Crop, Fertilizer, Disease
from app.models.market import Market, MarketPrice
from app.models.marketplace import ProductCategory, Product
from app.models.content import FarmingTip, Banner, FAQ, SystemSetting, Notification

def seed_database(db: Session = None):
    auto_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        auto_close = True

    try:
        # 1. Roles
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            admin_role = Role(name="ADMIN", description="System Administrator with full management access")
            db.add(admin_role)

        farmer_role = db.query(Role).filter(Role.name == "FARMER").first()
        if not farmer_role:
            farmer_role = Role(name="FARMER", description="Farmer / Producer with farm advisory & marketplace access")
            db.add(farmer_role)
        db.commit()

        # 2. Default Users
        admin_user = db.query(User).filter(User.email == "admin@kisanmitra.ai").first()
        if not admin_user:
            admin_user = User(
                role_id=admin_role.id,
                full_name="KisanMitra Admin",
                email="admin@kisanmitra.ai",
                phone="9876543210",
                password_hash=hash_password("Admin@123"),
                is_active=True,
                is_verified=True,
                preferred_language="en"
            )
            db.add(admin_user)
            db.commit()

            admin_profile = UserProfile(
                user_id=admin_user.id,
                farm_location="Central Agronomy Hub, New Delhi",
                farm_size_acres=50.0,
                primary_crops="Wheat, Rice, Cotton, Pulses",
                soil_type="Alluvial Loam",
                irrigation_source="Canal & Borewell",
                state="Delhi",
                district="New Delhi",
                bio="Agricultural Systems Administrator"
            )
            db.add(admin_profile)

        farmer_user = db.query(User).filter(User.email == "farmer@kisanmitra.ai").first()
        if not farmer_user:
            farmer_user = User(
                role_id=farmer_role.id,
                full_name="Rameshwar Singh",
                email="farmer@kisanmitra.ai",
                phone="9812345678",
                password_hash=hash_password("Farmer@123"),
                is_active=True,
                is_verified=True,
                preferred_language="hi"
            )
            db.add(farmer_user)
            db.commit()

            farmer_profile = UserProfile(
                user_id=farmer_user.id,
                farm_location="Bakshi Ka Talab, Lucknow, UP",
                farm_size_acres=6.5,
                primary_crops="Rice, Wheat, Mustard",
                soil_type="Clay Loam",
                irrigation_source="Borewell & Drip",
                state="Uttar Pradesh",
                district="Lucknow",
                bio="Progressive farmer practicing organic crop rotation and precision irrigation."
            )
            db.add(farmer_profile)
            db.commit()

        # 3. Crops
        if db.query(Crop).count() == 0:
            crops_data = [
                {"name": "Rice", "scientific_name": "Oryza sativa", "category": "Cereal", "season": "Kharif", "min_n": 60, "max_n": 100, "min_p": 35, "max_p": 60, "min_k": 35, "max_k": 45, "min_ph": 5.0, "max_ph": 7.0, "optimal_temp_c": "20-27", "optimal_rainfall_mm": "180-300", "duration_days": 130, "description": "Major staple cereal crop in India requiring standing water in early vegetative stages.", "cultivation_guide": "Transplant 21-day old seedlings with 20x15cm spacing. Maintain 2-5cm standing water until grain hardening stage."},
                {"name": "Wheat", "scientific_name": "Triticum aestivum", "category": "Cereal", "season": "Rabi", "min_n": 80, "max_n": 120, "min_p": 40, "max_p": 60, "min_k": 30, "max_k": 50, "min_ph": 6.0, "max_ph": 7.5, "optimal_temp_c": "15-25", "optimal_rainfall_mm": "50-100", "duration_days": 120, "description": "Primary winter staple cereal grown across Indo-Gangetic plains.", "cultivation_guide": "Sow in lines in mid-November. Apply critical irrigations at CRI (21 DAS) and flowering stages."},
                {"name": "Maize", "scientific_name": "Zea mays", "category": "Cereal", "season": "Kharif / Rabi", "min_n": 60, "max_n": 100, "min_p": 35, "max_p": 60, "min_k": 15, "max_k": 25, "min_ph": 5.5, "max_ph": 7.5, "optimal_temp_c": "18-27", "optimal_rainfall_mm": "60-110", "duration_days": 100, "description": "Versatile cereal crop used for human food, poultry feed, and industrial starch.", "cultivation_guide": "Plant with 60x20cm spacing. Ridge and furrow planting improves drainage and root lodging resistance."},
                {"name": "Chickpea", "scientific_name": "Cicer arietinum", "category": "Pulses", "season": "Rabi", "min_n": 20, "max_n": 60, "min_p": 55, "max_p": 80, "min_k": 75, "max_k": 85, "min_ph": 5.9, "max_ph": 8.5, "optimal_temp_c": "17-22", "optimal_rainfall_mm": "65-95", "duration_days": 110, "description": "Major pulse crop supplying plant protein and enriching soil nitrogen via root nodules.", "cultivation_guide": "Treat seeds with Rhizobium culture. Nip shoot tips at 30-40 days to encourage heavy branching."},
                {"name": "Cotton", "scientific_name": "Gossypium hirsutum", "category": "Cash Crop", "season": "Kharif", "min_n": 100, "max_n": 140, "min_p": 35, "max_p": 60, "min_k": 15, "max_k": 25, "min_ph": 6.0, "max_ph": 8.0, "optimal_temp_c": "22-26", "optimal_rainfall_mm": "60-100", "duration_days": 160, "description": "White Gold of agriculture; deep-rooted fiber crop thriving in deep black soils.", "cultivation_guide": "Maintain 90x60cm spacing. Regularly monitor square formation and boll development for pest prevention."},
                {"name": "Mustard", "scientific_name": "Brassica juncea", "category": "Oilseeds", "season": "Rabi", "min_n": 60, "max_n": 90, "min_p": 30, "max_p": 50, "min_k": 20, "max_k": 40, "min_ph": 6.0, "max_ph": 7.5, "optimal_temp_c": "15-22", "optimal_rainfall_mm": "30-60", "duration_days": 105, "description": "Important edible oilseed crop grown in winter across North and Central India.", "cultivation_guide": "Sow in October for optimal vegetative growth. Apply Sulphur @ 20 kg/ha to increase seed oil percentage."}
            ]
            for c in crops_data:
                db.add(Crop(**c))
            db.commit()

        # 4. Fertilizers
        if db.query(Fertilizer).count() == 0:
            fertilizers_data = [
                {"name": "Neem Coated Urea (46-0-0)", "formula_or_ratio": "46-0-0", "category": "Nitrogenous", "nitrogen_pct": 46.0, "phosphorus_pct": 0.0, "potassium_pct": 0.0, "suitable_crops": "All Crops (Rice, Wheat, Maize, Cotton, Sugarcane)", "application_guidance": "Apply in 2-3 split doses during active vegetative growth. Neem coating slows nitrification and reduces nitrogen leaching.", "precautions": "Do not apply on waterlogged fields or sunny midday."},
                {"name": "DAP - Di-Ammonium Phosphate (18-46-0)", "formula_or_ratio": "18-46-0", "category": "Phosphatic", "nitrogen_pct": 18.0, "phosphorus_pct": 46.0, "potassium_pct": 0.0, "suitable_crops": "Wheat, Rice, Pulses, Oilseeds, Potato", "application_guidance": "Apply as basal placement 5 cm below seed level during sowing for strong root establishment.", "precautions": "Avoid mixing directly with seed germ."},
                {"name": "MOP - Muriate of Potash (0-0-60)", "formula_or_ratio": "0-0-60", "category": "Potassic", "nitrogen_pct": 0.0, "phosphorus_pct": 0.0, "potassium_pct": 60.0, "suitable_crops": "Banana, Potato, Sugarcane, Fruit Crops", "application_guidance": "Apply basal or top-dress before flowering to enhance drought tolerance and grain/fruit weight.", "precautions": "Do not use on chlorine-sensitive crops like Tobacco."},
                {"name": "NPK 19:19:19 (Water Soluble Complex)", "formula_or_ratio": "19-19-19", "category": "Complex", "nitrogen_pct": 19.0, "phosphorus_pct": 19.0, "potassium_pct": 19.0, "suitable_crops": "Vegetables, Flowers, Horticultural crops", "application_guidance": "Foliar spray @ 5-7 g/liter water or fertigation through drip irrigation system.", "precautions": "Spray during early morning or late evening hours."},
                {"name": "Single Super Phosphate - SSP (0-16-0 + 11% S)", "formula_or_ratio": "0-16-0", "category": "Phosphatic", "nitrogen_pct": 0.0, "phosphorus_pct": 16.0, "potassium_pct": 0.0, "suitable_crops": "Mustard, Groundnut, Pulses, Legumes", "application_guidance": "Excellent source of water-soluble phosphorus, sulphur, and calcium for oilseed enhancement.", "precautions": "Apply at time of land preparation."},
                {"name": "Bio-NPK & Trichoderma Organic Booster", "formula_or_ratio": "Bio-Consortium", "category": "Bio-fertilizer", "nitrogen_pct": 5.0, "phosphorus_pct": 5.0, "potassium_pct": 5.0, "suitable_crops": "Organic Farming & All Crops", "application_guidance": "Mix 2 kg per 100 kg FYM/vermicompost and broadcast before sowing.", "precautions": "Do not mix with chemical bactericides."}
            ]
            for f in fertilizers_data:
                db.add(Fertilizer(**f))
            db.commit()

        # 5. Diseases
        if db.query(Disease).count() == 0:
            diseases_data = [
                {"name": "Tomato Early Blight", "scientific_name": "Alternaria solani", "crop": "Tomato", "pathogen_type": "Fungal", "severity": "Moderate to High", "symptoms": "Dark brown concentric target spots on older lower leaves leading to premature defoliation.", "causes": "High humidity and warm temperatures (24-30°C).", "prevention_guide": "Use disease-free seeds, practice 3-year crop rotation, and avoid wetting foliage with drip irrigation.", "treatment_guide": "Apply Mancozeb 75% WP (2 g/L) or Chlorothalonil 75% WP (2 g/L) at first symptom appearance."},
                {"name": "Rice Leaf Blast", "scientific_name": "Magnaporthe oryzae", "crop": "Rice", "pathogen_type": "Fungal", "severity": "High", "symptoms": "Spindle-shaped elliptical lesions with grayish centers and brown borders on leaves and neck nodes.", "causes": "Excessive nitrogen fertilizer and prolonged dew.", "prevention_guide": "Avoid overdosing nitrogen fertilizer; apply split potassium; use certified disease-free seed.", "treatment_guide": "Foliar spray Tricyclazole 75% WP @ 0.6 g/L or Kasugamycin 3% SL @ 2.5 ml/L."},
                {"name": "Wheat Yellow Rust", "scientific_name": "Puccinia striiformis", "crop": "Wheat", "pathogen_type": "Fungal", "severity": "High", "symptoms": "Yellowish orange powdery pustules arranged in narrow linear stripes along leaf blades.", "causes": "Cool, humid weather (10-15°C) with heavy morning fog.", "prevention_guide": "Grow rust-resistant cultivars like HD 3086, DBW 187; timely sowing in mid-November.", "treatment_guide": "Spray Tebuconazole 25.9% EC (1.25 ml/L) or Propiconazole 25% EC (1 ml/L)."}
            ]
            for d in diseases_data:
                db.add(Disease(**d))
            db.commit()

        # 6. Markets & Market Prices
        if db.query(Market).count() == 0:
            markets_data = [
                {"name": "Lucknow Mandi (Dubagga)", "state": "Uttar Pradesh", "district": "Lucknow", "market_type": "APMC Mandi", "address": "Dubagga Hardoi Road, Lucknow"},
                {"name": "Azadpur Mandi", "state": "Delhi", "district": "North Delhi", "market_type": "Terminal Wholesale", "address": "Azadpur, New Delhi"},
                {"name": "Pune APMC (Gultekdi)", "state": "Maharashtra", "district": "Pune", "market_type": "APMC Mandi", "address": "Market Yard, Gultekdi, Pune"},
                {"name": "Ludhiana Grain Market", "state": "Punjab", "district": "Ludhiana", "market_type": "APMC Mandi", "address": "Grain Market, Gill Road, Ludhiana"},
                {"name": "Karnal Mandi", "state": "Haryana", "district": "Karnal", "market_type": "APMC Mandi", "address": "New Anaj Mandi, Karnal"}
            ]
            markets_objs = []
            for m in markets_data:
                m_obj = Market(**m)
                db.add(m_obj)
                markets_objs.append(m_obj)
            db.commit()

            prices_data = [
                {"market_id": markets_objs[0].id, "crop_name": "Wheat (Sharbati)", "variety": "Sharbati Grade-A", "market_name": "Lucknow Mandi", "state": "Uttar Pradesh", "min_price": 2450.0, "max_price": 2720.0, "modal_price": 2580.0, "unit": "₹ / Quintal", "trend": "UP", "change_percent": 2.4},
                {"market_id": markets_objs[0].id, "crop_name": "Paddy (Basmati)", "variety": "Pusa 1121", "market_name": "Lucknow Mandi", "state": "Uttar Pradesh", "min_price": 3800.0, "max_price": 4250.0, "modal_price": 4050.0, "unit": "₹ / Quintal", "trend": "UP", "change_percent": 3.1},
                {"market_id": markets_objs[0].id, "crop_name": "Mustard Seed", "variety": "Black Bold", "market_name": "Lucknow Mandi", "state": "Uttar Pradesh", "min_price": 5400.0, "max_price": 5850.0, "modal_price": 5650.0, "unit": "₹ / Quintal", "trend": "STABLE", "change_percent": 0.2},
                {"market_id": markets_objs[1].id, "crop_name": "Tomato (Hybrid)", "variety": "Himsona", "market_name": "Azadpur Mandi", "state": "Delhi", "min_price": 1800.0, "max_price": 2400.0, "modal_price": 2100.0, "unit": "₹ / Quintal", "trend": "DOWN", "change_percent": -4.2},
                {"market_id": markets_objs[2].id, "crop_name": "Onion (Nashik)", "variety": "Red Medium", "market_name": "Pune APMC", "state": "Maharashtra", "min_price": 2200.0, "max_price": 2800.0, "modal_price": 2500.0, "unit": "₹ / Quintal", "trend": "UP", "change_percent": 5.0},
                {"market_id": markets_objs[3].id, "crop_name": "Paddy (PR 126)", "variety": "Non-Basmati", "market_name": "Ludhiana Grain Market", "state": "Punjab", "min_price": 2200.0, "max_price": 2350.0, "modal_price": 2280.0, "unit": "₹ / Quintal", "trend": "STABLE", "change_percent": 0.0},
                {"market_id": markets_objs[4].id, "crop_name": "Basmati 1509", "variety": "Super Fine", "market_name": "Karnal Mandi", "state": "Haryana", "min_price": 3400.0, "max_price": 3900.0, "modal_price": 3650.0, "unit": "₹ / Quintal", "trend": "UP", "change_percent": 1.8}
            ]
            for p in prices_data:
                db.add(MarketPrice(**p))
            db.commit()

        # 7. Product Categories & Marketplace
        if db.query(ProductCategory).count() == 0:
            categories_data = [
                {"name": "Grains & Cereals", "slug": "grains-cereals", "description": "Direct farm harvested wheat, paddy, maize and millets", "icon_name": "Wheat"},
                {"name": "Organic Pulses & Legumes", "slug": "pulses", "description": "Unpolished lentils, chickpeas, and rajma", "icon_name": "Bean"},
                {"name": "Fresh Vegetables & Fruits", "slug": "produce", "description": "Farm-fresh daily harvest produce", "icon_name": "Carrot"},
                {"name": "Certified Seeds", "slug": "seeds", "description": "High germination hybrid & organic heirloom seeds", "icon_name": "Sprout"},
                {"name": "Bio-Fertilizers & Nutrients", "slug": "fertilizers", "description": "Organic compost, vermicompost, and liquid micronutrients", "icon_name": "FlaskConical"},
                {"name": "Farming Equipment & Tools", "slug": "tools", "description": "Drip kits, sprayers, and precision farm tools", "icon_name": "Wrench"}
            ]
            cat_objs = []
            for c in categories_data:
                cat_obj = ProductCategory(**c)
                db.add(cat_obj)
                cat_objs.append(cat_obj)
            db.commit()

            seller = farmer_user or admin_user
            products_data = [
                {"seller_id": seller.id, "category_id": cat_objs[0].id, "name": "Sharbati Golden Wheat (100% Organic)", "description": "A-Grade MP Sharbati wheat grown naturally without synthetic pesticides. Naturally sweet taste and high gluten quality.", "price": 42.0, "unit": "kg", "stock_quantity": 5000.0, "location": "Lucknow, Uttar Pradesh", "is_organic": True, "rating": 4.9},
                {"seller_id": seller.id, "category_id": cat_objs[0].id, "name": "Traditional Basmati Rice (Pusa 1121)", "description": "Extra-long grain aged Basmati rice with authentic rich aroma. Direct from farmer harvest.", "price": 95.0, "unit": "kg", "stock_quantity": 3000.0, "location": "Karnal, Haryana", "is_organic": False, "rating": 4.8},
                {"seller_id": seller.id, "category_id": cat_objs[1].id, "name": "Desi Chana (Organic Brown Chickpeas)", "description": "Protein-rich unpolished indigenous desi chickpeas. Cleaned and sun-dried.", "price": 88.0, "unit": "kg", "stock_quantity": 1200.0, "location": "Nagpur, Maharashtra", "is_organic": True, "rating": 4.9},
                {"seller_id": seller.id, "category_id": cat_objs[3].id, "name": "Hybrid Mustard Seeds (Pusa Bold)", "description": "Certified high oil-content mustard seed pack with 95%+ germination rate. Resistant to white rust.", "price": 450.0, "unit": "packet (1 kg)", "stock_quantity": 250.0, "location": "Jaipur, Rajasthan", "is_organic": False, "rating": 4.7},
                {"seller_id": seller.id, "category_id": cat_objs[4].id, "name": "Enriched Cow Dung Vermicompost", "description": "100% pure organic vermicompost enriched with neem cake and beneficial soil microbes.", "price": 12.0, "unit": "kg", "stock_quantity": 10000.0, "location": "Pune, Maharashtra", "is_organic": True, "rating": 5.0},
                {"seller_id": seller.id, "category_id": cat_objs[5].id, "name": "16-Liter Battery Operated Knapsack Sprayer", "description": "Dual motor rechargeable farm sprayer with adjustable brass nozzles for uniform foliar spray.", "price": 2850.0, "unit": "piece", "stock_quantity": 40.0, "location": "New Delhi", "is_organic": False, "rating": 4.8}
            ]
            for p in products_data:
                db.add(Product(**p))
            db.commit()

        # 8. Farming Tips
        if db.query(FarmingTip).count() == 0:
            tips_data = [
                {"title": "Drip Irrigation Scheduling for Water Conservation", "category": "Irrigation", "summary": "Save up to 60% irrigation water while boosting crop yields by 25% with micro-drip fertigation.", "detailed_content": "Drip irrigation delivers water and nutrients directly to the plant root zone, eliminating evaporation losses and weed proliferation. For vegetable crops like tomato and chili, run lateral lines at 1.2m spacing with 4 LPH drippers spaced 30cm apart.", "season": "All Seasons", "author": "Dr. S. K. Sharma (Agronomist)"},
                {"title": "Organic Soil Carbon Regeneration with Green Manuring", "category": "Soil Management", "summary": "Restore soil humus and micro-flora naturally by incorporating Dhaincha or Sunn hemp before Kharif sowing.", "detailed_content": "Sow Dhaincha (Sesbania aculeata) @ 25 kg/ha with pre-monsoon showers. Incorporate the succulent 45-day-old green biomass into soil 10 days before paddy transplanting. Adds 15-20 tons of organic biomass and fixes 80-100 kg atmospheric nitrogen per hectare.", "season": "Kharif", "author": "ICAR Soil Science Division"},
                {"title": "Integrated Pest Management (IPM) in Cotton & Pulses", "category": "Pest Management", "summary": "Reduce chemical pesticide usage by combining pheromone traps, yellow sticky cards, and bio-pesticides.", "detailed_content": "Install yellow sticky traps (20 per acre) at canopy level to monitor whiteflies, aphids, and thrips. Use Trichogramma egg parasitoids @ 50,000/ha for natural bollworm management. Spray Azadirachtin 1500 ppm @ 3 ml/L at first nymph sightings.", "season": "Kharif / Rabi", "author": "KisanMitra Advisory Cell"}
            ]
            for t in tips_data:
                db.add(FarmingTip(**t))
            db.commit()

        # 9. FAQs & System Settings
        if db.query(FAQ).count() == 0:
            faqs_data = [
                {"question": "How accurate is the KisanMitra AI Crop Recommendation model?", "answer": "The Crop Recommendation engine uses a trained Random Forest model with over 99% validation accuracy based on ICAR agronomic datasets, factoring in soil NPK, pH, ambient temperature, humidity, and rainfall.", "category": "AI Technology", "display_order": 1},
                {"question": "Can I test plant diseases using mobile leaf photos?", "answer": "Yes! Simply take a clear, well-lit photo of the affected plant leaf and upload it in the Disease Detection module. The AI analyzes visual symptoms, identifying fungal or bacterial pathogens with instant treatment guidance.", "category": "Disease Detection", "display_order": 2},
                {"question": "How do farmers sell produce on KisanMitra Marketplace?", "answer": "Registered farmers can easily list their crops, seeds, or organic produce through the Farmer Dashboard with transparent pricing, stock quantities, and direct buyer contact.", "category": "Marketplace", "display_order": 3},
                {"question": "Is KisanMitra AI available in Hindi and regional languages?", "answer": "Yes, the entire platform supports both English and Hindi with an instant language switcher in the top navigation bar.", "category": "General", "display_order": 4}
            ]
            for f in faqs_data:
                db.add(FAQ(**f))
            db.commit()

        if db.query(SystemSetting).count() == 0:
            settings_data = [
                {"key": "PLATFORM_NAME", "value": "KisanMitra AI", "description": "Official Platform Name", "is_public": True},
                {"key": "TAGLINE", "value": "Your Intelligent Farming Companion", "description": "Header Tagline", "is_public": True},
                {"key": "SUPPORT_EMAIL", "value": "support@kisanmitra.ai", "description": "Public Support Email", "is_public": True},
                {"key": "HELPLINE_PHONE", "value": "1800-180-1551 (Kisan Call Center)", "description": "National Farmer Helpline", "is_public": True},
                {"key": "ENABLE_AI_ASSISTANT", "value": "true", "description": "Toggle AI Agronomist Chat Feature", "is_public": True}
            ]
            for s in settings_data:
                db.add(SystemSetting(**s))
            db.commit()

        print("Database initialized and successfully seeded with rich agricultural data.")
    finally:
        if auto_close:
            db.close()

if __name__ == "__main__":
    seed_database()
