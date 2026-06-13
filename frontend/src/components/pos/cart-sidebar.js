"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Trash2, Minus, Plus, CreditCard, ChefHat, User, MapPin, Package, List } from "lucide-react";

export default function CartSidebar() {
  const { cart, removeItem, addItem, decreaseQuantity, clearCart, customer } = useCartStore();
  const [selectedTable, setSelectedTable] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const tableData = localStorage.getItem('selectedTable');
    if (tableData) {
      setSelectedTable(JSON.parse(tableData));
    }
  }, [cart]); // Refresh when cart changes to pick up table updates

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  const getTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = Number(item.price) * item.quantity;
      const tax = (itemTotal * (Number(item.tax) || 0)) / 100;
      return sum + tax;
    }, 0);
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!customer || !customer.name || !customer.email || !customer.mobile) {
      alert("Please add customer details (Name, Email, and Mobile) in the products page before proceeding.");
      return;
    }
    localStorage.setItem('pendingOrder', JSON.stringify(cart));
    if (customer) localStorage.setItem('pendingCustomer', JSON.stringify(customer));
    window.location.href = '/pos/payment';
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    if (!customer || !customer.name || !customer.email || !customer.mobile) {
      alert("Please add customer details (Name, Email, and Mobile) in the products page before sending to kitchen.");
      return;
    }
    setSending(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const session = JSON.parse(localStorage.getItem('activeSession') || '{}');

      if (!session || !session.id) {
        throw new Error("No active session found. Please start a session first.");
      }

      // Create Order with status SENT in one go
      const orderPayload = {
        sessionId: session.id,
        tableId: selectedTable?.id || undefined,
        status: 'SENT',
        type: selectedTable ? "DINE_IN" : "TAKEAWAY",
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        customer: customer || undefined
      };

      const orderResponse = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        throw new Error(`Failed to create order: ${errorData || orderResponse.statusText}`);
      }

      clearCart();
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('pendingCustomer');
      
      alert("Order sent to kitchen successfully!");
      window.location.href = '/pos/tables';
    } catch (error) {
      console.error('Send to kitchen error:', error);
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="w-[400px] bg-white border-l border-[#E8F5E9] flex flex-col h-full shadow-2xl relative z-10">
      {/* Header */}
      <div className="p-6 border-b border-[#E8F5E9] bg-[#FBFBF2]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-[#1A4D2E] tracking-tight">Current Order</h2>
          {cart.length > 0 && (
            <button 
              onClick={clearCart} 
              className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors border border-red-100"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Customer & Table Badges */}
        <div className="flex gap-2">
          {selectedTable ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F5E9] text-[#1A4D2E] text-xs font-bold border border-[#4ADE80]/20">
              <MapPin className="h-3.5 w-3.5" />
              <span>{selectedTable.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
              <Package className="h-3.5 w-3.5" />
              <span>Takeaway</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200">
            <User className="h-3.5 w-3.5" />
            <span>{customer?.name || "Walk-in"}</span>
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white scrollbar-thin scrollbar-thumb-[#1A4D2E]/10 scrollbar-track-transparent">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-20">
            <div className="h-20 w-20 bg-[#FBFBF2] rounded-full flex items-center justify-center mb-4 border border-[#E8F5E9]">
              <List className="h-10 w-10 text-[#5F6F65]" />
            </div>
            <p className="font-bold text-[#1A4D2E] text-lg">No items yet</p>
            <p className="text-sm text-[#5F6F65] max-w-[200px] mt-1">Select products from the menu to start taking orders.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 hover:bg-[#FBFBF2] rounded-[1.5rem] border border-transparent hover:border-[#E8F5E9] transition-all group">
              <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl overflow-hidden relative shrink-0 border border-[#E8F5E9]">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-50">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[#1A4D2E] truncate leading-tight pr-2">{item.name}</h4>
                    <p className="font-bold text-[#1A4D2E]">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-[#5F6F65] mt-0.5">
                    {item.category?.name || "Uncategorized"}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center bg-[#FBFBF2] border border-[#E8F5E9] rounded-full h-9 px-1">
                    <button 
                      onClick={() => decreaseQuantity(item.id)}
                      className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white text-[#5F6F65] transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold w-7 text-center text-[#1A4D2E]">{item.quantity}</span>
                    <button 
                      onClick={() => addItem(item)}
                      className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white text-[#5F6F65] transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Section */}
      <div className="p-6 bg-[#FBFBF2] border-t border-[#E8F5E9] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] space-y-4">
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm text-[#5F6F65]">
            <span>Subtotal</span>
            <span className="font-bold text-[#1A4D2E]">₹{subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm text-[#5F6F65]">
              <span>Tax</span>
              <span className="font-bold text-[#1A4D2E]">₹{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xl font-bold text-[#1A4D2E] pt-3 border-t border-[#E8F5E9] mt-2">
            <span>Total</span>
            <span className="text-2xl font-black text-[#1A4D2E]">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full h-14 bg-[#1A4D2E] text-white py-3 rounded-[2rem] font-bold text-lg hover:bg-[#143d24] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            Proceed to Payment
          </button>

          <button 
            onClick={handleSendToKitchen}
            disabled={sending || cart.length === 0}
            className="w-full h-14 bg-[#F5A623] hover:bg-[#D48A14] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-[2rem] font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <ChefHat className="h-5 w-5" />
            {sending ? "Sending..." : "Send to Kitchen"}
          </button>
        </div>
      </div>
    </aside>
  );
}
