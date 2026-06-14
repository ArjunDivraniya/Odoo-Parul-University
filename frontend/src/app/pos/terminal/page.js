"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, RefreshCw, Power, Coffee, User, Plus } from "lucide-react";
import CustomerModal from "@/components/pos/CustomerModal";
import CloseSessionModal from "@/components/pos/CloseSessionModal";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { useCartStore } from "@/stores/cart-store";
import CartSidebar from "@/components/pos/cart-sidebar";
import { usePopup } from "@/context/PopupContext";

export default function POSTerminalPage() {
  const { showAlert } = usePopup();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { cart, addItem, customer, setCustomer, orderId } = useCartStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

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
    const activeSession = localStorage.getItem('activeSession');
    if (!activeSession) {
      window.location.href = '/pos/session';
      return;
    }
    setSession(JSON.parse(activeSession));

    const tableData = localStorage.getItem('selectedTable');
    if (tableData) {
      setSelectedTable(JSON.parse(tableData));
    }

    fetchProducts();
  }, []);

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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category?.name === selectedCategory;
    return matchesSearch && matchesCategory && p.isAvailable;
  });

  const getProductImageUrl = (product) => {
    if (product.imageUrl) return product.imageUrl;
    const query = encodeURIComponent(product?.name || "coffee");
    return `https://source.unsplash.com/collection/139386/800x600/?coffee,${query}`;
  };

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
                <button
                  onClick={() => window.location.href = '/pos/cart'}
                  className="px-6 py-3 bg-[#1A4D2E] text-white rounded-[2rem] font-bold hover:bg-[#143d24] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Cart
                </button>
                <button
                  onClick={() => fetchProducts()}
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
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 rounded-[2rem] border-2 border-[#E8F5E9] focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white shadow-sm font-semibold"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-2 shrink-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
                  !selectedCategory ? 'bg-[#1A4D2E] text-white' : 'bg-white text-[#5F6F65] hover:bg-[#FBFBF2] border border-[#E8F5E9]'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
                    selectedCategory === category.name ? 'bg-[#1A4D2E] text-white' : 'bg-white text-[#5F6F65] hover:bg-[#FBFBF2] border border-[#E8F5E9]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Scrollable Products Grid */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1A4D2E]/15 scrollbar-track-transparent pb-10">
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
              
              {filteredProducts.length === 0 && (
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
    </div>
  );
}
