"use client";

import { useState, useEffect } from "react";
import TableSelectModal from "@/components/pos/TableSelectModal";
import { MapPin, Package, Search, ShoppingCart, RefreshCw, Power, Coffee, User, Plus, Tag, Gift } from "lucide-react";
import CustomerModal from "@/components/pos/CustomerModal";
import CloseSessionModal from "@/components/pos/CloseSessionModal";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { useCartStore } from "@/stores/cart-store";
import CartSidebar from "@/components/pos/cart-sidebar";
import { usePopup } from "@/context/PopupContext";

export default function POSTerminalPage() {
  const { showAlert, showToast } = usePopup();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const { 
    cart, 
    addItem, 
    customer, 
    setCustomer, 
    orderId,
    // Promotions states/functions
    autoApply,
    setAutoApply,
    evaluatedData,
    applyManualPromotion
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const syncTable = () => {
    const tableData = localStorage.getItem('selectedTable');
    if (tableData) {
      setSelectedTable(JSON.parse(tableData));
    } else {
      setSelectedTable(null);
    }
  };

  const [activePromotions, setActivePromotions] = useState([]);
  const [activeOfferPopup, setActiveOfferPopup] = useState(null);
  const [dismissedOffers, setDismissedOffers] = useState([]);

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

  const fetchActivePromotions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promotions/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivePromotions(data);
      }
    } catch (error) {
      console.error("Failed to fetch active promotions:", error);
    }
  };

  useEffect(() => {
    const activeSession = localStorage.getItem('activeSession');
    if (!activeSession) {
      window.location.href = '/pos/session';
      return;
    }
    setSession(JSON.parse(activeSession));

    syncTable();
    window.addEventListener('storage', syncTable);
    window.addEventListener('table-changed', syncTable);

    fetchProducts();
    fetchActivePromotions();

    return () => {
      window.removeEventListener('storage', syncTable);
      window.removeEventListener('table-changed', syncTable);
    };
  }, []);

  // Available offers popup trigger (real time WOW feature)
  useEffect(() => {
    if (evaluatedData && evaluatedData.availableOffers && evaluatedData.availableOffers.length > 0) {
      const firstNewOffer = evaluatedData.availableOffers.find(
        offer => !dismissedOffers.includes(offer.promotionId)
      );
      if (firstNewOffer) {
        setActiveOfferPopup(firstNewOffer);
      } else {
        setActiveOfferPopup(null);
      }
    } else {
      setActiveOfferPopup(null);
    }
  }, [evaluatedData?.availableOffers, dismissedOffers]);

  const handleApplyOffer = (promoId) => {
    applyManualPromotion(promoId);
    if (showToast) showToast("Offer applied successfully!", "success");
    setActiveOfferPopup(null);
  };

  const getProductBadge = (productId) => {
    const promo = activePromotions.find(p => {
      if (p.type === 'PRODUCT_DISCOUNT') {
        return p.products.some(pp => pp.productId === productId && pp.role === 'DISCOUNTED');
      }
      if (p.type === 'BUY_X_GET_Y') {
        return p.conditions.some(pc => pc.triggerProductId === productId);
      }
      if (p.type === 'COMBO') {
        return p.products.some(pp => pp.productId === productId && pp.role === 'COMBO_ITEM');
      }
      return false;
    });

    if (!promo) return null;

    if (promo.type === 'PRODUCT_DISCOUNT') {
      const reward = promo.rewards[0];
      if (reward) {
        return reward.discountType === 'PERCENTAGE' 
          ? `${Number(reward.discountValue)}% OFF` 
          : `₹${Number(reward.discountValue)} OFF`;
      }
    }
    if (promo.type === 'BUY_X_GET_Y') {
      const cond = promo.conditions[0];
      const reward = promo.rewards[0];
      if (cond && reward) {
        if (reward.rewardProductId === cond.triggerProductId) {
          return `Buy ${cond.triggerQuantity} Get ${reward.rewardQuantity}`;
        } else {
          const rProd = products.find(p => p.id === reward.rewardProductId);
          return `Free ${rProd ? rProd.name : 'Drink'}`;
        }
      }
    }
    if (promo.type === 'COMBO') {
      return 'Combo Offer';
    }
    return null;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);

        const uniqueCategories = [...new Set(data.map(p => p.category?.name).filter(Boolean))];
        setCategories(uniqueCategories.map((name, idx) => ({ id: idx, name })));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBorderColor = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('food')) return 'border-b-[#4A148C]';
    if (name.includes('beverage') || name.includes('coffee') || name.includes('drink')) return 'border-b-[#3E2723]';
    if (name.includes('dessert') || name.includes('cake') || name.includes('bakery')) return 'border-b-[#2E7D32]';
    return 'border-b-coffee-600';
  };

  const getCategoryColor = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('food')) return 'bg-purple-900';
    if (name.includes('beverage') || name.includes('coffee') || name.includes('drink')) return 'bg-coffee-800';
    if (name.includes('dessert') || name.includes('cake') || name.includes('pastry')) return 'bg-green-800';
    return 'bg-coffee-600';
  };

  const getProductImageUrl = (product) => {
    if (product?.imageUrl) return product.imageUrl;
    return `https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80`;
  };

  const handleAddAdminComboToCart = (promo) => {
    if (!promo.products || promo.products.length === 0) return;
    
    let addedCount = 0;
    promo.products.forEach(pItem => {
      const prod = products.find(p => p.id === pItem.productId);
      if (prod) {
        addItem(prod);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      if (showToast) showToast(`Added "${promo.name}" items to Cart! Combo offer applied.`, "success");
    } else {
      if (showAlert) showAlert("Combo items could not be found in active product menu.", "Combo Error", "error");
    }
  };

  const handleAddOfferTriggerToCart = (promo) => {
    if (promo.type === 'BUY_X_GET_Y' && promo.conditions?.[0]?.triggerProductId) {
      const triggerProd = products.find(p => p.id === promo.conditions[0].triggerProductId);
      if (triggerProd) {
        const qty = promo.conditions[0].triggerQuantity || 1;
        for (let i = 0; i < qty; i++) {
          addItem(triggerProd);
        }
        if (showToast) showToast(`Added ${triggerProd.name} (x${qty}) to Cart for offer!`, "success");
      }
    }
  };

  const isComboFilter = selectedCategory === "COMBOS_FILTER";
  const isOfferFilter = selectedCategory === "OFFERS_FILTER";

  const adminComboPromos = activePromotions.filter(p => p.type === 'COMBO');
  const adminOfferPromos = activePromotions.filter(p => p.type === 'BUY_X_GET_Y' || p.type === 'PRODUCT_DISCOUNT' || p.type === 'ORDER_VALUE');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === "COMBOS_FILTER") {
      const isComboCat = p.category?.name?.toLowerCase().includes('combo') || p.category?.name?.toLowerCase().includes('special');
      const isComboProduct = activePromotions.some(promo => promo.type === 'COMBO' && promo.products?.some(pp => pp.productId === p.id));
      return matchesSearch && (isComboCat || isComboProduct) && p.isAvailable;
    }

    if (selectedCategory === "OFFERS_FILTER") {
      const hasOfferBadge = getProductBadge(p.id) !== null;
      return matchesSearch && hasOfferBadge && p.isAvailable;
    }

    const matchesCategory = !selectedCategory || p.category?.name === selectedCategory;
    return matchesSearch && matchesCategory && p.isAvailable;
  });

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Left Pane (Fixed header, scrollable cards) */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={setCustomer}
          initialData={customer}
        />

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <CoffeeLoader size="xl" text="Loading Menu..." />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] shadow-md border border-[#E8F5E9] shrink-0">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex items-center gap-3 hover:bg-[#FBFBF2] px-3 py-2 rounded-xl transition-colors group"
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${customer ? 'bg-[#E8F5E9] text-[#1A4D2E]' : 'bg-gray-100 text-gray-500 group-hover:bg-[#FBFBF2] group-hover:text-[#1A4D2E]'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[#5F6F65] font-bold uppercase tracking-wider">Customer</p>
                    <p className={`text-base font-bold ${customer ? 'text-[#1A4D2E]' : 'text-gray-400'}`}>
                      {customer ? customer.name : 'Add Customer'}
                    </p>
                  </div>
                </button>

                <div className="h-8 w-px bg-[#E8F5E9]"></div>

                {/* Table / Service Selector Pill */}
                <button
                  onClick={() => setIsTableModalOpen(true)}
                  className="flex items-center gap-3 hover:bg-[#FBFBF2] px-3 py-2 rounded-xl transition-colors group cursor-pointer"
                  title="Click to select table or switch to takeaway"
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${selectedTable ? 'bg-[#E8F5E9] text-[#1A4D2E]' : 'bg-orange-50 text-orange-600'}`}>
                    {selectedTable ? <MapPin className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[#5F6F65] font-bold uppercase tracking-wider">Service / Table</p>
                    <p className={`text-base font-bold ${selectedTable ? 'text-[#1A4D2E]' : 'text-orange-700'}`}>
                      {selectedTable ? selectedTable.name : 'Takeaway (Select Table)'}
                    </p>
                  </div>
                </button>

                <div className="h-8 w-px bg-[#E8F5E9]"></div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-[#1A4D2E]">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[#5F6F65] font-bold uppercase tracking-wider">Cart</p>
                    <p className="text-base font-bold text-[#1A4D2E]">{cart.length} items</p>
                  </div>
                </div>

                {orderId && (
                  <>
                    <div className="h-8 w-px bg-[#E8F5E9]"></div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-orange-100 text-orange-700 uppercase tracking-wider border border-orange-200">
                      ✏️ Editing Active Order
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Auto Apply Toggle */}
                <button
                  onClick={() => setAutoApply(!autoApply)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    autoApply 
                      ? 'bg-[#E8F5E9] text-[#1A4D2E] border-[#4ADE80]/30 shadow-sm' 
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                  title="Toggle automatic BOGO item additions"
                >
                  <Gift className="h-3.5 w-3.5" />
                  Auto Apply: {autoApply ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => window.location.href = '/pos/cart'}
                  className="px-6 py-3 bg-[#1A4D2E] text-white rounded-[2rem] font-bold hover:bg-[#143d24] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Cart
                </button>
                <button
                  onClick={() => { fetchProducts(); fetchActivePromotions(); }}
                  className="p-2 hover:bg-[#FBFBF2] rounded-xl text-[#5F6F65] transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowCloseSessionModal(true)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2 text-sm"
                >
                  <Power className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#5F6F65] h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, combos, or offers..."
                className="w-full pl-12 pr-4 py-3 rounded-[2rem] border-2 border-[#E8F5E9] focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white shadow-sm font-semibold"
              />
            </div>

            {/* Categories & Dedicated Combo/Offer Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2 shrink-0 scrollbar-none items-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${!selectedCategory ? 'bg-[#1A4D2E] text-white' : 'bg-white text-[#5F6F65] hover:bg-[#FBFBF2] border border-[#E8F5E9]'
                  }`}
              >
                All Menu
              </button>

              {/* Dedicated Admin Combos Filter */}
              <button
                onClick={() => setSelectedCategory("COMBOS_FILTER")}
                className={`px-6 py-2 rounded-full font-black text-sm whitespace-nowrap transition-all shadow-md flex items-center gap-2 ${
                  isComboFilter 
                    ? 'bg-[#3E2B21] text-white ring-2 ring-[#E68A00]' 
                    : 'bg-[#FFF4E5] text-[#B8700A] hover:bg-[#FFE8CC] border border-[#FFE0A3]'
                }`}
              >
                🔥 Combos ({adminComboPromos.length})
              </button>

              {/* Dedicated Admin Offers Filter */}
              <button
                onClick={() => setSelectedCategory("OFFERS_FILTER")}
                className={`px-6 py-2 rounded-full font-black text-sm whitespace-nowrap transition-all shadow-md flex items-center gap-2 ${
                  isOfferFilter 
                    ? 'bg-[#1A4D2E] text-white ring-2 ring-[#4ADE80]' 
                    : 'bg-[#E8F5E9] text-[#1A4D2E] hover:bg-[#D4EDDA] border border-[#A5D6A7]'
                }`}
              >
                🏷️ Offers ({adminOfferPromos.length})
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${selectedCategory === category.name ? 'bg-[#1A4D2E] text-white' : 'bg-white text-[#5F6F65] hover:bg-[#FBFBF2] border border-[#E8F5E9]'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Scrollable Products & Combos Grid */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1A4D2E]/15 scrollbar-track-transparent pb-10 space-y-6">
              
              {/* ADMIN COMBOS CARDS SECTION (Shown when Combos or All filter is selected) */}
              {(isComboFilter || (!selectedCategory && adminComboPromos.length > 0)) && adminComboPromos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#3E2B21] font-serif flex items-center gap-2">
                      <span>🔥 Admin Defined Combos</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF4E5] text-[#B8700A] border border-[#FFE0A3]">1-Click Order</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {adminComboPromos.map((combo) => {
                      const reward = combo.rewards?.[0];
                      const comboPrice = reward?.comboPrice ? Number(reward.comboPrice) : null;
                      const originalSum = combo.products?.reduce((sum, p) => sum + (Number(p.product?.price) || 0), 0);

                      return (
                        <div
                          key={combo.id}
                          className="rounded-[28px] bg-gradient-to-br from-[#FDFCF7] via-white to-[#FFF8E1] border-2 border-[#FFE0A3] p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-3 py-1 rounded-full bg-[#E68A00] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                                COMBO PACKAGE
                              </span>
                              {comboPrice && originalSum > comboPrice && (
                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  Save ₹{(originalSum - comboPrice).toFixed(0)}
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="text-lg font-black text-[#3E2B21] font-serif leading-snug">{combo.name}</h4>
                              {combo.description && (
                                <p className="text-xs text-[#8C8775] font-medium mt-1">{combo.description}</p>
                              )}
                            </div>

                            {/* Items inside combo */}
                            <div className="bg-white/80 rounded-2xl p-3 border border-[#F0EBE1] space-y-1.5">
                              <p className="text-[10px] font-bold text-[#8C8775] uppercase tracking-wider">Included Items:</p>
                              {combo.products?.map((pItem, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-bold text-[#3E2B21]">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="text-emerald-600 shrink-0">✓</span> {pItem.product?.name || 'Item'}
                                  </span>
                                  <span className="text-[#8C8775] shrink-0 ml-2">₹{Number(pItem.product?.price || 0).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer with Price and Full-Width Action Button */}
                          <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] uppercase tracking-wider text-[#8C8775] font-bold">Special Combo Price</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-[#1A4D2E]">
                                  ₹{comboPrice ? comboPrice.toFixed(2) : originalSum.toFixed(2)}
                                </span>
                                {comboPrice && originalSum > comboPrice && (
                                  <span className="text-xs text-gray-400 line-through font-bold">
                                    ₹{originalSum.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddAdminComboToCart(combo)}
                              className="w-full py-3 rounded-full bg-[#1A4D2E] hover:bg-[#143D24] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                            >
                              <Plus className="h-4 w-4" /> Add Combo To Cart
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ADMIN OFFERS SECTION (Shown when Offers filter is selected) */}
              {isOfferFilter && adminOfferPromos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-[#3E2B21] font-serif flex items-center gap-2">
                    <span>🏷️ Active Promotional Offers</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminOfferPromos.map((promo) => (
                      <div
                        key={promo.id}
                        className="rounded-[24px] bg-[#E8F5E9]/50 border border-[#A5D6A7] p-4 flex items-center justify-between gap-4 shadow-xs hover:shadow-md transition-all"
                      >
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1A4D2E] text-white text-[10px] font-black uppercase tracking-wider">
                            {promo.type.replace(/_/g, ' ')}
                          </span>
                          <h4 className="text-base font-black text-[#1A4D2E] mt-1">{promo.name}</h4>
                          {promo.description && (
                            <p className="text-xs text-[#5F6F65] font-medium">{promo.description}</p>
                          )}
                        </div>

                        {promo.type === 'BUY_X_GET_Y' && (
                          <button
                            onClick={() => handleAddOfferTriggerToCart(promo)}
                            className="px-4 py-2 bg-[#1A4D2E] text-white rounded-full text-xs font-black hover:bg-[#143d24] transition-all shadow-sm shrink-0"
                          >
                            Add Trigger Item 🛒
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REGULAR PRODUCTS GRID */}
              <div>
                {isComboFilter && (
                  <h3 className="text-md font-bold text-[#3E2B21] mb-3">Individual Combo Products</h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const categoryColorBg = getCategoryColor(product.category?.name);
                    const categoryFooterClass = getCategoryBorderColor(product.category?.name);

                    return (
                      <div
                        key={product.id}
                        className={`group relative rounded-[24px] bg-white border border-[#EFE8D8] shadow-sm hover:shadow-lg transition-all overflow-hidden border-b-[6px] ${categoryFooterClass} cursor-pointer flex flex-col justify-between`}
                        onClick={() => addItem(product)}
                      >
                        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-[#F9E4C9] via-[#FDF5EA] to-[#E6F4EB] opacity-60" />

                        {/* Image */}
                        <div className="relative h-32 overflow-hidden bg-gray-50">
                          {getProductBadge(product.id) && (
                            <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-[#3E2B21] text-[#FDFCF7] text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {getProductBadge(product.id)}
                            </div>
                          )}
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f291c]/50 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative p-4 flex flex-col gap-2 flex-1 justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5F6F65]/80 flex items-center gap-1.5 font-bold">
                              <span className={`h-1.5 w-1.5 rounded-full ${categoryColorBg}`} />
                              {product.category?.name || "Uncategorized"}
                            </p>
                            <h3 className="text-base font-bold text-[#1A4D2E] mt-1 leading-snug line-clamp-1" title={product.name}>
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-xs text-[#5F6F65] line-clamp-1 mt-0.5">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-end justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-[#A08A6B] font-bold">Price</p>
                              <p className="text-xl font-black text-[#1A4D2E]">
                                ₹{Number(product.price).toFixed(2)}
                              </p>
                            </div>
                            <button
                              className="h-9 w-9 bg-[#1A4D2E] rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(product);
                              }}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredProducts.length === 0 && !isComboFilter && (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-[#E8F5E9] shadow-sm">
                  <p className="text-lg font-bold text-[#1A4D2E]">No products match search criteria.</p>
                  <p className="text-sm text-[#5F6F65] mt-1">Try another keyword or category filter.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Cart Sidebar */}
      {!loading && (
        <CartSidebar onAddCustomer={() => setIsCustomerModalOpen(true)} />
      )}

      {showCloseSessionModal && session && (
        <CloseSessionModal
          session={session}
          onClose={() => setShowCloseSessionModal(false)}
          onConfirm={async (closingCash) => {
            try {
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
              const token = localStorage.getItem('token');

              const response = await fetch(`${API_URL}/sessions/${session.id}/close`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ closingCash })
              });

              if (response.ok) {
                localStorage.removeItem('activeSession');
                localStorage.removeItem('selectedTable');
                window.location.href = '/pos/session';
              } else {
                const err = await response.json();
                showAlert(`Failed to close session: ${formatErrorMessage(err)}`, "Close Session", "error");
              }
            } catch (error) {
              console.error('Error closing session:', error);
              showAlert(`Failed to close session: ${formatErrorMessage(error)}`, "Close Session", "error");
            }
          }}
        />
      )}

      {/* Real-time Offer Available Popup (WOW Feature) */}
      {activeOfferPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-[0_20px_60px_rgba(62,43,33,0.25)] border border-[#EBE4D5] overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
            {/* Header banner */}
            <div className="p-6 bg-gradient-to-br from-[#FDFCF7] to-[#F5EFE6] border-b border-[#EBE4D5] text-center relative">
              <span className="text-4xl">🎉</span>
              <h3 className="text-xl font-black text-[#3E2B21] mt-2 font-serif">Offer Available</h3>
              <p className="text-xs text-[#3E2B21]/60 font-medium">Add matching item or apply discount now!</p>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <div className="px-4 py-5 bg-[#FDFCF7] rounded-2xl border border-[#EBE4D5] shadow-inner">
                <p className="text-lg font-black text-[#3E2B21] tracking-wide font-mono">
                  {activeOfferPopup.message}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleApplyOffer(activeOfferPopup.promotionId)}
                  className="flex-1 py-3.5 rounded-[1.2rem] bg-[#1A4D2E] text-white font-bold text-sm hover:bg-[#143d24] transition-colors shadow-md"
                >
                  Apply Offer
                </button>
                <button
                  onClick={() => {
                    setDismissedOffers(prev => [...prev, activeOfferPopup.promotionId]);
                    setActiveOfferPopup(null);
                  }}
                  className="flex-1 py-3.5 rounded-[1.2rem] border border-[#3E2B21]/20 text-[#3E2B21]/60 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  No, Thanks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onSelectTable={(table) => {
          setSelectedTable(table);
          window.dispatchEvent(new Event('table-changed'));
        }}
        currentTable={selectedTable}
      />
    </div>
  );
}
