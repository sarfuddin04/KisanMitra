import datetime
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal, sync_schema
from app.core.security import hash_password
from app.models.user import Role, User, UserProfile
from app.models.agronomy import Crop, Fertilizer, Disease
from app.models.market import State, District, Mandi, Market, MarketPrice
from app.models.marketplace import ProductCategory, Product
from app.models.content import FarmingTip, Banner, FAQ, SystemSetting, Notification

def seed_database(db: Session = None):
    sync_schema(engine)
    Base.metadata.create_all(bind=engine)
    auto_close = False
    if db is None:
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

        # 3. Crops (10 essential agricultural crops with images)
        crops_data = [
            {
                "name": "Wheat",
                "scientific_name": "Triticum aestivum",
                "category": "Cereal",
                "season": "Rabi",
                "min_n": 80, "max_n": 120, "min_p": 40, "max_p": 60, "min_k": 30, "max_k": 50,
                "min_ph": 6.0, "max_ph": 7.5,
                "optimal_temp_c": "15-25", "optimal_rainfall_mm": "50-100", "duration_days": 120,
                "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80",
                "description": "Primary winter staple cereal grown across Indo-Gangetic plains.",
                "cultivation_guide": "Sow in lines in mid-November. Apply critical irrigations at CRI (21 DAS) and flowering stages.",
                "is_active": True
            },
            {
                "name": "Rice",
                "scientific_name": "Oryza sativa",
                "category": "Cereal",
                "season": "Kharif",
                "min_n": 60, "max_n": 100, "min_p": 35, "max_p": 60, "min_k": 35, "max_k": 45,
                "min_ph": 5.0, "max_ph": 7.0,
                "optimal_temp_c": "20-27", "optimal_rainfall_mm": "180-300", "duration_days": 130,
                "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
                "description": "Major staple cereal crop in India requiring standing water in early vegetative stages.",
                "cultivation_guide": "Transplant 21-day old seedlings with 20x15cm spacing. Maintain 2-5cm standing water until grain hardening stage.",
                "is_active": True
            },
            {
                "name": "Maize",
                "scientific_name": "Zea mays",
                "category": "Cereal",
                "season": "Kharif / Rabi",
                "min_n": 60, "max_n": 100, "min_p": 35, "max_p": 60, "min_k": 15, "max_k": 25,
                "min_ph": 5.5, "max_ph": 7.5,
                "optimal_temp_c": "18-27", "optimal_rainfall_mm": "60-110", "duration_days": 100,
                "image_url": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80",
                "description": "Versatile cereal crop used for human food, poultry feed, and industrial starch.",
                "cultivation_guide": "Plant with 60x20cm spacing. Ridge and furrow planting improves drainage and root lodging resistance.",
                "is_active": True
            },
            {
                "name": "Cotton",
                "scientific_name": "Gossypium hirsutum",
                "category": "Cash Crop",
                "season": "Kharif",
                "min_n": 100, "max_n": 140, "min_p": 35, "max_p": 60, "min_k": 15, "max_k": 25,
                "min_ph": 6.0, "max_ph": 8.0,
                "optimal_temp_c": "22-26", "optimal_rainfall_mm": "60-100", "duration_days": 160,
                "image_url": "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=400&q=80",
                "description": "White Gold of agriculture; deep-rooted fiber crop thriving in deep black soils.",
                "cultivation_guide": "Maintain 90x60cm spacing. Regularly monitor square formation and boll development for pest prevention.",
                "is_active": True
            },
            {
                "name": "Sugarcane",
                "scientific_name": "Saccharum officinarum",
                "category": "Cash Crop",
                "season": "Year-round",
                "min_n": 120, "max_n": 200, "min_p": 40, "max_p": 80, "min_k": 60, "max_k": 120,
                "min_ph": 6.0, "max_ph": 7.5,
                "optimal_temp_c": "20-35", "optimal_rainfall_mm": "150-250", "duration_days": 360,
                "image_url": "https://images.unsplash.com/photo-1596797882870-8c33deeac224?auto=format&fit=crop&w=400&q=80",
                "description": "High-value commercial perennial grass crop used for sugar, jaggery, and ethanol production.",
                "cultivation_guide": "Plant two-budded setts in deep furrows with 90-120cm row spacing. Earthing up at 90 days prevents lodging.",
                "is_active": True
            },
            {
                "name": "Potato",
                "scientific_name": "Solanum tuberosum",
                "category": "Vegetable",
                "season": "Rabi",
                "min_n": 100, "max_n": 150, "min_p": 60, "max_p": 100, "min_k": 80, "max_k": 120,
                "min_ph": 5.2, "max_ph": 6.8,
                "optimal_temp_c": "15-20", "optimal_rainfall_mm": "50-80", "duration_days": 90,
                "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80",
                "description": "Major tuber vegetable crop rich in carbohydrates, vitamins, and minerals.",
                "cultivation_guide": "Plant sprouted seed tubers at 60x20cm spacing. Regular earthing up protects developing tubers from sun-greening.",
                "is_active": True
            },
            {
                "name": "Tomato",
                "scientific_name": "Solanum lycopersicum",
                "category": "Vegetable",
                "season": "Year-round",
                "min_n": 80, "max_n": 120, "min_p": 40, "max_p": 60, "min_k": 40, "max_k": 80,
                "min_ph": 6.0, "max_ph": 7.0,
                "optimal_temp_c": "18-27", "optimal_rainfall_mm": "60-120", "duration_days": 100,
                "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
                "description": "High-demand vegetable crop cultivated across all seasons with high commercial return.",
                "cultivation_guide": "Stake indeterminate plants with bamboo trellises. Mulching with paddy straw reduces soil-borne fruit rot.",
                "is_active": True
            },
            {
                "name": "Onion",
                "scientific_name": "Allium cepa",
                "category": "Vegetable",
                "season": "Rabi / Kharif",
                "min_n": 60, "max_n": 100, "min_p": 40, "max_p": 60, "min_k": 40, "max_k": 60,
                "min_ph": 6.0, "max_ph": 7.5,
                "optimal_temp_c": "15-25", "optimal_rainfall_mm": "40-75", "duration_days": 120,
                "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80",
                "description": "Indispensable bulb vegetable crop widely grown and traded across Indian APMC mandis.",
                "cultivation_guide": "Transplant 6-8 week old healthy seedlings at 15x10cm spacing in flat beds. Stop irrigation 15 days before harvesting.",
                "is_active": True
            },
            {
                "name": "Gram (Chickpea)",
                "scientific_name": "Cicer arietinum",
                "category": "Pulses",
                "season": "Rabi",
                "min_n": 20, "max_n": 60, "min_p": 55, "max_p": 80, "min_k": 75, "max_k": 85,
                "min_ph": 5.9, "max_ph": 8.5,
                "optimal_temp_c": "17-22", "optimal_rainfall_mm": "65-95", "duration_days": 110,
                "image_url": "https://images.unsplash.com/photo-1515543904379-3d757afe72e6?auto=format&fit=crop&w=400&q=80",
                "description": "Major pulse crop supplying plant protein and enriching soil nitrogen via root nodules.",
                "cultivation_guide": "Treat seeds with Rhizobium culture. Nip shoot tips at 30-40 days to encourage heavy branching.",
                "is_active": True
            },
            {
                "name": "Mustard",
                "scientific_name": "Brassica juncea",
                "category": "Oilseeds",
                "season": "Rabi",
                "min_n": 60, "max_n": 90, "min_p": 30, "max_p": 50, "min_k": 20, "max_k": 40,
                "min_ph": 6.0, "max_ph": 7.5,
                "optimal_temp_c": "15-22", "optimal_rainfall_mm": "30-60", "duration_days": 105,
                "image_url": "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=400&q=80",
                "description": "Important edible oilseed crop grown in winter across North and Central India.",
                "cultivation_guide": "Sow in October for optimal vegetative growth. Apply Sulphur @ 20 kg/ha to increase seed oil percentage.",
                "is_active": True
            }
        ]
        for c in crops_data:
            existing_crop = db.query(Crop).filter((Crop.name == c["name"]) | (Crop.name == c["name"].split(" ")[0])).first()
            if existing_crop:
                for k, v in c.items():
                    setattr(existing_crop, k, v)
            else:
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

        # ==================== LOCATION HIERARCHY SEEDING ====================
        if db.query(State).count() == 0:
            locations = [
                {
                    "state": "Uttar Pradesh",
                    "districts": [
                        {"name": "Lucknow", "mandis": [
                            {"name": "Lucknow Mandi", "address": "Aishbagh, Lucknow", "pincode": "226004", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "20:00", "contact_number": "0522-2636291"},
                            {"name": "Dubagga Mandi", "address": "Dubagga, Lucknow", "pincode": "226002", "mandi_type": "Rural Haat", "opening_time": "06:00", "closing_time": "19:00"},
                            {"name": "Sitapur Road Mandi", "address": "Sitapur Road, Lucknow", "pincode": "226021", "mandi_type": "APMC Mandi", "opening_time": "05:30", "closing_time": "20:30"},
                        ]},
                        {"name": "Agra", "mandis": [
                            {"name": "Agra Mandi", "address": "Shahganj Sabji Mandi, Agra", "pincode": "282010", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "20:00"},
                            {"name": "Bodla Mandi", "address": "Bodla, Agra", "pincode": "282007", "mandi_type": "Wholesale", "opening_time": "06:00", "closing_time": "18:00"},
                        ]},
                        {"name": "Varanasi", "mandis": [
                            {"name": "Varanasi Mandi", "address": "Lahartara Mandi, Varanasi", "pincode": "221002", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "21:00"},
                            {"name": "Chaukaghat Mandi", "address": "Chaukaghat, Varanasi", "pincode": "221001", "mandi_type": "Rural Haat"},
                        ]},
                        {"name": "Kanpur", "mandis": [
                            {"name": "Kanpur Mandi", "address": "Navagraha Mandi, Kanpur", "pincode": "208001", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "20:00"},
                            {"name": "Kidwai Nagar Mandi", "address": "Kidwai Nagar, Kanpur", "pincode": "208011", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Meerut", "mandis": [
                            {"name": "Meerut Mandi", "address": "Dilli Road, Meerut", "pincode": "250002", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "20:00"},
                            {"name": "Shastri Nagar Mandi", "address": "Shastri Nagar, Meerut", "pincode": "250004", "mandi_type": "Rural Haat"},
                        ]},
                        {"name": "Allahabad", "mandis": [
                            {"name": "Allahabad Mandi", "address": "Zero Road, Prayagraj", "pincode": "211003", "mandi_type": "APMC Mandi"},
                            {"name": "Naini Mandi", "address": "Naini, Prayagraj", "pincode": "211008", "mandi_type": "Wholesale"},
                        ]},
                    ]
                },
                {
                    "state": "Maharashtra",
                    "districts": [
                        {"name": "Nashik", "mandis": [
                            {"name": "Nashik Mandi", "address": "APMC Yard, Nashik", "pincode": "422001", "mandi_type": "APMC Mandi", "opening_time": "06:00", "closing_time": "20:00"},
                            {"name": "Lasalgaon Mandi", "address": "Lasalgaon, Nashik", "pincode": "422306", "mandi_type": "APMC Mandi", "contact_number": "02550-280043"},
                            {"name": "Yeola Mandi", "address": "Yeola, Nashik District", "pincode": "423401", "mandi_type": "Rural Haat"},
                        ]},
                        {"name": "Pune", "mandis": [
                            {"name": "Pune Market Yard", "address": "Gultekdi, Pune", "pincode": "411037", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "22:00"},
                            {"name": "Pimpri Mandi", "address": "Pimpri, Pune", "pincode": "411018", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Nagpur", "mandis": [
                            {"name": "Nagpur Mandi", "address": "Kalamna Market, Nagpur", "pincode": "440013", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "20:00"},
                            {"name": "Butibori Mandi", "address": "Butibori, Nagpur", "pincode": "441122", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Aurangabad", "mandis": [
                            {"name": "Aurangabad Mandi", "address": "Garkheda, Aurangabad", "pincode": "431005", "mandi_type": "APMC Mandi"},
                            {"name": "Chikalthana Mandi", "address": "Chikalthana, Aurangabad", "pincode": "431006", "mandi_type": "Rural Haat"},
                        ]},
                    ]
                },
                {
                    "state": "Punjab",
                    "districts": [
                        {"name": "Amritsar", "mandis": [
                            {"name": "Amritsar Grain Market", "address": "Hall Bazaar, Amritsar", "pincode": "143001", "mandi_type": "APMC Mandi", "opening_time": "06:00", "closing_time": "20:00"},
                            {"name": "Chatiwind Mandi", "address": "Chatiwind, Amritsar", "pincode": "143001", "mandi_type": "Rural Haat"},
                        ]},
                        {"name": "Ludhiana", "mandis": [
                            {"name": "Ludhiana Grain Market", "address": "Gill Road, Ludhiana", "pincode": "141003", "mandi_type": "APMC Mandi", "opening_time": "06:00", "closing_time": "21:00"},
                            {"name": "Sahnewal Mandi", "address": "Sahnewal, Ludhiana", "pincode": "141120", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Patiala", "mandis": [
                            {"name": "Patiala Mandi", "address": "Old Grain Market, Patiala", "pincode": "147001", "mandi_type": "APMC Mandi"},
                            {"name": "Rajpura Mandi", "address": "Rajpura, Patiala", "pincode": "140401", "mandi_type": "Rural Haat"},
                        ]},
                    ]
                },
                {
                    "state": "Haryana",
                    "districts": [
                        {"name": "Karnal", "mandis": [
                            {"name": "Karnal Anaj Mandi", "address": "Kunjpura Road, Karnal", "pincode": "132001", "mandi_type": "APMC Mandi", "opening_time": "06:00", "closing_time": "20:00"},
                            {"name": "Gharaunda Mandi", "address": "Gharaunda, Karnal", "pincode": "132114", "mandi_type": "Rural Haat"},
                        ]},
                        {"name": "Rohtak", "mandis": [
                            {"name": "Rohtak Mandi", "address": "Delhi Bypass, Rohtak", "pincode": "124001", "mandi_type": "APMC Mandi"},
                            {"name": "Asthal Bohar Mandi", "address": "Asthal Bohar, Rohtak", "pincode": "124001", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Hisar", "mandis": [
                            {"name": "Hisar Anaj Mandi", "address": "Railway Road, Hisar", "pincode": "125001", "mandi_type": "APMC Mandi", "opening_time": "05:30", "closing_time": "20:00"},
                            {"name": "Hansi Mandi", "address": "Hansi, Hisar", "pincode": "125033", "mandi_type": "Rural Haat"},
                        ]},
                    ]
                },
                {
                    "state": "Delhi",
                    "districts": [
                        {"name": "New Delhi", "mandis": [
                            {"name": "Azadpur Mandi", "address": "Azadpur, North Delhi", "pincode": "110033", "mandi_type": "APMC Mandi", "opening_time": "04:00", "closing_time": "22:00", "contact_number": "011-27672009"},
                            {"name": "Okhla Mandi", "address": "Okhla Phase-I, New Delhi", "pincode": "110020", "mandi_type": "Wholesale"},
                            {"name": "Ghazipur Mandi", "address": "Ghazipur, New Delhi", "pincode": "110096", "mandi_type": "APMC Mandi", "opening_time": "04:00", "closing_time": "22:00"},
                        ]},
                        {"name": "South Delhi", "mandis": [
                            {"name": "Sarojini Nagar Market", "address": "Sarojini Nagar, New Delhi", "pincode": "110023", "mandi_type": "Rural Haat"},
                            {"name": "Mehrauli Mandi", "address": "Mehrauli, South Delhi", "pincode": "110030", "mandi_type": "Rural Haat"},
                        ]},
                    ]
                },
                {
                    "state": "Rajasthan",
                    "districts": [
                        {"name": "Jaipur", "mandis": [
                            {"name": "Jaipur Mandi", "address": "Muhana Mandi, Jaipur", "pincode": "302023", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "21:00"},
                            {"name": "Chandpole Mandi", "address": "Chandpole, Jaipur", "pincode": "302001", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Jodhpur", "mandis": [
                            {"name": "Jodhpur Krishi Mandi", "address": "Nandanwan, Jodhpur", "pincode": "342003", "mandi_type": "APMC Mandi"},
                            {"name": "Pali Road Mandi", "address": "Pali Road, Jodhpur", "pincode": "342001", "mandi_type": "Rural Haat"},
                        ]},
                        {"name": "Kota", "mandis": [
                            {"name": "Kota Mandi", "address": "Vigyan Nagar, Kota", "pincode": "324005", "mandi_type": "APMC Mandi"},
                            {"name": "Dara Mandi", "address": "Dara, Kota", "pincode": "325201", "mandi_type": "Rural Haat"},
                        ]},
                    ]
                },
                {
                    "state": "Madhya Pradesh",
                    "districts": [
                        {"name": "Bhopal", "mandis": [
                            {"name": "Karond Mandi", "address": "Karond, Bhopal", "pincode": "462038", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "20:00"},
                            {"name": "Bairagarh Mandi", "address": "Bairagarh, Bhopal", "pincode": "462030", "mandi_type": "Wholesale"},
                        ]},
                        {"name": "Indore", "mandis": [
                            {"name": "Indore Mandi", "address": "Rajwada Mandi, Indore", "pincode": "452001", "mandi_type": "APMC Mandi", "opening_time": "05:00", "closing_time": "22:00"},
                            {"name": "Chhawani Mandi", "address": "Chhawani, Indore", "pincode": "452003", "mandi_type": "Wholesale"},
                        ]},
                    ]
                },
            ]

            created_mandis = []  # Track for market price seeding
            for loc in locations:
                # Create state
                st = db.query(State).filter(State.name == loc["state"]).first()
                if not st:
                    st = State(name=loc["state"], is_active=True)
                    db.add(st)
                    db.flush()

                for dist_data in loc["districts"]:
                    dt = db.query(District).filter(
                        District.name == dist_data["name"],
                        District.state_id == st.id
                    ).first()
                    if not dt:
                        dt = District(state_id=st.id, name=dist_data["name"], is_active=True)
                        db.add(dt)
                        db.flush()

                    for mandi_data in dist_data["mandis"]:
                        mn = db.query(Mandi).filter(
                            Mandi.name == mandi_data["name"],
                            Mandi.district_id == dt.id
                        ).first()
                        if not mn:
                            mn = Mandi(
                                district_id=dt.id,
                                name=mandi_data["name"],
                                address=mandi_data.get("address"),
                                pincode=mandi_data.get("pincode"),
                                contact_number=mandi_data.get("contact_number"),
                                opening_time=mandi_data.get("opening_time", "06:00"),
                                closing_time=mandi_data.get("closing_time", "20:00"),
                                mandi_type=mandi_data.get("mandi_type", "APMC Mandi"),
                                is_active=True
                            )
                            db.add(mn)
                            db.flush()
                        created_mandis.append((mn, st.name, dist_data["name"]))

            db.commit()

            # Seed sample market prices linked to mandis
            wheat = db.query(Crop).filter(Crop.name.ilike("%wheat%")).first()
            rice = db.query(Crop).filter(Crop.name.ilike("%rice%")).first()
            maize = db.query(Crop).filter(Crop.name.ilike("%maize%")).first()
            tomato = db.query(Crop).filter(Crop.name.ilike("%tomato%")).first()
            onion = db.query(Crop).filter(Crop.name.ilike("%onion%")).first()
            potato = db.query(Crop).filter(Crop.name.ilike("%potato%")).first()

            sample_prices = [
                # (mandi_name_fragment, crop_obj, min_price, max_price, modal, unit, trend)
                ("Lucknow Mandi", wheat, 2100, 2500, 2350, "₹/Quintal", "UP"),
                ("Lucknow Mandi", rice, 1800, 2200, 2050, "₹/Quintal", "STABLE"),
                ("Lucknow Mandi", potato, 800, 1200, 1050, "₹/Quintal", "DOWN"),
                ("Dubagga Mandi", tomato, 1500, 2500, 2000, "₹/Quintal", "UP"),
                ("Dubagga Mandi", onion, 1200, 1800, 1500, "₹/Quintal", "STABLE"),
                ("Nashik Mandi", onion, 900, 1600, 1250, "₹/Quintal", "UP"),
                ("Lasalgaon Mandi", onion, 800, 1500, 1150, "₹/Quintal", "UP"),
                ("Azadpur Mandi", tomato, 2000, 3500, 2800, "₹/Quintal", "UP"),
                ("Azadpur Mandi", potato, 900, 1300, 1100, "₹/Quintal", "STABLE"),
                ("Karnal Anaj Mandi", wheat, 2200, 2600, 2400, "₹/Quintal", "UP"),
                ("Ludhiana Grain Market", wheat, 2300, 2700, 2500, "₹/Quintal", "STABLE"),
                ("Amritsar Grain Market", wheat, 2250, 2650, 2450, "₹/Quintal", "UP"),
                ("Sitapur Road Mandi", maize, 1600, 2000, 1800, "₹/Quintal", "UP"),
                ("Jaipur Mandi", maize, 1700, 2100, 1900, "₹/Quintal", "STABLE"),
                ("Indore Mandi", wheat, 2000, 2400, 2200, "₹/Quintal", "DOWN"),
            ]

            if db.query(MarketPrice).filter(MarketPrice.mandi_id != None).count() == 0:
                for mandi_fragment, crop_obj, min_p, max_p, modal_p, unit, trend in sample_prices:
                    if not crop_obj:
                        continue
                    mandi = db.query(Mandi).filter(Mandi.name.ilike(f"%{mandi_fragment}%")).first()
                    if not mandi:
                        continue
                    district = mandi.district
                    state = district.state if district else None
                    db.add(MarketPrice(
                        mandi_id=mandi.id,
                        crop_id=crop_obj.id,
                        crop_name=crop_obj.name,
                        market_name=mandi.name,
                        district=district.name if district else None,
                        state=state.name if state else None,
                        min_price=min_p,
                        max_price=max_p,
                        modal_price=modal_p,
                        unit=unit,
                        trend=trend,
                        change_percent=round((modal_p - (min_p + max_p) / 2) / max_p * 100, 1),
                        is_active=True
                    ))
                db.commit()

            print("Location hierarchy (States/Districts/Mandis) seeded successfully.")


    finally:
        if auto_close:
            db.close()

if __name__ == "__main__":
    seed_database()
