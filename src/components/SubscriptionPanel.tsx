import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  CreditCard, 
  Calendar, 
  History, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Shield, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  Receipt,
  HelpCircle,
  TrendingUp,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { SUBSCRIPTION_PLANS } from '../constants';
import toast from 'react-hot-toast';

interface SubscriptionPanelProps {
  onOpenUpgradeModal?: () => void;
}

export function SubscriptionPanel({ onOpenUpgradeModal }: SubscriptionPanelProps) {
  const { user, isWhitelisted, subscriptionDetails, circleDownloadsCount } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [activeLicense, setActiveLicense] = useState<any>(null);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingLicense, setLoadingLicense] = useState(true);

  const cleanEmail = user?.email?.toLowerCase().trim().replace(/\s+/g, '') || '';

  // Helper to safely convert Firestore timestamps
  const safeToDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  useEffect(() => {
    if (!user || !user.uid) {
      setLoadingRequests(false);
      return;
    }

    setLoadingRequests(true);
    const path = 'subscription_requests';
    
    // Subscribe to real-time subscription requests for current user
    const q = query(
      collection(db, path),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by timestamp descending
      list.sort((a, b) => {
        const dateA = safeToDate(a.timestamp)?.getTime() || 0;
        const dateB = safeToDate(b.timestamp)?.getTime() || 0;
        return dateB - dateA;
      });
      setRequests(list);
      setLoadingRequests(false);
    }, (error) => {
      console.warn("Error fetching user's subscription requests:", error);
      setLoadingRequests(false);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {}
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch the active guest license from authorized_guests collection
  useEffect(() => {
    if (!cleanEmail) {
      setLoadingLicense(false);
      return;
    }

    const fetchLicense = async () => {
      setLoadingLicense(true);
      try {
        const guestDocRef = doc(db, 'authorized_guests', cleanEmail);
        const snap = await getDoc(guestDocRef);
        if (snap.exists()) {
          setActiveLicense(snap.data());
        } else {
          setActiveLicense(null);
        }
      } catch (err) {
        console.warn("Could not query active license from authorized_guests:", err);
      } finally {
        setLoadingLicense(false);
      }
    };

    fetchLicense();
  }, [cleanEmail]);

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/50 p-8 text-center space-y-4 shadow-sm" id="sub_panel_logged_out">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black uppercase text-slate-800 tracking-tight">Access Restricted</h3>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-tight">Please login to view subscription details and receipts.</p>
        </div>
      </div>
    );
  }

  // Calculate quota variables
  const limit = subscriptionDetails?.circleDownloadsLimit || 6;
  const count = circleDownloadsCount || subscriptionDetails?.circleDownloadsCount || 0;
  const planKey = subscriptionDetails?.subscriptionType || 'guest_trial';
  const planInfo = SUBSCRIPTION_PLANS[planKey] || { label: 'Free Trial', price: 0, colorClass: 'text-slate-700 bg-slate-50' };
  const isUnlimited = limit === Infinity || limit > 99999;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((count / limit) * 100));

  return (
    <div className="space-y-6" id="subscription_panel_root">
      
      {/* 1. PLAN STATUS CARD */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 shadow-md relative overflow-hidden border border-slate-800" id="current_plan_card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#00A86B] bg-[#00A86B]/15 px-2.5 py-1 rounded-md border border-[#00A86B]/20">
              Active Portal License
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight mt-2 flex items-center gap-2">
              <CreditCard className="text-[#00A86B]" size={22} />
              {planInfo.label}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
              Registered email: <span className="text-white font-extrabold">{user.email}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Validity Period</div>
            <div className="text-2xl font-black text-white mt-1 flex items-baseline sm:justify-end gap-1">
              <span>{subscriptionDetails?.daysRemaining === Infinity ? 'Unlimited' : (subscriptionDetails?.daysRemaining || 0)}</span>
              <span className="text-xs text-slate-400 font-bold uppercase">Days Left</span>
            </div>
          </div>
        </div>

        {/* Quota Progress Meter */}
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 relative z-10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-500" />
              Syllabus Download Usage
            </span>
            <span className="text-white font-black text-[11px] uppercase tracking-wide">
              {isUnlimited ? 'Unlimited Active' : `${count} of ${limit} Files Generated`}
            </span>
          </div>

          {!isUnlimited && (
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-[2px] border border-slate-700/50">
                <div 
                  className="bg-[#00A86B] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(0,168,107,0.4)]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                <span>0% Usage</span>
                <span>{percentage}% Circle Exhausted</span>
                <span>100% Limit</span>
              </div>
            </div>
          )}

          {isUnlimited && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-left">
              <CheckCircle2 className="text-[#00A86B]" size={16} />
              <p className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wide">
                Premium License: Unrestricted syllabus browser access & unlimited lesson notes downloads active.
              </p>
            </div>
          )}
        </div>

        {/* Upgrade Call-to-action */}
        {planKey === 'guest_trial' && onOpenUpgradeModal && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 text-left">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-white text-xs">Are you generating lesson notes?</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Upgrade to bypass the 4-file basic trial quota limits.</p>
            </div>
            <button
              onClick={onOpenUpgradeModal}
              className="bg-[#00A86B] hover:bg-emerald-600 active:scale-95 text-white py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Activate Circle</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 2. ACTIVE BILLING RECORD */}
      {activeLicense && (
        <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-4 text-left" id="billing_license_receipt">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Receipt className="text-[#00A86B]" size={16} />
                Current License Details
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Active payment receipt whitelisted in Firestore.</p>
            </div>
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
              License Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Licensing Term</span>
              <span className="text-slate-800 font-extrabold text-xs block mt-1 uppercase">
                {activeLicense.subscriptionType || planKey} Circle
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Amount Paid</span>
              <span className="text-emerald-700 font-extrabold text-xs block mt-1">
                ZMK {activeLicense.amountPaid || activeLicense.amount || 0}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Payment Channel</span>
              <span className="text-slate-800 font-extrabold text-xs block mt-1 uppercase">
                {activeLicense.paymentMethod || 'Mobile Money'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            <strong>Government License ID:</strong> <code className="text-xs text-slate-600 select-all font-mono font-bold bg-white px-1.5 py-0.5 rounded-md border border-slate-100">{activeLicense.id || cleanEmail}</code> <br />
            Registered on {safeToDate(activeLicense.addedAt || activeLicense.subscriptionStart)?.toLocaleDateString() || 'N/A'}. All transactions are logged systematically to maintain curriculum workspace audit trails.
          </p>
        </div>
      )}

      {/* 3. TRANSACTION / REQUEST TIMELINE HISTORY */}
      <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-4 text-left" id="transaction_requests_timeline">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <History className="text-[#00A86B]" size={16} />
              Billing & Verification Logs
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Chronological list of payment requests and activation status.</p>
          </div>
          
          <button 
            onClick={() => {
              toast.success("Syncing status with secure Firestore node...");
              const refreshEvent = new Event('eduplan_force_sync');
              window.dispatchEvent(refreshEvent);
            }}
            className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '6s' }} />
          </button>
        </div>

        {loadingRequests ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-[#00A86B]" size={20} />
            <span className="text-[10px] font-black uppercase tracking-wider">Retrieving History...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
            <FileCheck2 className="text-slate-300 mx-auto" size={24} />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-extrabold text-slate-700 uppercase">No requests logged</h4>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight">Your activation history is currently empty.</p>
            </div>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {requests.map((req, reqIdx) => {
                const planDetails = SUBSCRIPTION_PLANS[req.subscriptionType] || { label: req.subscriptionType, price: req.amount || 0 };
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';

                return (
                  <li key={req.id}>
                    <div className="relative pb-8 text-left">
                      {reqIdx !== requests.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            isApproved 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : isPending 
                                ? 'bg-amber-50 text-amber-600 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isApproved ? (
                              <CheckCircle2 size={15} />
                            ) : isPending ? (
                              <Clock size={15} />
                            ) : (
                              <AlertCircle size={15} />
                            )}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs font-black text-slate-800">
                              Requested Activation: <span className="text-indigo-600 font-black">{planDetails.label}</span>
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                              Channel: {req.paymentMethod || 'Mobile Money'} // Value: <span className="text-slate-600 font-black">ZMK {req.amount || planDetails.price}</span>
                            </p>
                            {req.approvedAt && (
                              <p className="text-[9px] text-emerald-600 font-extrabold uppercase mt-0.5">
                                Verified Date: {safeToDate(req.approvedAt)?.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-slate-500 flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md border ${
                              isApproved 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                : isPending 
                                  ? 'bg-amber-50 border-amber-100 text-amber-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}>
                              {req.status || 'pending'}
                            </span>
                            <time className="text-[9px] font-semibold text-slate-400">
                              {safeToDate(req.timestamp)?.toLocaleDateString()}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}
