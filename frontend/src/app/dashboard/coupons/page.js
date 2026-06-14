// frontend/src/app/dashboard/coupons/page.js
"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, X, RefreshCw, Ticket, Check, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function CouponsDashboardPage() {
  const { showToast, showAlert, showConfirm } = usePopup();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "PERCENTAGE",
    expiresAt: ""
  });

  const formatErrorMessage = (err) => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === "string") return err;
    if (typeof err.error === "string") return err.error;
    if (Array.isArray(err.error)) {
      return err.error.map(e => {
        const fieldName = e.path && e.path.length > 0 ? e.path[e.path.length - 1] : "";
        return `${fieldName ? fieldName + ": " : ""}${e.message}`;
      }).join("\n");
    }
    if (err.message) return err.message;
    return JSON.stringify(err);
  };

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
          code: newCoupon.code.toUpperCase()
        })
      });

      if (response.ok) {
        fetchCoupons();
        setShowAddModal(false);
        setNewCoupon({ code: "", discount: "", type: "PERCENTAGE", expiresAt: "" });
        showToast("Coupon created successfully!", "success");
      } else {
        const err = await response.json();
        showAlert(formatErrorMessage(err), "Create Coupon", "error");
      }
    } catch (error) {
      console.error("Failed to create coupon:", error);
      showAlert(formatErrorMessage(error), "Create Coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
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
      } else {
        const err = await response.json();
        showAlert(formatErrorMessage(err), "Toggle Coupon Status", "error");
      }
    } catch (error) {
      console.error("Failed to toggle coupon status:", error);
      showAlert(formatErrorMessage(error), "Toggle Coupon Status", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
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
        showAlert(formatErrorMessage(err), "Delete Coupon", "error");
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      showAlert(formatErrorMessage(error), "Delete Coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CoffeeLoader size="lg" text="Loading Coupons..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#0F291C] via-[#175236] to-[#1F5D3E] text-white p-8 shadow-[0_30px_70px_rgba(10,46,29,0.35)] border border-white/10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Odoo Cafe · Promotion Center</p>
            <h2 className="text-4xl font-black leading-tight">Coupons & Campaigns</h2>
            <p className="text-white/80 text-lg">Create discount codes and promotions for your customers.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#1A4D2E] font-semibold shadow-[0_20px_45px_rgba(0,0,0,0.2)] hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5" /> New Coupon
          </button>
        </div>
      </section>

      {/* Coupons Table */}
      <div className="rounded-[32px] bg-white border border-[#EFE8D8] shadow-[0_25px_60px_rgba(26,77,46,0.08)] p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-coffee-800 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-[#1A4D2E]" />
            Active Codes
          </h3>
          <button onClick={fetchCoupons} className="p-2 text-gray-400 hover:text-[#1A4D2E] transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b">
              <tr>
                <th className="p-4">Promo Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Type</th>
                <th className="p-4">Expires At</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="p-4 font-black text-[#1A4D2E]">{coupon.code}</td>
                  <td className="p-4 font-bold">
                    {coupon.type === 'PERCENTAGE' ? `${Number(coupon.discount)}%` : `₹${Number(coupon.discount)}`}
                  </td>
                  <td className="p-4 text-xs font-semibold text-gray-500 uppercase">{coupon.type}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleToggleActive(coupon.id, coupon.isActive)} className="focus:outline-none">
                      {coupon.isActive ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                          Disabled
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                    No coupons created yet. Click New Coupon to start!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={saving ? undefined : () => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl border" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-2xl font-black text-coffee-800 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#1A4D2E]" />
                Create Coupon
              </h3>
              <button onClick={() => setShowAddModal(false)} disabled={saving} className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-50">
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Coupon Code *</label>
                <input
                  type="text"
                  required
                  disabled={saving}
                  placeholder="e.g. SAVE10"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A4D2E] outline-none uppercase font-bold text-lg text-[#1A4D2E] disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={saving}
                    placeholder="10"
                    value={newCoupon.discount}
                    onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A4D2E] outline-none font-bold disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Discount Type *</label>
                  <select
                    value={newCoupon.type}
                    disabled={saving}
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A4D2E] outline-none bg-white font-semibold disabled:opacity-50"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Expiry Date (Optional)</label>
                <input
                  type="date"
                  disabled={saving}
                  value={newCoupon.expiresAt}
                  onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A4D2E] outline-none font-semibold text-gray-600 disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 font-bold text-white bg-[#1A4D2E] rounded-xl hover:bg-[#143D24] disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
