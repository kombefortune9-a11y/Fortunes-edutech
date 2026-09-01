import React, { useState, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { X, CheckCircle2, AlertTriangle, MessageSquare, Copy, Sparkles, ShieldAlert, Share2, ExternalLink, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { SUBSCRIPTION_PLANS } from '../constants';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { safeLocalStorage } from '../lib/storage';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessModal({ isOpen, onClose }: AccessModalProps) {
  const { user, isWhitelisted, subscriptionDetails, refreshSubscription, isQuotaExceeded } = useAuth();
  const [selectedCircle, setSelectedCircle] = useState<string>('monthly');
  const [requestHistory, setRequestHistory] = useState<any[]>(() => {
    try {
      const cached = safeLocalStorage.getItem(`eduplan_req_history_${user?.uid}`);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>(() => {
    try {
      const cached = safeLocalStorage.getItem(`eduplan_req_history_${user?.uid}`);
      return cached ? JSON.parse(cached).filter((r: any) => r.status === 'pending') : [];
    } catch (e) {
      return [];
    }
  });
  // Subscription registration states
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPaymentMethod, setRegisterPaymentMethod] = useState('MTN Mobile Money');
  const [registerReferenceId, setRegisterReferenceId] = useState('');
  const [registerComments, setRegisterComments] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'form' | 'status'>('form');

  const [isSyncingSub, setIsSyncingSub] = useState(false);
  const handleSyncSubscription = async () => {
    setIsSyncingSub(true);
    const loadToast = toast.loading("Connecting to Fortunes Edutech servers to verify activation...");
    try {
      await refreshSubscription();
      // Wait for a short moment to simulate live server lookup
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.dismiss(loadToast);
      
      if (isQuotaExceeded) {
        toast.error("Firebase Database Quota Exceeded! App is temporarily in Offline Mode. Please contact +260961622222 to activate instantly.", { duration: 6000 });
      } else {
        toast.success("Synchronization request sent! Your application access details have been refreshed.");
      }
    } catch (e) {
      toast.dismiss(loadToast);
      toast.error("Error connecting to verification server.");
    } finally {
      setIsSyncingSub(false);
    }
  };

  useEffect(() => {
    if (user) {
      setRegisterName(user.displayName || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'subscription_requests'),
      where('uid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      // Sort by timestamp desc (newest first)
      list.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setRequestHistory(list);
      setPendingRequests(list.filter(r => r.status === 'pending'));
      try {
        safeLocalStorage.setItem(`eduplan_req_history_${user.uid}`, JSON.stringify(list));
      } catch (e) {}
    }, (err) => {
      console.warn("Error listening to user subscription requests:", err);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleCopyNumber = (num: string, network: string) => {
    navigator.clipboard.writeText(num);
    toast.success(`${network} number copied!`);
  };

  if (!isOpen) return null;

  const isExpired = subscriptionDetails?.isSubscriptionExpired;
  const isTrial = subscriptionDetails?.subscriptionType === 'guest_trial' || !isWhitelisted;
  const subType = subscriptionDetails?.subscriptionType || 'guest_trial';

  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    let d: Date | null = null;
    if (date instanceof Date) d = date;
    else if (typeof date?.toDate === 'function') d = date.toDate();
    else if (typeof date === 'number') d = new Date(date);
    else if (date?.seconds !== undefined) d = new Date(date.seconds * 1000);
    else if (date?._seconds !== undefined) d = new Date(date._seconds * 1000);
    else d = new Date(date);

    if (!d || isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectedPlanInfo = SUBSCRIPTION_PLANS[selectedCircle] || SUBSCRIPTION_PLANS.monthly;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">♿</span>
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase leading-none">
                  APP FULL ACCESS SYSTEM
                </h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                  Select your billing circle & request activation
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

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Elegant Tab Headers */}
            <div className="flex border-b border-slate-100 gap-1 pb-1">
              <button
                type="button"
                onClick={() => setActiveModalTab('form')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] rounded-xl transition-all cursor-pointer ${
                  activeModalTab === 'form'
                    ? 'bg-[#00A86B] text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200/50'
                }`}
              >
                📝 1. Select & Register Access
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('status')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] rounded-xl transition-all relative cursor-pointer ${
                  activeModalTab === 'status'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200/50'
                }`}
              >
                📋 2. My Submission Status
                {pendingRequests.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-rose-500 text-white font-black text-[7.5px] rounded-full leading-none animate-pulse shrink-0">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>

            {activeModalTab === 'status' && (
              <div className="space-y-6">
              {/* Status Section */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Your Current Status</h4>
              
              {isWhitelisted && !isExpired ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 size={24} className="fill-emerald-50 text-emerald-600" />
                    <div>
                      <p className="font-extrabold uppercase text-sm tracking-tight">Active Whitelisted Access</p>
                      <p className="text-xs font-semibold text-emerald-700">All educational materials are unlocked for your registered grade!</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-slate-600">
                    <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active Circle</p>
                      <p className="font-extrabold text-slate-800 mt-1 uppercase">
                        {SUBSCRIPTION_PLANS[subType]?.label || subType}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-3 rounded-xl col-span-2 sm:col-span-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cycle Started</p>
                      <p className="font-bold text-slate-800 mt-1 truncate">{formatDate(subscriptionDetails?.subscriptionStart)}</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-3 rounded-xl col-span-2 sm:col-span-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Disconnection Date</p>
                      <p className="font-bold text-slate-800 mt-1 truncate">{formatDate(subscriptionDetails?.subscriptionEnd)}</p>
                    </div>
                  </div>

                  {/* Warning if only 1 day remaining */}
                  {subscriptionDetails?.daysRemaining <= 1 && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/50 text-amber-800 p-3 rounded-xl text-xs font-bold animate-pulse mt-2">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black uppercase tracking-tight text-[10px]">Warning: Disconnection imminent</p>
                        <p className="mt-0.5 leading-normal">You have only {subscriptionDetails?.hoursRemaining} hours remaining before automatic disconnection and revert to trial mode. Please renew your package today.</p>
                      </div>
                    </div>
                  )}

                  {/* Downloads Depleted Warning */}
                  {(subscriptionDetails?.isQuotaExhausted || (subscriptionDetails?.circleDownloadsLimit < 999999 && subscriptionDetails?.circleDownloadsCount >= subscriptionDetails?.circleDownloadsLimit)) && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-xs font-bold mt-2 shadow-sm">
                      <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black uppercase tracking-tight text-[11px] text-red-700">Downloads Depleted for Active Circle</p>
                        <p className="mt-1 leading-relaxed text-red-800">
                          You have depleted your allocated downloads for this subscription circle ({subscriptionDetails?.circleDownloadsCount || 0}/{subscriptionDetails?.circleDownloadsLimit || 90} docs used). Even though your subscription date has not yet reached, no downloads can be granted until you renew your subscription circle.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Downloads count progress */}
                  <div className="border-t border-slate-200/60 pt-4 space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Circle Download Tracker</span>
                      <span className="text-xs font-extrabold text-slate-700">
                        {subscriptionDetails?.unlimitedDownloads 
                          ? "UNLIMITED" 
                          : `${subscriptionDetails?.circleDownloadsCount || 0} / ${subscriptionDetails?.circleDownloadsLimit || 180} docs (${Math.max(0, (subscriptionDetails?.circleDownloadsLimit || 180) - (subscriptionDetails?.circleDownloadsCount || 0))} remaining)`}
                      </span>
                    </div>
                    {!subscriptionDetails?.unlimitedDownloads && (
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                        <div 
                          className="bg-[#00A86B] h-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (subscriptionDetails?.circleDownloadsCount / subscriptionDetails?.circleDownloadsLimit) * 100)}%` }}
                        />
                      </div>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 leading-normal">
                      Note: To maintain the integrity of our resources, downloads are limited based on your active circle plan. If depleted, you can easily renew or upgrade.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(subscriptionDetails?.isQuotaExhausted || (subscriptionDetails?.circleDownloadsLimit < 999999 && subscriptionDetails?.circleDownloadsCount >= subscriptionDetails?.circleDownloadsLimit)) && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs font-bold shadow-sm">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black uppercase tracking-tight text-[11px] text-amber-800">Free Trial Downloads Depleted</p>
                        <p className="mt-1 leading-relaxed text-amber-900">
                          You have depleted your Free Trial access downloads. No further downloads can be granted until you upgrade to a Subscription Circle.
                        </p>
                      </div>
                    </div>
                  )}
                  {pendingRequests.length > 0 && (
                    <div className="flex items-start gap-3 text-indigo-800 bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-xs">
                      <Clock size={20} className="text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-extrabold uppercase text-xs tracking-tight flex items-center gap-1">
                          <Clock size={12} className="animate-pulse text-indigo-500" />
                          <span>Activation Request Pending Review</span>
                        </p>
                        <p className="text-[11px] font-bold text-indigo-900 mt-1 leading-relaxed">
                          Your request for <strong className="text-indigo-950">{SUBSCRIPTION_PLANS[pendingRequests[0].subscriptionType]?.label || pendingRequests[0].subscriptionType} (ZMK {pendingRequests[0].amount})</strong> has been sent to the developer queue. Once verified, your app will activate automatically.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 text-amber-800 bg-amber-50/80 border border-amber-200 p-4 rounded-xl">
                    <ShieldAlert size={20} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="w-full">
                      <p className="font-extrabold uppercase text-xs tracking-tight">Free Trial Access Mode (Default)</p>
                      <p className="text-[11px] font-bold text-amber-900 mt-1 leading-relaxed">
                        {isExpired 
                          ? "Your previous active subscription cycle has ended. Select a package below to subscribe and reactivate full access."
                          : "You are currently running in Free Trial mode by default. Select your preferred subscription circle below to request instant activation."
                        }
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={handleSyncSubscription}
                          disabled={isSyncingSub}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <RefreshCw size={11} className={`${isSyncingSub ? "animate-spin" : ""}`} />
                          {isSyncingSub ? "Syncing..." : "Sync & Verify Activation"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold pt-1">
                    <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-slate-400">SOW</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">1 Max</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-slate-400">Forecast</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">1 Max</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-slate-400">Lesson</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">2 Max</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-slate-400">Catch-Up</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">0 Max</p>
                    </div>
                  </div>

                  {/* Share link & WhatsApp information for trial users */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-3 shadow-2xs mt-2">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <Share2 size={13} className="text-[#00A86B]" />
                        Share Free Trial Access With Fellow Teachers
                      </p>
                      <p className="text-[10.5px] font-medium text-slate-500 mt-0.5">
                        Invite other teachers to experience the Zambian curriculum planning suite on Free Trial mode.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <button
                        onClick={() => {
                          const url = window.location.origin;
                          navigator.clipboard.writeText(url);
                          toast.success("App invite link copied to clipboard!");
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Copy size={12} />
                        <span>Copy App Link</span>
                      </button>

                      <button
                        onClick={() => {
                          const shareText = encodeURIComponent(
                            "Hello fellow teacher! Try out the Fortunes Edutech App for lesson planning, schemes of work, and records with free trial access here: " + window.location.origin
                          );
                          window.open(`https://wa.me/?text=${shareText}`, '_blank');
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <MessageSquare size={12} />
                        <span>Share on WhatsApp</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
                      <div className="text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Developer WhatsApp:</span> +260 96 1622222 (Fast Activation & Inquiries)
                      </div>
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(`Hello Fortunes Edutech Developer! I am using the app on Free Trial mode (Email: ${user?.email || 'N/A'}) and would like activation for ${selectedPlanInfo?.label || 'Monthly Circle'} (ZMK ${selectedPlanInfo?.price || 90}).`);
                          window.open(`https://wa.me/260961622222?text=${msg}`, '_blank');
                        }}
                        className="text-[#00A86B] hover:text-emerald-700 font-black uppercase tracking-tight flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <span>Chat Developer</span>
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submission & Activation History list */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    📝 Submission & Activation History
                  </h5>
                </div>
                <span className="text-[9.5px] font-bold text-[#00A86B] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                  {requestHistory.length} {requestHistory.length === 1 ? 'submission' : 'submissions'}
                </span>
              </div>

              {requestHistory.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-400">
                  No previous subscription submissions logged yet. Choose a package on the "Select & Register" tab to submit.
                </div>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {requestHistory.map((req: any) => {
                    const plan = SUBSCRIPTION_PLANS[req.subscriptionType] || { label: req.subscriptionType, price: req.amount || 0 };
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';
                    
                    return (
                      <div 
                        key={req.id} 
                        className={`border p-3.5 rounded-xl text-xs space-y-2 relative transition-all ${
                          isPending 
                            ? 'bg-amber-50/40 border-amber-200/70 shadow-2xs' 
                            : isApproved 
                              ? 'bg-emerald-50/10 border-emerald-150' 
                              : 'bg-slate-50/50 border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-slate-800 uppercase text-[11px] tracking-tight">
                              {plan.label || req.subscriptionType}
                            </p>
                            <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                              Submitted: {formatDate(req.timestamp)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded ${
                            isPending 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : isApproved 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}>
                            {isPending ? '🟡 Pending Review' : isApproved ? '🟢 Activated' : '🔴 Dismissed'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] font-medium text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                          <div>
                            💰 Amount: <span className="font-extrabold text-slate-800">ZMK {req.amount || plan.price}</span>
                          </div>
                          <div>
                            💳 Method: <span className="font-bold text-slate-800">{req.paymentMethod || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            📞 Phone/Sender: <span className="font-bold text-slate-800">{req.phone || 'N/A'}</span>
                          </div>
                          <div className="col-span-2 border-t border-slate-100/60 pt-1 mt-1">
                            🔑 Transaction Ref ID: <span className="font-mono text-emerald-700 bg-emerald-50/50 px-1 py-0.5 rounded text-[10px] select-all font-bold">{req.referenceId || 'Not Provided'}</span>
                          </div>
                        </div>

                        {req.comments && (
                          <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed bg-slate-50 p-1.5 px-2 rounded-md border border-slate-100">
                            💬 Note: "{req.comments}"
                          </p>
                        )}

                        {isApproved && (
                          <div className="text-[9.5px] font-extrabold text-emerald-700 flex items-center gap-1 mt-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                            🚀 Activated instantly by Fortunes Developer! All planning materials unlocked.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
            )}

            {activeModalTab === 'form' && (
            <div className="space-y-6">
              {/* Premium Access Packages Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#00A86B]" />
                  <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Select Subscription Circle</h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Click any card to select
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(SUBSCRIPTION_PLANS)
                  .filter(([key]) => key !== 'guest_trial' && key !== 'unlimited')
                  .map(([key, plan]) => {
                    const isTermly = key === 'termly';
                    const isSelected = selectedCircle === key;
                    const isActive = isWhitelisted && !isExpired && subType === key;

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedCircle(key)}
                        className={`border rounded-2xl p-4 text-center transition-all bg-white relative overflow-hidden flex flex-col justify-between cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/20 shadow-md'
                            : isTermly 
                              ? 'border-indigo-200 bg-indigo-50/10 hover:border-indigo-400 shadow-2xs' 
                              : 'border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-white text-[7.5px] font-black uppercase py-0.5 tracking-wider">
                            Your Active Circle
                          </div>
                        )}

                        <div className={isActive ? 'mt-2' : ''}>
                          <div className={`text-[9px] font-black uppercase ${isSelected ? 'text-emerald-700' : isTermly ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {plan.label}
                          </div>
                          <div className={`text-2xl font-black mt-1 ${isSelected ? 'text-emerald-800' : isTermly ? 'text-indigo-950' : 'text-slate-800'}`}>
                            ZMK {plan.price}
                          </div>
                          <div className={`text-[9px] font-bold mt-2 py-1 rounded-md uppercase ${isSelected ? 'text-white bg-emerald-600' : isTermly ? 'text-indigo-700 bg-indigo-50 border border-indigo-200' : 'text-slate-600 bg-slate-100'}`}>
                            {plan.limit} Downloads
                          </div>
                          <div className="text-[8px] text-slate-400 font-semibold mt-1">
                            {plan.durationDays} Days Duration
                          </div>
                        </div>

                        {isTermly && (
                          <div className="mt-2 pt-1 border-t border-indigo-100 text-[7.5px] font-black uppercase text-indigo-700 tracking-tight flex items-center justify-center gap-0.5">
                            <span>✨ Incl. Assignment & Research Hub</span>
                          </div>
                        )}

                        <div className="mt-3 pt-2 border-t border-slate-100">
                          {isSelected ? (
                            <button className="w-full py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-xl tracking-wider shadow-xs">
                              Selected
                            </button>
                          ) : (
                            <button className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold uppercase rounded-xl tracking-wider transition-colors">
                              Select Circle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Direct Transfer Payment Details */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                      Payment Details for {selectedPlanInfo?.label} (ZMK {selectedPlanInfo?.price})
                    </h5>
                    <p className="text-xs font-semibold text-slate-300 mt-0.5">
                      Transfer ZMK {selectedPlanInfo?.price} directly via Mobile Money to any line below:
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-lg text-[10.5px] font-black text-amber-300 uppercase tracking-wider shrink-0">
                    <span className="text-sm">👤</span> Name: KOMBE FORTUNE
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleCopyNumber("0961622222", "MTN")}
                    className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-amber-400 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="text-[8px] font-black uppercase text-amber-400 tracking-wider">MTN Mobile Money</p>
                      <p className="text-xs font-extrabold text-white mt-0.5">0961622222</p>
                    </div>
                    <Copy size={13} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
                  </button>

                  <button 
                    onClick={() => handleCopyNumber("0957622025", "Zamtel")}
                    className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-green-400 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="text-[8px] font-black uppercase text-green-400 tracking-wider">Zamtel Kwacha</p>
                      <p className="text-xs font-extrabold text-white mt-0.5">0957622025</p>
                    </div>
                    <Copy size={13} className="text-slate-400 group-hover:text-green-400 transition-colors" />
                  </button>

                  <button 
                    onClick={() => handleCopyNumber("0779385933", "Airtel")}
                    className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-red-400 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="text-[8px] font-black uppercase text-red-400 tracking-wider">Airtel Money</p>
                      <p className="text-xs font-extrabold text-white mt-0.5">0779385933</p>
                    </div>
                    <Copy size={13} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Subscription Registration & Activation Initiation Form */}
              <div className="bg-[#f4faf7] border border-emerald-100/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="border-b border-emerald-100/50 pb-2">
                  <h5 className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">📝</span>
                    Subscription Registration Form
                  </h5>
                  <p className="text-[9px] text-emerald-600/90 font-bold uppercase mt-0.5">
                    Select your circle plan above, pay Kombe Fortune, and log your transfer details below
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Subscriber Full Name</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sender Mobile Money Number</label>
                    <input
                      type="text"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="e.g. 0961622222"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payment Channel Network</label>
                    <select
                      value={registerPaymentMethod}
                      onChange={(e) => setRegisterPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Zamtel Kwacha">Zamtel Kwacha</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Transaction Reference Code / ID</label>
                    <input
                      type="text"
                      value={registerReferenceId}
                      onChange={(e) => setRegisterReferenceId(e.target.value)}
                      placeholder="e.g. 29384729103"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Additional Comments (Optional)</label>
                  <textarea
                    value={registerComments}
                    onChange={(e) => setRegisterComments(e.target.value)}
                    placeholder="Enter any additional payment reference or notes here..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all min-h-[45px] resize-none"
                  />
                </div>
              </div>

              {/* Informational Guidelines on Subscriptions */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[10.5px] font-bold text-slate-500 space-y-1.5 leading-relaxed">
                <p className="font-extrabold uppercase tracking-widest text-[9px] text-slate-400">Access Terms & Policy</p>
                <p>📍 All generated documents are unlimited until each active circle ends, and downloads are bounded directly to the plan limits above.</p>
                <p>📍 All premium packages grant full access to all grades from Early Childhood Education (ECE) levels up to Form 6 (A Level).</p>
                <p>📍 Once your active billing cycle ends, your profile is automatically reverted to Free Trial mode, and you can re-select any package to subscribe again.</p>
              </div>
            </div>
            </div>
            )}

            {/* Request activation Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-tight transition-colors cursor-pointer"
              >
                Close Window
              </button>
              {activeModalTab === 'form' && (
                <button
                  onClick={async () => {
                    if (!user || !user.email) {
                      toast.error("Please log in to submit activation requests.");
                      return;
                    }
                    if (!registerPhone.trim()) {
                      toast.error("Please enter your Mobile Money sender phone number.");
                      return;
                    }

                    setIsSubmittingForm(true);
                    const cleanEmail = user.email.toLowerCase().trim().replace(/\s+/g, '');
                    const requestId = `${user.uid}_${selectedCircle}`;
                    
                    try {
                      await setDoc(doc(db, 'subscription_requests', requestId), {
                        id: requestId,
                        uid: user.uid,
                        email: cleanEmail,
                        displayName: registerName || user.displayName || cleanEmail.split('@')[0],
                        subscriptionType: selectedCircle,
                        amount: selectedPlanInfo?.price || 90,
                        phone: registerPhone.trim(),
                        paymentMethod: registerPaymentMethod,
                        referenceId: registerReferenceId.trim(),
                        comments: registerComments.trim(),
                        grade: 'all',
                        timestamp: serverTimestamp(),
                        status: 'pending'
                      }, { merge: true });
                      
                      toast.success("Logged pending request in developer terminal!");
                      setRegisterReferenceId('');
                      setRegisterComments('');
                      setActiveModalTab('status');
                    } catch (err: any) {
                      console.warn("Firestore logging failed, continuing to WhatsApp:", err);
                    } finally {
                      setIsSubmittingForm(false);
                    }

                    const msg = encodeURIComponent(`Hello Fortunes Edutech Developer! I have submitted my subscription registration:\n` +
                      `- Name: ${registerName || 'N/A'}\n` +
                      `- Email: ${user?.email || 'N/A'}\n` +
                      `- Circle: ${selectedPlanInfo?.label || 'Monthly'}\n` +
                      `- Amount: ZMK ${selectedPlanInfo?.price || 90}\n` +
                      `- Payment Channel: ${registerPaymentMethod}\n` +
                      `- Phone: ${registerPhone}\n` +
                      `- Reference ID: ${registerReferenceId.trim() || 'Not Provided'}\n` +
                      `Please verify and activate my account.`);
                    window.open(`https://wa.me/260961622222?text=${msg}`, '_blank');
                  }}
                  disabled={isSubmittingForm}
                  className="px-6 py-2.5 bg-[#00A86B] text-white hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  {isSubmittingForm ? "Submitting..." : `Submit Registration (ZMK ${selectedPlanInfo?.price})`}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
