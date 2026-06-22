// frontend/src/app/dashboard/coupons/page.js
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
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function CouponsDashboardPage() {
  const { showToast, showAlert, showConfirm } = usePopup();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "PERCENTAGE",
    expiresAt: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (saving) return;

    const trimmedCode = newCoupon.code.trim();
    if (!trimmedCode) {
      showAlert("Coupon Code is required.", "Validation Error", "error");
      return;
    }
    const discountVal = Number(newCoupon.discount);
    if (isNaN(discountVal) || discountVal <= 0) {
      showAlert("Discount Value must be a positive number.", "Validation Error", "error");
      return;
    }
    if (newCoupon.type === "PERCENTAGE" && discountVal > 100) {
      showAlert("Percentage discount cannot exceed 100%.", "Validation Error", "error");
      return;
    }

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newCoupon,
          code: trimmedCode.toUpperCase(),
          discount: discountVal
        })
      });

      if (response.ok) {
        fetchCoupons();
        setShowAddModal(false);
        setNewCoupon({ code: "", discount: "", type: "PERCENTAGE", expiresAt: "" });
        showToast("Coupon created successfully!", "success");
      } else {
        const err = await response.json();
        showAlert(err.error || "Failed to create coupon", "Create Coupon", "error");
      }
    } catch (error) {
      console.error("Failed to create coupon:", error);
      showAlert("Error creating coupon", "Create Coupon", "error");
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

      const response = await fetch(`${API_URL}/coupons/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setCoupons(prev => 
          prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c)
        );
        showToast("Coupon status updated successfully!", "success");
      } else {
        const err = await response.json();
        showAlert(err.error || "Failed to update coupon status", "Update Coupon", "error");
      }
    } catch (error) {
      console.error("Failed to toggle coupon status:", error);
      showAlert("Error updating coupon status", "Update Coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (saving) return;
    const confirmed = await showConfirm("Are you sure you want to delete this coupon?", "Delete Coupon");
    if (!confirmed) return;

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        showToast("Coupon deleted successfully!", "success");
      } else {
        const err = await response.json();
        showAlert(err.error || "Failed to delete coupon", "Delete Coupon", "error");
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      showAlert("Error deleting coupon", "Delete Coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const expiredCoupons = coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;
  const percentageCoupons = coupons.filter(c => c.type === 'PERCENTAGE').length;

  const filteredCoupons = searchQuery
    ? coupons.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()))
    : coupons;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CoffeeLoader size="lg" text="Loading Coupons..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* ═══════════════════════════════════════════════════════ */}
      {/*  HERO SECTION                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Left — Hero Text */}
        <div className="relative flex-1 bg-[#FDFCF7] rounded-[40px] p-8 lg:p-12 shadow-[0_4px_20px_rgba(62,43,33,0.02)] border border-[#EBE4D5]/60 overflow-hidden flex flex-col justify-center min-h-[220px]">
          <div className="relative z-10 max-w-lg space-y-5">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FCF8F2] text-[#3E2B21] text-sm font-semibold border border-[#EBE4D5]">
              <Gift className="h-4 w-4" /> Promotion Center
            </div>

            <div>
              <h1 className="text-3xl lg:text-[44px] font-black leading-[1.15] text-[#3E2B21] font-serif tracking-tight">
                Coupons & Campaigns
              </h1>
              <p className="text-[#3E2B21]/60 text-base mt-3 font-medium leading-relaxed max-w-md">
                Create discount codes and promotions to delight your customers and boost revenue.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm shadow-[0_4px_12px_rgba(62,43,33,0.2)] hover:bg-[#2C1810] transition-colors"
            >
              <Plus className="h-4.5 w-4.5" /> New Coupon
            </button>
          </div>

          <img
            src="/coupons_hero_1781584354450.png"
            alt="Coffee"
            className="absolute -right-16 -bottom-10 h-[130%] object-contain opacity-30 pointer-events-none"
          />
        </div>

        {/* Right — Stats */}
        <div className="w-full xl:w-[380px] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] flex flex-col justify-center">
              <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Total Codes</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-[28px] font-black text-[#3E2B21] leading-none">{coupons.length}</p>
                <div className="h-9 w-9 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#6B4423]">
                  <Ticket className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] flex flex-col justify-center">
              <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Active</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-[28px] font-black text-[#3E2B21] leading-none">{activeCoupons}</p>
                <div className="h-9 w-9 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)]">
            <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Percentage Discounts</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[28px] font-black text-[#3E2B21] leading-none">{percentageCoupons}</p>
              <div className="h-9 w-9 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#E68A00]">
                <Percent className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)]">
            <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Expired</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[28px] font-black text-[#3E2B21] leading-none">{expiredCoupons}</p>
              <div className="h-9 w-9 rounded-full bg-[#FFEBEE] flex items-center justify-center text-[#C62828]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  SEARCH & TABLE                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="rounded-[32px] bg-white border border-[#EBE4D5]/60 shadow-[0_4px_20px_rgba(62,43,33,0.02)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#EBE4D5]/60 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#F3EDE5] flex items-center justify-center">
              <Ticket className="h-5 w-5 text-[#6B4423]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#3E2B21]">Active Codes</h3>
              <p className="text-[12px] text-[#3E2B21]/40 font-medium">{coupons.length} coupons total</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-[280px]">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3E2B21]/30 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coupon code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-[16px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/30"
              />
            </div>
            <button
              onClick={fetchCoupons}
              className="h-10 w-10 rounded-full border border-[#EBE4D5] hover:border-[#3E2B21]/20 hover:bg-[#F5EFE6] flex items-center justify-center transition-all"
            >
              <RefreshCw className="h-4 w-4 text-[#6B4423]" />
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="h-16 w-16 rounded-full bg-[#F5EFE6] flex items-center justify-center mx-auto">
              <Ticket className="h-8 w-8 text-[#3E2B21]/30" />
            </div>
            <p className="text-[#3E2B21]/60 text-lg font-bold">
              {searchQuery ? "No coupons match your search" : "No coupons created yet"}
            </p>
            <p className="text-sm text-[#3E2B21]/40 font-medium">
              {searchQuery ? "Try a different search term." : "Click New Coupon to start!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FDFCF7] border-b border-[#EBE4D5]/60">
                  {["Promo Code", "Discount", "Type", "Expires", "Status", ""].map((head) => (
                    <th key={head} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-[#3E2B21]/40">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon, idx) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  return (
                    <tr
                      key={coupon.id}
                      className={`transition-colors duration-200 hover:bg-[#FDFCF7] ${idx !== filteredCoupons.length - 1 ? "border-b border-[#EBE4D5]/40" : ""}`}
                    >
                      {/* Code */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#F3EDE5] flex items-center justify-center">
                            <Tag className="h-4 w-4 text-[#6B4423]" />
                          </div>
                          <span className="font-black text-[#3E2B21] text-sm tracking-wider">
                            {coupon.code}
                          </span>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-[#3E2B21]">
                          {coupon.type === 'PERCENTAGE' ? `${Number(coupon.discount)}%` : `₹${Number(coupon.discount)}`}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                          coupon.type === 'PERCENTAGE'
                            ? 'bg-[#FFF4E5] text-[#B8700A] border-[#FFE0A3]'
                            : 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
                        }`}>
                          {coupon.type === 'PERCENTAGE' ? (
                            <Percent className="h-3 w-3" />
                          ) : (
                            <DollarSign className="h-3 w-3" />
                          )}
                          {coupon.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed'}
                        </span>
                      </td>

                      {/* Expires */}
                      <td className="px-6 py-5">
                        {coupon.expiresAt ? (
                          <span className={`text-[13px] font-medium ${isExpired ? "text-red-500" : "text-[#3E2B21]/60"}`}>
                            {new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {isExpired && (
                              <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                Expired
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[13px] text-[#3E2B21]/30 font-medium italic">
                            No expiry
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-5">
                        <button
                          onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                          disabled={saving}
                          className="focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {coupon.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#C62828]" />
                              Disabled
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          disabled={saving}
                          className="h-9 w-9 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  CREATE COUPON MODAL                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={saving ? undefined : () => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-md shadow-[0_25px_80px_rgba(62,43,33,0.18)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 pb-6 border-b border-[#EBE4D5]/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#F3EDE5] flex items-center justify-center">
                    <Gift className="h-5 w-5 text-[#6B4423]" />
                  </div>
                  <h3 className="text-xl font-black text-[#3E2B21]">Create Coupon</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="h-10 w-10 rounded-full bg-[#F5EFE6] hover:bg-[#EBE4D5] flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-[#6B4423]" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-8 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={saving}
                  placeholder="e.g. SAVE10"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] uppercase font-black text-lg text-[#3E2B21] placeholder:text-[#3E2B21]/20 placeholder:font-medium placeholder:text-sm placeholder:normal-case disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={saving}
                    placeholder="10"
                    value={newCoupon.discount}
                    onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] font-bold text-[#3E2B21] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">
                    Type *
                  </label>
                  <select
                    value={newCoupon.type}
                    disabled={saving}
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none bg-[#FDFCF7] font-semibold text-[#3E2B21] text-sm disabled:opacity-50"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  disabled={saving}
                  value={newCoupon.expiresAt}
                  onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] font-medium text-[#3E2B21]/60 text-sm disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.2)] disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Coupon"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 rounded-[18px] border-2 border-[#3E2B21] text-[#3E2B21] font-bold text-sm hover:bg-[#3E2B21]/5 transition-colors disabled:opacity-50"
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
