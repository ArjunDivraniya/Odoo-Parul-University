"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const PopupContext = createContext(null);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

export const PopupProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmLabel: 'OK',
    cancelLabel: null,
    isConfirm: false,
    resolve: null
  });

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const showAlert = useCallback((message, title = 'Alert', type = 'error') => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type,
        confirmLabel: 'OK',
        cancelLabel: null,
        isConfirm: false,
        resolve
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = 'Confirm Action', type = 'warning', confirmLabel = 'Yes', cancelLabel = 'No') => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type,
        confirmLabel,
        cancelLabel,
        isConfirm: true,
        resolve
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modal.resolve) modal.resolve(true);
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modal.resolve) modal.resolve(false);
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Color styles based on type
  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          text: 'text-emerald-900',
          iconBg: 'bg-emerald-100 text-emerald-700 border border-emerald-200/60',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-emerald-600/20',
          icon: CheckCircle2
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200',
          text: 'text-rose-900',
          iconBg: 'bg-rose-100 text-rose-700 border border-rose-200/60',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-rose-600/20',
          icon: XCircle
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-900',
          iconBg: 'bg-amber-100 text-amber-700 border border-amber-200/60',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-amber-600/20',
          icon: AlertTriangle
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-50 border-sky-200',
          text: 'text-sky-900',
          iconBg: 'bg-[#F5EFE6] text-[#3E2B21] border border-[#EBE4D5]',
          btn: 'bg-[#3E2B21] hover:bg-[#2C1810] text-white focus:ring-[#3E2B21] shadow-[#3E2B21]/20',
          icon: Info
        };
    }
  };

  const modalStyles = getTypeStyles(modal.type);
  const ModalIcon = modalStyles.icon;

  return (
    <PopupContext.Provider value={{ showToast, showAlert, showConfirm }}>
      {children}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const styles = getTypeStyles(toast.type);
            const ToastIcon = styles.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md pointer-events-auto bg-white/95 ${styles.bg}`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${styles.iconBg}`}>
                  <ToastIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm font-semibold text-[#2A1A10] pr-2 leading-snug">
                  {toast.message}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 shrink-0 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal Dialog (Alert / Confirm) */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={modal.isConfirm ? undefined : handleCancel}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] bg-[#FDFCF7] border border-[#EBE4D5] p-7 shadow-2xl pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center">
                {/* Modal Icon */}
                <div className={`mb-4 rounded-2xl p-3.5 shadow-sm ${modalStyles.iconBg}`}>
                  <ModalIcon className="w-8 h-8" />
                </div>

                {/* Modal Title */}
                <h3 className="text-xl font-black text-[#2A1A10] font-serif tracking-tight mb-2">
                  {modal.title}
                </h3>

                {/* Modal Message */}
                <p className="text-sm font-medium text-[#3E2B21]/75 mb-6 whitespace-pre-wrap leading-relaxed">
                  {modal.message}
                </p>

                {/* Buttons Container */}
                <div className="flex w-full items-center justify-center gap-3">
                  {modal.isConfirm && (
                    <button
                      onClick={handleCancel}
                      className="w-full rounded-2xl border border-[#EBE4D5] bg-white hover:bg-[#F5EFE6] py-3 px-5 text-sm font-bold text-[#3E2B21] transition-all transform active:scale-95 shadow-sm focus:outline-none"
                    >
                      {modal.cancelLabel || 'No'}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`w-full rounded-2xl py-3 px-5 text-sm font-bold text-white shadow-md transition-all transform active:scale-95 focus:outline-none ${modalStyles.btn}`}
                  >
                    {modal.confirmLabel || 'OK'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PopupContext.Provider>
  );
};
