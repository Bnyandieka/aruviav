import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    // Validate stock before adding
    if (!product.stock || product.stock <= 0) {
      console.warn('❌ Product out of stock:', product.name);
      return { success: false, error: 'Product is out of stock' };
    }

    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Check if adding another would exceed stock
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.stock) {
        console.warn(`❌ Cannot add more of ${product.name}. Available: ${product.stock}, Requested: ${newQuantity}`);
        return { success: false, error: `Only ${product.stock} ${product.name}(s) available in stock` };
      }
      
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    return { success: true };
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, change) => {
    setCartItems(cartItems.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        
        // Validate stock before updating
        if (newQuantity > 0 && item.stock && newQuantity > item.stock) {
          console.warn(`❌ Cannot increase quantity. Max available: ${item.stock}`);
          // Don't change quantity, return original item
          return item;
        }
        
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const restoreCart = useCallback((items) => {
    try {
      if (!items || !Array.isArray(items)) {
        console.warn('⚠️ restoreCart: items is not a valid array', items);
        return;
      }
      console.log('🔄 Restoring cart with', items.length, 'items:', items);
      setCartItems(items);
    } catch (err) {
      console.warn('Could not restore cart from session:', err.message);
    }
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      restoreCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};