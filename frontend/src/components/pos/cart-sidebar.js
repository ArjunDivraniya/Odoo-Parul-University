"use client";

import { useCartStore } from "@/stores/cart-store";
import { Trash2, Minus, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartSidebar() {
  const { cart, removeItem, addItem, decreaseQuantity, clearCart } = useCartStore();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  return (
    <aside className="w-[400px] bg-white border-l border-gray-100 flex flex-col z-10 shadow-xl">
      <div className="p-6 pb-4 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Current Order</h2>
        <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-400">Order #04652</p>
            <button 
                onClick={clearCart} 
                className="text-xs font-semibold text-red-500 hover:text-red-600 uppercase tracking-wide px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
                Clear
            </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <List className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900">No items yet</p>
                <p className="text-sm text-gray-500 max-w-[150px]">Choose products from the grid to get started.</p>
            </div>
        ) : (
            cart.map((item) => (
            <div key={item.id} className="flex gap-4 group">
                <div className="h-16 w-16 bg-gray-50 rounded-xl overflow-hidden relative shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 truncate pr-2">{item.name}</h4>
                        <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-full h-8 px-1">
                            <button 
                                onClick={() => decreaseQuantity(item.id)}
                                className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            >
                                <Minus className="h-3 w-3 text-gray-600" />
                            </button>
                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                            <button 
                                onClick={() => addItem(item)}
                                className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            >
                                <Plus className="h-3 w-3 text-gray-600" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400">${item.price.toFixed(2)} / ea</p>
                    </div>
                </div>
            </div>
            ))
        )}
      </div>

      {/* Summary Section */}
      <div className="p-6 bg-gray-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
         <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
                <span>Tax (10%)</span>
                <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span className="text-primary-600">${total.toFixed(2)}</span>
            </div>
         </div>

         <Button className="w-full h-14 text-lg shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all">
             Pay ${total.toFixed(2)}
         </Button>
      </div>
    </aside>
  );
}

function List({className}) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
    )
}
