import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TermsAndConditionsView } from './TermsContent';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 relative flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00A86B]/20 border border-[#00A86B]/40 rounded-2xl text-[#00A86B]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase leading-none">
                  FORTUNES EDUTECH - TERMS & PRIVACY POLICY
                </h3>
                <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mt-1">
                  Combined Legal Agreement • PACRA BN No.: 320261079581 • ZRA TPIN: 1005958991
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar text-left">
            <TermsAndConditionsView />
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Last updated: 08 October 2026
            </span>
            <button
              onClick={onClose}
              className="bg-[#00A86B] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md"
            >
              I Agree & Understand
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

