// frontend/src/app/pos/cart/page.js
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, CreditCard, User, Edit2, Package, Tag, Utensils, AlertCircle } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import CustomerModal from "@/components/pos/CustomerModal";
import { usePopup } from "@/context/PopupContext";

export default function CartPage() {
  const {
    cart,
    addItem,
    decreaseQuantity,
    removeItem,
    updateItemNotes,
    clearCart,
    customer,
    setCustomer,
    orderId,
    coupon,
    setCoupon
  } = useCartStore();

  const [selectedTable, setSelectedTable] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const { showToast, showAlert } = usePopup();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const tableData = localStorage.getItem('selectedTable');
    if (tableData) {
      setSelectedTable(JSON.parse(tableData));
    }
    if (coupon) {
      setCouponInput(coupon.code);
      setCouponSuccess(`Applied: ${coupon.code}`);
    }
  }, [coupon]);

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  const getTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = Number(item.price) * item.quantity;
      const taxRate = Number(item.tax) || 0;
      const tax = (itemTotal * taxRate) / 100;
      return sum + tax;
    }, 0);
  };

  const getDiscount = (subtotal) => {
    if (!coupon) return 0;
    if (coupon.type === 'PERCENTAGE') {
      return subtotal * (Number(coupon.discount) / 100);
    } else {
      return Math.min(subtotal, Number(coupon.discount));
    }
  };

  // Coupon Validation
  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/coupons/validate/${couponInput.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupon(data);
        setCouponSuccess(`Coupon code applied successfully!`);
      } else {
        const err = await response.json();
        setCouponError(err.error || "Invalid coupon code");
        setCoupon(null);
      }
    } catch (error) {
      console.error('Coupon validation failed:', error);
      setCouponError("Failed to validate coupon");
      setCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  // Send Order to Kitchen
  const handleSendToKitchen = async () => {
    if (sendingToKitchen || checkingOut) return;
    setSendingToKitchen(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const session = JSON.parse(localStorage.getItem('activeSession') || '{}');

      const payload = {
        id: orderId || undefined,
        tableId: selectedTable?.id || null,
        sessionId: session?.id || null,
        type: selectedTable ? "DINE_IN" : "TAKEAWAY",
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          variantId: item.variantId || null,
          notes: item.notes || null
        })),
        customer: customer || undefined,
        couponCode: coupon?.code || null,
        status: 'SENT'
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        clearCart();
        showToast("Order sent to kitchen successfully!", "success");
        window.location.href = '/pos/tables';
      } else {
        const err = await res.json();
        showAlert(err.error || "Failed to send order to kitchen", "Kitchen Error", "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("Error sending order to kitchen", "Kitchen Error", "error");
    } finally {
      setSendingToKitchen(false);
    }
  };

  // Proceed to Checkout
  const handleCheckout = async () => {
    if (sendingToKitchen || checkingOut) return;
    setCheckingOut(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const session = JSON.parse(localStorage.getItem('activeSession') || '{}');

      const payload = {
        id: orderId || undefined,
        tableId: selectedTable?.id || null,
        sessionId: session?.id || null,
        type: selectedTable ? "DINE_IN" : "TAKEAWAY",
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          variantId: item.variantId || null,
          notes: item.notes || null
        })),
        customer: customer || undefined,
        couponCode: coupon?.code || null,
        status: orderId ? undefined : 'SENT' // Keep status if editing, set SENT if creating new
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const order = await res.json();
        localStorage.setItem('payingOrderId', order.id);
        window.location.href = '/pos/payment';
      } else {
        const err = await res.json();
        showAlert(err.message || err.error || "Failed to checkout", "Checkout Failure", "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("Checkout error", "Checkout Error", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FBFBF2]">
        <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-[#E8F5E9] text-center max-w-md">
          <div className="h-24 w-24 bg-[#FBFBF2] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-[#5F6F65]" />
          </div>
          <h2 className="text-3xl font-bold text-[#1A4D2E] mb-4">Cart is Empty</h2>
          <p className="text-[#5F6F65] mb-8">Add some products to get started</p>
          <button
            onClick={() => window.location.href = '/pos/terminal'}
            className="px-8 py-4 bg-[#1A4D2E] text-white rounded-[2rem] font-bold hover:bg-[#143d24] transition-all shadow-lg hover:shadow-xl"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const subtotal = getCartSubtotal();
  const tax = getTax();
  const discount = getDiscount(subtotal);
  const total = subtotal + tax - discount;

  return (
    <div className="h-screen flex flex-col bg-[#FBFBF2]">
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={setCustomer}
        initialData={customer}
      />

      {/* Header */}
      <div className="bg-white border-b border-[#E8F5E9] p-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/pos/terminal'}
            className="flex items-center gap-2 text-[#5F6F65] hover:text-[#1A4D2E] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Products</span>
          </button>

          <h1 className="text-3xl font-black text-[#1A4D2E]">Shopping Cart</h1>

          <button
            onClick={() => clearCart()}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex gap-6 p-6">
          {/* Left: Cart Items */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white rounded-[2rem] p-6 shadow-md border border-[#E8F5E9] hover:shadow-lg transition-all"
                >
                  <div className="flex gap-6">
                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-[#1A4D2E] mb-1">{item.name}</h3>
                            <p className="text-sm text-[#5F6F65]">
                              {item.category?.name || 'Uncategorized'}
                              {item.variantName && ` • Option: ${item.variantName}`}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Special Instructions Input */}
                        <div className="mt-3">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6F65] mb-1">
                            👨‍🍳 Special Instructions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. No Onion, Extra Cheese, Ice level, etc."
                            value={item.notes || ""}
                            onChange={(e) => updateItemNotes(item.cartItemId, e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-[#1A4D2E] focus:outline-none bg-[#FBFBF2]/50 font-medium text-[#1A4D2E]"
                          />
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#FBFBF2]">
                        <div className="flex items-center gap-3 bg-[#FBFBF2] rounded-xl p-1.5 border border-[#E8F5E9]">
                          <button
                            onClick={() => decreaseQuantity(item.cartItemId)}
                            className="h-9 w-9 hover:bg-white rounded-lg flex items-center justify-center transition-colors text-[#5F6F65]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-[#1A4D2E] text-md">{item.quantity}</span>
                          <button
                            onClick={() => addItem(item, item.variantId ? { id: item.variantId, name: item.variantName, extraPrice: 0 } : null)}
                            className="h-9 w-9 hover:bg-white rounded-lg flex items-center justify-center transition-colors text-[#5F6F65]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[#5F6F65]">
                            ₹{Number(item.price).toFixed(2)} × {item.quantity}
                          </p>
                          <p className="text-xl font-black text-[#1A4D2E]">
                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary & Coupon */}
          <div className="w-96 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-[#E8F5E9]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A4D2E]">Customer</h3>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="p-2 hover:bg-[#FBFBF2] rounded-xl transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-[#5F6F65]" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${customer ? 'bg-[#E8F5E9] text-[#1A4D2E]' : 'bg-gray-100 text-gray-400'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A4D2E]">{customer?.name || 'Walk-in Customer'}</p>
                    {customer?.mobile && (
                      <p className="text-sm text-[#5F6F65]">{customer.mobile}</p>
                    )}
                  </div>
                </div>
                {customer?.email && (
                  <p className="text-sm text-[#5F6F65] pl-13">{customer.email}</p>
                )}
              </div>
            </div>

            {/* Coupons & Promo Codes */}
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-[#E8F5E9] space-y-3">
              <h3 className="font-bold text-[#1A4D2E] flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#1A4D2E]" />
                Promo / Coupon
              </h3>

              {!coupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. SAVE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2 border rounded-xl focus:border-[#1A4D2E] focus:outline-none uppercase font-bold text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponInput}
                    className="px-4 py-2 bg-[#1A4D2E] text-white rounded-xl font-bold hover:bg-[#143D24] text-sm disabled:opacity-50"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-[#E8F5E9] rounded-xl border border-[#4ADE80]/30 flex justify-between items-center">
                  <div>
                    <span className="font-black text-[#1A4D2E] text-sm">{coupon.code}</span>
                    <span className="text-xs text-[#5F6F65] ml-2">({coupon.type === 'PERCENTAGE' ? `${coupon.discount}%` : `₹${coupon.discount}`} off)</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="p-1 hover:bg-white rounded text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {couponError && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {couponError}</p>}
              {couponSuccess && <p className="text-xs text-emerald-600 font-bold">✓ {couponSuccess}</p>}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-[#E8F5E9] space-y-4">
              <h3 className="font-bold text-[#1A4D2E] text-lg mb-4">Order Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Items ({cart.length})</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>Tax</span>
                    <span className="font-semibold">₹{tax.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-[#E8F5E9] pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[#1A4D2E]">Total</span>
                    <span className="text-3xl font-black text-[#1A4D2E]">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {selectedTable && (
                  <button
                    onClick={handleSendToKitchen}
                    disabled={sendingToKitchen || checkingOut}
                    className="w-full bg-white text-[#1A4D2E] border-2 border-[#1A4D2E] py-3.5 rounded-[2rem] font-bold text-md hover:bg-[#E8F5E9] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Utensils className="h-5 w-5" />
                    {sendingToKitchen ? "Sending..." : "Send to Kitchen"}
                  </button>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={sendingToKitchen || checkingOut}
                  className="w-full bg-[#1A4D2E] text-white py-3.5 rounded-[2rem] font-bold text-md hover:bg-[#143d24] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5" />
                  {checkingOut ? "Processing..." : "Proceed to Payment"}
                </button>
              </div>
            </div>

            {/* Table Info */}
            {selectedTable && (
              <div className="bg-[#E8F5E9] rounded-[2rem] p-4 border border-[#4ADE80]/30 text-center">
                <p className="text-xs text-[#5F6F65] uppercase tracking-wider font-bold">Selected Table</p>
                <p className="font-black text-[#1A4D2E] text-xl mt-1">{selectedTable.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
