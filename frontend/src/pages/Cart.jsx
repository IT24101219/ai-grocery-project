// frontend/src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // This runs automatically when the page loads
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      // Calls your GET /cart/ endpoint
      const response = await fetch('http://localhost:8000/cart/');
      const data = await response.json();
      setCartItems(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      // Calls your POST /orders/checkout endpoint
      const response = await fetch('http://localhost:8000/orders/checkout', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert("Success! " + data.message + " Order ID: " + data.order_id);
        setCartItems([]); // Empty the cart on the screen
      } else {
        alert("Checkout failed: " + data.detail);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading cart...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Your Shopping Cart</h2>
      
      {cartItems.length === 0 ? (
        <p>Your cart is empty. Go add some groceries!</p>
      ) : (
        <div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {cartItems.map((item, index) => (
              <li key={index} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                <strong>Product ID:</strong> {item.product_id} <br />
                <strong>Quantity:</strong> {item.quantity}
              </li>
            ))}
          </ul>
          
          <button 
            onClick={handleCheckout}
            style={{ 
              marginTop: '20px', backgroundColor: '#FF9800', color: 'white', 
              padding: '12px 24px', border: 'none', borderRadius: '5px', 
              cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' 
            }}
          >
            💳 Pay & Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;