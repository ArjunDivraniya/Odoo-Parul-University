// frontend/src/app/pos/payment/page.js
"use client";

import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Smartphone, ArrowLeft, Check, AlertCircle } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { useCartStore } from "@/stores/cart-store";
import { getSocket } from "@/lib/socket";
import { usePopup } from "@/context/PopupContext";


export default function POSPaymentPage() {
  const { clearCart } = useCartStore();
  const { showToast, showAlert, showConfirm } = usePopup();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    // Only check for valid session or redirect
    const activeSession = localStorage.getItem('activeSession');
    if (!activeSession) {
      window.location.href = '/pos/session';
      return;
    }
    fetchOrderDetails();

    const socket = getSocket();
    socket.emit('join', 'cashier-room');

    const handleUpdate = (updatedOrder) => {
      const payingOrderId = localStorage.getItem('payingOrderId');
      if (updatedOrder && updatedOrder.id === payingOrderId) {
        console.log("📶 Order updated via socket:", updatedOrder);
        setOrder(updatedOrder);
      }
    };

    socket.on('order_updated', handleUpdate);
    socket.on('kitchen_status_changed', (data) => {
      const payingOrderId = localStorage.getItem('payingOrderId');
      if (data && data.orderId === payingOrderId) {
        console.log("📶 Kitchen status changed via socket:", data);
        fetchOrderDetails();
      }
    });

    return () => {
      socket.off('order_updated', handleUpdate);
      socket.off('kitchen_status_changed');
    };
  }, []);

  const fetchOrderDetails = async () => {
    const payingOrderId = localStorage.getItem('payingOrderId');
    if (!payingOrderId) {
      showAlert("No active checkout order found", "Payment Process", "error").then(() => {
        window.location.href = '/pos/terminal';
      });
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/orders/${payingOrderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        if (data.customerMobile) {
          setWhatsappNumber(data.customerMobile);
        }
      } else {
        showAlert("Failed to load order details", "Payment Process", "error").then(() => {
          window.location.href = '/pos/terminal';
        });
      }
    } catch (error) {
      console.error("Failed to load order details:", error);
      showAlert("Error loading order context", "Payment Process", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCashPayment = async () => {
    setProcessing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      // 1. Process payment
      const paymentResponse = await fetch(`${API_URL}/orders/${order.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          method: 'CASH',
          amount: Number(order.totalAmount),
          reference: 'CASH_REC_' + Date.now()
        })
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.text();
        throw new Error(`Failed to process cash payment: ${errorData}`);
      }

      // Clear checkout states
      clearCart();
      localStorage.removeItem('payingOrderId');
      
      setProcessing(false);
      setOrderComplete(true);

      // Auto send WhatsApp if phone is available
      const phoneNum = whatsappNumber || order?.customerMobile;
      if (phoneNum) {
        setTimeout(() => {
          handleShareWhatsApp();
        }, 500);
      }
    } catch (e) {
      console.error(e);
      showAlert(e.message, "Cash Payment", "error");
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK. Verify internet connectivity.");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      // 1. Create Razorpay order in backend
      const rzOrderRes = await fetch(`${API_URL}/payments/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: order.id })
      });

      if (!rzOrderRes.ok) {
        const err = await rzOrderRes.json();
        throw new Error(err.error || "Failed to initiate Razorpay order");
      }

      const rzOrder = await rzOrderRes.json();

      // Check for mock Razorpay credentials or fallback order
      if (rzOrder.id.startsWith('order_mock_') || rzOrder.key === 'rzp_test_placeholder' || rzOrder.key.includes('mockkey')) {
        const simulateSuccess = await showConfirm(
          "Real Razorpay keys are not configured in your backend .env.\n\nWould you like to simulate a successful payment validation for this order?",
          "Razorpay Simulator",
          "info",
          "Simulate Success",
          "Cancel"
        );
        if (simulateSuccess) {
          try {
            const verifyRes = await fetch(`${API_URL}/payments/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: order.id,
                razorpay_order_id: rzOrder.id,
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
                razorpay_signature: "mock_signature"
              })
            });

            if (verifyRes.ok) {
              clearCart();
              localStorage.removeItem('payingOrderId');
              setProcessing(false);
              setOrderComplete(true);
              const phoneNum = whatsappNumber || order?.customerMobile;
              if (phoneNum) {
                setTimeout(() => {
                  handleShareWhatsApp();
                }, 500);
              }
            } else {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.error || "Payment verification failed");
            }
          } catch (verifyError) {
            showAlert(verifyError.message, "Payment Verification", "error");
            setProcessing(false);
          }
        } else {
          setProcessing(false);
        }
        return;
      }

      // 2. Configure checkout
      const options = {
        key: rzOrder.key,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: "Odoo Cafe",
        description: `Payment for Order ${order.orderNumber}`,
        image: "/odoo_cafe_logo.png",
        order_id: rzOrder.id,
        handler: async function (response) {
          setProcessing(true);
          try {
            // Send to backend for verification and marking PAID
            const verifyRes = await fetch(`${API_URL}/payments/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              clearCart();
              localStorage.removeItem('payingOrderId');
              setProcessing(false);
              setOrderComplete(true);
              const phoneNum = whatsappNumber || order?.customerMobile;
              if (phoneNum) {
                setTimeout(() => {
                  handleShareWhatsApp();
                }, 500);
              }
            } else {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.error || "Payment verification failed");
            }
          } catch (verifyError) {
            showAlert(verifyError.message, "Payment Verification", "error");
            setProcessing(false);
          }
        },
        prefill: {
          name: order.customerName || "Walk-in Customer",
          email: order.customerEmail || "",
          contact: order.customerMobile || ""
        },
        theme: {
          color: "#1A4D2E"
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      showAlert(e.message, "Razorpay Payment", "error");
      setProcessing(false);
    }
  };
  const handleShareWhatsApp = async () => {
    if (!order) return;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    
    try {
      setProcessing(true);
      const res = await fetch(`${API_URL}/payments/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.id,
          phone: whatsappNumber
        })
      });

      setProcessing(false);

      if (res.ok) {
        showToast("Receipt sent successfully via automated local WhatsApp!", "success");
        return;
      }

      const errData = await res.json();
      console.warn("Automated WhatsApp failed:", errData);
      
      // Fallback redirect to WhatsApp Web
      showToast("Local WhatsApp is not connected. Redirecting to WhatsApp Web...", "warning");
      triggerWhatsappWebFallback();
    } catch (err) {
      console.error("WhatsApp API error:", err);
      setProcessing(false);
      triggerWhatsappWebFallback();
    }
  };

  const triggerWhatsappWebFallback = () => {
    const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const tax = Number(order.taxAmount) || 0;
    const discount = Number(order.discountAmount) || 0;
    const total = Number(order.totalAmount);
    const tableName = order.table ? order.table.name : 'Takeaway';
    const paymentMethodDisplay = order.payments && order.payments.length > 0 ? order.payments.map(p => p.method).join(', ') : paymentMethod;

    const itemsText = order.items.map(item => 
      `- ${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} - ₹${(Number(item.price) * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = `*Odoo Cafe Receipt*\n--------------------------\nOrder: ${order.orderNumber}\nDate: ${new Date(order.updatedAt || order.createdAt).toLocaleString()}\nTable: ${tableName}\nCustomer: ${order.customerName || 'Guest'}\n--------------------------\nItems:\n${itemsText}\n--------------------------\nSubtotal: ₹${subtotal.toFixed(2)}\n${discount > 0 ? `Discount: -₹${discount.toFixed(2)}\n` : ''}${tax > 0 ? `Tax: ₹${tax.toFixed(2)}\n` : ''}Total Amount: ₹${total.toFixed(2)}\n--------------------------\nPayment Method: ${paymentMethodDisplay}\nThank you for dining with us!`;

    const cleanNum = whatsappNumber.replace(/\D/g, '');
    const phone = cleanNum.length === 10 ? '91' + cleanNum : cleanNum;

    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getChange = () => {
    if (!order) return 0;
    const received = parseFloat(amountReceived) || 0;
    const total = Number(order.totalAmount);
    return Math.max(0, received - total);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FBFBF2]">
        <CoffeeLoader size="xl" text="Fetching Receipt..." />
      </div>
    );
  }

  if (processing) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FBFBF2]/90 backdrop-blur-sm fixed inset-0 z-50">
        <CoffeeLoader size="xl" text="Processing Payment..." />
      </div>
    );
  }

  if (orderComplete) {
    const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const tax = Number(order.taxAmount) || 0;
    const discount = Number(order.discountAmount) || 0;
    const total = Number(order.totalAmount);
    const tableName = order.table ? order.table.name : 'Takeaway';
    const paymentMethodDisplay = order.payments && order.payments.length > 0 ? order.payments.map(p => p.method).join(', ') : paymentMethod;

    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#1A4D2E] to-[#143d24] p-4 overflow-y-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full text-center border border-[#E8F5E9] my-8 relative">
          <div className="h-16 w-16 bg-[#4ADE80] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#1A4D2E] mb-1">Payment Successful!</h1>
          <p className="text-[#5F6F65] text-sm mb-6">Receipt generated successfully.</p>

          {/* Receipt Breakdown Card */}
          <div className="bg-[#FBFBF2] rounded-2xl p-5 border border-[#E8F5E9] text-left text-sm space-y-3 mb-6">
            <div className="flex justify-between font-bold text-[#1A4D2E] border-b border-dashed border-gray-200 pb-2">
              <span>Order ID</span>
              <span>{order.orderNumber}</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-xs text-gray-600">
                  <span>{item.quantity}x {item.productName}</span>
                  <span className="font-semibold">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-200 pt-2 space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-500 font-semibold">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#1A4D2E] pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Send via WhatsApp Info */}
          {whatsappNumber && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mb-6 text-left text-xs font-bold text-[#1A4D2E]">
              📱 Receipt auto-sent via WhatsApp to {whatsappNumber}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-white border-2 border-[#1A4D2E] text-[#1A4D2E] font-bold rounded-2xl hover:bg-[#E8F5E9] transition-all text-sm shadow-sm"
            >
              Print Receipt
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('selectedTable');
                window.location.href = '/pos/tables';
              }}
              className="w-full py-3 bg-[#1A4D2E] text-white font-bold rounded-2xl hover:bg-[#143d24] transition-all text-sm shadow-md"
            >
              Start New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const tax = Number(order.taxAmount) || 0;
  const discount = Number(order.discountAmount) || 0;
  const total = Number(order.totalAmount);

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#1A4D2E] to-[#143d24] p-8">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl mx-auto flex flex-col border border-[#E8F5E9]">
        {/* Header */}
        <div className="p-8 border-b border-[#E8F5E9]">
          <button
            onClick={() => window.location.href = '/pos/cart'}
            className="flex items-center gap-2 text-[#5F6F65] hover:text-[#1A4D2E] mb-4 transition-colors font-semibold"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Cart
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-[#1A4D2E]">Payment</h1>
            <span className="px-4 py-1.5 bg-[#E8F5E9] text-[#1A4D2E] rounded-full text-xs font-black uppercase border border-[#1A4D2E]/20">
              {order.orderNumber}
            </span>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto grid md:grid-cols-2 gap-8">
          {/* Left: Summary */}
          <div className="bg-[#FBFBF2] rounded-[2rem] p-6 border border-[#E8F5E9] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[#1A4D2E] mb-4 text-lg border-b border-dashed pb-2">Order Receipt</h3>
              <div className="space-y-3 mb-6 max-h-56 overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#5F6F65] font-semibold">{item.quantity}x {item.productName}</span>
                    <span className="font-bold text-[#1A4D2E]">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E8F5E9] pt-4 space-y-2.5">
              <div className="flex justify-between text-sm text-[#5F6F65]">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                  <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sm text-[#5F6F65]">
                  <span>Tax</span>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[#E8F5E9] pt-3 flex justify-between items-center">
                <span className="text-lg font-black text-[#1A4D2E]">Total</span>
                <span className="text-3xl font-black text-[#1A4D2E]">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right: Payment Method & Input */}
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              {order?.paymentStatus !== 'PAID' ? (
                <div className="p-5 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider mb-1">🔴 Payment Pending</p>
                    <p className="opacity-90">This order is awaiting payment validation. Click below to complete checkout.</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-emerald-200 bg-[#E8F5E9] text-[#1A4D2E] text-xs font-semibold flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#1A4D2E] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider mb-1">🟢 Payment Completed</p>
                    <p className="opacity-90">This order has been paid successfully.</p>
                  </div>
                </div>
              )}
              <h3 className="font-bold text-[#1A4D2E] text-lg">Select Method</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center ${paymentMethod === "CASH"
                      ? "border-[#1A4D2E] bg-[#E8F5E9] text-[#1A4D2E]"
                      : "border-[#E8F5E9] text-[#5F6F65] hover:border-[#4ADE80]"
                    }`}
                >
                  <DollarSign className="h-6 w-6 mb-1.5" />
                  <p className="font-black text-xs">Cash</p>
                </button>
                <button
                  onClick={() => setPaymentMethod("DIGITAL")}
                  className={`p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center ${paymentMethod === "DIGITAL"
                      ? "border-[#1A4D2E] bg-[#E8F5E9] text-[#1A4D2E]"
                      : "border-[#E8F5E9] text-[#5F6F65] hover:border-[#4ADE80]"
                    }`}
                >
                  <CreditCard className="h-6 w-6 mb-1.5" />
                  <p className="font-black text-xs">Card (Razorpay)</p>
                </button>
                <button
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center ${paymentMethod === "UPI"
                      ? "border-[#1A4D2E] bg-[#E8F5E9] text-[#1A4D2E]"
                      : "border-[#E8F5E9] text-[#5F6F65] hover:border-[#4ADE80]"
                    }`}
                >
                  <Smartphone className="h-6 w-6 mb-1.5" />
                  <p className="font-black text-xs">UPI (Razorpay)</p>
                </button>
              </div>

              {/* Cash Input */}
              {paymentMethod === "CASH" ? (
                <div className="space-y-3 bg-[#FBFBF2] p-5 rounded-2xl border border-gray-100">
                  <label className="block text-xs font-bold text-[#1A4D2E] uppercase tracking-wider">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8F5E9] focus:border-[#1A4D2E] focus:outline-none transition-colors text-xl font-black text-[#1A4D2E] bg-white"
                  />
                  {amountReceived && parseFloat(amountReceived) >= total && (
                    <div className="flex justify-between items-center bg-[#E8F5E9] p-3 rounded-xl border border-[#4ADE80] mt-3">
                      <span className="font-bold text-[#1A4D2E] text-sm">Change Refund</span>
                      <span className="text-xl font-black text-[#1A4D2E]">₹{getChange().toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border-2 border-dashed border-[#1D4ED8]/20 bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider mb-1">Razorpay Sandbox Mode</p>
                    <p className="opacity-90">Clicking Pay will open the secure Razorpay Standard Checkout popup. Use standard test cards or UPI mocks to complete the flow.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <div className="pt-6">
              <button
                onClick={() => {
                  if (processing) return;
                  if (paymentMethod === "CASH") {
                    handleCashPayment();
                  } else {
                    handleRazorpayPayment();
                  }
                }}
                disabled={processing || order?.paymentStatus === 'PAID' || (paymentMethod === "CASH" && (parseFloat(amountReceived) < total || !amountReceived))}
                className="w-full bg-[#1A4D2E] text-white py-4 rounded-[2rem] font-bold text-lg hover:bg-[#143d24] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
              >
                {processing 
                  ? (paymentMethod === "CASH" ? "Processing Cash..." : "Initiating Razorpay...") 
                  : (paymentMethod === "CASH" ? `Complete Payment - ₹${total.toFixed(2)}` : 'Pay via Razorpay Test')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}