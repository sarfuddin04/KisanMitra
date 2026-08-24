from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Category
class ProductCategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon_name: Optional[str] = "Sprout"
    is_active: Optional[bool] = True

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = None
    is_active: Optional[bool] = None

class ProductCategoryOut(ProductCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Product
class ProductBase(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    unit: Optional[str] = "kg"
    stock_quantity: Optional[float] = 100.0
    location: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = True
    is_organic: Optional[bool] = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    stock_quantity: Optional[float] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_organic: Optional[bool] = None

class ProductOut(ProductBase):
    id: int
    seller_id: int
    seller_name: Optional[str] = None
    seller_phone: Optional[str] = None
    category_name: Optional[str] = None
    rating: float = 4.8
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Cart
class CartItemCreate(BaseModel):
    product_id: int
    quantity: float = 1.0

class CartItemOut(BaseModel):
    id: int
    product_id: int
    product: ProductOut
    quantity: float
    subtotal: float

    class Config:
        from_attributes = True

class CartOut(BaseModel):
    id: int
    items: List[CartItemOut] = []
    total_amount: float = 0.0

# Order
class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    unit_price: float
    unit: str
    quantity: float
    subtotal: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    shipping_name: str
    shipping_address: str
    shipping_phone: str
    payment_method: Optional[str] = "Cash on Delivery / UPI"

class OrderStatusUpdate(BaseModel):
    order_status: str
    tracking_notes: Optional[str] = None

class OrderOut(BaseModel):
    id: int
    order_number: str
    user_id: int
    total_amount: float
    shipping_name: str
    shipping_address: str
    shipping_phone: str
    order_status: str
    payment_status: str
    payment_method: str
    tracking_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True
