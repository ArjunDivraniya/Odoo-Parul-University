"use client";

import { useSettings } from "@/context/SettingsContext";

export default function PrintableReceipt({ order }) {
  const { cafeName = "Odoo Cafe", receiptFooter = "Thank you for your visit!", currency = "₹" } = useSettings();

  if (!order) return null;

  const subtotal = order.items?.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  ) || 0;
  const tax = Number(order.taxAmount) || 0;
  const discount = Number(order.discountAmount) || 0;
  const total = Number(order.totalAmount) || 0;
  const tableName = order.table ? order.table.name : "Takeaway";
  const dateTimeStr = new Date(order.updatedAt || order.createdAt || Date.now()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const paymentMethodDisplay =
    order.payments && order.payments.length > 0
      ? order.payments.map((p) => p.method).join(", ")
      : order.paymentMethod || "PAID";
  const cashierName = order.user?.name || "Cashier";

  return (
    <div id="printable-receipt" className="hidden print:block text-black bg-white">
      <div className="w-[80mm] max-w-full mx-auto p-4 font-mono text-xs leading-tight text-black">
        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h1 className="text-lg font-black uppercase tracking-wider">{cafeName}</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest mt-0.5">Smart POS Point</p>
          <p className="text-[11px] font-bold mt-1 tracking-widest">*** TAX INVOICE ***</p>
        </div>

        {/* Metadata */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="font-bold">Order #:</span>
            <span>{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Date:</span>
            <span>{dateTimeStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Service:</span>
            <span>{tableName}</span>
          </div>
          {order.customerName && (
            <div className="flex justify-between">
              <span className="font-bold">Customer:</span>
              <span>{order.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-bold">Cashier:</span>
            <span>{cashierName}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex font-bold text-[11px] border-b border-black pb-1 mb-1">
            <span className="w-8">QTY</span>
            <span className="flex-1">ITEM</span>
            <span className="w-16 text-right">AMOUNT</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {order.items?.map((item, idx) => {
              const itemTotal = Number(item.price) * item.quantity;
              return (
                <div key={idx} className="flex justify-between items-start">
                  <span className="w-8 font-bold">{item.quantity}x</span>
                  <div className="flex-1 pr-1">
                    <p className="font-bold">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-[9px] text-gray-700">+ {item.variantName}</p>
                    )}
                    {item.notes && (
                      <p className="text-[9px] text-gray-700">Note: {item.notes}</p>
                    )}
                  </div>
                  <span className="w-16 text-right font-bold">
                    {currency}{itemTotal.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-bold">
              <span>Discount:</span>
              <span>-{currency}{discount.toFixed(2)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{currency}{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black border-t border-black pt-1 mt-1">
            <span>TOTAL:</span>
            <span>{currency}{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] pt-1">
            <span>Payment Mode:</span>
            <span className="font-bold uppercase">{paymentMethodDisplay}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 space-y-1 text-[10px]">
          <p className="font-bold">{receiptFooter}</p>
          <p className="text-[9px] text-gray-600 uppercase tracking-widest pt-1">
            Thank you for dining with us!
          </p>
        </div>
      </div>
    </div>
  );
}
