import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { styles } from '../utils/styles';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    const handleApiError = (e) => addToast(e.detail, 'error');
    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, [addToast]);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              style={{
                backgroundColor: styles.colors.surface,
                border: `1px solid ${toast.type === 'success' ? styles.colors.success : toast.type === 'error' ? styles.colors.danger : styles.colors.primary}`,
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 10px 40px -5px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '380px'
              }}
            >
              {toast.type === 'success' ? <CheckCircle2 color={styles.colors.success} /> : 
               toast.type === 'error' ? <AlertCircle color={styles.colors.danger} /> : <Info color={styles.colors.primary} />}
              <span style={{ fontWeight: 600, fontSize: '14px', color: styles.colors.textMain, flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: styles.colors.secondary, cursor: 'pointer', display: 'flex', padding: 0 }}>
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};
