"use client";

import { jsPDF } from "jspdf";
import emailjs from '@emailjs/browser';

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  X,
  Eye,
  Printer,
  Download,
  Sparkles,
  Coffee,
  Activity,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const statusOptions = [
    "all",
    "SENT",
    "PREPARING",
    "COMPLETED",
    "PAID",
    "CANCELLED",
    "DRAFT",
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    //Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      DRAFT: "bg-cream-100 text-coffee-700 border border-cream-200",
      SENT: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      PREPARING: "bg-amber-50 text-amber-700 border border-amber-200",
      COMPLETED: "bg-sage-50 text-sage-700 border border-sage-200",
      PAID: "bg-sage-500/10 text-sage-700 border border-sage-200/40",
      CANCELLED: "bg-red-50 text-red-600 border border-red-100",
    };
    return statusClasses[status] || "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }),
    []
  );

  const formatCurrency = (value = 0) => currencyFormatter.format(value || 0);

  const serviceDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const statusSummary = useMemo(() => {
    const summary = { total: orders.length, revenue: 0 };
    orders.forEach((order) => {
      const statusKey = order.status || "UNKNOWN";
      summary[statusKey] = (summary[statusKey] || 0) + 1;
      summary.revenue += Number(order.totalAmount) || 0;
    });
    return summary;
  }, [orders]);

  const progressOrders = (statusSummary.PREPARING || 0) + (statusSummary.SENT || 0);
  const completedOrders = (statusSummary.COMPLETED || 0) + (statusSummary.PAID || 0);

  const quickStats = [
    {
      id: "total",
      label: "Total Orders",
      value: statusSummary.total || 0,
      hint: "Across every channel",
      icon: Coffee,
      iconClasses: "bg-white/80 text-[#1A4D2E]",
    },
    {
      id: "progress",
      label: "In Progress",
      value: progressOrders,
      hint: `${statusSummary.PREPARING || 0} in kitchen, ${statusSummary.SENT || 0} en route`,
      icon: Activity,
      iconClasses: "bg-[#FDF2E9] text-[#D47C2F]",
      progress:
        statusSummary.total > 0
          ? Math.min(100, (progressOrders / statusSummary.total) * 100)
          : 0,
    },
    {
      id: "completed",
      label: "Completed",
      value: completedOrders,
      hint: `${statusSummary.COMPLETED || 0} served, ${statusSummary.PAID || 0} paid`,
      icon: CheckCircle2,
      iconClasses: "bg-[#E8F5E9] text-[#1A4D2E]",
      progress:
        statusSummary.total > 0
          ? Math.min(100, (completedOrders / statusSummary.total) * 100)
          : 0,
    },
    {
      id: "revenue",
      label: "Revenue Today",
      value: formatCurrency(statusSummary.revenue || 0),
      hint: "Gross sales generated",
      icon: DollarSign,
      iconClasses: "bg-[#F3F1E2] text-[#B47D37]",
    },
  ];



  // ... existing imports ...

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    const generateReceipt = () => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPos = 20;

        // Header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("ODOO CAFE", pageWidth / 2, yPos, { align: "center" });
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Order Receipt: ${order.orderNumber}`, pageWidth / 2, yPos, { align: "center" });
        yPos += 10;
        doc.text("------------------------------------------------", pageWidth / 2, yPos, { align: "center" });
        yPos += 10;

        // Info
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 20, yPos);
        yPos += 6;
        if (order.table) {
          doc.text(`Table: ${order.table.name}`, 20, yPos);
          yPos += 6;
        }
        if (order.customerName) {
          doc.text(`Customer: ${order.customerName}`, 20, yPos);
          yPos += 6;
        }
        yPos += 4;

        // Items
        doc.setFont("helvetica", "bold");
        doc.text("Item", 20, yPos);
        doc.text("Qty", 140, yPos, { align: "right" });
        doc.text("Price", 180, yPos, { align: "right" });
        yPos += 6;
        doc.setFont("helvetica", "normal");

        let subtotal = 0;
        order.items?.forEach(item => {
          const itemTotal = Number(item.price) * item.quantity;
          subtotal += itemTotal;

          // Handle long product names
          const splitTitle = doc.splitTextToSize(item.productName, 110);
          doc.text(splitTitle, 20, yPos);
          doc.text(String(item.quantity), 140, yPos, { align: "right" });
          doc.text(`₹${itemTotal.toFixed(2)}`, 180, yPos, { align: "right" });

          yPos += (6 * splitTitle.length);
        });

        yPos += 4;
        doc.text("------------------------------------------------", pageWidth / 2, yPos, { align: "center" });
        yPos += 8;

        // Totals
        const tax = subtotal * 0.09;
        const total = Number(order.totalAmount);

        doc.text(`Subtotal:`, 120, yPos);
        doc.text(`₹${subtotal.toFixed(2)}`, 180, yPos, { align: "right" });
        yPos += 6;
        doc.text(`Tax (9%):`, 120, yPos);
        doc.text(`₹${tax.toFixed(2)}`, 180, yPos, { align: "right" });
        yPos += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Total:`, 120, yPos);
        doc.text(`₹${total.toFixed(2)}`, 180, yPos, { align: "right" });

        // Save
        doc.save(`Receipt-${order.orderNumber}.pdf`);
      } catch (err) {
        console.error("PDF Generation Error", err);
        alert("Failed to generate PDF");
      }
    };



    // ... existing imports ...

    const handleEmailReceipt = async () => {
      let recipient = order.customerEmail;

      if (!recipient) {
        recipient = prompt("No email on file. Please enter customer email:");
        if (!recipient) return;
      }

      // EmailJS Configuration
      const SERVICE_ID = "service_gb48lwj";
      const PUBLIC_KEY = "W0595iJ-qNi2bVbxR";
      const TEMPLATE_ID = "template_u4syz79";

      // Matching the structure from your screenshot (Default EmailJS eCommerce template)
      const templateParams = {
        email: recipient,              // Matches 'To Email: {{email}}'
        order_id: order.orderNumber,   // Matches 'Subject: ... #{{order_id}}'

        // Loop for {{#orders}} ... {{/orders}}
        orders: order.items.map(item => ({
          name: item.productName,    // Matches {{name}}
          price: Number(item.price).toFixed(2), // Matches ${{price}} - keeping number only, template adds symbol? Or add symbol here? 
          // If template expects symbol, I should send it. User wants ₹.
          price_formatted: `₹${Number(item.price).toFixed(2)}`,
          units: item.quantity       // Matches QTY: {{units}}
        })),

        // Matches {{cost.total}}, {{cost.tax}}
        cost: {
          shipping: "0.00",
          tax: (Number(order.totalAmount) - order.items.reduce((s, i) => s + (Number(i.price) * i.quantity), 0)).toFixed(2), // Approx tax
          total: Number(order.totalAmount).toFixed(2)
        },

        // Fallback message if using a simple template
        message: `Receipt for Order ${order.orderNumber}. Total: ₹${Number(order.totalAmount).toFixed(2)}`
      };

      try {
        console.log("Sending via EmailJS...", templateParams);
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('SUCCESS!', response.status, response.text);
        alert(`Receipt sent successfully to ${recipient}!`);
      } catch (error) {
        console.error('FAILED...', error);
        alert(`Failed to send email: ${error.text || 'Unknown Error'}`);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-gradient-to-b from-cream-50 via-white to-beige-50 rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_45px_90px_rgba(14,60,39,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gold-500/20 sticky top-0 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-coffee-800">Order Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-coffee-600/10 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-coffee-600" />
              </button>
            </div>
            <p className="text-coffee-600/60">#{order.orderNumber}</p>
          </div>

          {/* Order Info */}
          <div className="p-6 space-y-6">
            {/* Status & Table */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-coffee-600/60 mb-1">Status</p>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <div>
                {order.table && (
                  <div className="mb-2">
                    <p className="text-sm text-coffee-600/60 mb-1">Table</p>
                    <p className="text-lg font-semibold text-coffee-800">{order.table.name}</p>
                  </div>
                )}
                {order.customerName && (
                  <div>
                    <p className="text-sm text-coffee-600/60 mb-1">Customer</p>
                    <p className="text-lg font-semibold text-coffee-800">{order.customerName}</p>
                    <p className="text-sm text-coffee-600">{order.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-bold text-coffee-800 mb-3">Order Items</h3>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gold-500/20 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-coffee-600/10 rounded-xl flex items-center justify-center font-bold text-coffee-700">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="font-semibold text-coffee-800">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-sm text-coffee-600/60">{item.variantName}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-coffee-800">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gold-500/20">
              <div className="flex items-center justify-between text-xl rounded-2xl bg-beige-100 px-4 py-3">
                <span className="font-semibold text-coffee-700">Total Amount</span>
                <span className="font-bold text-coffee-800">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={generateReceipt}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 rounded-xl bg-coffee-800 text-white font-bold hover:bg-coffee-900 transition-colors"
              >
                <Printer className="h-5 w-5" />
                Print Receipt
              </button>
              <button
                onClick={handleEmailReceipt}
                className="flex-1 btn-outline flex items-center justify-center gap-2 py-3 rounded-xl border border-coffee-800 text-coffee-800 font-bold hover:bg-coffee-50 transition-colors"
              >
                <Download className="h-5 w-5" />
                Export / Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CoffeeLoader size="lg" text="Loading Orders..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[42px] text-white p-8 shadow-[0_45px_120px_rgba(10,46,29,0.45)] border border-white/10"
        style={{
          backgroundImage: `linear-gradient(135deg, #163d28ff 0%, #1A4D2E 60%, #2F7A46 100%)`,
        }}

      >
        <div className="absolute inset-0 opacity-70 pointer-events-none">
          <span className="absolute -left-16 top-1/4 h-48 w-48 rounded-full bg-white/15 blur-[120px]" />
          <span className="absolute right-8 top-6 h-32 w-32 rounded-full bg-[#8DE0B0]/30 blur-[90px]" />
          <span className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-[#F4B860]/25 blur-[130px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Live service overview
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Orders Management</h1>
              <p className="text-white/80 mt-2 text-lg">
                Keep every table, takeaway, and online order flowing through the bar with ease.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Live orders</p>
                <p className="text-3xl font-black">{progressOrders}</p>
                <p className="text-xs text-white/70 mt-1">Brewing & on the way</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Completed</p>
                <p className="text-3xl font-black">{completedOrders}</p>
                <p className="text-xs text-white/70 mt-1">Served with a smile</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Revenue</p>
                <p className="text-3xl font-black">{formatCurrency(statusSummary.revenue)}</p>
                <p className="text-xs text-white/70 mt-1">Today&apos;s takings</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-[32px] bg-white/10 border border-white/20 p-6 backdrop-blur">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {serviceDate}
              </span>
              <button className="px-4 py-2 rounded-full bg-white text-[#1A4D2E] text-xs font-semibold shadow-lg flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Focus</p>
                <p className="text-lg font-semibold">Dine-in & takeaway</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-white/70">Awaiting pickup</p>
                  <p className="text-2xl font-bold">{statusSummary.SENT || 0}</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-white/70">Cancelled</p>
                  <p className="text-2xl font-bold">{statusSummary.CANCELLED || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          const displayValue =
            typeof stat.value === "number"
              ? stat.value.toLocaleString()
              : stat.value;

          return (
            <div
              key={stat.id}
              className="rounded-[30px] bg-white/90 backdrop-blur border border-white shadow-[0_25px_60px_rgba(26,77,46,0.08)] p-5 transition duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#5F6F65]/70">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-[#1A4D2E] mt-2">{displayValue}</p>
                </div>
                <span className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stat.iconClasses}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="text-sm text-[#5F6F65] mt-3">{stat.hint}</p>
              {typeof stat.progress === "number" && (
                <div className="mt-4 h-1.5 rounded-full bg-[#E6E9E5] overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-[#1A4D2E]"
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Filters & Search */}
      <section className="rounded-[36px] bg-white/95 backdrop-blur border border-white shadow-[0_30px_70px_rgba(26,77,46,0.08)] p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#1A4D2E]/80">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-coffee-600/40 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number, table, or customer"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none transition-colors bg-white"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-coffee-100 px-4 py-3 text-sm text-[#5F6F65]">
            <Calendar className="h-4 w-4" /> Service window: Today
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => {
            const isActive = statusFilter === status;
            const label = status === "all" ? "All" : status;
            const count = status === "all" ? statusSummary.total : statusSummary[status] || 0;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition ${isActive
                  ? "bg-[#1A4D2E] text-white border-transparent shadow"
                  : "bg-white text-[#1A4D2E] border-coffee-100 hover:border-coffee-200"
                  }`}
              >
                {label}
                <span
                  className={`h-6 min-w-6 rounded-full text-xs flex items-center justify-center ${isActive ? "bg-white/20" : "bg-coffee-50"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-coffee-100 pt-4 text-sm text-[#5F6F65]">
          <p>
            Showing <span className="font-semibold text-[#1A4D2E]">{filteredOrders.length}</span> of
            <span className="font-semibold text-[#1A4D2E]"> {orders.length}</span> orders
          </p>
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cream-200 text-[#1A4D2E] text-xs font-semibold">
            {statusFilter === "all" ? "All orders" : `${statusFilter} queue`}
          </span>
        </div>
      </section>

      {/* Orders Table */}
      <section className="rounded-[40px] bg-white/95 backdrop-blur border border-white shadow-[0_35px_80px_rgba(26,77,46,0.08)] overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Coffee className="h-10 w-10 text-coffee-200 mx-auto" />
            <p className="text-coffee-600/70 text-lg">No orders match this view</p>
            <p className="text-sm text-coffee-500">Try changing the filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs uppercase tracking-[0.35em] text-[#5F6F65]/70 bg-[#F7F4EA]">
                <tr>
                  {[
                    "Order #",
                    "Table",
                    "Status",
                    "Items",
                    "Total",
                    "Time",
                    "",
                  ].map((head) => (
                    <th key={head} className="px-6 py-4 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/20">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-[#F8F5ED]"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1A4D2E]">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#1A4D2E]" />
                        #{order.orderNumber?.slice(-6) || order.id.slice(0, 6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#1A4D2E]/80">
                      {order.table?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#1A4D2E]/80">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1A4D2E]">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                    <td className="px-6 py-4 text-[#5F6F65]/70 text-sm">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-2xl border border-coffee-100 hover:border-coffee-300 transition"
                      >
                        <Eye className="h-5 w-5 text-coffee-700" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}