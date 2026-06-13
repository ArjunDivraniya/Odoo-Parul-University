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
  Sparkles,
  Leaf,
  Grid,
  ShieldCheck,
} from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const ProductModal = ({ product, onClose, onSave }) => {
    // When editing, clean up the product object:
    // - Strip DB-only variant fields (id, productId, createdAt, updatedAt)
    // - Resolve categoryId from nested category object if needed
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

    // Category mode: 'select' = pick existing, 'new' = type new category name
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
      // Pass newCategoryName alongside formData so handleSaveProduct can create it
      onSave({ ...formData, _newCategoryName: categoryMode === 'new' ? newCategoryName.trim() : null });
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-beige-50 rounded-3xl max-w-2xl w-full max-h-[ 90vh] overflow-y-auto shadow-premium-lg" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-gold-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-coffee-800">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-coffee-600/10 rounded-xl">
                <X className="h-6 w-6 text-coffee-600" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-coffee-700 mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-coffee-700 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-coffee-700 mb-2">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-700 mb-2">Tax (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax || '0'}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Category Field — select existing OR create new */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-coffee-700">Category *</label>
                <div className="flex rounded-xl overflow-hidden border border-coffee-600/20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCategoryMode('select')}
                    className={`px-3 py-1 transition ${
                      categoryMode === 'select'
                        ? 'bg-[#1A4D2E] text-white'
                        : 'bg-white text-coffee-700 hover:bg-coffee-50'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryMode('new')}
                    className={`px-3 py-1 transition ${
                      categoryMode === 'new'
                        ? 'bg-[#1A4D2E] text-white'
                        : 'bg-white text-coffee-700 hover:bg-coffee-50'
                    }`}
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
                  className="w-full px-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none bg-white"
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Cold Brews, Snacks, Combos..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#1A4D2E]/40 focus:border-[#1A4D2E] focus:outline-none bg-white"
                  />
                  <p className="text-xs text-[#5F6F65] mt-1.5">
                    ✨ This will create a new category and assign it to the product.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-5 h-5 rounded border-coffee-600/20"
                />
                <span className="text-sm font-semibold text-coffee-700">Available for Sale</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendToKitchen}
                  onChange={(e) => setFormData({ ...formData, sendToKitchen: e.target.checked })}
                  className="w-5 h-5 rounded border-coffee-600/20"
                />
                <span className="text-sm font-semibold text-coffee-700">Send to Kitchen</span>
              </label>
            </div>

            {/* Image URL Input */}
            <div>
              <label className="block text-sm font-semibold text-coffee-700 mb-1">Image URL (Visual)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="flex-1 input-field"
                />
                {formData.imageUrl && (
                  <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-200">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Paste a link from Unsplash or similar. Leave empty for default.</p>
            </div>

            {/* Variants Section */}
            <div className="border-t border-coffee-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-coffee-700">Variants / Add-ons</label>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="text-xs flex items-center gap-1 text-coffee-600 hover:text-coffee-800 font-semibold"
                >
                  <Plus className="h-3 w-3" /> Add Variant
                </button>
              </div>

              <div className="space-y-3">
                {(formData.variants || []).map((variant, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      placeholder="Name (e.g. Large)"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                      className="flex-[2] px-3 py-2 rounded-xl border border-coffee-600/20 text-sm"
                      required
                    />
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Extra Price"
                        value={variant.extraPrice}
                        onChange={(e) => handleVariantChange(index, "extraPrice", e.target.value)}
                        className="w-full pl-6 pr-3 py-2 rounded-xl border border-coffee-600/20 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(formData.variants || []).length === 0 && (
                  <p className="text-xs text-coffee-400 italic">No variants added (e.g. Sizes, Toppings)</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 btn-primary">
                {product ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleSaveProduct = async (formData) => {
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
          alert(`Failed to create category: ${err.error || 'Unknown error'}`);
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
        name: formData.name,
        description: formData.description,
        price: formData.price,
        tax: formData.tax,
        categoryId: resolvedCategoryId,
        isAvailable: formData.isAvailable,
        sendToKitchen: formData.sendToKitchen,
        imageUrl: formData.imageUrl,
        unit: formData.unit || undefined,
        variants: formData.variants?.map(v => ({
          name: v.name,
          extraPrice: v.extraPrice
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
        fetchProducts();
        setShowAddModal(false);
        setEditingProduct(null);
      } else {
        const err = await response.json();
        console.error("Backend Error:", err);
        alert(`Failed to save product: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(`Failed to save product: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const err = await response.json();
        console.error("Backend Error:", err);
        alert(`Failed to delete product: ${err.error || 'Unknown error'}\n\n(Note: You cannot delete products that are part of existing orders.)`);
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  const getCategoryColor = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('food')) return 'bg-purple-900';
    if (name.includes('beverage') || name.includes('coffee') || name.includes('drink')) return 'bg-coffee-800';
    if (name.includes('dessert') || name.includes('cake') || name.includes('pastry')) return 'bg-green-800';
    return 'bg-coffee-600';
  };

  const getCategoryStyle = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('bakery') || name.includes('dessert') || name.includes('cake')) {
        return 'border-b-[#2E7D32]'; // Dark Green (Desserts)
    }
    if (name.includes('coffee') || name.includes('drink') || name.includes('beverage')) {
        return 'border-b-[#3E2723]'; // Dark Brown (Beverages)
    }
    return 'border-b-[#4A148C]'; // Dark Purple (Food/Default)
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
      accent: "bg-white/80 text-[#1A4D2E]",
    },
    {
      id: "available",
      label: "Available",
      value: menuStats.available,
      hint: "Ready to serve",
      icon: ShieldCheck,
      accent: "bg-[#E7F5EF] text-[#1A4D2E]",
    },
    {
      id: "kitchen",
      label: "Kitchen Queue",
      value: menuStats.kitchen,
      hint: "Auto-send enabled",
      icon: Leaf,
      accent: "bg-[#FBF0DD] text-[#C07826]",
    },
    {
      id: "average",
      label: "Avg. Price",
      value: `₹${menuStats.avgPrice.toFixed(2)}`,
      hint: "Ticket sweet spot",
      icon: DollarSign,
      accent: "bg-[#FFF9ED] text-[#8C5A21]",
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
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#0F291C] via-[#184730] to-[#1C5B3C] text-white p-8 shadow-[0_45px_100px_rgba(10,46,29,0.45)] border border-white/10"
      >
        <div className="absolute inset-0 opacity-70 pointer-events-none">
          <span className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-white/10 blur-[120px]" />
          <span className="absolute right-2 bottom-4 h-48 w-48 rounded-full bg-[#F4B860]/20 blur-[140px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Curate the Odoo Cafe menu
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-black leading-tight">
                Signature beverages & bites, crafted to perfection.
              </h1>
              <p className="text-white/80 text-lg">
                Keep every latte, frappe, and pastry aligned with your cafe&apos;s story. Update availability, pricing, and categories in one elegant interface.
              </p>
            </div>

            <div className="inline-flex gap-3 flex-wrap">
              {[
                { label: "Espresso Bar", value: `${menuStats.available} live items` },
                { label: "Categories", value: `${menuStats.categories} curated` },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm tracking-wide"
                >
                  <span className="text-white/70 mr-2">{chip.label}</span>
                  <span className="font-semibold text-white">{chip.value}</span>
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowAddModal(true);
                }}
                className="px-6 py-3 rounded-2xl bg-white text-[#1A4D2E] font-semibold shadow-[0_15px_45px_rgba(0,0,0,0.2)] flex items-center gap-2"
              >
                <Plus className="h-5 w-5" /> Add new product
              </button>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-[32px] bg-white/10 border border-white/20 p-6 backdrop-blur">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-white/70">Kitchen Queue</p>
                <p className="text-3xl font-black">{menuStats.kitchen}</p>
                <p className="text-xs text-white/60 mt-1">Auto sent to prep</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-white/70">Avg. Price</p>
                <p className="text-3xl font-black">₹{menuStats.avgPrice.toFixed(2)}</p>
                <p className="text-xs text-white/60 mt-1">Ticket blend</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 col-span-2 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Coffee className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-[0.3em]">Menu health</p>
                  <p className="text-lg font-semibold">{menuStats.available} items serving now</p>
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
                  <p className="text-3xl font-black text-[#1A4D2E] mt-2">{stat.value}</p>
                </div>
                <span className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stat.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="text-sm text-[#5F6F65] mt-3">{stat.hint}</p>
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <section className="rounded-[36px] bg-white/95 backdrop-blur border border-white shadow-[0_30px_70px_rgba(26,77,46,0.08)] p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-coffee-600/40 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cappuccino, salted caramel..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none transition-colors bg-white"
            />
          </div>
          <div className="text-sm text-[#5F6F65]">
            Showing <span className="font-semibold text-[#1A4D2E]">{filteredProducts.length}</span> of
            <span className="font-semibold text-[#1A4D2E]"> {products.length}</span> products
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {categoryPills.map((pill) => {
            const isActive = categoryFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition ${isActive
                  ? "bg-[#1A4D2E] text-white border-transparent shadow"
                  : "bg-white text-[#1A4D2E] border-coffee-100 hover:border-coffee-200"
                  }`}
              >
                {pill.name}
                <span
                  className={`h-6 min-w-6 rounded-full text-xs flex items-center justify-center ${isActive ? "bg-white/20" : "bg-coffee-50"
                    }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const categoryColorBg = getCategoryColor(product.category?.name);
          const categoryFooterClass = getCategoryStyle(product.category?.name);

          return (
            <div
              key={product.id}
              className={`group relative rounded-[32px] bg-white border border-[#EFE8D8] shadow-sm hover:shadow-2xl transition-all overflow-hidden border-b-[8px] ${categoryFooterClass}`}
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#F9E4C9] via-[#FDF5EA] to-[#E6F4EB] opacity-90" />
              {/* Product image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f291c]/65 to-transparent" />
              </div>

              <div className="relative p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#5F6F65]/70 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${categoryColorBg}`} />
                      {product.category?.name || "Uncategorized"}
                    </p>
                    <h3 className="text-2xl font-bold text-[#1A4D2E] mt-2 leading-tight">
                      {product.name}
                    </h3>
                  </div>
                  {!product.isAvailable ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                      Paused
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Live
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-[#5F6F65] line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-sm text-[#5F6F65]">
                  <Tag className="h-4 w-4" />
                  <span>{product.category?.name || "Category"}</span>
                  {product.sendToKitchen && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-[#E7F5EF] text-[#1A4D2E]">
                      <ShieldCheck className="h-3 w-3" /> Kitchen
                    </span>
                  )}
                  {product.variants?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      <Grid className="h-3 w-3" /> {product.variants.length} Options
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-[#A08A6B]">Price</p>
                    <p className="text-3xl font-black text-[#1A4D2E]">
                      ₹{Number(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowAddModal(true);
                      }}
                      className="p-2 rounded-2xl border border-[#E1D9C8] hover:bg-[#F9F5EC] transition"
                    >
                      <Edit2 className="h-4 w-4 text-[#5F6F65]" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 rounded-2xl border border-[#F3D7D2] hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 rounded-[32px] bg-gradient-to-br from-[#FFF9F0] to-[#F1F6EF] border border-[#F0E7D5]">
          <Coffee className="h-16 w-16 text-[#C0A074]/40 mx-auto mb-4" />
          <p className="text-[#5F6F65] text-lg">No products match this view</p>
          <p className="text-[#9DA5A0] text-sm">Try another category or keyword.</p>
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
        />
      )}
    </div>
  );
}
