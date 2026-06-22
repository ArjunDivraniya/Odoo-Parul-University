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
          bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900',
          text: 'text-emerald-800 dark:text-emerald-300',
          iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
          icon: CheckCircle2
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900',
          text: 'text-rose-800 dark:text-rose-300',
          iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
          icon: XCircle
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
          text: 'text-amber-800 dark:text-amber-300',
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
          btn: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500',
          icon: AlertTriangle
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900',
          text: 'text-sky-800 dark:text-sky-300',
          iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400',
          btn: 'bg-coffee-600 hover:bg-coffee-700 text-white focus:ring-coffee-500',
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
      <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
                className={`flex items-start gap-3 p-4 rounded-xl shadow-premium border glass pointer-events-auto ${styles.bg}`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${styles.iconBg}`}>
                  <ToastIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 pr-2">
                  {toast.message}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
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
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#FAF9F6] border border-coffee-200/50 p-6 shadow-premium-lg dark:bg-zinc-900 dark:border-zinc-800 pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center">
                {/* Modal Icon */}
                <div className={`mb-4 rounded-full p-3 ${modalStyles.iconBg}`}>
                  <ModalIcon className="w-8 h-8" />
                </div>

                {/* Modal Title */}
                <h3 className="text-lg font-bold text-coffee-900 dark:text-cream-50 mb-2">
                  {modal.title}
                </h3>

                {/* Modal Message */}
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6 whitespace-pre-wrap leading-relaxed">
                  {modal.message}
                </p>

                {/* Buttons Container */}
                <div className="flex w-full items-center justify-center gap-3">
                  {modal.isConfirm && (
                    <button
                      onClick={handleCancel}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {modal.cancelLabel || 'No'}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 ${modalStyles.btn}`}
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
