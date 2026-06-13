"use client";

import { useState } from "react";
import { X, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default function CloseSessionModal({ session, onClose, onConfirm }) {
  const [closingCash, setClosingCash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const expectedCash = Number(session.openingCash || 0);
  const actualCash = Number(closingCash || 0);
  const discrepancy = actualCash - expectedCash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirm(closingCash);
    setIsSubmitting(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-beige-50 rounded-3xl max-w-lg w-full shadow-premium-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-coffee-800">Close Session</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-coffee-600/10 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-coffee-600" />
            </button>
          </div>
          <p className="text-coffee-600/60 mt-1">Reconcile cash and end your shift</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Session Info */}
          <div className="bg-beige-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-coffee-600/60">Terminal</span>
              <span className="font-semibold text-coffee-800">{session.terminal?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-coffee-600/60">Started At</span>
              <span className="font-semibold text-coffee-800">
                {new Date(session.startAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-coffee-600/60">Opening Cash</span>
              <span className="font-semibold text-coffee-800">₹{expectedCash.toFixed(2)}</span>
            </div>
          </div>

          {/* Closing Cash Input */}
          <div>
            <label className="block text-sm font-semibold text-coffee-700 mb-2">
              Closing Cash Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-coffee-600/60 h-5 w-5 font-bold flex items-center justify-center">₹</span>
              <input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                required
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-coffee-600/20 focus:border-coffee-600 focus:outline-none bg-white text-lg font-semibold"
              />
            </div>
          </div>

          {/* Dis crepancy Display */}
          {closingCash && (
            <div className={`p-4 rounded-2xl ${
              Math.abs(discrepancy) < 0.01 
                ? 'bg-sage-500/10' 
                : 'bg-orange-100'
            }`}>
              <div className="flex items-center gap-3">
                {Math.abs(discrepancy) < 0.01 ? (
                  <TrendingUp className="h-6 w-6 text-sage-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm text-coffee-800">Cash Discrepancy</p>
                  <p className={`text-lg font-bold ${
                    Math.abs(discrepancy) < 0.01 
                      ? 'text-sage-600' 
                      : discrepancy > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                  }`}>
                    {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)}
                  </p>
                </div>
              </div>
              {Math.abs(discrepancy) >= 0.01 && (
                <p className="text-sm text-coffee-600/60 mt-2">
                  {discrepancy > 0 
                    ? 'You have extra cash in the drawer.' 
                    : 'There is a cash shortage.'}
                </p>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> Closing the session will end your shift and you won't be able to process new orders until a new session is opened.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!closingCash || isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
