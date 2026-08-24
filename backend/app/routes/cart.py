from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.marketplace import Cart, CartItem, Product
from app.schemas.marketplace import CartOut, CartItemCreate, CartItemOut, ProductOut

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

def get_or_create_cart(user_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

@router.get("", response_model=CartOut)
def get_user_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_cart(current_user.id, db)
    items_out = []
    total = 0.0
    for item in cart.items:
        p = item.product
        if p:
            subtotal = p.price * item.quantity
            total += subtotal
            prod_out = ProductOut(
                id=p.id,
                seller_id=p.seller_id,
                seller_name=p.seller.full_name if p.seller else "Seller",
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
            items_out.append(CartItemOut(
                id=item.id,
                product_id=item.product_id,
                product=prod_out,
                quantity=item.quantity,
                subtotal=round(subtotal, 2)
            ))
    return CartOut(id=cart.id, items=items_out, total_amount=round(total, 2))

@router.post("/items", response_model=CartOut)
def add_to_cart(
    req: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == req.product_id, Product.is_available == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not available.")
        
    cart = get_or_create_cart(current_user.id, db)
    existing_item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == req.product_id).first()
    
    if existing_item:
        existing_item.quantity += req.quantity
    else:
        new_item = CartItem(cart_id=cart.id, product_id=req.product_id, quantity=req.quantity)
        db.add(new_item)
    db.commit()
    return get_user_cart(current_user, db)

@router.delete("/items/{item_id}", response_model=CartOut)
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    db.delete(item)
    db.commit()
    return get_user_cart(current_user, db)

@router.delete("", response_model=CartOut)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user.id, db)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    return get_user_cart(current_user, db)
