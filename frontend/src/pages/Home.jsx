// frontend/src/pages/Home.jsx
import React from 'react';

function Home() {
  // Temporary fake products until your teammate builds the Inventory API
  const mockProducts = [
    { id: 1, name: "Fresh Apples", price: 150.00, image: "🍎" },
    { id: 2, name: "Whole Milk", price: 300.00, image: "🥛" },
    { id: 3, name: "Brown Bread", price: 200.00, image: "🍞" },
  ];

  const handleAddToCart = async (productId) => {
    // This connects directly to the FastAPI endpoint you just wrote!
    try {
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      const data = await response.json();
      alert(data.message); // A simple popup confirming it worked
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Welcome to Ransara Supermarket</h2>
      <p>Select your items to add them to your cart.</p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {mockProducts.map(product => (
          <div key={product.id} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>{product.image}</div>
            <h3>{product.name}</h3>
            <p>Rs. {product.price.toFixed(2)}</p>
            <button 
              onClick={() => handleAddToCart(product.id)}
              style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;