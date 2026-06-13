"use client";

import { useCartStore } from "@/stores/cart-store";
import { Plus } from "lucide-react";
import Image from "next/image";

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div 
      className="group relative bg-white rounded-3xl p-3 pb-4 shadow-[0_2px_10px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => addItem(product)}
    >
      <div className="relative aspect-square mb-3 overflow-hidden rounded-2xl bg-gray-50">
         <Image 
            src={product.image} 
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
         />
         {/* Floating Add Button */}
         <div className="absolute bottom-3 right-3 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <Plus className="h-5 w-5 text-gray-900" />
         </div>
      </div>
      
      <div className="px-1">
        <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
        <p className="text-secondary-500 font-bold text-primary-600">₹{product.price.toFixed(2)}</p>
      </div>
    </div>
  );
}
