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

  const [autoApply, setAutoApply] = useState(true);
  const [appliedManualPromotions, setAppliedManualPromotions] = useState([]);
  const [evaluatedData, setEvaluatedData] = useState({
    items: [],
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    appliedPromotions: [],
    availableOffers: []
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCustomer = localStorage.getItem('customer');
    const savedOrderId = localStorage.getItem('orderId');
    const savedCoupon = localStorage.getItem('coupon');
    const savedAutoApply = localStorage.getItem('autoApply');
    
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

    if (savedAutoApply !== null) {
      setAutoApply(savedAutoApply === 'true');
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

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('autoApply', autoApply ? 'true' : 'false');
    }
  }, [autoApply, isHydrated]);

  // Evaluate promotions with backend API
  const fetchEvaluation = async () => {
    if (cart.length === 0) {
      setEvaluatedData({
        items: [],
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        appliedPromotions: [],
        availableOffers: []
      });
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const payload = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          variantId: item.variantId || null,
          notes: item.notes || null
        })),
        couponCode: coupon ? coupon.code : null,
        customer: customer || null,
        autoApply,
        appliedManualPromotions
      };

      const response = await fetch(`${API_URL}/promotions/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluatedData(data);
      }
    } catch (error) {
      console.error("Failed to evaluate promotions:", error);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      fetchEvaluation();
    }
  }, [cart, coupon, customer, autoApply, appliedManualPromotions, isHydrated]);

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
    setCustomer(order.customerName ? {
      id: order.customerId,
      name: order.customerName,
      email: order.customerEmail,
      mobile: order.customerMobile,
      phone: order.customerMobile
    } : null);

    if (order.discountCode) {
      setCoupon({
        code: order.discountCode,
        discount: Number(order.discountAmount),
        type: 'PERCENTAGE' // Evaluator handles precise totals
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
        tax: 0
      };
    });

    setCart(loadedCart);
    
    // Extract applied manual promotion ids if recorded
    if (order.appliedPromotions) {
      try {
        const list = typeof order.appliedPromotions === 'string'
          ? JSON.parse(order.appliedPromotions)
          : order.appliedPromotions;
        if (Array.isArray(list)) {
          setAppliedManualPromotions(list.map(p => p.promotionId).filter(Boolean));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setOrderId(null);
    setCoupon(null);
    setAppliedManualPromotions([]);
    localStorage.removeItem('cart');
    localStorage.removeItem('customer');
    localStorage.removeItem('orderId');
    localStorage.removeItem('coupon');
  };

  const applyManualPromotion = (id) => {
    setAppliedManualPromotions(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const clearManualPromotions = () => {
    setAppliedManualPromotions([]);
  };

  // New action: Add a combo (multiple products) to the cart atomically
  const addCombo = (comboId, comboProducts) => {
    // comboProducts is expected to be an array of objects { product, variant? }
    setCart(prevCart => {
      // We'll copy existing cart and add each product using the existing addItem logic for consistency.
      let updatedCart = [...prevCart];
      comboProducts.forEach(item => {
        const product = item.product;
        const variant = item.variant || null;
        // Reuse the same logic as addItem to generate a unique cartItemId and merge quantities.
        const itemId = variant ? `${product.id}-${variant.id}` : product.id;
        const existing = updatedCart.find(it => it.cartItemId === itemId);
        if (existing) {
          updatedCart = updatedCart.map(it =>
            it.cartItemId === itemId ? { ...it, quantity: it.quantity + 1 } : it
          );
        } else {
          updatedCart.push({
            ...product,
            cartItemId: itemId,
            id: product.id,
            price: variant ? Number(product.price) + Number(variant.extraPrice) : Number(product.price),
            variantId: variant ? variant.id : null,
            variantName: variant ? variant.name : null,
            quantity: 1,
            notes: ''
          });
        }
      });
      return updatedCart;
    });
  };

  // New action: Add a combo as a single cart entry with its combo price
  const addComboItem = (comboId, comboName, comboPrice) => {
    const comboProduct = {
      id: `combo-${comboId}`,
      name: comboName,
      price: Number(comboPrice),
      imageUrl: null,
      category: { name: 'Combo' },
      isCombo: true
    };
    // Reuse addItem to insert the combo product
    addItem(comboProduct, null);
  };

  return (
    <CartContext.Provider value={{
      addCombo,
      addComboItem,
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
      setOrderId,
      // Promotions Engine Context
      autoApply,
      setAutoApply,
      appliedManualPromotions,
      evaluatedData,
      applyManualPromotion,
      clearManualPromotions,
      fetchEvaluation
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
