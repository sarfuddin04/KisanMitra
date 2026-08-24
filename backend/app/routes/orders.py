import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.marketplace import Order, OrderItem, Cart, CartItem, Product, Payment
from app.models.content import Notification
from app.schemas.marketplace import OrderCreate, OrderOut, OrderItemOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderOut)
def create_order(
    req: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cannot place order with an empty cart.")
        
    order_num = f"KM-{uuid.uuid4().hex[:8].upper()}"
    total_amount = 0.0
    order_items_to_create = []
    
    for ci in cart.items:
        p = ci.product
        if p:
            subtotal = p.price * ci.quantity
            total_amount += subtotal
            order_items_to_create.append(OrderItem(
                product_id=p.id,
                product_name=p.name,
                unit_price=p.price,
                unit=p.unit,
                quantity=ci.quantity,
                subtotal=subtotal
            ))
            # Decrement stock
            p.stock_quantity = max(0.0, p.stock_quantity - ci.quantity)
            
    order = Order(
        order_number=order_num,
        user_id=current_user.id,
        total_amount=round(total_amount, 2),
        shipping_name=req.shipping_name,
        shipping_address=req.shipping_address,
        shipping_phone=req.shipping_phone,
        order_status="CONFIRMED",
        payment_status="COMPLETED",
        payment_method=req.payment_method or "Cash on Delivery / UPI",
        tracking_notes="Order confirmed. Processing farmer harvest and dispatch."
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    for oi in order_items_to_create:
        oi.order_id = order.id
        db.add(oi)
        
    # Mock Payment record
    payment = Payment(
        order_id=order.id,
        amount=order.total_amount,
        payment_method=order.payment_method,
        transaction_ref=f"TXN-{uuid.uuid4().hex[:10].upper()}",
        status="SUCCESS"
    )
    db.add(payment)
    
    # Send Notification to Farmer
    notif = Notification(
        user_id=current_user.id,
        title="🌾 Order Confirmed!",
        message=f"Your order #{order.order_number} for ₹{order.total_amount} has been placed successfully.",
        notification_type="ORDER",
        link_url="/orders"
    )
    db.add(notif)
    
    # Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)
    
    return order

@router.get("", response_model=List[OrderOut])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders

@router.get("/{order_id}", response_model=OrderOut)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.user_id != current_user.id and (not current_user.role or current_user.role.name != "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to view this order.")
    return order
