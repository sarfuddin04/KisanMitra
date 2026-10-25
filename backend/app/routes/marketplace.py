import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.config import settings
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

# ── HELPERS FOR PERMISSION & IMAGE STORAGE ─────────────────────────

ALLOWED_PRODUCT_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def _check_product_permission(product: Product, current_user: User):
    """Ensure user is either the product's seller or an Admin."""
    is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
    if product.seller_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this product or its images."
        )


def _save_product_image_file(file: UploadFile, content: bytes) -> str:
    """Validate and write uploaded image to storage/products/ directory."""
    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_PRODUCT_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{content_type}'. Please upload JPG, JPEG, PNG, or WebP."
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded image file is empty.")
    if len(content) > MAX_PRODUCT_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size ({len(content) // 1024} KB) exceeds the 5 MB limit."
        )

    ext_map = {"image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map.get(content_type, "jpg")

    products_dir = os.path.join(settings.UPLOAD_DIR, "products")
    os.makedirs(products_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(products_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return f"/api/static/products/{filename}"


def _remove_local_file_safe(image_url: str, db: Session):
    """Safely delete stored local image file if not referenced by any other product."""
    if not image_url or not image_url.startswith("/api/static/"):
        return

    # Check if another product or image is still using this URL
    in_use_p = db.query(Product).filter(Product.image_url == image_url).count()
    in_use_img = db.query(ProductImage).filter(ProductImage.image_url == image_url).count()
    if in_use_p > 0 or in_use_img > 0:
        return

    relative_path = image_url.replace("/api/static/", "", 1).strip()
    file_path = os.path.join(settings.UPLOAD_DIR, relative_path)
    abs_upload = os.path.abspath(settings.UPLOAD_DIR)
    abs_file = os.path.abspath(file_path)

    if abs_file.startswith(abs_upload) and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass


# ── AUTHENTICATED endpoints ─────────────────────────────────────

@router.post("/products")
def create_farmer_product(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a product listing (authenticated farmer or admin)."""
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

    raw_images = req.get("images") or []
    parsed_images = []
    for idx, item in enumerate(raw_images):
        if isinstance(item, dict):
            url = item.get("image_url") or item.get("url")
            is_prim = bool(item.get("is_primary", False))
            order = item.get("display_order", idx)
        else:
            url = str(item) if item else None
            is_prim = (idx == 0)
            order = idx
        if url:
            parsed_images.append({"url": url, "is_primary": is_prim, "order": order})

    primary_img_url = req.get("image_url")
    if not primary_img_url and parsed_images:
        for pi in parsed_images:
            if pi["is_primary"]:
                primary_img_url = pi["url"]
                break
        if not primary_img_url:
            primary_img_url = parsed_images[0]["url"]

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
        image_url=primary_img_url,
        is_available=req.get("is_available", True),
        is_organic=req.get("is_organic", False),
        status="APPROVED" if (current_user.role and current_user.role.name == "ADMIN") else "PENDING",
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Sync multiple images
    if parsed_images:
        for pi in parsed_images:
            is_prim = pi["is_primary"] or (pi["url"] == primary_img_url)
            img = ProductImage(
                product_id=product.id,
                image_url=pi["url"],
                is_primary=is_prim,
                display_order=pi["order"],
            )
            db.add(img)
        db.commit()
    elif primary_img_url:
        db.add(ProductImage(
            product_id=product.id,
            image_url=primary_img_url,
            is_primary=True,
            display_order=0,
        ))
        db.commit()

    db.refresh(product)
    return _product_to_dict(product)


@router.get("/my-products")
def get_my_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all products created by the authenticated farmer."""
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
    """Update product information with strict ownership check."""
    p = db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(p, current_user)

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

    # Sync images list if provided
    if "images" in req and isinstance(req["images"], list):
        parsed_images = []
        for idx, item in enumerate(req["images"]):
            if isinstance(item, dict):
                url = item.get("image_url") or item.get("url")
                is_prim = bool(item.get("is_primary", False))
                order = item.get("display_order", idx)
            else:
                url = str(item) if item else None
                is_prim = (idx == 0)
                order = idx
            if url:
                parsed_images.append({"url": url, "is_primary": is_prim, "order": order})

        current_images = {img.image_url: img for img in p.images}
        new_urls = {pi["url"] for pi in parsed_images}

        # Remove deleted images
        for url, img_obj in list(current_images.items()):
            if url not in new_urls:
                db.delete(img_obj)

        # Add or reorder
        for pi in parsed_images:
            url = pi["url"]
            is_prim = pi["is_primary"] or (url == p.image_url)
            if url in current_images:
                current_images[url].display_order = pi["order"]
                current_images[url].is_primary = is_prim
            else:
                db.add(ProductImage(
                    product_id=p.id,
                    image_url=url,
                    is_primary=is_prim,
                    display_order=pi["order"]
                ))

        if parsed_images and not p.image_url:
            p.image_url = parsed_images[0]["url"]

    # Ensure Product.image_url is mirrored in ProductImage primary flag
    if p.image_url:
        db.query(ProductImage).filter(ProductImage.product_id == p.id).update({"is_primary": False})
        primary_match = db.query(ProductImage).filter(
            ProductImage.product_id == p.id,
            ProductImage.image_url == p.image_url
        ).first()
        if primary_match:
            primary_match.is_primary = True
        else:
            db.add(ProductImage(
                product_id=p.id,
                image_url=p.image_url,
                is_primary=True,
                display_order=0
            ))

    db.commit()
    db.refresh(p)
    return _product_to_dict(p)


@router.delete("/products/{product_id}")
def delete_farmer_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product listing with ownership check."""
    p = db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(p, current_user)

    # Collect images to safely remove files if not shared
    images_to_check = [img.image_url for img in p.images]
    if p.image_url and p.image_url not in images_to_check:
        images_to_check.append(p.image_url)

    db.delete(p)
    db.commit()

    for url in images_to_check:
        _remove_local_file_safe(url, db)

    return {"message": "Product removed successfully.", "id": product_id}


# ── COMPLETE PRODUCT IMAGE MANAGEMENT ENDPOINTS ─────────────────

@router.get("/products/{product_id}/images")
def get_product_images(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get all gallery images for a product sorted by primary and display order."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    images = db.query(ProductImage).filter(
        ProductImage.product_id == product_id
    ).order_by(ProductImage.is_primary.desc(), ProductImage.display_order.asc(), ProductImage.id.asc()).all()

    return [
        {
            "id": img.id,
            "product_id": img.product_id,
            "image_url": img.image_url,
            "is_primary": img.is_primary,
            "display_order": img.display_order,
            "created_at": img.created_at,
        }
        for img in images
    ]


@router.post("/products/{product_id}/images/upload")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new product image file from device (Farmer owner or Admin)."""
    product = db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(product, current_user)

    content = await file.read()
    image_url = _save_product_image_file(file, content)

    # If first image or marked as primary, make it primary
    existing_count = len(product.images)
    should_be_primary = is_primary or (existing_count == 0) or (not product.image_url)

    if should_be_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product.id).update({"is_primary": False})
        product.image_url = image_url

    new_img = ProductImage(
        product_id=product.id,
        image_url=image_url,
        is_primary=should_be_primary,
        display_order=existing_count
    )
    db.add(new_img)
    db.commit()
    db.refresh(new_img)
    db.refresh(product)

    return {
        "message": "Product image uploaded successfully.",
        "image": {
            "id": new_img.id,
            "product_id": new_img.product_id,
            "image_url": new_img.image_url,
            "is_primary": new_img.is_primary,
            "display_order": new_img.display_order,
            "created_at": new_img.created_at,
        },
        "product": _product_to_dict(product)
    }


@router.post("/products/{product_id}/images")
def add_product_image_url(
    product_id: int,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Associate an already uploaded or external image URL with the product."""
    product = db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(product, current_user)

    image_url = req.get("image_url", "").strip()
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url is required.")

    is_primary = bool(req.get("is_primary", False))
    existing_count = len(product.images)
    should_be_primary = is_primary or (existing_count == 0) or (not product.image_url)

    if should_be_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product.id).update({"is_primary": False})
        product.image_url = image_url

    new_img = ProductImage(
        product_id=product.id,
        image_url=image_url,
        is_primary=should_be_primary,
        display_order=existing_count
    )
    db.add(new_img)
    db.commit()
    db.refresh(new_img)
    db.refresh(product)

    return {
        "message": "Image added to product.",
        "image": {
            "id": new_img.id,
            "product_id": new_img.product_id,
            "image_url": new_img.image_url,
            "is_primary": new_img.is_primary,
            "display_order": new_img.display_order,
        },
        "product": _product_to_dict(product)
    }


@router.put("/products/{product_id}/images/{image_id}/primary")
def set_primary_product_image(
    product_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Designate an image as the primary marketplace display image."""
    product = db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(product, current_user)

    target_img = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id
    ).first()
    if not target_img:
        raise HTTPException(status_code=404, detail="Image not found on this product.")

    # Demote all images
    db.query(ProductImage).filter(ProductImage.product_id == product_id).update({"is_primary": False})
    # Promote target
    target_img.is_primary = True
    product.image_url = target_img.image_url

    db.commit()
    db.refresh(product)
    return {
        "message": "Primary product image updated.",
        "primary_image_url": product.image_url,
        "product": _product_to_dict(product)
    }


@router.put("/products/{product_id}/images/reorder")
def reorder_product_images(
    product_id: int,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder multiple product images via a list of image IDs."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(product, current_user)

    image_ids = req.get("image_ids", [])
    for order, img_id in enumerate(image_ids):
        db.query(ProductImage).filter(
            ProductImage.id == img_id,
            ProductImage.product_id == product_id
        ).update({"display_order": order})

    db.commit()
    return get_product_images(product_id=product_id, db=db)


@router.put("/products/{product_id}/images/{image_id}/replace")
async def replace_product_image(
    product_id: int,
    image_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Replace an existing product image with a new uploaded file."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(product, current_user)

    target_img = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id
    ).first()
    if not target_img:
        raise HTTPException(status_code=404, detail="Image to replace not found.")

    old_url = target_img.image_url
    content = await file.read()
    new_url = _save_product_image_file(file, content)

    # Update database
    target_img.image_url = new_url
    if target_img.is_primary or product.image_url == old_url:
        product.image_url = new_url

    db.commit()
    db.refresh(target_img)
    db.refresh(product)

    # Safely clean up old file if not referenced elsewhere
    _remove_local_file_safe(old_url, db)

    return {
        "message": "Product image replaced successfully.",
        "image": {
            "id": target_img.id,
            "product_id": target_img.product_id,
            "image_url": target_img.image_url,
            "is_primary": target_img.is_primary,
        },
        "product": _product_to_dict(product)
    }


@router.delete("/products/{product_id}/images/{image_id}")
def delete_product_image(
    product_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an image from a product with ownership/admin check."""
    product = db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    _check_product_permission(product, current_user)

    target_img = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id
    ).first()
    if not target_img:
        raise HTTPException(status_code=404, detail="Image not found.")

    was_primary = target_img.is_primary
    old_url = target_img.image_url

    db.delete(target_img)
    db.flush()

    # If deleted image was primary, promote next remaining image
    if was_primary or product.image_url == old_url:
        remaining = db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).order_by(ProductImage.display_order.asc(), ProductImage.id.asc()).first()

        if remaining:
            remaining.is_primary = True
            product.image_url = remaining.image_url
        else:
            product.image_url = None

    db.commit()
    db.refresh(product)

    # Clean up storage file if safe
    _remove_local_file_safe(old_url, db)

    return {
        "message": "Image deleted successfully.",
        "product": _product_to_dict(product)
    }

