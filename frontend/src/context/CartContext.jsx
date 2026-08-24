import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ id: 0, items: [], total_amount: 0.0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart({ id: 0, items: [], total_amount: 0.0 });
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      alert("Please login to add products to your cart.");
      return;
    }
    try {
      const res = await api.post('/cart/items', { product_id: productId, quantity });
      setCart(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to add to cart:", err);
      throw err;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      setCart(res.data);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.delete('/cart');
      setCart(res.data);
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  const totalItemsCount = cart.items ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
        clearCart,
        totalItemsCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
