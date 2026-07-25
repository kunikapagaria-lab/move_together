import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'freeze';
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-md text-center relative overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full border border-white/20 bg-white/10 text-white shadow-xl">
              {type === 'freeze' ? <span className="text-3xl">❄️</span> : <AlertCircle className="w-8 h-8 text-white" />}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-xs text-white/70 leading-relaxed mb-6">{message}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl border border-white/10 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-white hover:bg-white/90 text-black font-bold text-xs py-3 rounded-xl shadow-lg transition-all active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
