# backend/APIs/cart.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.cart import Cart, CartItem

router = APIRouter(
    prefix="/cart",
    tags=["Cart Management"]
)

# Pydantic schema to validate incoming frontend requests
class CartItemRequest(BaseModel):
    product_id: int
    quantity: int

# --- THE AUTHENTICATION BRIDGE ---
def get_current_user():
    """
    Placeholder dependency. 
    Right now, it just returns user_id = 1. 
    Later, your teammate will update this single function to decode a real JWT token 
    and fetch the real User object from the database!
    """
    return 1 
# ---------------------------------


@router.post("/add")
def add_to_cart(
    item: CartItemRequest, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user) # <-- Injected dynamically now!
):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == item.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item.quantity
    else:
        new_item = CartItem(cart_id=cart.id, product_id=item.product_id, quantity=item.quantity)
        db.add(new_item)
        
    db.commit()
    return {"status": "success", "message": "Item added to cart"}

@router.get("/")
def view_cart(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        return {"cart_id": None, "items": []}
        
    return {
        "cart_id": cart.id,
        "items": [{"product_id": i.product_id, "quantity": i.quantity} for i in cart.items]
    }

@router.put("/update")
def update_cart_item(item: CartItemRequest, db: Session = Depends(get_db)):
    user_id = 1 # Hardcoded for now
    
    # 1. Find the user's cart
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    # 2. Find the specific item
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == item.product_id
    ).first()
    
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    # 3. Update quantity or remove if 0
    if item.quantity <= 0:
        db.delete(existing_item)
        message = "Item removed from cart"
    else:
        existing_item.quantity = item.quantity
        message = "Item quantity updated"
        
    db.commit()
    return {"status": "success", "message": message}

@router.delete("/remove/{product_id}")
def remove_from_cart(product_id: int, db: Session = Depends(get_db)):
    user_id = 1 # Hardcoded for now
    
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == product_id
    ).first()
    
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    db.delete(existing_item)
    db.commit()
    
    return {"status": "success", "message": "Item completely removed from cart"}