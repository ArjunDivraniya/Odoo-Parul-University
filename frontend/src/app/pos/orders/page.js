"use client";

import { useState, useEffect } from "react";
import { Clock, Receipt, Search, X, Download, CreditCard, Edit3 } from "lucide-react";
import emailjs from '@emailjs/browser';
import { usePopup } from "@/context/PopupContext";
import { useCartStore } from "@/stores/cart-store";

export default function POSOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { showToast, showAlert } = usePopup();
  const { loadOrder } = useCartStore();

  // Local state for Email Receipt Input Dialog
  const [emailOrder, setEmailOrder] = useState(null);
  const [emailInput, setEmailInput] = useState("");

  const handlePayNow = (order, e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('payingOrderId', order.id);
    if (order.table) {
      localStorage.setItem('selectedTable', JSON.stringify(order.table));
    }
    window.location.href = `/pos/payment?orderId=${order.id}`;
  };

  const handleResumeOrder = (order, e) => {
    if (e) e.stopPropagation();
    loadOrder(order);
    if (order.table) {
      localStorage.setItem('selectedTable', JSON.stringify(order.table));
    }
    showToast(`Loaded order ${order.orderNumber || ''} into Cart`, "info");
    window.location.href = '/pos/terminal';
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const activeSession = JSON.parse(localStorage.getItem('activeSession') || '{}');
      if (!activeSession.id) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/orders?sessionId=${activeSession.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Keep full data for modal, formatted for list
        const formatted = data.map(order => ({
          ...order,
          displayId: order.orderNumber || order.id.slice(0, 8),
          time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          totalFormatted: Number(order.totalAmount).toFixed(2),
          itemCountString: `${order.items?.length || 0} items`
        }));
        setOrders(formatted);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailReceipt = async (orderToEmail, recipient) => {
    // EmailJS Configuration
    const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID;
    const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY;
    const TEMPLATE_ID = process.env.NEXT_PUBLIC_TEMPLATE_ID;

    const templateParams = {
      email: recipient,
      order_id: orderToEmail.orderNumber,
      orders: orderToEmail.items.map(item => ({
        name: item.productName,
        price: Number(item.price).toFixed(2),
        price_formatted: `₹${Number(item.price).toFixed(2)}`,
        units: item.quantity
      })),
      cost: {
        shipping: "0.00",
        tax: (Number(orderToEmail.totalAmount) - orderToEmail.items.reduce((s, i) => s + (Number(i.price) * i.quantity), 0)).toFixed(2),
        total: Number(orderToEmail.totalAmount).toFixed(2)
      },
      message: `Receipt for Order ${orderToEmail.orderNumber}. Total: ₹${Number(orderToEmail.totalAmount).toFixed(2)}`
    };

    try {
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      console.log('SUCCESS!', response.status, response.text);
      showToast(`Receipt sent successfully to ${recipient}!`, "success");
    } catch (error) {
      console.error('FAILED...', error);
      showAlert(`Failed to send email: ${error.text || 'Unknown Error'}`, "Email Receipt", "error");
    }
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    const getStatusBadgeClass = (status) => {
      const statusClasses = {
        DRAFT: "bg-[#FBFBF2] text-[#1A4D2E] border border-[#E8F5E9]",
        SENT: "bg-[#E8F5E9] text-[#1A4D2E] border border-[#4ADE80]",
        PREPARING: "bg-[#FBFBF2] text-[#5F6F65] border border-[#E8F5E9]",
        COMPLETED: "bg-[#E8F5E9] text-[#1A4D2E] border border-[#4ADE80]",
        PAID: "bg-[#E8F5E9] text-[#1A4D2E] border border-[#4ADE80]",
        CANCELLED: "bg-red-50 text-red-600 border border-red-100",
      };
      return statusClasses[status] || "bg-[#FBFBF2] text-[#5F6F65] border border-[#E8F5E9]";
    };

    const handleEmailReceipt = async () => {
      const recipient = order.customerEmail;
      if (!recipient) {
        setEmailInput("");
        setEmailOrder(order);
      } else {
        await sendEmailReceipt(order, recipient);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-[2.5rem] max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-[#E8F5E9]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#E8F5E9] flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-[#1A4D2E]">Order Details</h2>
              <p className="text-sm text-[#5F6F65]">{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#FBFBF2] rounded-full text-[#5F6F65] transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
              <span className="text-sm text-[#5F6F65]">{new Date(order.createdAt).toLocaleString()}</span>
            </div>

            {/* Customer Info */}
            {(order.table || order.customerName) && (
              <div className="bg-[#FBFBF2] p-4 rounded-xl space-y-2 border border-[#E8F5E9]">
                {order.table && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5F6F65]">Table</span>
                    <span className="font-bold text-[#1A4D2E]">{order.table.name}</span>
                  </div>
                )}
                {order.customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5F6F65]">Customer</span>
                    <span className="font-bold text-[#1A4D2E]">{order.customerName}</span>
                  </div>
                )}
                {order.customerEmail && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5F6F65]">Email</span>
                    <span className="text-[#5F6F65]">{order.customerEmail}</span>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="font-bold text-[#1A4D2E] mb-3">Items</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 flex items-center justify-center bg-[#E8F5E9] text-[#1A4D2E] rounded text-xs font-bold">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium text-[#1A4D2E]">{item.productName}</p>
                        {item.variantName && <p className="text-xs text-[#5F6F65]">{item.variantName}</p>}
                      </div>
                    </div>
                    <p className="font-bold text-[#1A4D2E]">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-dashed border-[#E8F5E9] pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold text-[#1A4D2E]">
                <span>Total</span>
                <span>₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-[#E8F5E9] bg-[#FBFBF2] space-y-3">
            {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => handlePayNow(order, e)}
                  className="py-3 rounded-xl bg-[#1A4D2E] text-white font-bold hover:bg-[#143d24] transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </button>
                <button
                  onClick={(e) => handleResumeOrder(order, e)}
                  className="py-3 rounded-xl bg-white border-2 border-[#1A4D2E] text-[#1A4D2E] font-bold hover:bg-[#E8F5E9] transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <Edit3 className="h-4 w-4" />
                  Resume Cart
                </button>
              </div>
            )}
            <button
              onClick={handleEmailReceipt}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm shadow-sm"
            >
              <Download className="h-4 w-4" />
              Send via Email
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 bg-[#FDFCF7] p-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#3E2B21] font-serif tracking-tight">Recent Orders</h1>
          <p className="text-sm text-[#8C8775] font-bold mt-1">Track shift receipts, draft carts, and completed payments.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A396]" />
          <input
            placeholder="Search receipt # or table..."
            className="w-full pl-13 pr-5 py-3.5 rounded-full border border-[#F0EBE1] bg-white focus:border-[#1A4D2E] focus:ring-4 focus:ring-[#FDFCF7] outline-none text-sm font-bold text-[#3E2B21] placeholder:text-[#A8A396] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all"
          />
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 bg-white rounded-[32px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F0EBE1] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FDFCF7]">
          <span className="font-black text-[#3E2B21] font-serif text-lg">Order History</span>
          <span className="text-xs font-bold text-[#8C8775] bg-white px-3 py-1 rounded-full border border-[#F0EBE1]">{orders.length} Receipts</span>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {orders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="flex items-center justify-between p-5 bg-[#FDFCF7] hover:bg-white rounded-[24px] transition-all duration-300 cursor-pointer border border-[#F0EBE1] hover:border-[#1A4D2E] shadow-2xs hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-[#1A4D2E] border border-[#F0EBE1] shadow-xs group-hover:bg-[#1A4D2E] group-hover:text-white transition-all">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-black text-[#3E2B21] text-base">{order.displayId}</p>
                    {order.table ? (
                      <span className="px-3 py-0.5 rounded-full bg-[#1A4D2E]/10 text-[#1A4D2E] text-[10px] font-black uppercase tracking-wider border border-[#1A4D2E]/20">
                        {order.table.name}
                      </span>
                    ) : (
                      <span className="px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                        Takeaway
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#8C8775] mt-1 font-bold">
                    <Clock className="h-3.5 w-3.5 text-[#1A4D2E]" /> {order.time} • {order.itemCountString}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {order.status !== 'PAID' && order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                  <button
                    onClick={(e) => handlePayNow(order, e)}
                    className="px-5 py-2.5 bg-[#1A4D2E] text-white rounded-full text-xs font-black hover:bg-[#143d24] transition-all shadow-md flex items-center gap-1.5 active:scale-95 uppercase tracking-wider"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Pay Order
                  </button>
                )}
                <div className="text-right">
                  <p className="font-black text-[#3E2B21] text-lg">₹{order.totalFormatted}</p>
                  <span className={`text-[11px] px-3.5 py-0.5 rounded-full font-black inline-block mt-1 uppercase tracking-wider ${
                    order.status === 'COMPLETED' ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]' :
                    order.status === 'PAID' ? 'bg-[#E8F5E9] text-[#1A4D2E] border border-[#4ADE80]/40' :
                    order.status === 'PREPARING' ? 'bg-[#FFF4E5] text-[#B8700A] border border-[#FFE0A3]' :
                    order.status === 'DRAFT' ? 'bg-[#F5EFE6] text-[#8C7B6B] border border-[#E8DFD3]' :
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Custom Email Input Modal */}
      {emailOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-[#FDFCF7] rounded-[36px] shadow-2xl max-w-sm w-full p-8 border border-[#F0EBE1]">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#3E2B21] font-serif">Send Email Receipt</h2>
              <p className="text-[#8C8775] text-xs font-bold mt-1">Please enter customer email address.</p>
            </div>

            <div className="mb-6">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="customer@example.com"
                autoFocus
                className="w-full px-5 py-4 rounded-full bg-white border border-[#F0EBE1] focus:border-[#1A4D2E] focus:outline-none transition-all font-bold text-[#3E2B21] text-sm shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setEmailOrder(null)}
                className="px-6 py-3.5 bg-[#F5EFE6] text-[#3E2B21] rounded-full font-bold hover:bg-gray-200 transition-colors border border-[#E8DFD3] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (emailInput.trim()) {
                    sendEmailReceipt(emailOrder, emailInput.trim());
                    setEmailOrder(null);
                  }
                }}
                disabled={!emailInput.trim()}
                className="px-6 py-3.5 bg-[#1A4D2E] text-white rounded-full font-bold hover:bg-[#143d24] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shadow-md text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

