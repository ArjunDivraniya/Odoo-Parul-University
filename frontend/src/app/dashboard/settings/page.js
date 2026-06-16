"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Users, Monitor, CreditCard, List, Save, Plus, Trash2, Edit2, X, Check, MapPin, Coffee } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, showAlert, showConfirm } = usePopup();

  // Data States
  const [settings, setSettings] = useState({
    cafeName: "",
    receiptFooter: "",
    currency: "₹",
    cashEnabled: true,
    digitalEnabled: true,
    upiEnabled: true,
    upiId: "",
  });
  const [users, setUsers] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedFloorForTable, setSelectedFloorForTable] = useState(null);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [settingsRes, usersRes, terminalsRes, catsRes, floorsRes] = await Promise.all([
        fetch(`${API_URL}/settings`, { headers }),
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/terminals`, { headers }),
        fetch(`${API_URL}/products/categories`, { headers }),
        fetch(`${API_URL}/floors`, { headers })
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (terminalsRes.ok) setTerminals(await terminalsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (floorsRes.ok) setFloors(await floorsRes.json());

    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        const err = await response.json();
        showAlert(formatErrorMessage(err), "Save Settings", "error");
      }
    } catch (error) {
      console.error("Save failed:", error);
      showAlert(error.message, "Save Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Users
  const handleSaveUser = async (userData) => {
    const payload = { ...userData };
    if (!payload.password) delete payload.password;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;

    setSaving(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
        setShowUserModal(false);
        setEditingUser(null);
        showToast(`User ${editingUser ? "updated" : "created"} successfully!`, "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "User Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "User Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this user?", "Delete User");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("User deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Delete User", "error");
      }
    } catch (e) {
      showAlert(e.message, "Delete User", "error");
    } finally {
      setSaving(false);
    }
  };

  // Terminals
  const handleSaveTerminal = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/terminals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchData();
        setShowTerminalModal(false);
        showToast("Terminal created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Terminal Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Terminal Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerminal = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this terminal?", "Delete Terminal");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/terminals/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("Terminal deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Delete Terminal", "error");
      }
    } catch (e) {
      showAlert(e.message, "Delete Terminal", "error");
    } finally {
      setSaving(false);
    }
  };

  // Categories
  const handleSaveCategory = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchData();
        setShowCategoryModal(false);
        showToast("Category created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Category Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Category Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this category?", "Delete Category");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/products/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Category Settings", "error");
      } else {
        showToast("Category deleted successfully", "success");
        await fetchData();
      }
    } catch (e) {
      showAlert(e.message, "Category Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Floors
  const handleSaveFloor = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/floors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchData();
        setShowFloorModal(false);
        showToast("Floor created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Floor Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Floor Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this floor and all its tables?", "Delete Floor");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/floors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("Floor deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Floor Settings", "error");
      }
    } catch (e) {
      showAlert(e.message, "Floor Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Tables
  const handleSaveTable = async (name, seats) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/floors/${selectedFloorForTable}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, seats })
      });
      if (res.ok) {
        await fetchData();
        setShowTableModal(false);
        setSelectedFloorForTable(null);
        showToast("Table created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Table Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Table Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this table?", "Delete Table");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tables/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("Table deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Table Settings", "error");
      }
    } catch (e) {
      showAlert(e.message, "Table Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "My Cafe", icon: SettingsIcon, desc: "Name, currency & receipts" },
    { id: "users", label: "Team", icon: Users, desc: "Staff & roles" },
    { id: "terminals", label: "POS Devices", icon: Monitor, desc: "Order terminals" },
    { id: "tables", label: "Dine-In Layout", icon: MapPin, desc: "Floors & tables" },
    { id: "payments", label: "Billing", icon: CreditCard, desc: "Payment methods" },
    { id: "categories", label: "Menu Groups", icon: List, desc: "Product categories" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <CoffeeLoader size="lg" text="Loading Settings..." />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* ═══════════════════════════════════════════════════════ */}
      {/*  HERO HEADER                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#FDFCF7] rounded-[40px] p-8 lg:p-12 shadow-[0_4px_20px_rgba(62,43,33,0.02)] border border-[#EBE4D5]/60 overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FCF8F2] text-[#3E2B21] text-sm font-semibold border border-[#EBE4D5]">
              <SettingsIcon className="h-4 w-4" /> Manage Cafe
            </div>
            <h1 className="text-3xl lg:text-[44px] font-black leading-[1.15] text-[#3E2B21] font-serif tracking-tight">
              Manage your cafe
            </h1>
            <p className="text-[#3E2B21]/60 text-base font-medium leading-relaxed max-w-md">
              Manage everything — from branding to billing, team to tables.
            </p>
          </div>
          {(activeTab === "general" || activeTab === "payments") && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm shadow-[0_4px_12px_rgba(62,43,33,0.2)] hover:bg-[#2C1810] transition-colors disabled:opacity-50"
            >
              <Save className="h-4.5 w-4.5" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
        <img
          src="/manage_cafe_hero_1781584566773.png"
          alt="Manage Cafe"
          className="absolute -right-16 -bottom-10 h-[130%] object-contain opacity-20 pointer-events-none"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ═══════════════════════════════════════════════════════ */}
        {/*  SIDEBAR TABS                                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1">
          <div className="rounded-[28px] bg-white border border-[#EBE4D5]/60 shadow-[0_4px_20px_rgba(62,43,33,0.02)] p-3 space-y-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[20px] text-left transition-all duration-200 ${isActive
                    ? "bg-[#3E2B21] text-white shadow-[0_4px_12px_rgba(62,43,33,0.2)]"
                    : "text-[#3E2B21] hover:bg-[#F5EFE6]"
                    }`}
                >
                  <span className={`h-9 w-9 rounded-[14px] flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/15" : "bg-[#F5EFE6] border border-[#EBE4D5]"}`}>
                    <tab.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold leading-tight ${isActive ? "text-white" : "text-[#3E2B21]"}`}>{tab.label}</p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-white/60" : "text-[#3E2B21]/40"}`}>{tab.desc}</p>
                  </div>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  CONTENT                                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3">
          <div className="rounded-[28px] bg-white border border-[#EBE4D5]/60 shadow-[0_4px_20px_rgba(62,43,33,0.02)] p-6 lg:p-8">

            {/* General */}
            {activeTab === "general" && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-[#EBE4D5]/60 pb-6">
                  <div className="h-12 w-12 rounded-[18px] bg-[#F3EDE5] flex items-center justify-center">
                    <SettingsIcon className="h-6 w-6 text-[#6B4423]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#3E2B21]">Cafe Details</h3>
                    <p className="text-[#3E2B21]/40 text-sm font-medium">Your cafe's name, currency, and receipt info.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Cafe Name</label>
                      <input
                        className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21]"
                        placeholder="e.g. Odoo Cafe"
                        value={settings.cafeName || ""}
                        onChange={e => setSettings({ ...settings, cafeName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Currency Symbol</label>
                      <input
                        className="w-32 px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-center font-black text-lg text-[#3E2B21]"
                        placeholder="₹"
                        value={settings.currency || ""}
                        onChange={e => setSettings({ ...settings, currency: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Receipt Footer</label>
                    <textarea
                      className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] min-h-[160px] resize-none"
                      placeholder="e.g. Thank you for visiting! Please visit again."
                      rows={5}
                      value={settings.receiptFooter || ""}
                      onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })}
                    />
                    <p className="text-[11px] text-[#3E2B21]/30 mt-2 font-medium">{settings.receiptFooter?.length || 0}/200 characters</p>
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-[#3E2B21]">Your Team</h3>
                  <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.15)]">
                    <Plus className="h-4 w-4" /> Add Staff
                  </button>
                </div>
                <div className="overflow-hidden rounded-[20px] border border-[#EBE4D5]/60">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FDFCF7] border-b border-[#EBE4D5]/60">
                        {["Name", "Email", "Role", ""].map(h => (
                          <th key={h} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-[#3E2B21]/40">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u.id} className={`hover:bg-[#FDFCF7] transition-colors ${idx !== users.length - 1 ? "border-b border-[#EBE4D5]/40" : ""}`}>
                          <td className="px-6 py-4 font-bold text-[#3E2B21] text-sm">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-[#3E2B21]/60 font-medium">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#F5EFE6] text-[#3E2B21]/60 border border-[#EBE4D5]">{u.role}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="h-8 w-8 rounded-full border border-[#EBE4D5] hover:bg-[#F5EFE6] flex items-center justify-center transition-all">
                                <Edit2 className="h-3.5 w-3.5 text-[#6B4423]" />
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="h-8 w-8 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all">
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terminals */}
            {activeTab === "terminals" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-[#3E2B21]">Order Devices</h3>
                  <button onClick={() => setShowTerminalModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.15)]">
                    <Plus className="h-4 w-4" /> Add Device
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {terminals.map(t => (
                    <div key={t.id} className="p-5 rounded-[20px] border border-[#EBE4D5]/60 flex justify-between items-center bg-[#FDFCF7] hover:shadow-[0_4px_20px_rgba(62,43,33,0.04)] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-[14px] flex items-center justify-center shadow-sm border border-[#EBE4D5]">
                          <Monitor className="h-5 w-5 text-[#6B4423]" />
                        </div>
                        <span className="font-bold text-[#3E2B21] text-sm">{t.name}</span>
                      </div>
                      <button onClick={() => handleDeleteTerminal(t.id)} className="h-8 w-8 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables & Floors */}
            {activeTab === "tables" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-[#3E2B21]">Your Cafe Layout</h3>
                  <button onClick={() => setShowFloorModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.15)]">
                    <Plus className="h-4 w-4" /> Add Floor
                  </button>
                </div>

                <div className="space-y-6">
                  {floors.map(floor => (
                    <div key={floor.id} className="p-6 rounded-[24px] border border-[#EBE4D5]/60 bg-[#FDFCF7] space-y-4">
                      <div className="flex justify-between items-center border-b border-[#EBE4D5]/60 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-[#3E2B21]">{floor.name}</span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F3EDE5] text-[#3E2B21]/50">{floor.tables?.length || 0} tables</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedFloorForTable(floor.id); setShowTableModal(true); }}
                            className="px-3 py-1.5 bg-[#3E2B21] hover:bg-[#2C1810] text-white rounded-[12px] text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Table
                          </button>
                          <button onClick={() => handleDeleteFloor(floor.id)} className="h-8 w-8 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all">
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {floor.tables?.map(table => (
                          <div key={table.id} className="bg-white p-4 rounded-[18px] border border-[#EBE4D5]/60 flex justify-between items-center hover:shadow-sm transition-all">
                            <div>
                              <p className="font-bold text-[#3E2B21] text-sm">{table.name}</p>
                              <p className="text-[11px] text-[#3E2B21]/40 font-medium">{table.seats} Seats • {table.status || 'AVAILABLE'}</p>
                            </div>
                            <button onClick={() => handleDeleteTable(table.id)} className="h-7 w-7 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all">
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                        {(!floor.tables || floor.tables.length === 0) && (
                          <p className="text-[12px] text-[#3E2B21]/30 italic font-medium py-2 col-span-full">No tables on this floor yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {floors.length === 0 && (
                    <div className="text-center py-16">
                      <div className="h-14 w-14 rounded-full bg-[#F5EFE6] flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-7 w-7 text-[#3E2B21]/30" />
                      </div>
                      <p className="text-[#3E2B21]/50 font-bold">No floors created yet</p>
                      <p className="text-sm text-[#3E2B21]/30 font-medium mt-1">Add a floor to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Categories */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-[#3E2B21]">Menu Categories</h3>
                  <button onClick={() => setShowCategoryModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.15)]">
                    <Plus className="h-4 w-4" /> Add Category
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(c => (
                    <div key={c.id} className="p-4 rounded-[20px] border border-[#EBE4D5]/60 flex justify-between items-center hover:shadow-[0_4px_20px_rgba(62,43,33,0.04)] transition-all bg-[#FDFCF7]">
                      <span className="font-bold text-[#3E2B21] text-sm">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#3E2B21]/30 font-medium">{c._count?.products || 0} items</span>
                        <button onClick={() => handleDeleteCategory(c.id)} className="h-7 w-7 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all">
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {activeTab === "payments" && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-[#EBE4D5]/60 pb-6">
                  <div className="h-12 w-12 rounded-[18px] bg-[#F3EDE5] flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-[#6B4423]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#3E2B21]">How Customers Pay</h3>
                    <p className="text-[#3E2B21]/40 text-sm font-medium">Toggle payment methods your cafe accepts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cash */}
                  <div
                    onClick={() => setSettings({ ...settings, cashEnabled: !settings.cashEnabled })}
                    className={`relative overflow-hidden cursor-pointer p-6 rounded-[24px] border-2 transition-all duration-300 ${
                      settings.cashEnabled
                        ? "border-[#3E2B21] bg-[#FDFCF7] shadow-[0_8px_25px_rgba(62,43,33,0.08)]"
                        : "border-[#EBE4D5] bg-white hover:border-[#EBE4D5]/80 grayscale"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className={`h-11 w-11 rounded-[14px] flex items-center justify-center transition-colors ${
                        settings.cashEnabled ? "bg-[#3E2B21] text-white" : "bg-[#F5EFE6] text-[#3E2B21]/40"
                      }`}>
                        <span className="text-xl">💵</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-[#3E2B21] text-sm">Cash</h4>
                          <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${settings.cashEnabled ? "bg-[#3E2B21]" : "bg-[#EBE4D5]"}`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-transform ${settings.cashEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#3E2B21]/40 leading-relaxed">Physical currency at counter.</p>
                      </div>
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => setSettings({ ...settings, digitalEnabled: !settings.digitalEnabled })}
                    className={`relative overflow-hidden cursor-pointer p-6 rounded-[24px] border-2 transition-all duration-300 ${
                      settings.digitalEnabled
                        ? "border-[#3E2B21] bg-[#FDFCF7] shadow-[0_8px_25px_rgba(62,43,33,0.08)]"
                        : "border-[#EBE4D5] bg-white hover:border-[#EBE4D5]/80 grayscale"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className={`h-11 w-11 rounded-[14px] flex items-center justify-center transition-colors ${
                        settings.digitalEnabled ? "bg-[#3E2B21] text-white" : "bg-[#F5EFE6] text-[#3E2B21]/40"
                      }`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-[#3E2B21] text-sm">Card / POS</h4>
                          <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${settings.digitalEnabled ? "bg-[#3E2B21]" : "bg-[#EBE4D5]"}`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-transform ${settings.digitalEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#3E2B21]/40 leading-relaxed">Card swipes via POS machine.</p>
                      </div>
                    </div>
                  </div>

                  {/* UPI */}
                  <div
                    onClick={() => setSettings({ ...settings, upiEnabled: !settings.upiEnabled })}
                    className={`relative overflow-hidden cursor-pointer p-6 rounded-[24px] border-2 transition-all duration-300 ${
                      settings.upiEnabled
                        ? "border-[#3E2B21] bg-[#FDFCF7] shadow-[0_8px_25px_rgba(62,43,33,0.08)]"
                        : "border-[#EBE4D5] bg-white hover:border-[#EBE4D5]/80 grayscale"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className={`h-11 w-11 rounded-[14px] flex items-center justify-center transition-colors ${
                        settings.upiEnabled ? "bg-[#3E2B21] text-white" : "bg-[#F5EFE6] text-[#3E2B21]/40"
                      }`}>
                        <span className="text-xl">📱</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-[#3E2B21] text-sm">UPI / QR</h4>
                          <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${settings.upiEnabled ? "bg-[#3E2B21]" : "bg-[#EBE4D5]"}`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-transform ${settings.upiEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#3E2B21]/40 leading-relaxed">QR via PhonePe, GPay, etc.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {settings.upiEnabled && (
                  <div className="p-6 rounded-[24px] border-2 border-dashed border-[#EBE4D5] bg-[#FDFCF7]">
                    <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Merchant UPI ID</label>
                    <div className="relative max-w-md">
                      <input
                        className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-white font-mono text-sm tracking-wider text-[#3E2B21]"
                        placeholder="merchant@upi"
                        value={settings.upiId || ""}
                        onChange={e => setSettings({ ...settings, upiId: e.target.value })}
                      />
                      {settings.upiId && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-[#3E2B21]/30 font-medium">Used to generate dynamic QR codes at checkout.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  MODALS                                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          saving={saving}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />
      )}
      {showTerminalModal && (
        <InputModal
          title="Add Terminal"
          label="Terminal Name"
          saving={saving}
          onClose={() => setShowTerminalModal(false)}
          onSave={handleSaveTerminal}
        />
      )}
      {showCategoryModal && (
        <InputModal
          title="Add Category"
          label="Category Name"
          saving={saving}
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
        />
      )}
      {showFloorModal && (
        <InputModal
          title="Add Floor"
          label="Floor Name"
          saving={saving}
          onClose={() => setShowFloorModal(false)}
          onSave={handleSaveFloor}
        />
      )}
      {showTableModal && (
        <TableModal
          saving={saving}
          onClose={() => setShowTableModal(false)}
          onSave={handleSaveTable}
        />
      )}
    </div>
  );
}

// --- Sub Components ---

function InputModal({ title, label, onClose, onSave, saving }) {
  const [val, setVal] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-sm shadow-[0_25px_80px_rgba(62,43,33,0.18)]" onClick={e => e.stopPropagation()}>
        <div className="p-8 pb-6 border-b border-[#EBE4D5]/60">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#3E2B21]">{title}</h3>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-[#F5EFE6] hover:bg-[#EBE4D5] flex items-center justify-center transition-colors">
              <X className="h-5 w-5 text-[#6B4423]" />
            </button>
          </div>
        </div>
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">{label}</label>
            <input
              autoFocus
              disabled={saving}
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={val}
              onChange={e => setVal(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onSave(val)}
              disabled={!val || saving}
              className="flex-1 py-3.5 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.2)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onClose} disabled={saving} className="flex-1 py-3.5 rounded-[18px] border-2 border-[#3E2B21] text-[#3E2B21] font-bold text-sm hover:bg-[#3E2B21]/5 transition-colors disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableModal({ onClose, onSave, saving }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("4");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-sm shadow-[0_25px_80px_rgba(62,43,33,0.18)]" onClick={e => e.stopPropagation()}>
        <div className="p-8 pb-6 border-b border-[#EBE4D5]/60">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#3E2B21]">Add Table</h3>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-[#F5EFE6] hover:bg-[#EBE4D5] flex items-center justify-center transition-colors">
              <X className="h-5 w-5 text-[#6B4423]" />
            </button>
          </div>
        </div>
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Table Name</label>
            <input
              autoFocus
              disabled={saving}
              placeholder="e.g. Table 1"
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Seats Count</label>
            <input
              type="number"
              disabled={saving}
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={seats}
              onChange={e => setSeats(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => onSave(name, Number(seats))} disabled={!name || !seats || saving} className="flex-1 py-3.5 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.2)] disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onClose} disabled={saving} className="flex-1 py-3.5 rounded-[18px] border-2 border-[#3E2B21] text-[#3E2B21] font-bold text-sm hover:bg-[#3E2B21]/5 transition-colors disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave, saving }) {
  const [data, setData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "EMPLOYEE",
    password: ""
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-[0_25px_80px_rgba(62,43,33,0.18)]" onClick={e => e.stopPropagation()}>
        <div className="p-8 pb-6 border-b border-[#EBE4D5]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#F3EDE5] flex items-center justify-center">
                <Users className="h-5 w-5 text-[#6B4423]" />
              </div>
              <h3 className="text-xl font-black text-[#3E2B21]">{user ? "Edit User" : "Add New User"}</h3>
            </div>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-[#F5EFE6] hover:bg-[#EBE4D5] flex items-center justify-center transition-colors">
              <X className="h-5 w-5 text-[#6B4423]" />
            </button>
          </div>
        </div>
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Full Name</label>
            <input
              disabled={saving}
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={data.name}
              onChange={e => setData({ ...data, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Email</label>
            <input
              type="email"
              disabled={saving}
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={data.email}
              onChange={e => setData({ ...data, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Role</label>
            <select
              disabled={saving}
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={data.role}
              onChange={e => setData({ ...data, role: e.target.value })}
            >
              <option value="EMPLOYEE">Cashier</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">{user ? "New Password (Optional)" : "Password"}</label>
            <input
              type="password"
              disabled={saving}
              className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              value={data.password}
              onChange={e => setData({ ...data, password: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => onSave(data)} disabled={saving} className="flex-1 py-3.5 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.2)] disabled:opacity-50">
              {saving ? "Saving..." : "Save User"}
            </button>
            <button onClick={onClose} disabled={saving} className="flex-1 py-3.5 rounded-[18px] border-2 border-[#3E2B21] text-[#3E2B21] font-bold text-sm hover:bg-[#3E2B21]/5 transition-colors disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
