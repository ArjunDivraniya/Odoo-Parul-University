"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { usePopup } from "@/context/PopupContext";
import { Gift } from "lucide-react";

export default function ComboPanel() {
  const { addCombo, addItem, addComboItem } = useCartStore();
  const { showToast, showAlert } = usePopup();
  const [combos, setCombos] = useState([]);
  const [productsMap, setProductsMap] = useState({}); // productId -> product object
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
        const token = localStorage.getItem("token");
        // Fetch promotions
        const promosRes = await fetch(`${API_URL}/promotions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const promosData = promosRes.ok ? await promosRes.json() : [];
        const comboPromos = promosData.filter(p => p.type === "COMBO" && p.isActive);

        // Fetch all products for lookup
        const prodRes = await fetch(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const prodData = prodRes.ok ? await prodRes.json() : [];
        const map = {};
        prodData.forEach(p => {
          map[p.id] = p;
        });

        setCombos(comboPromos);
        setProductsMap(map);
      } catch (e) {
        console.error(e);
        showAlert("Failed to load combo promotions.", "Error", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddCombo = async (combo) => {
    if (addingId) return; // prevent duplicate
    setAddingId(combo.id);
    try {
      const comboProducts = (combo.products || []).map(item => {
        const productInfo = productsMap[item.productId];
        return {
          product: {
            id: productInfo?.id,
            name: productInfo?.name || "Unknown",
            price: productInfo?.price || 0,
            imageUrl: productInfo?.imageUrl,
            category: productInfo?.category ? { name: productInfo.category.name } : undefined
          },
          variant: null
        };
      });
      const comboPrice = combo.rewards?.[0]?.comboPrice ?? comboProducts.reduce((sum, p) => sum + (p.product.price || 0), 0);
      await addComboItem(combo.id, combo.name, comboPrice);
      showToast(`Combo "${combo.name}" added to cart!`, "success");
    } catch (e) {
      console.error(e);
      showAlert("Failed to add combo.", "Error", "error");
    } finally {
      setAddingId(null);
    }
  };

  const handleAddSingleItem = (productId) => {
    const productInfo = productsMap[productId];
    if (!productInfo) {
      showAlert("Product data not found.", "Error", "error");
      return;
    }
    addItem({
      id: productInfo.id,
      name: productInfo.name,
      price: productInfo.price,
      imageUrl: productInfo.imageUrl,
      category: productInfo.category ? { name: productInfo.category.name } : undefined
    }, null);
    showToast(`${productInfo.name} added to cart!`, "success");
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-[#5F6F65]">Loading combos…</div>
    );
  }

  if (combos.length === 0) {
    return null; // No combos to display
  }

  return (
    <div className="p-4 border-t border-[#E8F5E9] bg-[#FBFBF2]">
      <h3 className="text-lg font-black text-[#1A4D2E] mb-3 flex items-center gap-2">
        <Gift className="h-5 w-5 text-[#6B4423]" /> Combo Offers
      </h3>
      {combos.map(combo => (
        <div key={combo.id} className="mb-4 p-3 rounded-xl border border-[#E8F5E9] bg-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-[#1A4D2E]">{combo.name}</p>
              {combo.description && (
                <p className="text-xs text-[#5F6F65]">{combo.description}</p>
              )}
              {/* Combo price if provided in rewards */}
              {combo.rewards && combo.rewards[0] && combo.rewards[0].comboPrice !== undefined && (
                <p className="text-sm text-[#1A4D2E] mt-1">Price: ₹{Number(combo.rewards[0].comboPrice).toFixed(2)}</p>
              )}
              <ul className="mt-2 text-xs text-[#5F6F65] list-disc list-inside">
                {(combo.products || []).map((p, i) => (
                  <li key={i} className="flex items-center justify-between">
                    {productsMap[p.productId]?.name || p.productId}
                    <button
                      onClick={() => handleAddSingleItem(p.productId)}
                      className="ml-2 text-xs text-[#1A4D2E] underline"
                    >Add</button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleAddCombo(combo)}
              disabled={addingId === combo.id}
              className={`ml-4 px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${addingId === combo.id ? "bg-gray-300 text-gray-600" : "bg-[#1A4D2E] text-white hover:bg-[#143d24]"}`}
            >
              {addingId === combo.id ? "Adding…" : "Add Combo"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
