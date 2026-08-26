from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.user import User
from app.models.marketplace import Product, ProductCategory, ProductImage
from app.models.market import State, District, Mandi

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


def _product_to_dict(p: Product) -> dict:
    """Convert Product ORM row to a rich dict with location + images."""
    primary_image = p.image_url
    images = []
    if hasattr(p, 'images') and p.images:
        for img in p.images:
            images.append({
                "id": img.id,
                "image_url": img.image_url,
                "is_primary": img.is_primary,
            })
            if img.is_primary:
                primary_image = img.image_url

    return {
        "id": p.id,
        "seller_id": p.seller_id,
        "seller_name": p.seller.full_name if p.seller else "Farmer Seller",
        "seller_phone": p.seller.phone if p.seller else None,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else "General",
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "unit": p.unit,
        "stock_quantity": p.stock_quantity,
        "location": p.location,
        "state_id": p.state_id,
        "state_name": p.state_name or (p.state.name if p.state else None),
        "district_id": p.district_id,
        "district_name": p.district_name or (p.district.name if p.district else None),
        "mandi_id": p.mandi_id,
        "mandi_name": p.mandi_name or (p.mandi.name if p.mandi else None),
        "image_url": primary_image,
        "images": images,
        "is_available": p.is_available,
        "is_organic": p.is_organic,
        "status": p.status,
        "rating": p.rating,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


# ── PUBLIC browse endpoints (no auth required) ─────────────────

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(ProductCategory).filter(ProductCategory.is_active == True).all()


@router.get("/products")
def get_products(
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    state_id: Optional[int] = Query(None),
    district_id: Optional[int] = Query(None),
    mandi_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_organic: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Public product listing — NO login required for browsing."""
    query = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category),
        joinedload(Product.images),
        joinedload(Product.state),
        joinedload(Product.district),
        joinedload(Product.mandi),
    ).filter(Product.is_available == True)

    # Only show approved products to public
    query = query.filter(Product.status.in_(["APPROVED", "PENDING"]))

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if state_id:
        query = query.filter(Product.state_id == state_id)
    if district_id:
        query = query.filter(Product.district_id == district_id)
    if mandi_id:
        query = query.filter(Product.mandi_id == mandi_id)
    if is_organic is not None:
        query = query.filter(Product.is_organic == is_organic)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") |
            Product.description.ilike(f"%{search}%") |
            Product.location.ilike(f"%{search}%") |
            Product.state_name.ilike(f"%{search}%") |
            Product.district_name.ilike(f"%{search}%") |
            Product.mandi_name.ilike(f"%{search}%")
        )

    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    products = query.limit(limit).all()
    return [_product_to_dict(p) for p in products]


@router.get("/products/{product_id}")
def get_single_product(product_id: int, db: Session = Depends(get_db)):
    """Public product detail — NO login required."""
    p = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category),
        joinedload(Product.images),
        joinedload(Product.state),
        joinedload(Product.district),
        joinedload(Product.mandi),
    ).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return _product_to_dict(p)


# ── AUTHENTICATED endpoints ─────────────────────────────────────

@router.post("/products")
def create_farmer_product(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a product listing (farmer must be logged in)."""
    # Resolve location names
    state_name = district_name = mandi_name = None
    if req.get("state_id"):
        s = db.query(State).filter(State.id == req["state_id"]).first()
        state_name = s.name if s else None
    if req.get("district_id"):
        d = db.query(District).filter(District.id == req["district_id"]).first()
        district_name = d.name if d else None
    if req.get("mandi_id"):
        m = db.query(Mandi).filter(Mandi.id == req["mandi_id"]).first()
        mandi_name = m.name if m else None

    product = Product(
        seller_id=current_user.id,
        category_id=req.get("category_id"),
        name=req.get("name"),
        description=req.get("description"),
        price=float(req.get("price", 0)),
        unit=req.get("unit", "kg"),
        stock_quantity=float(req.get("stock_quantity", 100)),
        location=req.get("location", ""),
        state_id=req.get("state_id"),
        district_id=req.get("district_id"),
        mandi_id=req.get("mandi_id"),
        state_name=state_name,
        district_name=district_name,
        mandi_name=mandi_name,
        image_url=req.get("image_url"),
        is_available=req.get("is_available", True),
        is_organic=req.get("is_organic", False),
        status="PENDING",
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Add product images
    if req.get("images"):
        for idx, img_url in enumerate(req["images"]):
            img = ProductImage(
                product_id=product.id,
                image_url=img_url,
                is_primary=(idx == 0),
                display_order=idx,
            )
            db.add(img)
        db.commit()

    return _product_to_dict(product)


@router.get("/my-products")
def get_my_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category),
        joinedload(Product.images),
    ).filter(Product.seller_id == current_user.id).order_by(Product.created_at.desc()).all()
    return [_product_to_dict(p) for p in products]


@router.put("/products/{product_id}")
def update_farmer_product(
    product_id: int,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    if p.seller_id != current_user.id and (not current_user.role or current_user.role.name != "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    updatable = [
        "name", "description", "price", "unit", "stock_quantity", "location",
        "image_url", "is_available", "is_organic", "category_id",
        "state_id", "district_id", "mandi_id",
    ]
    for k in updatable:
        if k in req:
            setattr(p, k, req[k])

    # Resolve location names
    if req.get("state_id"):
        s = db.query(State).filter(State.id == req["state_id"]).first()
        p.state_name = s.name if s else None
    if req.get("district_id"):
        d = db.query(District).filter(District.id == req["district_id"]).first()
        p.district_name = d.name if d else None
    if req.get("mandi_id"):
        m = db.query(Mandi).filter(Mandi.id == req["mandi_id"]).first()
        p.mandi_name = m.name if m else None

    db.commit()
    db.refresh(p)
    return _product_to_dict(p)


@router.delete("/products/{product_id}")
def delete_farmer_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    if p.seller_id != current_user.id and (not current_user.role or current_user.role.name != "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized.")
    db.delete(p)
    db.commit()
    return {"message": "Product removed successfully."}
