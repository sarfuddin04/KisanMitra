import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    icon_name = Column(String(50), default="Sprout")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=False)
    name = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    unit = Column(String(50), default="kg")  # kg, quintal, bag, liter, piece, packet
    stock_quantity = Column(Float, default=100.0)
    location = Column(String(200), nullable=True)
    image_url = Column(String(255), nullable=True)
    is_available = Column(Boolean, default=True)
    is_organic = Column(Boolean, default=False)
    rating = Column(Float, default=4.8)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    seller = relationship("User", back_populates="products")
    category = relationship("ProductCategory", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    shipping_name = Column(String(120), nullable=False)
    shipping_address = Column(Text, nullable=False)
    shipping_phone = Column(String(50), nullable=False)
    order_status = Column(String(50), default="PLACED")  # PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    payment_status = Column(String(50), default="COMPLETED")  # PENDING, COMPLETED, FAILED, REFUNDED
    payment_method = Column(String(50), default="Cash on Delivery / UPI")
    tracking_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(150), nullable=False)
    unit_price = Column(Float, nullable=False)
    unit = Column(String(50), default="kg")
    quantity = Column(Float, default=1.0)
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="UPI / Direct Transfer")
    transaction_ref = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default="SUCCESS")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="payment")
