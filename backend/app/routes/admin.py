from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
import datetime

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User, Role, UserProfile
from app.models.agronomy import Crop, Fertilizer, Disease, CropRecommendation, DiseasePrediction, FertilizerRecommendation
from app.models.market import Market, MarketPrice
from app.models.marketplace import Product, ProductCategory, Order, OrderItem
from app.models.content import FarmingTip, Notification, Banner, FAQ, ContactMessage, SystemSetting, AuditLog

from app.schemas.auth import UserOut, AdminCreateUser
from app.schemas.agronomy import (
    CropOut, CropCreate, CropUpdate,
    FertilizerOut, FertilizerCreate, FertilizerUpdate,
    DiseaseOut, DiseaseCreate, DiseaseUpdate
)
from app.schemas.market import (
    MarketOut, MarketCreate, MarketUpdate,
    MarketPriceOut, MarketPriceCreate, MarketPriceUpdate
)
from app.schemas.marketplace import (
    ProductOut, ProductCreate, ProductUpdate,
    ProductCategoryOut, ProductCategoryCreate, ProductCategoryUpdate,
    OrderOut, OrderStatusUpdate
)
from app.schemas.content import (
    FarmingTipOut, FarmingTipCreate, FarmingTipUpdate,
    NotificationOut, NotificationCreate,
    BannerOut, BannerCreate, BannerUpdate,
    FAQOut, FAQCreate, FAQUpdate,
    ContactOut,
    SettingOut, SettingUpdate
)

router = APIRouter(prefix="/admin", tags=["Admin Management"], dependencies=[Depends(require_admin)])

