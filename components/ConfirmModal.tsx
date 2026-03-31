
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-supabase-panel border border-supabase-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-supabase-green/10 text-supabase-green'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-supabase-text uppercase tracking-tight mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-supabase-muted leading-relaxed">
                    {message}
                  </p>
                </div>
                <button 
                  onClick={onCancel}
                  className="text-supabase-muted hover:text-supabase-text transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-black text-supabase-muted uppercase tracking-widest hover:text-supabase-text transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                    isDestructive 
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
                      : 'bg-supabase-green text-black hover:bg-supabase-greenHover shadow-supabase-green/20'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
