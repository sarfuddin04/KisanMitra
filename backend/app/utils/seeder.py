import datetime
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal, sync_schema
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import Role, User, UserProfile
from app.models.agronomy import Crop, Fertilizer, Disease
from app.models.market import State, District, Mandi, MandiCrop, Market, MarketPrice
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

        # 2. Default Users (seed defaults or configured passwords)
        admin_pwd = settings.ADMIN_PASSWORD or "KisanMitra@2026"
        farmer_pwd = settings.FARMER_PASSWORD or "Farmer@123"

        admin_user = db.query(User).filter(
            (User.email == "admin@kisanmitra.com") | (User.email == "admin@kisanmitra.ai")
        ).first()
        if not admin_user and admin_pwd:
            admin_user = User(
                role_id=admin_role.id,
                full_name="KisanMitra Admin",
                email="admin@kisanmitra.com",
                phone="9876543210",
                password_hash=hash_password(admin_pwd),
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
        elif admin_user and admin_pwd:
            # Always ensure admin credentials and role are correct on every startup
            admin_user.email = "admin@kisanmitra.com"
            admin_user.role_id = admin_role.id
            admin_user.password_hash = hash_password(admin_pwd)
            admin_user.is_active = True
            admin_user.is_verified = True
            db.commit()

        farmer_user = db.query(User).filter(User.email == "farmer@kisanmitra.ai").first()
        if not farmer_user and farmer_pwd:
            farmer_user = User(
                role_id=farmer_role.id,
                full_name="Rameshwar Singh",
                email="farmer@kisanmitra.ai",
                phone="9812345678",
                password_hash=hash_password(farmer_pwd),
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
        elif farmer_user and farmer_pwd:
            farmer_user.password_hash = hash_password(farmer_pwd)
            farmer_user.is_active = True
            farmer_user.is_verified = True
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
        # Expand to 10 categories, seed 45+ products with images
        categories_data = [
            {"name": "Seeds", "slug": "seeds", "description": "High germination hybrid & organic heirloom seeds", "icon_name": "Sprout"},
            {"name": "Fertilizers", "slug": "fertilizers", "description": "Organic compost, chemical fertilizers & micronutrients", "icon_name": "FlaskConical"},
            {"name": "Pesticides", "slug": "pesticides", "description": "Bio and chemical crop protection sprays", "icon_name": "Bug"},
            {"name": "Farming Tools", "slug": "farming-tools", "description": "Hand tools, sprayers & precision farm instruments", "icon_name": "Wrench"},
            {"name": "Irrigation Equipment", "slug": "irrigation", "description": "Drip kits, sprinklers, pumps & pipes", "icon_name": "Droplets"},
            {"name": "Organic Products", "slug": "organic", "description": "100% organic farm produce & inputs", "icon_name": "Leaf"},
            {"name": "Farm Machinery", "slug": "machinery", "description": "Power tillers, weeders & small farm equipment", "icon_name": "Cog"},
            {"name": "Crop Protection", "slug": "crop-protection", "description": "Fungicides, insecticides & bio-agents", "icon_name": "ShieldCheck"},
            {"name": "Animal & Farm Supplies", "slug": "farm-supplies", "description": "Feed, supplements & livestock essentials", "icon_name": "Beef"},
            {"name": "Agricultural Accessories", "slug": "accessories", "description": "Nets, mulch sheets, grow bags & tools", "icon_name": "Package"},
        ]

        # Upsert categories
        cat_map = {}  # slug -> ProductCategory obj
        for c_data in categories_data:
            existing_cat = db.query(ProductCategory).filter(ProductCategory.slug == c_data["slug"]).first()
            if existing_cat:
                for k, v in c_data.items():
                    setattr(existing_cat, k, v)
                cat_map[c_data["slug"]] = existing_cat
            else:
                cat_obj = ProductCategory(**c_data)
                db.add(cat_obj)
                db.flush()
                cat_map[c_data["slug"]] = cat_obj
        db.commit()

        # Re-fetch to ensure IDs
        for slug in cat_map:
            cat_map[slug] = db.query(ProductCategory).filter(ProductCategory.slug == slug).first()

        seller = farmer_user or admin_user

        # Full product catalog — 45 products across 10 categories
        # Each product has a unique relevant Unsplash image
        all_products = [
            # ── SEEDS (7) ──
            {"name": "Premium Wheat Seeds (Sharbati)", "category": "seeds", "description": "High-yield MP Sharbati wheat seeds with 95%+ germination rate. Certified disease-resistant variety ideal for Rabi season.", "price": 850, "unit": "10 kg bag", "stock_quantity": 500, "location": "Indore, Madhya Pradesh", "is_organic": False, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80"},
            {"name": "Basmati Rice Seeds (Pusa 1121)", "category": "seeds", "description": "Extra-long grain aromatic Basmati paddy seeds. Perfect for irrigated fields in Punjab-Haryana belt.", "price": 1200, "unit": "5 kg bag", "stock_quantity": 300, "location": "Karnal, Haryana", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80"},
            {"name": "Hybrid Maize Seeds (Pioneer)", "category": "seeds", "description": "Single cross hybrid maize seeds with excellent cob fill and drought tolerance. Suitable for Kharif season.", "price": 650, "unit": "4 kg bag", "stock_quantity": 400, "location": "Nashik, Maharashtra", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80"},
            {"name": "Mustard Seeds (Pusa Bold)", "category": "seeds", "description": "High oil-content certified mustard seeds resistant to white rust. 95%+ germination guarantee.", "price": 450, "unit": "1 kg packet", "stock_quantity": 250, "location": "Jaipur, Rajasthan", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&q=80"},
            {"name": "Tomato Seeds (Hybrid Himsona)", "category": "seeds", "description": "High-yielding hybrid tomato seeds with firm fruits and excellent shelf life. Suitable for all-season cultivation.", "price": 320, "unit": "10g packet", "stock_quantity": 600, "location": "Pune, Maharashtra", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80"},
            {"name": "Paddy Seeds (PR 126 Non-Basmati)", "category": "seeds", "description": "Short duration non-basmati paddy variety maturing in 123 days. Good for late transplanting.", "price": 380, "unit": "5 kg bag", "stock_quantity": 350, "location": "Ludhiana, Punjab", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1536304993881-460e32342370?w=600&q=80"},
            {"name": "Vegetable Seed Kit (10-in-1)", "category": "seeds", "description": "Complete kitchen garden seed kit: tomato, brinjal, chili, okra, spinach, coriander, radish, carrot, pumpkin, bottle gourd.", "price": 499, "unit": "kit", "stock_quantity": 200, "location": "New Delhi", "is_organic": True, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80"},

            # ── FERTILIZERS (6) ──
            {"name": "Urea Fertilizer (Neem Coated 46-0-0)", "category": "fertilizers", "description": "Government-approved neem coated urea with 46% nitrogen. Slow release reduces leaching losses by 15%.", "price": 266, "unit": "45 kg bag", "stock_quantity": 800, "location": "Kanpur, Uttar Pradesh", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&q=80"},
            {"name": "DAP Fertilizer (18-46-0)", "category": "fertilizers", "description": "Di-ammonium phosphate for strong root development. Best applied as basal dose during sowing.", "price": 1350, "unit": "50 kg bag", "stock_quantity": 600, "location": "Lucknow, Uttar Pradesh", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80"},
            {"name": "NPK 10-26-26 Complex", "category": "fertilizers", "description": "Balanced complex fertilizer for flowering and fruiting stage of crops. Excellent for potato, onion and vegetable crops.", "price": 1450, "unit": "50 kg bag", "stock_quantity": 400, "location": "Nashik, Maharashtra", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80"},
            {"name": "Enriched Vermicompost (Organic)", "category": "fertilizers", "description": "100% pure organic vermicompost enriched with neem cake and beneficial soil microbes. NPOP certified.", "price": 12, "unit": "kg", "stock_quantity": 10000, "location": "Pune, Maharashtra", "is_organic": True, "rating": 5.0,
             "image_url": "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80"},
            {"name": "NPK 12-32-16 Fertilizer", "category": "fertilizers", "description": "Phosphorus-rich complex fertilizer ideal for root crops and legumes. Apply as basal at sowing time.", "price": 1380, "unit": "50 kg bag", "stock_quantity": 350, "location": "Bhopal, Madhya Pradesh", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80"},
            {"name": "Neem Cake Organic Fertilizer", "category": "fertilizers", "description": "Cold-pressed neem cake powder rich in Azadirachtin. Acts as soil conditioner and natural pest deterrent.", "price": 28, "unit": "kg", "stock_quantity": 5000, "location": "Indore, Madhya Pradesh", "is_organic": True, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&q=80"},

            # ── PESTICIDES (4) ──
            {"name": "Neem-Based Bio Pesticide (Azadirachtin 1500 ppm)", "category": "pesticides", "description": "Botanical insecticide from neem seed extract. Controls 200+ pests including whitefly, aphids, and thrips. Safe for beneficial insects.", "price": 580, "unit": "1 litre", "stock_quantity": 300, "location": "Pune, Maharashtra", "is_organic": True, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&q=80"},
            {"name": "Imidacloprid 17.8% SL Insecticide", "category": "pesticides", "description": "Systemic insecticide for sucking pest control in cotton, paddy and vegetables. Long residual activity.", "price": 420, "unit": "250 ml", "stock_quantity": 500, "location": "Karnal, Haryana", "is_organic": False, "rating": 4.5,
             "image_url": "https://images.unsplash.com/photo-1563910791-1484b3567cef?w=600&q=80"},
            {"name": "Mancozeb 75% WP Fungicide", "category": "pesticides", "description": "Broad-spectrum contact fungicide for early blight, late blight, downy mildew and leaf spot diseases.", "price": 350, "unit": "500g packet", "stock_quantity": 450, "location": "Jaipur, Rajasthan", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1598512752271-33f913a5af13?w=600&q=80"},
            {"name": "Organic Crop Protection Kit", "category": "pesticides", "description": "Complete organic pest management kit: Neem oil, Trichoderma, Pseudomonas, and yellow sticky traps.", "price": 1250, "unit": "kit", "stock_quantity": 150, "location": "New Delhi", "is_organic": True, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&q=80"},

            # ── FARMING TOOLS (5) ──
            {"name": "16L Battery Operated Knapsack Sprayer", "category": "farming-tools", "description": "Dual motor rechargeable farm sprayer with adjustable brass nozzles. 6-8 hours battery life per charge.", "price": 2850, "unit": "piece", "stock_quantity": 40, "location": "New Delhi", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?w=600&q=80"},
            {"name": "Manual Seed Drill (5-Row)", "category": "farming-tools", "description": "Lightweight 5-row manual seed drill for precise seed placement. Adjustable seed rate for wheat, mustard, gram.", "price": 4500, "unit": "piece", "stock_quantity": 25, "location": "Ludhiana, Punjab", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80"},
            {"name": "Soil Testing Kit (Professional)", "category": "farming-tools", "description": "Complete soil NPK, pH, EC testing kit with reagents and digital meter. Includes 50 test strips.", "price": 1850, "unit": "kit", "stock_quantity": 60, "location": "Lucknow, Uttar Pradesh", "is_organic": False, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&q=80"},
            {"name": "Hand Weeder (3-Prong Steel)", "category": "farming-tools", "description": "Ergonomic hardened steel hand weeder for precision weed removal. Rubber grip handle for comfort.", "price": 280, "unit": "piece", "stock_quantity": 200, "location": "Nagpur, Maharashtra", "is_organic": False, "rating": 4.5,
             "image_url": "https://images.unsplash.com/photo-1416453072034-c8dbfa2856b5?w=600&q=80"},
            {"name": "Pruning Secateur (Bypass Type)", "category": "farming-tools", "description": "Japanese steel bypass pruner for clean cuts on live stems. Ideal for fruit orchards and vegetable gardens.", "price": 650, "unit": "piece", "stock_quantity": 100, "location": "Pune, Maharashtra", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600&q=80"},

            # ── IRRIGATION EQUIPMENT (4) ──
            {"name": "Drip Irrigation Kit (1/4 Acre)", "category": "irrigation", "description": "Complete drip irrigation system for 1/4 acre: mainline, sub-main, laterals, emitters, filter, connectors.", "price": 8500, "unit": "kit", "stock_quantity": 30, "location": "Jaipur, Rajasthan", "is_organic": False, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1557234195-bd9f290f0e4d?w=600&q=80"},
            {"name": "Sprinkler Irrigation Set (Rain Gun)", "category": "irrigation", "description": "360-degree rain gun sprinkler with 30m throw radius. Includes tripod stand, hose coupling.", "price": 3500, "unit": "set", "stock_quantity": 35, "location": "Karnal, Haryana", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80"},
            {"name": "Submersible Water Pump (1 HP)", "category": "irrigation", "description": "Single phase 1 HP submersible pump for borewell irrigation. Energy efficient motor with thermal overload protection.", "price": 6800, "unit": "piece", "stock_quantity": 20, "location": "Ludhiana, Punjab", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=600&q=80"},
            {"name": "PVC Irrigation Pipe (6 inch, 20ft)", "category": "irrigation", "description": "Heavy-duty agricultural PVC pipe, ISI marked. UV-resistant for exposed installations.", "price": 550, "unit": "20 ft pipe", "stock_quantity": 500, "location": "Kanpur, Uttar Pradesh", "is_organic": False, "rating": 4.5,
             "image_url": "https://images.unsplash.com/photo-1581092160607-ee67df4e6fbe?w=600&q=80"},

            # ── ORGANIC PRODUCTS (4) ──
            {"name": "Sharbati Golden Wheat (100% Organic)", "category": "organic", "description": "A-Grade MP Sharbati wheat grown naturally without synthetic pesticides. Naturally sweet taste and high gluten.", "price": 55, "unit": "kg", "stock_quantity": 5000, "location": "Indore, Madhya Pradesh", "is_organic": True, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=600&q=80"},
            {"name": "Desi Chana (Organic Brown Chickpeas)", "category": "organic", "description": "Protein-rich unpolished indigenous chickpeas. Sun-dried, chemical-free and hand-sorted.", "price": 88, "unit": "kg", "stock_quantity": 1200, "location": "Nagpur, Maharashtra", "is_organic": True, "rating": 4.9,
             "image_url": "https://images.unsplash.com/photo-1515543904379-3d757afe72e6?w=600&q=80"},
            {"name": "Cold-Pressed Mustard Oil (Wood Churned)", "category": "organic", "description": "Traditional wood-pressed kachi ghani mustard oil. No chemicals, no heat processing. Rich pungent aroma.", "price": 220, "unit": "litre", "stock_quantity": 500, "location": "Jaipur, Rajasthan", "is_organic": True, "rating": 5.0,
             "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87d5?w=600&q=80"},
            {"name": "Organic Jaggery (Gur) Block", "category": "organic", "description": "Pure sugarcane jaggery made in traditional iron pan process. No sulphur or chemicals added.", "price": 65, "unit": "kg", "stock_quantity": 800, "location": "Kanpur, Uttar Pradesh", "is_organic": True, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=600&q=80"},

            # ── FARM MACHINERY (4) ──
            {"name": "Power Weeder (Petrol 2HP)", "category": "machinery", "description": "Compact 2HP petrol power weeder with adjustable tilling width. Perfect for inter-row cultivation in small farms.", "price": 28000, "unit": "piece", "stock_quantity": 10, "location": "Ludhiana, Punjab", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1592805144716-feeccccef5ac?w=600&q=80"},
            {"name": "Mini Tiller / Cultivator (5HP Diesel)", "category": "machinery", "description": "Versatile 5HP diesel mini tiller for primary tillage, seed bed preparation. Attachments: plough, rotavator, ridger.", "price": 52000, "unit": "piece", "stock_quantity": 5, "location": "Bhopal, Madhya Pradesh", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1589923188651-268a9765e432?w=600&q=80"},
            {"name": "Agricultural Brush Cutter (4-Stroke)", "category": "machinery", "description": "Heavy-duty 4-stroke brush cutter for weed clearing, grass cutting, and farm maintenance. Low vibration handle.", "price": 12500, "unit": "piece", "stock_quantity": 15, "location": "Nashik, Maharashtra", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80"},
            {"name": "Chaff Cutter (Electric 3HP)", "category": "machinery", "description": "High-capacity electric chaff cutter for fodder preparation. Cuts green and dry fodder into uniform lengths.", "price": 18500, "unit": "piece", "stock_quantity": 8, "location": "Karnal, Haryana", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80"},

            # ── CROP PROTECTION (4) ──
            {"name": "Trichoderma Viride Bio-Agent", "category": "crop-protection", "description": "Biological control agent for soil-borne fungal diseases like root rot, wilt, and damping off. CFU >2x10⁸/g.", "price": 180, "unit": "1 kg packet", "stock_quantity": 300, "location": "Pune, Maharashtra", "is_organic": True, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=80"},
            {"name": "Yellow Sticky Traps (Pack of 50)", "category": "crop-protection", "description": "Double-sided adhesive traps for monitoring and mass trapping of whiteflies, aphids, and thrips.", "price": 320, "unit": "pack of 50", "stock_quantity": 400, "location": "New Delhi", "is_organic": True, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&q=80"},
            {"name": "Pheromone Trap (Helicoverpa Kit)", "category": "crop-protection", "description": "Funnel-type pheromone trap with lures for cotton bollworm and tomato fruit borer monitoring. Pack of 5.", "price": 750, "unit": "kit of 5", "stock_quantity": 200, "location": "Nagpur, Maharashtra", "is_organic": True, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&q=80"},
            {"name": "Copper Oxychloride 50% WP Fungicide", "category": "crop-protection", "description": "Contact fungicide for downy mildew, late blight and bacterial leaf spot. Safe for organic integration.", "price": 280, "unit": "500g packet", "stock_quantity": 350, "location": "Indore, Madhya Pradesh", "is_organic": False, "rating": 4.5,
             "image_url": "https://images.unsplash.com/photo-1595351298020-038700609878?w=600&q=80"},

            # ── ANIMAL & FARM SUPPLIES (4) ──
            {"name": "Cattle Feed Concentrate (Premium)", "category": "farm-supplies", "description": "Balanced dairy cattle feed with 20% crude protein. Fortified with minerals, vitamins and bypass fat.", "price": 1200, "unit": "50 kg bag", "stock_quantity": 200, "location": "Karnal, Haryana", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80"},
            {"name": "Mineral Mixture for Livestock", "category": "farm-supplies", "description": "Chelated mineral mixture with calcium, phosphorus, zinc, copper. Prevents deficiency diseases in cattle.", "price": 450, "unit": "5 kg pack", "stock_quantity": 300, "location": "Lucknow, Uttar Pradesh", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80"},
            {"name": "Poultry Layer Feed (Premium)", "category": "farm-supplies", "description": "Complete layer poultry feed with optimal amino acid profile for maximum egg production and shell quality.", "price": 1450, "unit": "50 kg bag", "stock_quantity": 150, "location": "Nashik, Maharashtra", "is_organic": False, "rating": 4.5,
             "image_url": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&q=80"},
            {"name": "Silage Wrap Film (750mm)", "category": "farm-supplies", "description": "UV-stabilized silage stretch wrap film for bale wrapping. Ensures anaerobic fermentation for quality silage.", "price": 2200, "unit": "roll", "stock_quantity": 80, "location": "Ludhiana, Punjab", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80"},

            # ── AGRICULTURAL ACCESSORIES (3) ──
            {"name": "Shade Net (50% Green, 4x50m)", "category": "accessories", "description": "HDPE knitted shade net for nursery, polyhouse and outdoor crop protection. UV-stabilized for 5+ years.", "price": 2800, "unit": "roll", "stock_quantity": 50, "location": "Pune, Maharashtra", "is_organic": False, "rating": 4.7,
             "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&q=80"},
            {"name": "Mulch Film (Black, 1m x 400m)", "category": "accessories", "description": "25-micron black mulch film for weed suppression and soil moisture retention. Biodegradable option available.", "price": 1800, "unit": "roll", "stock_quantity": 60, "location": "Nashik, Maharashtra", "is_organic": False, "rating": 4.6,
             "image_url": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80"},
            {"name": "Grow Bags (15x15 inch, Pack of 10)", "category": "accessories", "description": "Heavy-duty UV-treated grow bags for terrace farming and nursery. Excellent drainage with reinforced handles.", "price": 650, "unit": "pack of 10", "stock_quantity": 200, "location": "New Delhi", "is_organic": False, "rating": 4.8,
             "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80"},
        ]

        # Idempotent insert — skip existing products by name
        seeded_count = 0
        for p_data in all_products:
            existing_product = db.query(Product).filter(Product.name == p_data["name"]).first()
            if existing_product:
                # Update image_url if missing on existing product
                if not existing_product.image_url and p_data.get("image_url"):
                    existing_product.image_url = p_data["image_url"]
                continue

            cat_slug = p_data.pop("category")
            cat_obj = cat_map.get(cat_slug)
            if not cat_obj:
                continue

            product = Product(
                seller_id=seller.id,
                category_id=cat_obj.id,
                image_url=p_data.pop("image_url", None),
                status="APPROVED",
                **p_data,
            )
            db.add(product)
            seeded_count += 1
        db.commit()

        # Also ensure existing products (old seed data) have images
        products_without_images = db.query(Product).filter(
            (Product.image_url == None) | (Product.image_url == "")
        ).all()
        fallback_images = {
            "Grains & Cereals": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80",
            "Organic Pulses & Legumes": "https://images.unsplash.com/photo-1515543904379-3d757afe72e6?w=600&q=80",
            "Fresh Vegetables & Fruits": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80",
            "Certified Seeds": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
            "Bio-Fertilizers & Nutrients": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&q=80",
            "Farming Equipment & Tools": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80",
        }
        default_fallback = "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80"
        for p in products_without_images:
            cat_name = p.category.name if p.category else ""
            p.image_url = fallback_images.get(cat_name, default_fallback)
        db.commit()

        if seeded_count > 0:
            print(f"Seeded {seeded_count} new marketplace products with images.")

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

        # ==================== LOCATION HIERARCHY SEEDING (ALL 36 STATES & UTs) ====================
        from app.data.all_india_districts import ALL_INDIA_DISTRICTS
        from app.data.all_india_mandis import ALL_INDIA_LOCATIONS

        # Step 1: Ensure all 36 States/UTs and all 786+ districts from authoritative LGD/Census directory exist
        state_cache = {}
        for state_name, district_list in ALL_INDIA_DISTRICTS.items():
            state_obj = db.query(State).filter(State.name.ilike(state_name)).first()
            if not state_obj:
                state_obj = State(
                    name=state_name,
                    code=state_name[:2].upper(),
                    data_source="Census of India / Local Government Directory (LGD)",
                    is_active=True
                )
                db.add(state_obj)
                db.flush()
            else:
                if not state_obj.data_source:
                    state_obj.data_source = "Census of India / Local Government Directory (LGD)"
            state_cache[state_name.lower()] = state_obj

            for dist_name in district_list:
                dist_obj = db.query(District).filter(
                    District.state_id == state_obj.id,
                    District.name.ilike(dist_name)
                ).first()
                if not dist_obj:
                    dist_obj = District(
                        state_id=state_obj.id,
                        name=dist_name,
                        data_source="Local Government Directory (LGD)",
                        is_active=True
                    )
                    db.add(dist_obj)
                else:
                    if not dist_obj.data_source:
                        dist_obj.data_source = "Local Government Directory (LGD)"
        db.commit()

        # Step 2: Seed verified agricultural mandis across all states and districts
        # Cache existing crops by name lowercase for fast lookup
        existing_crops = {c.name.lower(): c for c in db.query(Crop).all()}

        for loc_data in ALL_INDIA_LOCATIONS:
            state_name = loc_data["state"]
            state_code = loc_data.get("code")

            # Find or create State
            state_obj = db.query(State).filter(
                (State.name.ilike(state_name)) | (State.code == state_code)
            ).first()
            if not state_obj:
                state_obj = State(
                    name=state_name,
                    code=state_code,
                    data_source="AGMARKNET / Directorate of Marketing & Inspection",
                    is_active=True
                )
                db.add(state_obj)
                db.flush()
            else:
                if state_code and not state_obj.code:
                    state_obj.code = state_code
                if not state_obj.data_source:
                    state_obj.data_source = "AGMARKNET / Directorate of Marketing & Inspection"

            for dist_data in loc_data.get("districts", []):
                dist_name = dist_data["name"]
                dist_obj = db.query(District).filter(
                    District.state_id == state_obj.id,
                    District.name.ilike(dist_name)
                ).first()
                if not dist_obj:
                    dist_obj = District(
                        state_id=state_obj.id,
                        name=dist_name,
                        data_source="Local Government Directory (LGD)",
                        is_active=True
                    )
                    db.add(dist_obj)
                    db.flush()

                for mandi_data in dist_data.get("mandis", []):
                    mandi_name = mandi_data["name"]
                    mandi_obj = db.query(Mandi).filter(
                        Mandi.district_id == dist_obj.id,
                        Mandi.name.ilike(mandi_name)
                    ).first()

                    if not mandi_obj:
                        mandi_obj = Mandi(
                            district_id=dist_obj.id,
                            name=mandi_name,
                            address=mandi_data.get("address"),
                            pincode=mandi_data.get("pincode"),
                            latitude=mandi_data.get("latitude"),
                            longitude=mandi_data.get("longitude"),
                            contact_number=mandi_data.get("contact_number"),
                            opening_time=mandi_data.get("opening_time"),
                            closing_time=mandi_data.get("closing_time"),
                            mandi_type=mandi_data.get("mandi_type", "APMC Mandi"),
                            is_verified=True,
                            verification_status="Verified",
                            data_source=mandi_data.get("data_source", "AGMARKNET / Directorate of Marketing & Inspection"),
                            is_active=True
                        )
                        db.add(mandi_obj)
                        db.flush()
                    else:
                        # Update coordinates and verified metadata
                        if mandi_data.get("latitude"):
                            mandi_obj.latitude = mandi_data["latitude"]
                        if mandi_data.get("longitude"):
                            mandi_obj.longitude = mandi_data["longitude"]
                        if mandi_data.get("address"):
                            mandi_obj.address = mandi_data["address"]
                        if mandi_data.get("pincode"):
                            mandi_obj.pincode = mandi_data["pincode"]
                        if mandi_data.get("contact_number"):
                            mandi_obj.contact_number = mandi_data["contact_number"]
                        if mandi_data.get("opening_time"):
                            mandi_obj.opening_time = mandi_data["opening_time"]
                        if mandi_data.get("closing_time"):
                            mandi_obj.closing_time = mandi_data["closing_time"]
                        if mandi_data.get("mandi_type"):
                            mandi_obj.mandi_type = mandi_data["mandi_type"]
                        mandi_obj.is_verified = True
                        mandi_obj.verification_status = "Verified"
                        if not mandi_obj.data_source:
                            mandi_obj.data_source = mandi_data.get("data_source", "AGMARKNET / Directorate of Marketing & Inspection")

                    # Associate crops and seed real/baseline AGMARKNET market prices
                    for crop_info in mandi_data.get("crops", []):
                        crop_name = crop_info["crop_name"]
                        crop_obj = existing_crops.get(crop_name.lower())
                        if not crop_obj:
                            crop_obj = Crop(
                                name=crop_name,
                                category="General",
                                season="Year-round",
                                is_active=True
                            )
                            db.add(crop_obj)
                            db.flush()
                            existing_crops[crop_name.lower()] = crop_obj

                        # MandiCrop association
                        mc = db.query(MandiCrop).filter(
                            MandiCrop.mandi_id == mandi_obj.id,
                            MandiCrop.crop_id == crop_obj.id
                        ).first()
                        if not mc:
                            db.add(MandiCrop(mandi_id=mandi_obj.id, crop_id=crop_obj.id))

                        # Check or create MarketPrice
                        today = datetime.date.today()
                        existing_price = db.query(MarketPrice).filter(
                            MarketPrice.mandi_id == mandi_obj.id,
                            MarketPrice.crop_name == crop_name
                        ).first()

                        if not existing_price:
                            min_p = crop_info.get("min_price", 1500)
                            max_p = crop_info.get("max_price", 2200)
                            modal_p = crop_info.get("modal_price", 1850)
                            db.add(MarketPrice(
                                mandi_id=mandi_obj.id,
                                crop_id=crop_obj.id,
                                crop_name=crop_name,
                                variety=crop_info.get("variety", "Standard"),
                                market_name=mandi_obj.name,
                                district=dist_obj.name,
                                state=state_obj.name,
                                min_price=min_p,
                                max_price=max_p,
                                modal_price=modal_p,
                                unit=crop_info.get("unit", "₹/Quintal"),
                                trend=crop_info.get("trend", "STABLE"),
                                price_date=today,
                                fetched_at=datetime.datetime.utcnow(),
                                data_source="AGMARKNET / Directorate of Marketing & Inspection",
                                change_percent=round((modal_p - (min_p + max_p) / 2) / max_p * 100, 1) if max_p else 0.0,
                                is_active=True
                            ))

        db.commit()
        print("All India Location hierarchy (36 States/UTs, Districts, Mandis, Verified Coordinates & Prices) seeded successfully.")


    finally:
        if auto_close:
            db.close()

if __name__ == "__main__":
    seed_database()
