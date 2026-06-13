"use client";

import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Smartphone, ArrowLeft, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useCartStore } from "@/stores/cart-store";
import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function POSPaymentPage() {
  const { cart, customer, clearCart, setCustomer } = useCartStore(); // Use store instead of local state for cart
  // We still need local state for payment method input
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);

  useEffect(() => {
    // Only check for valid session or redirect
    const activeSession = localStorage.getItem('activeSession');
    if (!activeSession) {
      window.location.href = '/pos/session';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    if (id) {
      setOrderId(id);
      fetchOrderDetails(id);
    }
  }, []);

  const fetchOrderDetails = async (id) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingOrder(data);
      } else {
        alert("Failed to load order details");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTotal = () => {
    if (existingOrder) {
      return Number(existingOrder.totalAmount);
    }
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  };

  const getChange = () => {
    const received = parseFloat(amountReceived) || 0;
    const total = getTotal();
    return Math.max(0, received - total);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const session = JSON.parse(localStorage.getItem('activeSession') || '{}');

      if (!session || !session.id) {
        throw new Error("No active session found. Please start a session from the Dashboard.");
      }

      let currentOrderId = orderId;

      if (!existingOrder) {
        // Step 1: Create Order
        const orderPayload = {
          sessionId: session.id,
          type: "DINE_IN",
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

        const order = await orderResponse.json();
        currentOrderId = order.id;
      }

      // Step 2: Process Payment
      const paymentPayload = {
        method: paymentMethod,
        amount: getTotal(),
        reference: paymentMethod === 'UPI' ? 'UPI_REF_' + Date.now() : undefined
      };

      const paymentResponse = await fetch(`${API_URL}/orders/${currentOrderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.text();
        throw new Error(`Failed to process payment: ${errorData || paymentResponse.statusText}`);
      }

      if (!existingOrder) {
        // Step 3: Update order status to SENT (so it appears in kitchen)
        await fetch(`${API_URL}/orders/${currentOrderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'SENT' })
        });

        // Clear cart and show success
        clearCart(); // Clear global store and localStorage
        
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('pendingCustomer');
      }
      
      setProcessing(false); // Stop loader
      setOrderComplete(true); // Show success

      // Redirect after 2 seconds
      setTimeout(() => {
        if (existingOrder) {
          window.location.href = '/pos/orders';
        } else {
          window.location.href = '/pos/tables';
        }
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      alert(error.message); // Show the specific error message
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FBFBF2]/90 backdrop-blur-sm fixed inset-0 z-50">
        <CoffeeLoader size="xl" text="Processing Payment..." />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#1A4D2E] to-[#143d24]">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-[#E8F5E9]">
          <div className="h-20 w-20 bg-[#4ADE80] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A4D2E] mb-2">Payment Successful!</h1>
          <p className="text-[#5F6F65]">Redirecting...</p>
        </div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#1A4D2E] to-[#143d24] p-8">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl mx-auto flex flex-col border border-[#E8F5E9]">
        {/* Header */}
        <div className="p-8 border-b border-[#E8F5E9]">
          <button
            onClick={() => window.location.href = existingOrder ? '/pos/orders' : '/pos/terminal'}
            className="flex items-center gap-2 text-[#5F6F65] hover:text-[#1A4D2E] mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            {existingOrder ? 'Back to Orders' : 'Back to Cart'}
          </button>
          <h1 className="text-3xl font-bold text-[#1A4D2E]">Payment</h1>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {/* Order Summary */}
          <div className="bg-[#FBFBF2] rounded-[2rem] p-6 mb-8 border border-[#E8F5E9]">
            <h3 className="font-bold text-[#1A4D2E] mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {existingOrder ? (
                existingOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#5F6F65]">{item.quantity}x {item.productName}</span>
                    <span className="font-semibold text-[#1A4D2E]">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#5F6F65]">{item.quantity}x {item.name}</span>
                    <span className="font-semibold text-[#1A4D2E]">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[#E8F5E9] pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-[#1A4D2E]">Total</span>
              <span className="text-3xl font-bold text-[#1A4D2E]">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h3 className="font-bold text-[#1A4D2E] mb-4">Payment Method</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod("CASH")}
                className={`p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === "CASH"
                    ? "border-[#1A4D2E] bg-[#E8F5E9]"
                    : "border-[#E8F5E9] hover:border-[#4ADE80]"
                  }`}
              >
                <DollarSign className={`h-8 w-8 mx-auto mb-2 ${paymentMethod === "CASH" ? "text-[#1A4D2E]" : "text-[#5F6F65]"}`} />
                <p className="font-bold text-[#1A4D2E]">Cash</p>
              </button>
              <button
                onClick={() => setPaymentMethod("DIGITAL")}
                className={`p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === "DIGITAL"
                    ? "border-[#1A4D2E] bg-[#E8F5E9]"
                    : "border-[#E8F5E9] hover:border-[#4ADE80]"
                  }`}
              >
                <CreditCard className={`h-8 w-8 mx-auto mb-2 ${paymentMethod === "DIGITAL" ? "text-[#1A4D2E]" : "text-[#5F6F65]"}`} />
                <p className="font-bold text-[#1A4D2E]">Card</p>
              </button>
              <button
                onClick={() => setPaymentMethod("UPI")}
                className={`p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === "UPI"
                    ? "border-[#1A4D2E] bg-[#E8F5E9]"
                    : "border-[#E8F5E9] hover:border-[#4ADE80]"
                  }`}
              >
                <Smartphone className={`h-8 w-8 mx-auto mb-2 ${paymentMethod === "UPI" ? "text-[#1A4D2E]" : "text-[#5F6F65]"}`} />
                <p className="font-bold text-[#1A4D2E]">UPI</p>
              </button>
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === "CASH" && (
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#1A4D2E] mb-2">
                Amount Received
              </label>
              <input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-[2rem] border-2 border-[#E8F5E9] focus:border-[#1A4D2E] focus:outline-none transition-colors text-2xl font-bold text-[#1A4D2E]"
              />
              {amountReceived && parseFloat(amountReceived) >= total && (
                <div className="mt-4 p-4 bg-[#E8F5E9] rounded-[2rem] border border-[#4ADE80]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#1A4D2E]">Change</span>
                    <span className="text-2xl font-bold text-[#1A4D2E]">₹{getChange().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-[#E8F5E9]">
          <button
            onClick={() => {
              if (paymentMethod === "UPI") {
                setShowUPIModal(true);
              } else {
                handlePayment();
              }
            }}
            disabled={processing || (paymentMethod === "CASH" && parseFloat(amountReceived) < total)}
            className="w-full bg-[#1A4D2E] text-white py-4 rounded-[2rem] font-bold text-lg hover:bg-[#143d24] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
          >
            {processing ? 'Processing...' : paymentMethod === "UPI" ? 'Show QR Code' : `Complete Payment - ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* UPI QR Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 transform transition-all border border-[#E8F5E9]">
            <div className="text-center">
              {/* Header */}
              <div className="mb-6">
                <div className="h-16 w-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Smartphone className="h-8 w-8 text-[#1A4D2E]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1A4D2E] mb-2">UPI QR Payment</h2>
                <p className="text-[#5F6F65]">Scan to pay with any UPI app</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-8 rounded-[2rem] border-4 border-[#1A4D2E] mb-6">
                <div className="h-64 w-64 mx-auto bg-white rounded-xl flex items-center justify-center">
                  <QRCodeSVG
                    value={`upi://pay?pa=rajputhardagya@okhdfcbank&pn=Odoo Cafe&am=${total.toFixed(2)}&cu=INR&tn=Order Payment`}
                    size={256}
                    level="H"
                    includeMargin={false}
                    fgColor="#1A4D2E"
                    bgColor="#FFFFFF"
                    imageSettings={{
                      src: "/odoo_cafe_logo.png",
                      x: undefined,
                      y: undefined,
                      height: 50,
                      width: 50,
                      excavate: true,
                    }}
                  />
                </div>
              </div>

              {/* Amount Display */}
              <div className="bg-gradient-to-r from-[#E8F5E9] to-[#FBFBF2] rounded-[2rem] p-6 mb-6 border border-[#4ADE80]/30">
                <p className="text-sm text-[#1A4D2E]/60 font-semibold mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold text-[#1A4D2E]">₹{total.toFixed(2)}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowUPIModal(false)}
                  className="px-6 py-4 bg-[#FBFBF2] text-[#5F6F65] rounded-[2rem] font-bold hover:bg-[#E8F5E9] transition-colors border border-[#E8F5E9]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUPIModal(false);
                    handlePayment();
                  }}
                  className="px-6 py-4 bg-[#1A4D2E] text-white rounded-[2rem] font-bold hover:bg-[#143d24] transition-colors shadow-lg"
                >
                  Confirmed
                </button>
              </div>

              <p className="text-xs text-[#5F6F65] mt-4">
                Click Confirmed after customer completes payment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
