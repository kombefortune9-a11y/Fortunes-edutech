import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, UserCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00A86B]/20 border border-[#00A86B]/40 rounded-2xl text-[#00A86B]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase leading-none">
                  TERMS OF USE & SERVICE AGREEMENT
                </h3>
                <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mt-1">
                  Fortunes Edutech • Plan Competently
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-left text-slate-700 text-xs leading-relaxed">
            
            {/* Banner Notice */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">Open Access & Universal Sign-In Policy</p>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Any user can sign up or log in with a Google / Gmail account or email guest trial seamlessly. All users receive trial or whitelisted access to explore and generate teaching resources under these terms of use.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
                <UserCheck size={14} className="text-[#00A86B]" />
                <span>1. Account Registration & Trial Access</span>
              </div>
              <p className="text-slate-600 pl-5">
                Sign-up and login are open to all educators and users using a standard Google/Gmail account or guest email authorization. Unsubscribed users are automatically granted <strong>Trial Access</strong> to explore the platform and generate curriculum materials across all available tools.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
                <FileText size={14} className="text-[#00A86B]" />
                <span>2. Curriculum Usage & Academic Purpose</span>
              </div>
              <p className="text-slate-600 pl-5">
                All generated schemes of work, weekly forecasts, lesson plans, assessment trackers, and record of work templates are crafted to align with the Ministry of Education and Outcome-Based Curriculum (OBC) standards. Materials generated are for professional classroom teaching and lesson preparation.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
                <Lock size={14} className="text-[#00A86B]" />
                <span>3. Privacy, Data Protection & Firebase Security</span>
              </div>
              <p className="text-slate-600 pl-5">
                Your user profile, authentication credentials, and saved lesson documents are protected using encrypted Google Firebase Authentication and Cloud Firestore security rules. Your personal details will never be sold, rented, or shared with third parties.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
                <HelpCircle size={14} className="text-[#00A86B]" />
                <span>4. Subscriptions & Circle Upgrades</span>
              </div>
              <p className="text-slate-600 pl-5">
                Users wishing to upgrade from Trial Access to extended grade circles or unlimited offline document downloads can subscribe to Fortunes Edutech packages. Whitelisted status grants expanded access per active billing cycle.
              </p>
            </div>

            {/* Acceptable Use */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <p className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest">Acceptable Use Commitment</p>
              <p className="text-slate-500 text-[11px]">
                By clicking "Login with Google" or "Continue as Guest", you confirm acceptance of these Terms of Use and agree to use the Fortunes Edutech platform responsibly for educational development.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Last updated: August 2026
            </span>
            <button
              onClick={onClose}
              className="bg-slate-900 text-white hover:bg-emerald-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
            >
              I Agree & Understand
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
