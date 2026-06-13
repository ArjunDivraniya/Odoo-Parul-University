"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, CreditCard, User, Edit2, Package, ChefHat } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import CustomerModal from "@/components/pos/CustomerModal";

export default function CartPage() {
  const { cart, addItem, decreaseQuantity, removeItem, clearCart, customer, setCustomer } = useCartStore();
  const [selectedTable, setSelectedTable] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    if (!customer || !customer.name || !customer.email || !customer.mobile) {
      alert("Please add customer details (Name, Email, and Mobile) before sending to kitchen.");
      setIsCustomerModalOpen(true);
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

  useEffect(() => {
    const tableData = localStorage.getItem('selectedTable');
    if (tableData) {
      setSelectedTable(JSON.parse(tableData));
    }
  }, []);

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  const getTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = Number(item.price) * item.quantity;
      const tax = (itemTotal * (Number(item.tax) || 0)) / 100;
      return sum + tax;
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    localStorage.setItem('pendingOrder', JSON.stringify(cart));
    if (customer) localStorage.setItem('pendingCustomer', JSON.stringify(customer));
    window.location.href = '/pos/payment';
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
  const total = subtotal + tax;

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
          
          <h1 className="text-3xl font-bold text-[#1A4D2E]">Shopping Cart</h1>
          
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
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[2rem] p-6 shadow-md border border-[#E8F5E9] hover:shadow-lg transition-all"
                >
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-[#1A4D2E] mb-1">{item.name}</h3>
                            <p className="text-sm text-[#5F6F65]">
                              {item.category?.name || 'Uncategorized'}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-[#5F6F65] line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-[#FBFBF2] rounded-xl p-2 border border-[#E8F5E9]">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            className="h-10 w-10 hover:bg-white rounded-lg flex items-center justify-center transition-colors text-[#5F6F65]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-bold text-[#1A4D2E] text-lg">{item.quantity}</span>
                          <button
                            onClick={() => addItem(item)}
                            className="h-10 w-10 hover:bg-white rounded-lg flex items-center justify-center transition-colors text-[#5F6F65]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-[#5F6F65]">
                            ₹{Number(item.price).toFixed(2)} × {item.quantity}
                          </p>
                          <p className="text-2xl font-black text-[#1A4D2E]">
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

          {/* Right: Summary */}
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

            {/* Order Summary */}
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-[#E8F5E9] space-y-4">
              <h3 className="font-bold text-[#1A4D2E] text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Items ({cart.length})</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                
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

              <button
                onClick={handleCheckout}
                className="w-full bg-[#1A4D2E] text-white py-4 rounded-[2rem] font-bold text-lg hover:bg-[#143d24] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-6"
              >
                <CreditCard className="h-5 w-5" />
                Proceed to Payment
              </button>

              <button
                onClick={handleSendToKitchen}
                disabled={sending}
                className="w-full bg-[#F5A623] hover:bg-[#D48A14] disabled:bg-gray-300 text-white py-4 rounded-[2rem] font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-3"
              >
                <ChefHat className="h-5 w-5" />
                {sending ? "Sending..." : "Send to Kitchen"}
              </button>
            </div>

            {/* Table Info */}
            {selectedTable && (
              <div className="bg-[#E8F5E9] rounded-[2rem] p-4 border border-[#4ADE80]/30">
                <p className="text-sm text-[#5F6F65] mb-1">Table</p>
                <p className="font-bold text-[#1A4D2E] text-lg">{selectedTable.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
