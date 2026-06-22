"use client";

import { useState, useEffect } from "react";
import { Users, User, Phone, Mail, Calendar, Sparkles, ShoppingBag, DollarSign, ArrowRight, Eye, RefreshCw, Edit, X, Save, ArrowLeft, Search } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function CustomersDashboard() {
  const { showToast, showAlert, showConfirm } = usePopup();
  
  // State variables
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    topCustomers: [],
    retentionRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // Single Customer View/Edit Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form edit fields
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthday: "",
    points: 0,
    membershipLevel: "BRONZE"
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch customer stats:", error);
    }
  };

  const fetchCustomersList = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const resData = await response.json();
        setCustomers(resData.data || []);
        setTotalPages(resData.pagination?.totalPages || 1);
        setCurrentPage(resData.pagination?.page || 1);
      }
    } catch (error) {
      console.error("Failed to fetch customers list:", error);
      showToast("Error loading customers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCustomersList(1, "");
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
    fetchCustomersList(1, query);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCustomersList(page, searchQuery);
  };

  const handleOpenProfile = async (id) => {
    setSelectedCustomerId(id);
    setProfileLoading(true);
    setIsEditing(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerProfile(data);
        
        // Prep form edit data
        setEditFormData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          birthday: data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : "",
          points: data.points || 0,
          membershipLevel: data.membershipLevel || "BRONZE"
        });
      } else {
        showToast("Failed to load customer profile", "error");
        setSelectedCustomerId(null);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      showToast("Failed to connect to server", "error");
      setSelectedCustomerId(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !editFormData.phone.trim()) {
      showAlert("Name and Phone fields are required.", "Edit Customer", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        email: editFormData.email.trim() || null,
        birthday: editFormData.birthday || null,
        points: Number(editFormData.points) || 0,
        membershipLevel: editFormData.membershipLevel
      };

      const res = await fetch(`${API_URL}/customers/${selectedCustomerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setCustomerProfile(prev => ({
          ...prev,
          ...updated
        }));
        setIsEditing(false);
        showToast("Customer profile updated successfully!", "success");
        // Reload list and stats
        fetchCustomersList(currentPage, searchQuery);
        fetchStats();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Error saving edits:", err);
      showToast("Connection failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const getTierClass = (level) => {
    const l = level?.toUpperCase() || "BRONZE";
    if (l === "PLATINUM") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (l === "GOLD") return "bg-amber-100 text-amber-800 border-amber-200";
    if (l === "SILVER") return "bg-slate-200 text-slate-800 border-slate-300";
    return "bg-amber-50 text-[#8C6239] border-[#E6D1C4]";
  };

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-black text-[#3E2B21]">Customer Directory</h1>
          <p className="text-[#8C8775] font-semibold mt-1">Monitor profiles, loyalty metrics, and historical spending data.</p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchCustomersList(currentPage, searchQuery); }}
          className="p-3 bg-white hover:bg-[#F5EFE6] border border-[#EBE4D5] text-[#3E2B21] rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Customers */}
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE4D5] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-gray-400">Total Customers</p>
            <h3 className="text-3xl font-black text-[#3E2B21]">{stats.totalCustomers}</h3>
            <p className="text-[10px] text-gray-400 font-bold">Registered profiles in database</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#F3EDE5] text-[#6B4423] flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: New Customers */}
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE4D5] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-gray-400">New Customers</p>
            <h3 className="text-3xl font-black text-emerald-600">{stats.newCustomers}</h3>
            <p className="text-[10px] text-gray-400 font-bold">Registered in the last 30 days</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Returning Customers */}
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE4D5] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-gray-400">Returning Customers</p>
            <h3 className="text-3xl font-black text-amber-600">{stats.returningCustomers}</h3>
            <p className="text-[10px] text-gray-400 font-bold">Placed more than 1 order</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Retention Rate */}
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE4D5] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-gray-400">Customer Retention</p>
            <h3 className="text-3xl font-black text-indigo-600">{stats.retentionRate}%</h3>
            <p className="text-[10px] text-gray-400 font-bold">Active returning customers ratio</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Customer Table List (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-[#EBE4D5] shadow-sm overflow-hidden flex flex-col">
          {/* List Toolbar */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/40">
            <h3 className="text-lg font-black text-[#3E2B21] tracking-tight">Customer Database</h3>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by name, phone or email..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-[#3E2B21]/30 focus:outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex justify-center">
                <CoffeeLoader size="lg" text="Searching customers..." />
              </div>
            ) : customers.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-bold">
                No customer profiles match this criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-[#3E2B21] uppercase tracking-wider">
                    <th className="py-4 px-6">Customer Details</th>
                    <th className="py-4 px-6">Loyalty Level</th>
                    <th className="py-4 px-6 text-center">Orders</th>
                    <th className="py-4 px-6 text-right">Total Spent</th>
                    <th className="py-4 px-6">Last Visit</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FCF9F2]/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 text-sm">{c.name}</div>
                        <div className="text-gray-400 text-[11px] font-medium mt-0.5">
                          📞 {c.phone} {c.email ? ` | ✉️ ${c.email}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getTierClass(c.membershipLevel)}`}>
                          {c.membershipLevel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-black text-gray-800">
                        {c.totalOrders}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-black text-[#6B4423]">
                        ₹{Number(c.totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-medium text-[11px]">
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenProfile(c.id)}
                          className="p-2 hover:bg-[#F5EFE6] text-[#3E2B21] rounded-lg transition-colors border border-transparent hover:border-[#3E2B21]/20"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-white bg-opacity-40">
              <span className="text-xs font-bold text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile / Details Panel (Right 1 col) */}
        <div className="bg-white rounded-[2.5rem] border border-[#EBE4D5] shadow-sm overflow-hidden flex flex-col p-6 min-h-[500px]">
          {selectedCustomerId ? (
            profileLoading ? (
              <div className="flex-1 flex flex-col justify-center items-center py-20">
                <CoffeeLoader size="md" text="Loading Profile..." />
              </div>
            ) : customerProfile ? (
              <div className="space-y-6">
                {/* Profile Header & Actions */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-[#3E2B21] tracking-tight">{customerProfile.name}</h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Customer since {new Date(customerProfile.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={saving}
                    className="px-3.5 py-1.5 bg-[#F5EFE6] hover:bg-[#EBE4D5]/60 text-[#3E2B21] rounded-xl text-xs font-black transition-colors flex items-center gap-1 border border-[#3E2B21]/20"
                  >
                    {isEditing ? "View Details" : "Edit Profile"}
                  </button>
                </div>

                {isEditing ? (
                  /* Edit Customer Profile Form */
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#3E2B21] tracking-wider ml-1">Name</label>
                      <input
                        required
                        disabled={saving}
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3E2B21]/30 text-xs font-semibold text-gray-800 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#3E2B21] tracking-wider ml-1">Phone Number</label>
                      <input
                        required
                        disabled={saving}
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3E2B21]/30 text-xs font-semibold text-gray-800 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#3E2B21] tracking-wider ml-1">Email</label>
                      <input
                        disabled={saving}
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3E2B21]/30 text-xs font-semibold text-gray-800 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#3E2B21] tracking-wider ml-1">Birthday</label>
                      <input
                        disabled={saving}
                        type="date"
                        value={editFormData.birthday}
                        onChange={(e) => setEditFormData({ ...editFormData, birthday: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3E2B21]/30 text-xs font-semibold text-gray-800 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#3E2B21] tracking-wider ml-1">Loyalty Points</label>
                      <input
                        disabled={saving}
                        type="number"
                        value={editFormData.points}
                        onChange={(e) => setEditFormData({ ...editFormData, points: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3E2B21]/30 text-xs font-semibold text-gray-800 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-[#3E2B21] tracking-wider ml-1">Membership Tier</label>
                      <select
                        disabled={saving}
                        value={editFormData.membershipLevel}
                        onChange={(e) => setEditFormData({ ...editFormData, membershipLevel: e.target.value })}
                        className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-[#3E2B21]/30 text-xs font-semibold text-gray-800 disabled:opacity-50"
                      >
                        <option value="BRONZE">Bronze</option>
                        <option value="SILVER">Silver</option>
                        <option value="GOLD">Gold</option>
                        <option value="PLATINUM">Platinum</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2.5 bg-[#3E2B21] hover:bg-[#2C1810] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? "Saving Changes..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Profile Details Summary & History */
                  <div className="space-y-6">
                    {/* Contact Detail Chips */}
                    <div className="space-y-2 bg-[#FCF9F2] p-4 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#8C8775]" />
                        <span>{customerProfile.phone}</span>
                      </div>
                      {customerProfile.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#8C8775]" />
                          <span className="truncate">{customerProfile.email}</span>
                        </div>
                      )}
                      {customerProfile.birthday && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#8C8775]" />
                          <span>Birthday: {new Date(customerProfile.birthday).toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}</span>
                        </div>
                      )}
                    </div>

                    {/* Loyalty Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#F5EFE6]/50 p-4 rounded-2xl border border-[#EBE4D5]/60 text-center space-y-1">
                        <span className="text-[10px] font-black uppercase text-[#3E2B21] tracking-wider">Tier</span>
                        <div className="flex justify-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getTierClass(customerProfile.membershipLevel)}`}>
                            {customerProfile.membershipLevel}
                          </span>
                        </div>
                      </div>
                      <div className="bg-indigo-50/20 p-4 rounded-2xl border border-indigo-50/30 text-center space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Points</span>
                        <p className="text-xl font-black text-indigo-900">{customerProfile.points}</p>
                      </div>
                    </div>

                    {/* Spend Stats & Favorite Products */}
                    <div className="space-y-3 bg-[#FCF9F2] p-4 rounded-2xl border border-gray-100">
                      <div className="flex justify-between border-b border-gray-100 pb-2 text-xs">
                        <span className="text-gray-400 font-bold">Favorite Products</span>
                        <span className="font-extrabold text-[#3E2B21]">Top 3</span>
                      </div>
                      {customerProfile.favoriteProducts && customerProfile.favoriteProducts.length > 0 ? (
                        <div className="space-y-1">
                          {customerProfile.favoriteProducts.map((prod, index) => (
                            <div key={index} className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#6B4423]" />
                              <span>{prod}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No products ordered yet.</p>
                      )}

                      <div className="flex justify-between border-b border-gray-100 pb-2 text-xs pt-3">
                        <span className="text-gray-400 font-bold">Coupons Used</span>
                      </div>
                      {customerProfile.couponsUsed && customerProfile.couponsUsed.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {customerProfile.couponsUsed.map((code, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] border border-red-100 rounded font-black tracking-wider uppercase">
                              🎫 {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No coupons applied yet.</p>
                      )}
                    </div>

                    {/* Order History */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-[#3E2B21] uppercase tracking-wider ml-1">Complete Order History</h4>
                      {customerProfile.orders && customerProfile.orders.length > 0 ? (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {customerProfile.orders.map((ord) => (
                            <div key={ord.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:border-[#3E2B21]/20 transition-all flex justify-between items-center text-xs">
                              <div>
                                <p className="font-black text-gray-900">{ord.orderNumber}</p>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-[#6B4423]">₹{Number(ord.totalAmount).toFixed(2)}</p>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  ord.status === "PAID" || ord.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                  ord.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">This customer has not placed any orders yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-60">
              <div className="h-16 w-16 bg-[#FCF9F2] border border-[#EBE4D5] rounded-full flex items-center justify-center mb-3">
                <User className="h-7 w-7 text-gray-400" />
              </div>
              <h4 className="font-bold text-[#3E2B21] text-sm">Select a Customer</h4>
              <p className="text-xs text-[#8C8775] max-w-[200px] mt-1">Click the eye action button on a profile row to view details, stats, loyalty levels, and order histories.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
