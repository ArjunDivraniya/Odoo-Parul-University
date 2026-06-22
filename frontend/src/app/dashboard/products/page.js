"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Coffee,
  Tag,
  DollarSign,
  Leaf,
  Grid,
  ShieldCheck,
  Package,
  ArrowUpRight,
} from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function ProductsPage() {
  const { showToast, showAlert, showConfirm } = usePopup();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, categoryFilter, products]);

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
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category?.id === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  /* ═══════════════════════════════════════════════════════ */
  /*  PRODUCT ADD/EDIT MODAL                                */
  /* ═══════════════════════════════════════════════════════ */
  const ProductModal = ({ product, onClose, onSave, saving }) => {
    const initialData = product
      ? {
          ...product,
          categoryId: product.categoryId || product.category?.id || '',
          variants: (product.variants || []).map(v => ({
            name: v.name,
            extraPrice: Number(v.extraPrice) || 0
          }))
        }
      : {
          name: '',
          description: '',
          price: '',
          categoryId: '',
          isAvailable: true,
          sendToKitchen: false,
          tax: '0',
          imageUrl: '',
          variants: []
        };

    const [formData, setFormData] = useState(initialData);
    const [categoryMode, setCategoryMode] = useState('select');
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleAddVariant = () => {
      setFormData({
        ...formData,
        variants: [...(formData.variants || []), { name: '', extraPrice: 0 }]
      });
    };

    const handleRemoveVariant = (index) => {
      const newVariants = [...(formData.variants || [])];
      newVariants.splice(index, 1);
      setFormData({ ...formData, variants: newVariants });
    };

    const handleVariantChange = (index, field, value) => {
      const newVariants = [...(formData.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      setFormData({ ...formData, variants: newVariants });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Client-side validations
      if (!formData.name || !formData.name.trim()) {
        showAlert("Product Name is required.", "Validation Error", "error");
        return;
      }
      if (Number(formData.price) <= 0 || isNaN(Number(formData.price))) {
        showAlert("Price must be a positive number.", "Validation Error", "error");
        return;
      }
      if (Number(formData.tax) < 0 || isNaN(Number(formData.tax))) {
        showAlert("Tax must be a non-negative number.", "Validation Error", "error");
        return;
      }
      if (categoryMode === 'select' && !formData.categoryId) {
        showAlert("Please select a category.", "Validation Error", "error");
        return;
      }
      if (categoryMode === 'new' && !newCategoryName.trim()) {
        showAlert("New Category Name is required.", "Validation Error", "error");
        return;
      }
      
      // Validate variants
      if (formData.variants && formData.variants.length > 0) {
        for (let i = 0; i < formData.variants.length; i++) {
          const v = formData.variants[i];
          if (!v.name || !v.name.trim()) {
            showAlert(`Variant #${i + 1} must have a name.`, "Validation Error", "error");
            return;
          }
          if (Number(v.extraPrice) < 0 || isNaN(Number(v.extraPrice))) {
            showAlert(`Variant #${i + 1} extra price must be non-negative.`, "Validation Error", "error");
            return;
          }
        }
      }

      onSave({ ...formData, _newCategoryName: categoryMode === 'new' ? newCategoryName.trim() : null });
    };

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={saving ? undefined : onClose}>
        <div
          className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_25px_80px_rgba(62,43,33,0.18)]"
          onClick={(e) => e.stopPropagation()}
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Header */}
          <div className="p-8 pb-6 border-b border-[#EBE4D5]/60 sticky top-0 bg-white rounded-t-[32px] z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#F3EDE5] flex items-center justify-center">
                  <Package className="h-5 w-5 text-[#6B4423]" />
                </div>
                <h2 className="text-xl font-black text-[#3E2B21]">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button onClick={onClose} disabled={saving} className="h-10 w-10 rounded-full bg-[#F5EFE6] hover:bg-[#EBE4D5] flex items-center justify-center transition-colors disabled:opacity-50">
                <X className="h-5 w-5 text-[#6B4423]" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={saving}
                className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={saving}
                className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] resize-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  disabled={saving}
                  className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Tax (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax || '0'}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  disabled={saving}
                  className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
                />
              </div>
            </div>

            {/* Category Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase">Category *</label>
                <div className="flex rounded-full overflow-hidden border border-[#EBE4D5] text-[11px] font-bold">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setCategoryMode('select')}
                    className={`px-3 py-1.5 transition-all ${
                      categoryMode === 'select'
                        ? 'bg-[#3E2B21] text-white'
                        : 'bg-[#FDFCF7] text-[#3E2B21]/60 hover:bg-[#F5EFE6]'
                    } disabled:opacity-50`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setCategoryMode('new')}
                    className={`px-3 py-1.5 transition-all ${
                      categoryMode === 'new'
                        ? 'bg-[#3E2B21] text-white'
                        : 'bg-[#FDFCF7] text-[#3E2B21]/60 hover:bg-[#F5EFE6]'
                    } disabled:opacity-50`}
                  >
                    + Create New
                  </button>
                </div>
              </div>

              {categoryMode === 'select' ? (
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  disabled={saving}
                  className="w-full px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="e.g. Cold Brews, Snacks, Combos..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    disabled={saving}
                    className="w-full px-4 py-3.5 rounded-[18px] border border-[#3E2B21]/20 focus:border-[#3E2B21]/40 focus:outline-none bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
                  />
                  <p className="text-[11px] text-[#3E2B21]/40 mt-1.5 font-medium">
                    ✨ This will create a new category and assign it to the product.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  disabled={saving}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-[#EBE4D5] accent-[#3E2B21] disabled:opacity-50"
                />
                <span className="text-sm font-semibold text-[#3E2B21]/70">Available for Sale</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendToKitchen}
                  disabled={saving}
                  onChange={(e) => setFormData({ ...formData, sendToKitchen: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-[#EBE4D5] accent-[#3E2B21] disabled:opacity-50"
                />
                <span className="text-sm font-semibold text-[#3E2B21]/70">Send to Kitchen</span>
              </label>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2">Image URL</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl || ''}
                  disabled={saving}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="flex-1 px-4 py-3.5 rounded-[18px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] disabled:opacity-50"
                />
                {formData.imageUrl && (
                  <div className="h-12 w-12 rounded-[14px] overflow-hidden border border-[#EBE4D5] shrink-0">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#3E2B21]/30 mt-1.5 font-medium">Paste a link from Unsplash or similar.</p>
            </div>

            {/* Variants */}
            <div className="border-t border-[#EBE4D5]/60 pt-5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase">Variants / Add-ons</label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleAddVariant}
                  className="text-[12px] flex items-center gap-1.5 text-[#6B4423] hover:text-[#3E2B21] font-bold transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Variant
                </button>
              </div>

              <div className="space-y-3">
                {(formData.variants || []).map((variant, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Name (e.g. Large)"
                      value={variant.name}
                      disabled={saving}
                      onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                      className="flex-[2] px-3.5 py-2.5 rounded-[14px] border border-[#EBE4D5] text-sm font-medium bg-[#FDFCF7] text-[#3E2B21] disabled:opacity-50"
                      required
                    />
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3E2B21]/30 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Extra"
                        value={variant.extraPrice}
                        disabled={saving}
                        onChange={(e) => handleVariantChange(index, "extraPrice", e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 rounded-[14px] border border-[#EBE4D5] text-sm font-medium bg-[#FDFCF7] text-[#3E2B21] disabled:opacity-50"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleRemoveVariant(index)}
                      className="h-9 w-9 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
                {(formData.variants || []).length === 0 && (
                  <p className="text-[12px] text-[#3E2B21]/30 italic font-medium">No variants added (e.g. Sizes, Toppings)</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm hover:bg-[#2C1810] transition-colors shadow-[0_4px_12px_rgba(62,43,33,0.2)] disabled:opacity-50"
              >
                {saving ? (product ? 'Updating...' : 'Saving...') : (product ? 'Update Product' : 'Add Product')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="flex-1 py-3.5 rounded-[18px] border-2 border-[#3E2B21] text-[#3E2B21] font-bold text-sm hover:bg-[#3E2B21]/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleSaveProduct = async (formData) => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      // Step 1: If user wants to create a new category, do that first
      let resolvedCategoryId = formData.categoryId;

      if (formData._newCategoryName) {
        const catResponse = await fetch(`${API_URL}/products/categories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: formData._newCategoryName })
        });

        if (!catResponse.ok) {
          const err = await catResponse.json();
          showAlert(`Failed to create category: ${err.error || 'Unknown error'}`, "Category Creation", "error");
          return;
        }

        const newCategory = await catResponse.json();
        resolvedCategoryId = newCategory.id;

        // Sync the categories list in the UI immediately
        setCategories(prev => [...prev, newCategory]);
      }

      // Step 2: Save the product with the resolved categoryId
      const url = editingProduct
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : null,
        price: Number(formData.price),
        tax: Number(formData.tax) || 0,
        categoryId: resolvedCategoryId,
        isAvailable: formData.isAvailable,
        sendToKitchen: formData.sendToKitchen,
        imageUrl: formData.imageUrl ? formData.imageUrl.trim() : null,
        unit: formData.unit || undefined,
        variants: formData.variants?.map(v => ({
          name: v.name.trim(),
          extraPrice: Number(v.extraPrice) || 0
        }))
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchProducts();
        setShowAddModal(false);
        setEditingProduct(null);
        showToast("Product saved successfully!", "success");
      } else {
        const err = await response.json();
        console.error("Backend Error:", err);
        showAlert(`Failed to save product: ${err.error || 'Unknown error'}`, "Save Product", "error");
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      showAlert(`Failed to save product: ${error.message}`, "Save Product", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this product?', 'Delete Product');
    if (!confirmed) return;

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast("Product deleted successfully!", "success");
        await fetchProducts();
      } else {
        const err = await response.json();
        console.error("Backend Error:", err);
        showAlert(
          `Failed to delete product: ${err.error || 'Unknown error'}\n\n(Note: You cannot delete products that are part of existing orders.)`,
          "Delete Product",
          "error"
        );
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      showAlert(`Failed to delete product: ${error.message}`, "Delete Product", "error");
    } finally {
      setSaving(false);
    }
  };

  const getProductImageUrl = (product) => {
    if (product.imageUrl) return product.imageUrl;
    const query = encodeURIComponent(product?.name || "coffee");
    return `https://source.unsplash.com/collection/139386/800x600/?coffee,${query}`;
  };

  const menuStats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable).length;
    const kitchen = products.filter((p) => p.sendToKitchen).length;
    const categorySet = new Set(products.map((p) => p.category?.id).filter(Boolean));
    const avgPrice =
      total > 0
        ? products.reduce((sum, p) => sum + Number(p.price || 0), 0) / total
        : 0;

    return {
      total,
      available,
      kitchen,
      categories: categorySet.size,
      avgPrice,
    };
  }, [products]);

  const categoryPills = useMemo(() => {
    const pills = [
      {
        id: "all",
        name: "All Menu",
        count: products.length,
      },
    ];

    categories.forEach((cat) => {
      pills.push({
        id: cat.id,
        name: cat.name,
        count: products.filter((p) => p.category?.id === cat.id).length,
      });
    });

    return pills;
  }, [categories, products]);

  const quickStats = useMemo(() => [
    {
      id: "inventory",
      label: "Menu Items",
      value: menuStats.total,
      hint: "Active across the cafe",
      icon: Grid,
      iconBg: "bg-[#F3EDE5]",
      iconColor: "text-[#6B4423]",
    },
    {
      id: "available",
      label: "Available",
      value: menuStats.available,
      hint: "Ready to serve",
      icon: ShieldCheck,
      iconBg: "bg-[#E8F5E9]",
      iconColor: "text-[#2E7D32]",
    },
    {
      id: "kitchen",
      label: "Kitchen Queue",
      value: menuStats.kitchen,
      hint: "Auto-send enabled",
      icon: Leaf,
      iconBg: "bg-[#FFF4E5]",
      iconColor: "text-[#E68A00]",
    },
    {
      id: "average",
      label: "Avg. Price",
      value: `₹${menuStats.avgPrice.toFixed(2)}`,
      hint: "Ticket sweet spot",
      icon: DollarSign,
      iconBg: "bg-[#FFF8E1]",
      iconColor: "text-[#F9A825]",
    },
  ], [menuStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CoffeeLoader size="lg" text="Loading Products..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════ */}
      {/*  HERO SECTION                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Left — Hero Text */}
        <div className="relative flex-1 bg-[#FDFCF7] rounded-[40px] p-8 lg:p-12 shadow-[0_4px_20px_rgba(62,43,33,0.02)] border border-[#EBE4D5]/60 overflow-hidden flex flex-col justify-center min-h-[220px]">
          <div className="relative z-10 max-w-lg space-y-5">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FCF8F2] text-[#3E2B21] text-sm font-semibold border border-[#EBE4D5]">
              <Coffee className="h-4 w-4" /> Product Catalog
            </div>

            <div>
              <h1 className="text-3xl lg:text-[44px] font-black leading-[1.15] text-[#3E2B21] font-serif tracking-tight">
                Signature beverages & bites.
              </h1>
              <p className="text-[#3E2B21]/60 text-base mt-3 font-medium leading-relaxed max-w-md">
                Curate your menu, manage pricing, and keep every latte and pastry aligned with your cafe&apos;s story.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[18px] bg-[#3E2B21] text-white font-bold text-sm shadow-[0_4px_12px_rgba(62,43,33,0.2)] hover:bg-[#2C1810] transition-colors"
            >
              <Plus className="h-4.5 w-4.5" /> Add new product
            </button>
          </div>

          <img
            src="/products_hero_1781584303220.png"
            alt="Coffee"
            className="absolute -right-16 -bottom-10 h-[130%] object-contain opacity-30 pointer-events-none"
          />
        </div>

        {/* Right — Stats Summary */}
        <div className="w-full xl:w-[380px] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] flex flex-col justify-center">
              <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Menu Items</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-[28px] font-black text-[#3E2B21] leading-none">{menuStats.total}</p>
                <div className="h-9 w-9 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#6B4423]">
                  <Grid className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] flex flex-col justify-center">
              <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Available</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-[28px] font-black text-[#3E2B21] leading-none">{menuStats.available}</p>
                <div className="h-9 w-9 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)]">
            <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Kitchen Queue</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[28px] font-black text-[#3E2B21] leading-none">{menuStats.kitchen}</p>
              <div className="flex items-center gap-1 text-[#E68A00]">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-xs font-bold">Auto-sent</span>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-[#EBE4D5] p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)]">
            <p className="text-[#3E2B21]/50 text-[12px] font-bold tracking-wide">Avg. Price</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[28px] font-black text-[#3E2B21] leading-none">₹{menuStats.avgPrice.toFixed(2)}</p>
              <div className="h-9 w-9 rounded-full bg-[#FFF8E1] flex items-center justify-center text-[#F9A825]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  QUICK STATS                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="rounded-[28px] bg-white p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] border border-[#EBE4D5]/60 hover:shadow-[0_8px_30px_rgba(62,43,33,0.06)] transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-[#3E2B21]/50 tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-black text-[#3E2B21] mt-1">{stat.value}</p>
                  <p className="text-[11px] text-[#3E2B21]/40 font-medium mt-1.5">{stat.hint}</p>
                </div>
                <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  FILTERS & SEARCH                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="rounded-[32px] bg-white border border-[#EBE4D5]/60 shadow-[0_4px_20px_rgba(62,43,33,0.02)] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3E2B21]/30 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cappuccino, salted caramel..."
              className="w-full pl-12 pr-4 py-3.5 rounded-[20px] border border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:outline-none focus:ring-2 focus:ring-[#3E2B21]/10 transition-all bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/30"
            />
          </div>
          <div className="text-sm text-[#3E2B21]/50 font-medium">
            Showing <span className="font-bold text-[#3E2B21]">{filteredProducts.length}</span> of
            <span className="font-bold text-[#3E2B21]"> {products.length}</span> products
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryPills.map((pill) => {
            const isActive = categoryFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all duration-200 ${isActive
                  ? "bg-[#3E2B21] text-white shadow-[0_4px_12px_rgba(62,43,33,0.2)]"
                  : "bg-[#FDFCF7] text-[#3E2B21]/70 border border-[#EBE4D5] hover:border-[#3E2B21]/20 hover:text-[#3E2B21]"
                  }`}
              >
                {pill.name}
                <span
                  className={`h-5 min-w-5 rounded-full text-[10px] flex items-center justify-center px-1.5 font-bold ${isActive ? "bg-white/20 text-white" : "bg-[#F3EDE5] text-[#3E2B21]/50"
                    }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  PRODUCTS GRID                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          return (
            <div
              key={product.id}
              className="group relative rounded-[28px] bg-white border border-[#EBE4D5]/60 shadow-[0_4px_20px_rgba(62,43,33,0.02)] hover:shadow-[0_12px_40px_rgba(62,43,33,0.08)] transition-all duration-300 overflow-hidden"
            >
              {/* Product image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  {!product.isAvailable ? (
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-50/90 text-red-600 border border-red-100 backdrop-blur-sm">
                      Paused
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/90 text-[#2E7D32] border border-[#A5D6A7]/50 backdrop-blur-sm">
                      Live
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
                {/* Category */}
                <p className="text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase">
                  {product.category?.name || "Uncategorized"}
                </p>

                {/* Name */}
                <h3 className="text-lg font-black text-[#3E2B21] leading-tight">
                  {product.name}
                </h3>

                {product.description && (
                  <p className="text-[13px] text-[#3E2B21]/50 line-clamp-2 font-medium leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {product.sendToKitchen && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FFF4E5] text-[#B8700A] border border-[#FFE0A3]">
                      <ShieldCheck className="h-3 w-3" /> Kitchen
                    </span>
                  )}
                  {product.variants?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F3EDE5] text-[#6B4423] border border-[#EBE4D5]">
                      <Grid className="h-3 w-3" /> {product.variants.length} Options
                    </span>
                  )}
                </div>

                {/* Price + Actions */}
                <div className="flex items-end justify-between pt-2 border-t border-[#EBE4D5]/60">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#3E2B21]/30 font-bold">Price</p>
                    <p className="text-2xl font-black text-[#3E2B21]">
                      ₹{Number(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowAddModal(true);
                      }}
                      disabled={saving}
                      className="h-9 w-9 rounded-full border border-[#EBE4D5] hover:border-[#3E2B21]/20 hover:bg-[#F5EFE6] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#6B4423]" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={saving}
                      className="h-9 w-9 rounded-full border border-red-100 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-24 rounded-[32px] bg-white border border-[#EBE4D5]/60 shadow-[0_4px_20px_rgba(62,43,33,0.02)]">
          <div className="h-16 w-16 rounded-full bg-[#F5EFE6] flex items-center justify-center mx-auto mb-4">
            <Coffee className="h-8 w-8 text-[#3E2B21]/30" />
          </div>
          <p className="text-[#3E2B21]/60 text-lg font-bold">No products match this view</p>
          <p className="text-sm text-[#3E2B21]/40 font-medium mt-1">Try another category or keyword.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          saving={saving}
        />
      )}
    </div>
  );
}
