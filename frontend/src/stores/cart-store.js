// frontend/src/stores/cart-store.js
"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [coupon, setCoupon] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCustomer = localStorage.getItem('customer');
    const savedOrderId = localStorage.getItem('orderId');
    const savedCoupon = localStorage.getItem('coupon');
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
    
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {
        console.error('Failed to parse customer:', e);
      }
    }

    if (savedOrderId) {
      setOrderId(savedOrderId);
    }

    if (savedCoupon) {
      try {
        setCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        console.error('Failed to parse coupon:', e);
      }
    }
    
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever states change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      if (customer) {
        localStorage.setItem('customer', JSON.stringify(customer));
      } else {
        localStorage.removeItem('customer');
      }
    }
  }, [customer, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      if (orderId) {
        localStorage.setItem('orderId', orderId);
      } else {
        localStorage.removeItem('orderId');
      }
    }
  }, [orderId, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      if (coupon) {
        localStorage.setItem('coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('coupon');
      }
    }
  }, [coupon, isHydrated]);

  const addItem = (product, variant = null) => {
    setCart((prevCart) => {
      // Create a unique key for product + variant combination
      const itemId = variant ? `${product.id}-${variant.id}` : product.id;
      const existing = prevCart.find((item) => item.cartItemId === itemId);
      
      if (existing) {
        return prevCart.map((item) =>
          item.cartItemId === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      return [
        ...prevCart,
        {
          ...product,
          cartItemId: itemId,
          id: product.id, // Keep original product id
          price: variant ? Number(product.price) + Number(variant.extraPrice) : Number(product.price),
          variantId: variant ? variant.id : null,
          variantName: variant ? variant.name : null,
          quantity: 1,
          notes: ''
        }
      ];
    });
  };

  const removeItem = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const decreaseQuantity = (cartItemId) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.cartItemId === cartItemId);
      if (existing?.quantity === 1) {
        return prevCart.filter((item) => item.cartItemId !== cartItemId);
      }
      return prevCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const updateItemNotes = (cartItemId, notes) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, notes } : item
      )
    );
  };

  const loadOrder = (order) => {
    setOrderId(order.id);
    setCustomer(order.customerEmail ? {
      name: order.customerName,
      email: order.customerEmail,
      mobile: order.customerMobile
    } : null);

    if (order.discountCode) {
      setCoupon({
        code: order.discountCode,
        discount: Number(order.discountAmount),
        type: 'PERCENTAGE' // The exact calculation will be managed by total or loaded
      });
    } else {
      setCoupon(null);
    }

    const loadedCart = order.items.map(item => {
      const cartItemId = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
      return {
        cartItemId,
        id: item.productId,
        name: item.productName,
        price: Number(item.price),
        variantId: item.variantId,
        variantName: item.variantName,
        quantity: item.quantity,
        notes: item.notes || '',
        tax: 0 // Will load or compute from product if needed, or default
      };
    });

    setCart(loadedCart);
  };

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setOrderId(null);
    setCoupon(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('customer');
    localStorage.removeItem('orderId');
    localStorage.removeItem('coupon');
  };

  return (
    <CartContext.Provider value={{
      cart,
      customer,
      orderId,
      coupon,
      addItem,
      removeItem,
      decreaseQuantity,
      updateItemNotes,
      loadOrder,
      clearCart,
      setCustomer,
      setCoupon,
      setOrderId
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartStore = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartStore must be used within a CartProvider');
  }
  return context;
};
