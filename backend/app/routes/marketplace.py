from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.user import User
from app.models.marketplace import Product, ProductCategory
from app.schemas.marketplace import (
    ProductOut, ProductCreate, ProductUpdate,
    ProductCategoryOut
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

@router.get("/categories", response_model=List[ProductCategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(ProductCategory).filter(ProductCategory.is_active == True).all()

@router.get("/products", response_model=List[ProductOut])
def get_products(
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    is_organic: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_available == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if is_organic is not None:
        query = query.filter(Product.is_organic == is_organic)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.description.ilike(f"%{search}%")) |
            (Product.location.ilike(f"%{search}%"))
        )
        
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())
        
    products = query.limit(100).all()
    
    results = []
    for p in products:
        results.append(ProductOut(
            id=p.id,
            seller_id=p.seller_id,
            seller_name=p.seller.full_name if p.seller else "Farmer Seller",
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

@router.get("/products/{product_id}", response_model=ProductOut)
def get_single_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return ProductOut(
        id=p.id,
        seller_id=p.seller_id,
        seller_name=p.seller.full_name if p.seller else "Farmer Seller",
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
    )

@router.post("/products", response_model=ProductOut)
def create_farmer_product(
    req: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = Product(
        seller_id=current_user.id,
        category_id=req.category_id,
        name=req.name,
        description=req.description,
        price=req.price,
        unit=req.unit or "kg",
        stock_quantity=req.stock_quantity or 100.0,
        location=req.location or (current_user.profile.farm_location if current_user.profile else "India"),
        image_url=req.image_url,
        is_available=req.is_available if req.is_available is not None else True,
        is_organic=req.is_organic if req.is_organic is not None else False
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return ProductOut(
        id=product.id,
        seller_id=product.seller_id,
        seller_name=current_user.full_name,
        seller_phone=current_user.phone,
        category_id=product.category_id,
        category_name=product.category.name if product.category else "General",
        name=product.name,
        description=product.description,
        price=product.price,
        unit=product.unit,
        stock_quantity=product.stock_quantity,
        location=product.location,
        image_url=product.image_url,
        is_available=product.is_available,
        is_organic=product.is_organic,
        rating=product.rating,
        created_at=product.created_at,
        updated_at=product.updated_at
    )

@router.get("/my-products", response_model=List[ProductOut])
def get_my_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.seller_id == current_user.id).order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        results.append(ProductOut(
            id=p.id,
            seller_id=p.seller_id,
            seller_name=current_user.full_name,
            seller_phone=current_user.phone,
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

@router.put("/products/{product_id}", response_model=ProductOut)
def update_farmer_product(
    product_id: int,
    req: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    if p.seller_id != current_user.id and (not current_user.role or current_user.role.name != "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to modify this product.")
        
    for k, v in req.dict(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return ProductOut(
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
    )

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
        raise HTTPException(status_code=403, detail="Not authorized to delete this product.")
    db.delete(p)
    db.commit()
    return {"message": "Product removed successfully."}