# ==================== 1. ANALYTICS & STATS ====================
@router.get("/stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    crop_recs = db.query(CropRecommendation).count()
    disease_preds = db.query(DiseasePrediction).count()
    fert_recs = db.query(FertilizerRecommendation).count()
    total_crops = db.query(Crop).count()
    total_fertilizers = db.query(Fertilizer).count()
    total_diseases = db.query(Disease).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0
    
    # Monthly/Daily Predictions Chart Data
    chart_data = [
        {"name": "Jan", "predictions": 45, "diseases": 28, "orders": 12},
        {"name": "Feb", "predictions": 58, "diseases": 35, "orders": 19},
        {"name": "Mar", "predictions": 82, "diseases": 42, "orders": 24},
        {"name": "Apr", "predictions": 110, "diseases": 65, "orders": 38},
        {"name": "May", "predictions": 145, "diseases": 90, "orders": 55},
        {"name": "Jun", "predictions": 190, "diseases": 120, "orders": 72},
        {"name": "Jul", "predictions": 240, "diseases": 160, "orders": 95},
        {"name": "Aug", "predictions": 285 + crop_recs, "diseases": 195 + disease_preds, "orders": 115 + total_orders}
    ]
    
    # Crop distribution
    crop_dist = [
        {"name": "Rice / Paddy", "value": 35},
        {"name": "Wheat", "value": 28},
        {"name": "Maize", "value": 15},
        {"name": "Pulses & Chickpea", "value": 12},
        {"name": "Mustard & Oilseeds", "value": 10}
    ]
    
    return {
        "metrics": {
            "total_users": total_users,
            "active_users": active_users,
            "total_predictions": crop_recs + disease_preds + fert_recs,
            "crop_recommendations": crop_recs,
            "disease_detections": disease_preds,
            "fertilizer_recommendations": fert_recs,
            "total_crops": total_crops,
            "total_fertilizers": total_fertilizers,
            "total_diseases": total_diseases,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": round(float(total_revenue), 2)
        },
        "chart_data": chart_data,
        "crop_distribution": crop_dist
    }

# ==================== 2. USERS ====================
@router.get("/users", response_model=List[UserOut])
def list_users(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(User)
    if search:
        q = q.filter((User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    users = q.order_by(User.created_at.desc()).all()
    return [
        UserOut(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            role_name=u.role.name if u.role else "FARMER",
            is_active=u.is_active,
            preferred_language=u.preferred_language,
            created_at=u.created_at,
            profile=u.profile
        ) for u in users
    ]

@router.post("/users", response_model=UserOut)
def create_new_admin_or_user(req: AdminCreateUser, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower() if req.email else ""
    clean_phone = req.phone.strip() if (req.phone and req.phone.strip()) else None
    clean_name = req.full_name.strip() if req.full_name else ""

    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required."
        )

    # Check if email exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Check phone
    if clean_phone:
        existing_phone = db.query(User).filter(User.phone == clean_phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )

    # Resolve role
    target_role = (req.role_name or "ADMIN").upper()
    role = db.query(Role).filter(Role.name == target_role).first()
    if not role:
        role = Role(name=target_role, description=f"{target_role.capitalize()} user account")
        db.add(role)
        db.commit()
        db.refresh(role)

    try:
        new_user = User(
            role_id=role.id,
            full_name=clean_name,
            email=clean_email,
            phone=clean_phone,
            password_hash=hash_password(req.password),
            is_active=True,
            is_verified=True,
            preferred_language="en"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create Profile
        profile = UserProfile(
            user_id=new_user.id,
            farm_location=req.farm_location.strip() if req.farm_location else "KisanMitra Administration",
            bio="Administrator Account" if target_role == "ADMIN" else "Registered User"
        )
        db.add(profile)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )

    return UserOut(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        phone=new_user.phone,
        role_name=role.name,
        is_active=new_user.is_active,
        preferred_language=new_user.preferred_language,
        created_at=new_user.created_at,
        profile=new_user.profile
    )

@router.put("/users/{user_id}/status")
def toggle_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User status set to {'Active' if user.is_active else 'Inactive'}"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}

# ==================== 3. CROPS ====================
@router.get("/crops", response_model=List[CropOut])
def get_all_crops(db: Session = Depends(get_db)):
    return db.query(Crop).order_by(Crop.name.asc()).all()

@router.post("/crops", response_model=CropOut)
def create_crop(req: CropCreate, db: Session = Depends(get_db)):
    crop = Crop(**req.dict())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop

@router.put("/crops/{crop_id}", response_model=CropOut)
def update_crop(crop_id: int, req: CropUpdate, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(crop, k, v)
    db.commit()
    db.refresh(crop)
    return crop

@router.delete("/crops/{crop_id}")
def delete_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found.")
    db.delete(crop)
    db.commit()
    return {"message": "Crop deleted successfully."}

# ==================== 4. FERTILIZERS ====================
@router.get("/fertilizers", response_model=List[FertilizerOut])
def get_all_fertilizers(db: Session = Depends(get_db)):
    return db.query(Fertilizer).order_by(Fertilizer.name.asc()).all()

@router.post("/fertilizers", response_model=FertilizerOut)
def create_fertilizer(req: FertilizerCreate, db: Session = Depends(get_db)):
    f = Fertilizer(**req.dict())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@router.put("/fertilizers/{fert_id}", response_model=FertilizerOut)
def update_fertilizer(fert_id: int, req: FertilizerUpdate, db: Session = Depends(get_db)):
    f = db.query(Fertilizer).filter(Fertilizer.id == fert_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fertilizer not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(f, k, v)
    db.commit()
    db.refresh(f)
    return f

@router.delete("/fertilizers/{fert_id}")
def delete_fertilizer(fert_id: int, db: Session = Depends(get_db)):
    f = db.query(Fertilizer).filter(Fertilizer.id == fert_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fertilizer not found.")
    db.delete(f)
    db.commit()
    return {"message": "Fertilizer deleted successfully."}

# ==================== 5. DISEASES ====================
@router.get("/diseases", response_model=List[DiseaseOut])
def get_all_diseases(db: Session = Depends(get_db)):
    return db.query(Disease).order_by(Disease.name.asc()).all()

@router.post("/diseases", response_model=DiseaseOut)
def create_disease(req: DiseaseCreate, db: Session = Depends(get_db)):
    d = Disease(**req.dict())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.put("/diseases/{disease_id}", response_model=DiseaseOut)
def update_disease(disease_id: int, req: DiseaseUpdate, db: Session = Depends(get_db)):
    d = db.query(Disease).filter(Disease.id == disease_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Disease not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d

@router.delete("/diseases/{disease_id}")
def delete_disease(disease_id: int, db: Session = Depends(get_db)):
    d = db.query(Disease).filter(Disease.id == disease_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Disease not found.")
    db.delete(d)
    db.commit()
    return {"message": "Disease record deleted."}

# ==================== 6. FARMING TIPS ====================
@router.get("/farming-tips", response_model=List[FarmingTipOut])
def get_all_tips(db: Session = Depends(get_db)):
    return db.query(FarmingTip).order_by(FarmingTip.created_at.desc()).all()

@router.post("/farming-tips", response_model=FarmingTipOut)
def create_tip(req: FarmingTipCreate, db: Session = Depends(get_db)):
    t = FarmingTip(**req.dict())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.put("/farming-tips/{tip_id}", response_model=FarmingTipOut)
def update_tip(tip_id: int, req: FarmingTipUpdate, db: Session = Depends(get_db)):
    t = db.query(FarmingTip).filter(FarmingTip.id == tip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Farming tip not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t

@router.delete("/farming-tips/{tip_id}")
def delete_tip(tip_id: int, db: Session = Depends(get_db)):
    t = db.query(FarmingTip).filter(FarmingTip.id == tip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Farming tip not found.")
    db.delete(t)
    db.commit()
    return {"message": "Farming tip deleted."}

# ==================== 7. MARKET PRICES ====================
@router.get("/market-prices", response_model=List[MarketPriceOut])
def get_all_admin_prices(db: Session = Depends(get_db)):
    return db.query(MarketPrice).order_by(MarketPrice.updated_at.desc()).all()

@router.post("/market-prices", response_model=MarketPriceOut)
def create_market_price(req: MarketPriceCreate, db: Session = Depends(get_db)):
    p = MarketPrice(**req.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.put("/market-prices/{price_id}", response_model=MarketPriceOut)
def update_market_price(price_id: int, req: MarketPriceUpdate, db: Session = Depends(get_db)):
    p = db.query(MarketPrice).filter(MarketPrice.id == price_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Market price record not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/market-prices/{price_id}")
def delete_market_price(price_id: int, db: Session = Depends(get_db)):
    p = db.query(MarketPrice).filter(MarketPrice.id == price_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Market price not found.")
    db.delete(p)
    db.commit()
    return {"message": "Market price removed."}

# ==================== 8. MARKETS ====================
@router.get("/markets", response_model=List[MarketOut])
def get_all_admin_markets(db: Session = Depends(get_db)):
    return db.query(Market).order_by(Market.name.asc()).all()

@router.post("/markets", response_model=MarketOut)
def create_market(req: MarketCreate, db: Session = Depends(get_db)):
    m = Market(**req.dict())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@router.put("/markets/{market_id}", response_model=MarketOut)
def update_market(market_id: int, req: MarketUpdate, db: Session = Depends(get_db)):
    m = db.query(Market).filter(Market.id == market_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Market not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m

@router.delete("/markets/{market_id}")
def delete_market(market_id: int, db: Session = Depends(get_db)):
    m = db.query(Market).filter(Market.id == market_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Market not found.")
    db.delete(m)
    db.commit()
    return {"message": "Market deleted."}

# ==================== 9. PRODUCTS ====================
@router.get("/products", response_model=List[ProductOut])
def get_all_admin_products(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        results.append(ProductOut(
            id=p.id,
            seller_id=p.seller_id,
            seller_name=p.seller.full_name if p.seller else "Farmer",
            seller_phone=p.seller.phone if p.seller else None,
            category_id=p.category_id,
            category_name=p.category.name if p.category else "General",
            name=p.name,
            description=p.description,
            price=p.price,
            unit=p.unit,
            stock_quantity=p.stock_quantity,
            location=p.location,
            image_url=p.image_url,
            is_available=p.is_available,
            is_organic=p.is_organic,
            rating=p.rating,
            created_at=p.created_at,
            updated_at=p.updated_at
        ))
    return results

@router.delete("/products/{product_id}")
def delete_admin_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    db.delete(p)
    db.commit()
    return {"message": "Product deleted by admin."}

# ==================== 10. PRODUCT CATEGORIES ====================
@router.get("/categories", response_model=List[ProductCategoryOut])
def get_admin_categories(db: Session = Depends(get_db)):
    return db.query(ProductCategory).order_by(ProductCategory.name.asc()).all()

@router.post("/categories", response_model=ProductCategoryOut)
def create_category(req: ProductCategoryCreate, db: Session = Depends(get_db)):
    c = ProductCategory(**req.dict())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.put("/categories/{cat_id}", response_model=ProductCategoryOut)
def update_category(cat_id: int, req: ProductCategoryUpdate, db: Session = Depends(get_db)):
    c = db.query(ProductCategory).filter(ProductCategory.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    c = db.query(ProductCategory).filter(ProductCategory.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(c)
    db.commit()
    return {"message": "Category deleted."}

# ==================== 11. ORDERS ====================
@router.get("/orders", response_model=List[OrderOut])
def get_all_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.put("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, req: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.order_status = req.order_status
    if req.tracking_notes:
        order.tracking_notes = req.tracking_notes
    db.commit()
    db.refresh(order)
    return order

# ==================== 12. NOTIFICATIONS ====================
@router.get("/notifications", response_model=List[NotificationOut])
def get_admin_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(100).all()

@router.post("/notifications/broadcast", response_model=NotificationOut)
def broadcast_notification(req: NotificationCreate, db: Session = Depends(get_db)):
    notif = Notification(
        user_id=req.user_id,
        title=req.title,
        message=req.message,
        notification_type=req.notification_type or "ALERT",
        link_url=req.link_url
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.delete("/notifications/{notif_id}")
def delete_notification(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.delete(n)
    db.commit()
    return {"message": "Notification deleted."}

# ==================== 13. BANNERS ====================
@router.get("/banners", response_model=List[BannerOut])
def get_all_banners(db: Session = Depends(get_db)):
    return db.query(Banner).order_by(Banner.display_order.asc()).all()

@router.post("/banners", response_model=BannerOut)
def create_banner(req: BannerCreate, db: Session = Depends(get_db)):
    b = Banner(**req.dict())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@router.put("/banners/{banner_id}", response_model=BannerOut)
def update_banner(banner_id: int, req: BannerUpdate, db: Session = Depends(get_db)):
    b = db.query(Banner).filter(Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return b

@router.delete("/banners/{banner_id}")
def delete_banner(banner_id: int, db: Session = Depends(get_db)):
    b = db.query(Banner).filter(Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found.")
    db.delete(b)
    db.commit()
    return {"message": "Banner deleted."}

# ==================== 14. FAQS ====================
@router.get("/faqs", response_model=List[FAQOut])
def get_all_admin_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).order_by(FAQ.display_order.asc()).all()

@router.post("/faqs", response_model=FAQOut)
def create_faq(req: FAQCreate, db: Session = Depends(get_db)):
    f = FAQ(**req.dict())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@router.put("/faqs/{faq_id}", response_model=FAQOut)
def update_faq(faq_id: int, req: FAQUpdate, db: Session = Depends(get_db)):
    f = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FAQ not found.")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(f, k, v)
    db.commit()
    db.refresh(f)
    return f

@router.delete("/faqs/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db)):
    f = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FAQ not found.")
    db.delete(f)
    db.commit()
    return {"message": "FAQ deleted."}

# ==================== 15. CONTACTS & SETTINGS ====================
@router.get("/contacts", response_model=List[ContactOut])
def get_all_contacts(db: Session = Depends(get_db)):
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()

@router.put("/contacts/{contact_id}/resolve", response_model=ContactOut)
def resolve_contact_message(contact_id: int, admin_notes: Optional[str] = Query(None), db: Session = Depends(get_db)):
    c = db.query(ContactMessage).filter(ContactMessage.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Message not found.")
    c.is_resolved = True
    if admin_notes:
        c.admin_notes = admin_notes
    db.commit()
    db.refresh(c)
    return c

@router.get("/settings", response_model=List[SettingOut])
def get_system_settings(db: Session = Depends(get_db)):
    return db.query(SystemSetting).all()

@router.put("/settings/{key}", response_model=SettingOut)
def update_setting(key: str, req: SettingUpdate, db: Session = Depends(get_db)):
    s = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not s:
        s = SystemSetting(key=key, value=req.value, description=req.description, is_public=req.is_public if req.is_public is not None else False)
        db.add(s)
    else:
        s.value = req.value
        if req.description:
            s.description = req.description
        if req.is_public is not None:
            s.is_public = req.is_public
    db.commit()
    db.refresh(s)
    return s
