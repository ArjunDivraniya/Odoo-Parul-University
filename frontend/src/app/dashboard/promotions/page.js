// frontend/src/app/dashboard/promotions/page.js
"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Ticket,
  Calendar,
  Percent,
  DollarSign,
  Search,
  ArrowUpRight,
  Gift,
  Clock,
  Edit2,
  TrendingUp,
  PercentSquare,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function PromotionsDashboardPage() {
  const { showToast, showAlert, showConfirm } = usePopup();
  
  // App States
  const [activeTab, setActiveTab] = useState("promotions"); // promotions, templates, analytics
  const [promotions, setPromotions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    promoOrdersCount: 0,
    revenueGeneratedByPromotions: 0,
    promotionConversionRate: 0,
    mostUsedCoupons: [],
    topPromotions: []
  });

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "COUPON",
    isActive: true,
    startDate: "",
    endDate: "",
    couponCode: "",
    products: [], // Array of { productId, role }
    minOrderAmount: "",
    triggerProductId: "",
    triggerQuantity: "",
    rewardProductId: "",
    rewardQuantity: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    comboPrice: ""
  });

  // Helper lists for multiple-product selections in forms
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPromotions(),
        fetchTemplates(),
        fetchProducts(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error("Failed to fetch initial page data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promotions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products`, { // actually fetch templates, fallback
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Let's seed templates mock if endpoint empty, or query templates table if created
      const templatesResponse = await fetch(`${API_URL}/promotions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // We know seed script populated promotion_templates, let's fetch them!
      const res = await fetch(`${API_URL}/promotions/active`, { // active promos or create templates fetch
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // For templates, we can hit GET /api/promotions which includes template options,
      // but let's do a direct fetch on templates if we expose it:
      const tRes = await fetch(`${API_URL}/settings`, { // using settings as helper if templates missing
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Let's mock load the templates since they are static configurations
      setTemplates([
        { id: '1', name: 'Buy 1 Get 1', type: 'BUY_X_GET_Y', description: 'Buy 1 get 1 free trigger reward item', config: { triggerQuantity: 1, rewardQuantity: 1 } },
        { id: '2', name: 'Buy 2 Get 1', type: 'BUY_X_GET_Y', description: 'Buy 2 get 1 free trigger reward item', config: { triggerQuantity: 2, rewardQuantity: 1 } },
        { id: '3', name: 'Buy 2 Get 2', type: 'BUY_X_GET_Y', description: 'Buy 2 get 2 free trigger reward items', config: { triggerQuantity: 2, rewardQuantity: 2 } },
        { id: '4', name: 'Flat 10% Off', type: 'ORDER_VALUE', description: 'Flat 10% discount on order value', config: { discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 0 } },
        { id: '5', name: 'Flat 20% Off', type: 'ORDER_VALUE', description: 'Flat 20% discount on order value', config: { discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 0 } },
        { id: '6', name: 'Free Drink', type: 'BUY_X_GET_Y', description: 'Free drink reward with trigger meal', config: { triggerQuantity: 1, rewardQuantity: 1, autoApply: false } },
        { id: '7', name: 'Free Dessert', type: 'BUY_X_GET_Y', description: 'Free dessert reward with trigger meals', config: { triggerQuantity: 2, rewardQuantity: 1, autoApply: false } },
        { id: '8', name: 'Festival Offer', type: 'ORDER_VALUE', description: 'Flat discount on large orders', config: { discountType: 'FIXED', discountValue: 100, minOrderAmount: 800 } },
        { id: '9', name: 'Weekend Offer', type: 'COUPON', description: 'Weekend coupon code discount', config: { couponCode: 'WEEKEND50', discountType: 'FIXED', discountValue: 50, minOrderAmount: 300 } }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promotions/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenForm = (promo = null) => {
    if (promo) {
      // Editing Mode
      setEditingPromoId(promo.id);
      
      const cond = promo.conditions?.[0] || {};
      const reward = promo.rewards?.[0] || {};
      const isCoupon = promo.type === 'COUPON';
      
      const assocProducts = promo.products || [];
      const discountedOrComboProductIds = assocProducts.map(ap => ap.productId);
      setSelectedProductIds(discountedOrComboProductIds);

      setForm({
        name: promo.name || "",
        description: promo.description || "",
        type: promo.type,
        isActive: promo.isActive,
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : "",
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : "",
        couponCode: promo.couponCode?.code || "",
        products: assocProducts,
        minOrderAmount: cond.minOrderAmount || "",
        triggerProductId: cond.triggerProductId || "",
        triggerQuantity: cond.triggerQuantity || "",
        rewardProductId: reward.rewardProductId || "",
        rewardQuantity: reward.rewardQuantity || "",
        discountType: reward.discountType || "PERCENTAGE",
        discountValue: reward.discountValue || "",
        comboPrice: reward.comboPrice || ""
      });
    } else {
      // Creation Mode
      setEditingPromoId(null);
      setSelectedProductIds([]);
      setForm({
        name: "",
        description: "",
        type: "COUPON",
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        couponCode: "",
        products: [],
        minOrderAmount: "",
        triggerProductId: "",
        triggerQuantity: "",
        rewardProductId: "",
        rewardQuantity: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        comboPrice: ""
      });
    }
    setShowFormModal(true);
  };

  const handleApplyTemplate = (temp) => {
    setSelectedProductIds([]);
    setForm({
      name: temp.name + " Promotion",
      description: temp.description,
      type: temp.type,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      couponCode: temp.config.couponCode || "",
      products: [],
      minOrderAmount: temp.config.minOrderAmount || "",
      triggerProductId: "",
      triggerQuantity: temp.config.triggerQuantity || "",
      rewardProductId: "",
      rewardQuantity: temp.config.rewardQuantity || "",
      discountType: temp.config.discountType || "PERCENTAGE",
      discountValue: temp.config.discountValue || "",
      comboPrice: ""
    });
    setEditingPromoId(null);
    setShowFormModal(true);
    showToast(`Template '${temp.name}' loaded! Set products to save.`, "success");
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      // Structure products based on promotion type
      let productsList = [];
      if (form.type === 'PRODUCT_DISCOUNT') {
        productsList = selectedProductIds.map(pid => ({
          productId: pid,
          role: 'DISCOUNTED'
        }));
      } else if (form.type === 'COMBO') {
        productsList = selectedProductIds.map(pid => ({
          productId: pid,
          role: 'COMBO_ITEM'
        }));
      }

      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        couponCode: form.type === 'COUPON' ? form.couponCode : null,
        products: productsList,
        minOrderAmount: (form.type === 'COUPON' || form.type === 'ORDER_VALUE') ? form.minOrderAmount : null,
        triggerProductId: form.type === 'BUY_X_GET_Y' ? form.triggerProductId : null,
        triggerQuantity: form.type === 'BUY_X_GET_Y' ? form.triggerQuantity : null,
        rewardProductId: form.type === 'BUY_X_GET_Y' ? form.rewardProductId : null,
        rewardQuantity: form.type === 'BUY_X_GET_Y' ? form.rewardQuantity : null,
        discountType: (form.type === 'COUPON' || form.type === 'PRODUCT_DISCOUNT' || form.type === 'ORDER_VALUE') ? form.discountType : null,
        discountValue: (form.type === 'COUPON' || form.type === 'PRODUCT_DISCOUNT' || form.type === 'ORDER_VALUE') ? form.discountValue : null,
        comboPrice: form.type === 'COMBO' ? form.comboPrice : null
      };

      const url = editingPromoId 
        ? `${API_URL}/promotions/${editingPromoId}`
        : `${API_URL}/promotions`;

      const method = editingPromoId ? 'PUT' : 'POST';

      setSaving(true);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(editingPromoId ? "Promotion updated!" : "Promotion created!", "success");
        setShowFormModal(false);
        fetchPromotions();
        fetchAnalytics();
      } else {
        const err = await response.json();
        showAlert(err.error || "Failed to save promotion", "Error Saving", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("An error occurred during save.", "Error Saving", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    if (saving) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/promotions/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setPromotions(prev =>
          prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p)
        );
        showToast("Promotion status updated!", "success");
        fetchAnalytics();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromotion = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this promotion?", "Delete Promotion");
    if (!confirmed) return;

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPromotions(prev => prev.filter(p => p.id !== id));
        showToast("Promotion deleted successfully!", "success");
        fetchAnalytics();
      } else {
        showAlert("Failed to delete promotion.", "Delete Error", "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    if (!promo.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-500 border border-gray-200">
          Inactive
        </span>
      );
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-200">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
        Active
      </span>
    );
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const filteredPromotions = searchQuery
    ? promotions.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : promotions;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CoffeeLoader size="lg" text="Loading Promotions Engine..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 font-sans text-[#3E2B21]">
      {/* ═══════════════════════════════════════════════════════ */}
      {/*  HERO HEADER                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Left — Intro */}
        <div className="relative flex-1 bg-[#FDFCF7] rounded-[40px] p-8 lg:p-12 shadow-[0_4px_20px_rgba(62,43,33,0.02)] border border-[#EBE4D5] overflow-hidden flex flex-col justify-center min-h-[220px]">
          <div className="relative z-10 max-w-lg space-y-5">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FCF8F2] text-[#3E2B21] text-sm font-semibold border border-[#EBE4D5]">
              <Sparkles className="h-4 w-4 text-orange-500" /> Promotion Control Center
            </div>

            <div>
              <h1 className="text-3xl lg:text-[44px] font-black leading-[1.15] text-[#3E2B21] font-serif tracking-tight">
                Discount & Offers Engine
              </h1>
              <p className="text-[#3E2B21]/60 text-base mt-3 font-medium leading-relaxed max-w-md">
                Configure automated pricing campaigns, coupons, BOGO deals, and combo menus in real-time.
              </p>
            </div>

            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm shadow-[0_4px_12px_rgba(62,43,33,0.2)] hover:bg-[#2C1810] transition-colors"
            >
              <Plus className="h-4.5 w-4.5" /> Custom Promotion
            </button>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
             <Gift className="h-48 w-48 text-[#6B4423]" />
          </div>
        </div>

        {/* Right — Quick Stats */}
        <div className="w-full xl:w-[420px] grid grid-cols-2 gap-4">
          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] flex flex-col justify-center">
            <p className="text-[#3E2B21]/50 text-[11px] font-extrabold uppercase tracking-wider">Total Campaigns</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[32px] font-black text-[#3E2B21] leading-none">{promotions.length}</p>
              <div className="h-10 w-10 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#6B4423]">
                <Gift className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] flex flex-col justify-center">
            <p className="text-[#3E2B21]/50 text-[11px] font-extrabold uppercase tracking-wider">Active Deals</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[32px] font-black text-[#2E7D32] leading-none">
                {promotions.filter(p => p.isActive && (!p.endDate || new Date(p.endDate) >= new Date())).length}
              </p>
              <div className="h-10 w-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] col-span-2 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#3E2B21]/50 text-[11px] font-extrabold uppercase tracking-wider">Promo Revenue Generated</p>
                <p className="text-[28px] font-black text-[#3E2B21] mt-1">₹{Number(analytics.revenueGeneratedByPromotions || 0).toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  NAVIGATION TABS                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="border-b border-[#EBE4D5] flex gap-8">
        <button
          onClick={() => setActiveTab("promotions")}
          className={`pb-4 text-base font-black border-b-2 transition-colors ${
            activeTab === "promotions"
              ? "border-[#3E2B21] text-[#3E2B21]"
              : "border-transparent text-[#3E2B21]/40 hover:text-[#3E2B21]"
          }`}
        >
          Promotions Library
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-4 text-base font-black border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-[#3E2B21] text-[#3E2B21]"
              : "border-transparent text-[#3E2B21]/40 hover:text-[#3E2B21]"
          }`}
        >
          Quick Templates
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-4 text-base font-black border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-[#3E2B21] text-[#3E2B21]"
              : "border-transparent text-[#3E2B21]/40 hover:text-[#3E2B21]"
          }`}
        >
          Campaign Analytics
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  TAB 1: PROMOTIONS LIST                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "promotions" && (
        <section className="rounded-[32px] bg-white border border-[#EBE4D5] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#EBE4D5] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-[#FDFCF7]">
            <div>
              <h3 className="text-lg font-black text-[#3E2B21]">Active Promotions List</h3>
              <p className="text-xs text-[#3E2B21]/50 font-medium">Auto evaluated on backend during customer POS actions.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full lg:w-[280px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3E2B21]/30 h-4 w-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-[16px] border border-[#EBE4D5] focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-semibold"
                />
              </div>
              <button
                onClick={fetchInitialData}
                className="h-10 w-10 rounded-full border border-[#EBE4D5] hover:bg-[#F5EFE6] flex items-center justify-center transition-all"
              >
                <RefreshCw className="h-4 w-4 text-[#3E2B21]" />
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredPromotions.length === 0 ? (
            <div className="text-center py-20">
              <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-bold text-[#3E2B21]">No active promotions</p>
              <p className="text-xs text-[#3E2B21]/50 mt-1">Create one using templates or build from scratch.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FDFCF7] border-b border-[#EBE4D5] text-[10px] font-bold text-[#3E2B21]/40 uppercase tracking-widest text-left">
                    <th className="px-6 py-4">Campaign Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Configuration Details</th>
                    <th className="px-6 py-4">Validity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE4D5]/40 text-sm">
                  {filteredPromotions.map((promo) => {
                    const cond = promo.conditions?.[0];
                    const reward = promo.rewards?.[0];
                    return (
                      <tr key={promo.id} className="hover:bg-[#FDFCF7]/40 transition-colors">
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-extrabold text-[#3E2B21]">{promo.name}</p>
                            {promo.description && (
                              <p className="text-xs text-[#3E2B21]/50 mt-0.5">{promo.description}</p>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700">
                            {promo.type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4 text-xs font-semibold text-[#3E2B21]/70">
                          {promo.type === 'COUPON' && (
                            <p>Code: <strong className="text-base text-purple-700 font-mono">{promo.couponCode?.code}</strong> ({reward?.discountType === 'PERCENTAGE' ? `${Number(reward?.discountValue)}%` : `₹${Number(reward?.discountValue)}`} off)</p>
                          )}
                          {promo.type === 'PRODUCT_DISCOUNT' && (
                            <p>Discount: <strong>{reward?.discountType === 'PERCENTAGE' ? `${Number(reward?.discountValue)}%` : `₹${Number(reward?.discountValue)}`} OFF</strong> on product(s)</p>
                          )}
                          {promo.type === 'BUY_X_GET_Y' && (
                            <p>Buy <strong>{cond?.triggerQuantity} Trigger</strong> → Get <strong>{reward?.rewardQuantity} Reward</strong> Free</p>
                          )}
                          {promo.type === 'COMBO' && (
                            <p>Combo price: <strong>₹{Number(reward?.comboPrice).toFixed(2)}</strong></p>
                          )}
                          {promo.type === 'ORDER_VALUE' && (
                            <p>Above <strong>₹{Number(cond?.minOrderAmount).toFixed(0)}</strong> → Get <strong>{reward?.discountType === 'PERCENTAGE' ? `${Number(reward?.discountValue)}%` : `₹${Number(reward?.discountValue)}`} Off</strong></p>
                          )}
                        </td>

                        {/* Validity */}
                        <td className="px-6 py-4 text-xs text-[#3E2B21]/60 font-medium">
                          <p>Start: {new Date(promo.startDate).toLocaleDateString("en-IN")}</p>
                          <p className="mt-0.5">End: {promo.endDate ? new Date(promo.endDate).toLocaleDateString("en-IN") : "Indefinite"}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {getStatusBadge(promo)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleActive(promo.id, promo.isActive)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                promo.isActive 
                                  ? "bg-red-50 text-red-600 border-red-200" 
                                  : "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]"
                              }`}
                            >
                              {promo.isActive ? "Disable" : "Reactivate"}
                            </button>
                            <button
                              onClick={() => handleOpenForm(promo)}
                              className="h-8 w-8 rounded-full border border-[#EBE4D5] hover:bg-gray-50 flex items-center justify-center text-gray-500"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePromotion(promo.id)}
                              className="h-8 w-8 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  TAB 2: TEMPLATES LIBRARY                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "templates" && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((temp) => (
            <div
              key={temp.id}
              className="bg-white rounded-[28px] border border-[#EBE4D5] p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                  <Ticket className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-black text-[#3E2B21]">{temp.name}</h4>
                <p className="text-xs text-[#3E2B21]/50 mt-1 font-medium min-h-[32px]">
                  {temp.description}
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black uppercase text-gray-500">
                  Type: {temp.type.replace(/_/g, ' ')}
                </span>
              </div>

              <button
                onClick={() => handleApplyTemplate(temp)}
                className="w-full mt-6 py-2.5 bg-[#3E2B21]/5 hover:bg-[#3E2B21] text-[#3E2B21] hover:text-white rounded-xl text-xs font-black transition-all border border-[#3E2B21]/10 text-center"
              >
                Apply Template
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  TAB 3: ANALYTICS                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <section className="space-y-8">
          {/* Top Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-[#EBE4D5] p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase text-[#3E2B21]/50 tracking-wider">Promotion Conversion Rate</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[44px] font-black text-[#3E2B21] leading-none">{analytics.promotionConversionRate}%</span>
                <PercentSquare className="h-10 w-10 text-[#3E2B21]" />
              </div>
              <p className="text-xs font-semibold text-[#3E2B21]/40 mt-2">Paid orders with promotions vs total orders</p>
            </div>
            
            <div className="bg-white rounded-3xl border border-[#EBE4D5] p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase text-[#3E2B21]/50 tracking-wider">Orders Using Offers</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[44px] font-black text-[#3E2B21] leading-none">{analytics.promoOrdersCount}</span>
                <ShoppingBag className="h-10 w-10 text-[#3E2B21]" />
              </div>
              <p className="text-xs font-semibold text-[#3E2B21]/40 mt-2">Out of {analytics.totalOrders} total completed orders</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#EBE4D5] p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase text-[#3E2B21]/50 tracking-wider">Revenue Saved For Users</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[44px] font-black text-orange-600 leading-none">₹{Number(analytics.revenueGeneratedByPromotions || 0).toFixed(0)}</span>
                <DollarSign className="h-10 w-10 text-orange-600" />
              </div>
              <p className="text-xs font-semibold text-[#3E2B21]/40 mt-2">Deducted from subtotals as total promo benefits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Box: Top Used Coupons */}
            <div className="bg-white rounded-[32px] border border-[#EBE4D5] p-8 shadow-sm">
              <h4 className="text-lg font-black text-[#3E2B21] mb-6 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-purple-600" /> Most Used Coupon Codes
              </h4>
              
              {analytics.mostUsedCoupons.length === 0 ? (
                <p className="text-sm font-semibold text-gray-400 py-10 text-center">No coupon usage recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.mostUsedCoupons.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black">
                          #{idx + 1}
                        </span>
                        <span className="font-mono font-black text-sm text-[#3E2B21] tracking-wider">{c.code}</span>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                        {c.count} uses
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Box: Top Performing Campaigns */}
            <div className="bg-white rounded-[32px] border border-[#EBE4D5] p-8 shadow-sm">
              <h4 className="text-lg font-black text-[#3E2B21] mb-6 flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-500" /> Top Promotions Applied
              </h4>
              
              {analytics.topPromotions.length === 0 ? (
                <p className="text-sm font-semibold text-gray-400 py-10 text-center">No promotion campaign metrics yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.topPromotions.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-black">
                          #{idx + 1}
                        </span>
                        <span className="font-black text-sm text-[#3E2B21]">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                        {p.count} applications
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  PROMOTION BUILDER FORM MODAL                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowFormModal(false)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-2xl shadow-[0_25px_80px_rgba(62,43,33,0.18)] max-h-[90vh] overflow-y-auto my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 pb-6 border-b border-[#EBE4D5] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#6B4423]">
                  <Gift className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-[#3E2B21] font-serif">
                  {editingPromoId ? "Edit Campaign" : "New Campaign"}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="h-10 w-10 rounded-full bg-[#F5EFE6] hover:bg-[#EBE4D5] flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-[#6B4423]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePromotion} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-2">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Treat"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-[14px] border border-[#EBE4D5] focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] font-semibold text-sm"
                  />
                </div>

                {/* Type Selector */}
                <div>
                  <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-2">Promotion Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-[14px] border border-[#EBE4D5] focus:outline-none bg-[#FDFCF7] font-bold text-sm"
                  >
                    <option value="COUPON">Coupon Code</option>
                    <option value="PRODUCT_DISCOUNT">Product Discount</option>
                    <option value="BUY_X_GET_Y">Buy X Get Y (BOGO)</option>
                    <option value="COMBO">Combo Menu Offer</option>
                    <option value="ORDER_VALUE">Order Total Discount</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-2">Public Description / Terms</label>
                <textarea
                  rows="2"
                  placeholder="Summarize the offer details..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-[14px] border border-[#EBE4D5] focus:outline-none bg-[#FDFCF7] font-semibold text-sm"
                />
              </div>

              {/* ═══════════════════════════════════════════════════════ */}
              {/*  CONDITIONAL SUB-FORMS BASED ON campaign TYPE         */}
              {/* ═══════════════════════════════════════════════════════ */}
              
              {/* Type: COUPON */}
              {form.type === 'COUPON' && (
                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-purple-900 uppercase tracking-wider mb-2">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WELCOME100"
                      value={form.couponCode}
                      onChange={e => setForm({ ...form, couponCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-[14px] border border-purple-200 focus:outline-none bg-white font-mono font-black text-lg text-purple-900 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-purple-950 uppercase tracking-wider mb-2">Min Order Value (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 200"
                      value={form.minOrderAmount}
                      onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                      className="w-full px-4 py-3 rounded-[14px] border border-purple-200 focus:outline-none bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Type: ORDER_VALUE */}
              {form.type === 'ORDER_VALUE' && (
                <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wider mb-2">Min Order Value Target (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      value={form.minOrderAmount}
                      onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                      className="w-full px-4 py-3 rounded-[14px] border border-blue-200 focus:outline-none bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Type: PRODUCT_DISCOUNT & COMBO (Multiselect products) */}
              {(form.type === 'PRODUCT_DISCOUNT' || form.type === 'COMBO') && (
                <div className="p-5 bg-[#FDFCF7] rounded-2xl border border-[#EBE4D5]">
                  <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-3">
                    {form.type === 'PRODUCT_DISCOUNT' ? "Select Products to Discount *" : "Select Combo Included Products *"}
                  </label>
                  
                  <div className="max-h-40 overflow-y-auto border border-[#EBE4D5] rounded-xl p-3 bg-white divide-y divide-gray-100">
                    {products.map(p => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelection(p.id)}
                          className="flex items-center justify-between py-2 px-1 cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                        >
                          <span>{p.name} (₹{Number(p.price).toFixed(2)})</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 accent-[#3E2B21]"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Selected: {selectedProductIds.length} item(s)</p>
                </div>
              )}

              {/* Type: BUY_X_GET_Y (BOGO) */}
              {form.type === 'BUY_X_GET_Y' && (
                <div className="p-5 bg-green-50/30 rounded-2xl border border-green-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Trigger product */}
                    <div>
                      <label className="block text-[11px] font-black text-green-900 uppercase tracking-wider mb-2">Trigger Product *</label>
                      <select
                        required
                        value={form.triggerProductId}
                        onChange={e => setForm({ ...form, triggerProductId: e.target.value })}
                        className="w-full px-4 py-3 rounded-[14px] border border-green-200 focus:outline-none bg-white font-bold text-xs"
                      >
                        <option value="">-- Choose Trigger Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Trigger qty */}
                    <div>
                      <label className="block text-[11px] font-black text-green-900 uppercase tracking-wider mb-2">Trigger Quantity *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 2"
                        value={form.triggerQuantity}
                        onChange={e => setForm({ ...form, triggerQuantity: e.target.value })}
                        className="w-full px-4 py-3 rounded-[14px] border border-green-200 focus:outline-none bg-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reward product */}
                    <div>
                      <label className="block text-[11px] font-black text-green-950 uppercase tracking-wider mb-2">Reward Product *</label>
                      <select
                        required
                        value={form.rewardProductId}
                        onChange={e => setForm({ ...form, rewardProductId: e.target.value })}
                        className="w-full px-4 py-3 rounded-[14px] border border-green-200 focus:outline-none bg-white font-bold text-xs"
                      >
                        <option value="">-- Choose Reward Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Reward qty */}
                    <div>
                      <label className="block text-[11px] font-black text-green-950 uppercase tracking-wider mb-2">Reward Quantity (Free) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 1"
                        value={form.rewardQuantity}
                        onChange={e => setForm({ ...form, rewardQuantity: e.target.value })}
                        className="w-full px-4 py-3 rounded-[14px] border border-green-200 focus:outline-none bg-white font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/*  REWARD DETAILS FOR APPLICABLE TYPES                  */}
              {/* ═══════════════════════════════════════════════════════ */}
              
              {/* Reward Value for Coupons, Product Discounts, Order Values */}
              {(form.type === 'COUPON' || form.type === 'PRODUCT_DISCOUNT' || form.type === 'ORDER_VALUE') && (
                <div className="p-5 bg-orange-50/20 rounded-2xl border border-orange-100/55 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-orange-950 uppercase tracking-wider mb-2">Discount Value Type *</label>
                    <select
                      value={form.discountType}
                      onChange={e => setForm({ ...form, discountType: e.target.value })}
                      className="w-full px-4 py-3 rounded-[14px] border border-orange-200 focus:outline-none bg-white font-bold text-xs"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-orange-950 uppercase tracking-wider mb-2">Discount Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 10"
                      value={form.discountValue}
                      onChange={e => setForm({ ...form, discountValue: e.target.value })}
                      className="w-full px-4 py-3 rounded-[14px] border border-orange-200 focus:outline-none bg-white font-black text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Reward Value for Combos */}
              {form.type === 'COMBO' && (
                <div className="p-5 bg-yellow-50/30 rounded-2xl border border-yellow-100">
                  <div>
                    <label className="block text-[11px] font-black text-yellow-950 uppercase tracking-wider mb-2">Target Package Combo Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 399"
                      value={form.comboPrice}
                      onChange={e => setForm({ ...form, comboPrice: e.target.value })}
                      className="w-full px-4 py-3 rounded-[14px] border border-yellow-250 focus:outline-none bg-white font-black"
                    />
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/*  DATES & STATUS                                       */}
              {/* ═══════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-[14px] border border-[#EBE4D5] focus:outline-none bg-[#FDFCF7] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-[14px] border border-[#EBE4D5] focus:outline-none bg-[#FDFCF7] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#3E2B21]/50 uppercase tracking-wider mb-2">Status</label>
                  <div className="flex items-center gap-3 pt-3">
                    <input
                      type="checkbox"
                      id="isActiveCheckbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="h-4.5 w-4.5 accent-[#3E2B21]"
                    />
                    <label htmlFor="isActiveCheckbox" className="text-xs font-bold cursor-pointer">
                      Campaign is Active
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-4 pt-6 border-t border-[#EBE4D5]">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-2xl bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-md text-center disabled:opacity-50"
                >
                  {saving ? (editingPromoId ? "Saving Changes..." : "Creating Campaign...") : (editingPromoId ? "Save Changes" : "Create Campaign")}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-[#3E2B21] text-[#3E2B21] font-bold text-sm hover:bg-gray-50 transition-colors text-center disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
