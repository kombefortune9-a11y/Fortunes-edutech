import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './FirebaseProvider';
import { X, CheckCircle2, AlertTriangle, MessageSquare, Copy, Sparkles, ShieldAlert, Share2, ExternalLink, Clock, ShieldCheck, RefreshCw, Smartphone, Zap, Loader2, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { SUBSCRIPTION_PLANS } from '../constants';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { safeLocalStorage } from '../lib/storage';
import { MtnMoMoLogo, AirtelLogo, ZamtelLogo, PaymentLogosIndicator } from './NetworkLogos';
import { SchoolRegistrationModal } from './SchoolRegistrationModal';
import { calculateSchoolPricing, BASE_SCHOOL_TEACHERS, EXTRA_TEACHER_PRICE } from '../lib/schoolTypes';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNetwork?: 'MTN Mobile Money' | 'Airtel Money' | 'Zamtel Kwacha';
}

export function AccessModal({ isOpen, onClose, initialNetwork }: AccessModalProps) {
  const { user, isWhitelisted, subscriptionDetails, refreshSubscription, isQuotaExceeded } = useAuth();
  const [selectedCircle, setSelectedCircle] = useState<string>('termly');
  const [schoolTeachersCount, setSchoolTeachersCount] = useState<number>(BASE_SCHOOL_TEACHERS);
  const [registeredTeacherEmails, setRegisteredTeacherEmails] = useState<string[]>(['']);
  const [isSchoolRegModalOpen, setIsSchoolRegModalOpen] = useState(false);
  const [schoolRegPaymentData, setSchoolRegPaymentData] = useState<any>(null);
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

  // Payment mode: instant automated USSD push vs manual deposit
  const [paymentMode, setPaymentMode] = useState<'instant_momo' | 'manual'>('instant_momo');
  const [momoNetwork, setMomoNetwork] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Zamtel Kwacha'>('MTN Mobile Money');

  useEffect(() => {
    if (initialNetwork) {
      setMomoNetwork(initialNetwork);
    }
  }, [initialNetwork, isOpen]);
  const [momoPhone, setMomoPhone] = useState('');
  const [isInitiatingMomo, setIsInitiatingMomo] = useState(false);
  const [momoActiveTx, setMomoActiveTx] = useState<{
    referenceId: string;
    identifier?: string;
    amount: number;
    phone: string;
    network: string;
  } | null>(null);
  const [momoSecondsLeft, setMomoSecondsLeft] = useState(120);
  const [isCheckingMomo, setIsCheckingMomo] = useState(false);

  // Subscription registration states
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPaymentMethod, setRegisterPaymentMethod] = useState('MTN Mobile Money');
  const [registerReferenceId, setRegisterReferenceId] = useState('');
  const [registerComments, setRegisterComments] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'form' | 'status'>('form');

  const pollIntervalRef = useRef<any>(null);

  // Activates subscription in Firestore and creates receipt on successful payment
  const completeActivation = async (refId: string, paidAmount: number, networkName: string, phoneUsed: string) => {
    if (!user || !user.email) return;
    const cleanEmail = user.email.toLowerCase().trim().replace(/\s+/g, '');
    const planInfo = SUBSCRIPTION_PLANS[selectedCircle] || SUBSCRIPTION_PLANS.monthly;

    // For Whole School Termly Circle, pop up school registration immediately after payment
    if (selectedCircle === 'termly') {
      setMomoActiveTx(null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setSchoolRegPaymentData({
        amount: paidAmount,
        referenceId: refId,
        network: networkName,
        phone: phoneUsed,
        purchasedTeachersLimit: schoolTeachersCount,
      });
      setIsSchoolRegModalOpen(true);
      toast.success("🎉 Payment Verified! Please fill out the Whole School Registration form to activate all teachers.", { duration: 9000 });
      return;
    }

    const days = planInfo.durationDays || 30;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const payload = {
      email: cleanEmail,
      displayName: user.displayName || cleanEmail.split('@')[0],
      isWhitelisted: true,
      status: 'active',
      subscriptionType: selectedCircle,
      assignedGrades: ['all'],
      grade: 'all',
      circle: selectedCircle,
      amountPaid: paidAmount,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: expiryDate.toISOString(),
      expiresAt: Timestamp.fromDate(expiryDate),
      circleDownloadsCount: 0,
      circleDownloadsLimit: planInfo.limit,
      paymentMethod: `Lipila (${networkName})`,
      paymentReference: refId,
      lastPaymentDate: now.toISOString(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'authorized_guests', cleanEmail), payload, { merge: true });
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

      const receiptData = {
        payerName: user.displayName || cleanEmail.split('@')[0],
        payerEmail: cleanEmail,
        payerPhone: phoneUsed,
        amount: paidAmount,
        currency: 'ZMW',
        packageName: `${planInfo.label} (${days} Days)`,
        packageType: selectedCircle,
        paymentMethod: `Mobile Money - ${networkName} (Lipila)`,
        referenceNumber: refId,
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        notes: `Automated instant payment via Lipila Gateway`,
        issuedBy: 'Fortunes Edutech Automated Billing',
        status: 'completed',
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('en-GB')
      };

      await addDoc(collection(db, 'receipts'), receiptData).catch(() => {});
      await addDoc(collection(db, 'users', user.uid, 'receipts'), receiptData).catch(() => {});

      await refreshSubscription();
      toast.success(`🎉 Payment Verified! You are now subscribed to ${planInfo.label}!`, { duration: 8000 });
      setMomoActiveTx(null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    } catch (err: any) {
      console.error("Error activating subscription:", err);
      toast.error("Payment received, but error activating. Please tap Sync & Verify.");
    }
  };

  // Poll transaction status while USSD prompt is pending on phone
  useEffect(() => {
    if (!momoActiveTx) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    setMomoSecondsLeft(120);

    const timer = setInterval(() => {
      setMomoSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/lipila/status/${momoActiveTx.referenceId}`);
        if (!res.ok) return;
        const ct = res.headers.get("content-type");
        if (!ct || !ct.includes("application/json")) return;
        const data = await res.json();
        if (data.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          clearInterval(timer);
          await completeActivation(momoActiveTx.referenceId, momoActiveTx.amount, momoActiveTx.network, momoActiveTx.phone);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          clearInterval(timer);
          toast.error("Payment prompt was cancelled or declined on your phone. Please try again.");
          setMomoActiveTx(null);
        }
      } catch (err) {
        // network polling retry
      }
    }, 3500);

    return () => {
      clearInterval(timer);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [momoActiveTx]);

  const handleSendMomoPrompt = async () => {
    if (!user || !user.email) {
      toast.error("Please log in to initiate mobile payments.");
      return;
    }
    const cleanPhone = momoPhone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("Please enter a valid Zambian mobile number (e.g. 0961622222 or 097...)");
      return;
    }

    const planInfo = SUBSCRIPTION_PLANS[selectedCircle] || SUBSCRIPTION_PLANS.monthly;
    const schoolPricing = calculateSchoolPricing(schoolTeachersCount);
    const effectiveAmount = selectedCircle === 'termly' ? schoolPricing.totalPrice : planInfo.price;
    setIsInitiatingMomo(true);

    try {
      const res = await fetch("/api/payments/lipila/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          phoneNumber: cleanPhone,
          operator: momoNetwork,
          email: user.email,
          planId: selectedCircle,
          planTitle: selectedCircle === 'termly' ? `${planInfo.label} (${schoolTeachersCount} Teachers)` : planInfo.label,
          userName: user.displayName || user.email.split('@')[0]
        })
      });

      const ct = res.headers.get("content-type");
      if (!ct || !ct.includes("application/json")) {
        throw new Error("Payment service is temporarily busy or reconnecting. Please try again in a few moments.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger payment prompt");
      }

      toast.success("📱 USSD Pop-up sent! Check your phone screen now and enter your PIN.", { duration: 6000 });
      setMomoActiveTx({
        referenceId: data.referenceId,
        identifier: data.identifier,
        amount: effectiveAmount,
        phone: cleanPhone,
        network: momoNetwork
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to contact payment network. Please try again.");
    } finally {
      setIsInitiatingMomo(false);
    }
  };

  const handleManualVerifyMomo = async () => {
    if (!momoActiveTx) return;
    setIsCheckingMomo(true);
    try {
      const res = await fetch(`/api/payments/lipila/status/${momoActiveTx.referenceId}`);
      const ct = res.headers.get("content-type");
      if (!ct || !ct.includes("application/json")) {
        throw new Error("Payment service is synchronizing. Please try again in a few moments.");
      }
      const data = await res.json();
      if (data.status === 'completed') {
        await completeActivation(momoActiveTx.referenceId, momoActiveTx.amount, momoActiveTx.network, momoActiveTx.phone);
      } else {
        const confirmRes = await fetch("/api/payments/lipila/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referenceId: momoActiveTx.referenceId })
        });
        const confirmCt = confirmRes.headers.get("content-type");
        const confirmData = (confirmCt && confirmCt.includes("application/json")) ? await confirmRes.json() : {};
        if (confirmData.success && confirmData.status === 'completed') {
          await completeActivation(momoActiveTx.referenceId, momoActiveTx.amount, momoActiveTx.network, momoActiveTx.phone);
        } else {
          toast("Still waiting for mobile PIN confirmation. Please ensure you approved the prompt on your phone.", { icon: "⏳" });
        }
      }
    } catch (err: any) {
      toast.error("Could not verify status. Please tap Sync & Verify.");
    } finally {
      setIsCheckingMomo(false);
    }
  };

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
  const effectivePrice = selectedPlanInfo.price;

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
                          You have depleted your allocated downloads for this subscription circle ({subscriptionDetails?.circleDownloadsCount || 0}/{subscriptionDetails?.circleDownloadsLimit || 180} docs used). Even though your subscription date has not yet reached, no downloads can be granted until you renew your subscription circle.
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
                          const msg = encodeURIComponent(`Hello Fortunes Edutech Developer! I am using the app on Free Trial mode (Email: ${user?.email || 'N/A'}) and would like activation for ${selectedPlanInfo?.label || 'Monthly Circle'} (ZMK ${selectedPlanInfo?.price || 70}).`);
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
                  {requestHistory.map((req: any, idx: number) => {
                    const plan = SUBSCRIPTION_PLANS[req.subscriptionType] || { label: req.subscriptionType, price: req.amount || 0 };
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';
                    
                    return (
                      <div 
                        key={`${req.id || 'req'}-${idx}`} 
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

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SUBSCRIPTION_PLANS)
                  .filter(([key]) => key !== 'guest_trial' && key !== 'unlimited')
                  .sort(([aKey], [bKey]) => {
                    const order = ['14days', 'monthly', 'termly'];
                    return order.indexOf(aKey) - order.indexOf(bKey);
                  })
                  .map(([key, plan]) => {
                    const isTermly = key === 'termly';
                    const isMonthly = key === 'monthly';
                    const is14Days = key === '14days';
                    const isSelected = selectedCircle === key;
                    const isActive = isWhitelisted && !isExpired && subType === key;

                    // Color schemes specified:
                    // 14 days: in white with black lined tab
                    // Monthly: in lighter blue with some few white in it
                    // Termly: in green tab with some white, light blue lines and some lighter black
                    const cardStyle = is14Days
                      ? (isSelected ? 'bg-white border-2 border-black ring-2 ring-black/20 shadow-xs' : 'bg-white border-2 border-black/80 hover:border-black')
                      : isMonthly
                        ? (isSelected ? 'bg-sky-50/90 border-2 border-sky-500 ring-2 ring-sky-400/30 shadow-xs' : 'bg-sky-50/60 border-2 border-sky-400 hover:border-sky-500')
                        : (isSelected ? 'bg-emerald-50 border-2 border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs' : 'bg-emerald-50/70 border-2 border-emerald-500 hover:border-emerald-600');

                    const headerColor = is14Days
                      ? 'text-slate-900'
                      : isMonthly
                        ? 'text-sky-900'
                        : 'text-emerald-950';

                    const priceColor = is14Days
                      ? 'text-black'
                      : isMonthly
                        ? 'text-sky-950'
                        : 'text-emerald-900';

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedCircle(key)}
                        className={`rounded-xl p-2 sm:p-2.5 text-center transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer active:scale-98 ${cardStyle}`}
                      >
                        {isActive && (
                          <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-white text-[7px] font-black uppercase py-0.5 tracking-wider">
                            Active
                          </div>
                        )}

                        <div className={isActive ? 'mt-1.5' : ''}>
                          <div className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight truncate ${headerColor}`}>
                            {plan.label}
                          </div>
                          <div className={`text-sm sm:text-base font-black mt-0.5 ${priceColor}`}>
                            ZMK {plan.price}
                          </div>
                          <div className={`text-[7.5px] sm:text-[8px] font-bold mt-1 py-0.5 px-1 rounded uppercase ${
                            is14Days
                              ? 'bg-slate-100 text-slate-800 border border-black/20'
                              : isMonthly
                                ? 'bg-white text-sky-800 border border-sky-200'
                                : 'bg-white text-emerald-800 border border-emerald-200'
                          }`}>
                            {plan.limit} Downloads
                          </div>
                          <div className="text-[7px] sm:text-[7.5px] text-slate-500 font-semibold mt-0.5">
                            {plan.durationDays} Days
                          </div>
                        </div>

                        {isTermly && (
                          <div className="mt-1.5 pt-1 border-t border-emerald-200/60 text-[7px] font-black uppercase text-emerald-800 tracking-tighter bg-white/70 py-0.5 rounded">
                            <span>✨ Research Hub</span>
                          </div>
                        )}

                        <div className="mt-2 pt-1.5 border-t border-slate-200/60">
                          {isSelected ? (
                            <button className={`w-full py-1 text-[7.5px] sm:text-[8.5px] font-black uppercase rounded-lg tracking-wider shadow-2xs ${
                              is14Days ? 'bg-black text-white' : isMonthly ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'
                            }`}>
                              Selected
                            </button>
                          ) : (
                            <button className="w-full py-1 bg-white/80 hover:bg-white text-slate-700 text-[7.5px] sm:text-[8.5px] font-bold uppercase rounded-lg tracking-wider transition-colors border border-slate-200">
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Instant Automated Activation Indicator */}
              <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-emerald-50 border border-emerald-200/80 rounded-2xl py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-center sm:text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                    Instant Automated Mobile Money Pop-up Payment
                  </span>
                </div>
                <PaymentLogosIndicator theme="light" compact={false} />
              </div>

              {/* AUTOMATED LIPILA INSTANT USSD POP-UP */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 space-y-5 shadow-xl border border-slate-700/60 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                          Instant USSD PIN Checkout
                        </h5>
                        <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
                          Powered by Lipila Payment Gateway (Airtel, MTN, Zamtel)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Total Due</span>
                      <p className="text-lg font-black text-emerald-400 leading-none">ZMK {effectivePrice}</p>
                    </div>
                  </div>

                  {momoActiveTx ? (
                    /* Waiting for PIN entry state */
                    <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-400 p-0.5 bg-slate-900 flex items-center justify-center">
                          {momoActiveTx.network === 'MTN Mobile Money' ? (
                            <MtnMoMoLogo className="w-full h-full rounded-xl" />
                          ) : momoActiveTx.network === 'Airtel Money' ? (
                            <AirtelLogo className="w-full h-full rounded-xl" />
                          ) : (
                            <ZamtelLogo className="w-full h-full rounded-xl" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-black uppercase tracking-tight text-white">
                          Check Your Phone Screen Now!
                        </h4>
                        <p className="text-xs text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
                          A mobile money prompt for <strong className="text-emerald-400">ZMK {momoActiveTx.amount}</strong> has been sent to <strong className="text-white">{momoActiveTx.phone}</strong> via {momoActiveTx.network}.
                        </p>
                        <p className="text-[11px] text-amber-300 font-bold mt-2">
                          👉 Please enter your Mobile Money PIN on your phone (or check under *115# pending approvals) to complete authorization.
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700 text-xs font-mono text-slate-300">
                        <Clock size={14} className="text-amber-400 animate-spin" />
                        <span>Prompt expires in: {Math.floor(momoSecondsLeft / 60)}:{(momoSecondsLeft % 60).toString().padStart(2, '0')}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleManualVerifyMomo}
                          disabled={isCheckingMomo}
                          className="w-full sm:w-auto px-6 py-3 bg-[#00A86B] hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                        >
                          {isCheckingMomo ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Verifying Status...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              <span>I Have Entered My PIN / Verify Now</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMomoActiveTx(null)}
                          className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Cancel / Re-enter Number
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial Phone & Network Input Form */
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                          1. Select Your Mobile Money Network
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {/* MTN */}
                          <button
                            type="button"
                            onClick={() => setMomoNetwork('MTN Mobile Money')}
                            className={`relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                              momoNetwork === 'MTN Mobile Money'
                                ? 'bg-gradient-to-b from-amber-400/25 to-amber-950/40 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                                : 'bg-slate-800/90 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-0.5 bg-[#FFC700] shrink-0">
                              <MtnMoMoLogo className="w-full h-full rounded-[10px]" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-100 leading-tight">
                                MTN MoMo
                              </p>
                              <span className="text-[7.5px] sm:text-[8px] font-bold text-amber-400 uppercase tracking-tight block mt-0.5">
                                *115# Pop-up
                              </span>
                            </div>
                            {momoNetwork === 'MTN Mobile Money' && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow">
                                ✓
                              </span>
                            )}
                          </button>

                          {/* Airtel */}
                          <button
                            type="button"
                            onClick={() => setMomoNetwork('Airtel Money')}
                            className={`relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                              momoNetwork === 'Airtel Money'
                                ? 'bg-gradient-to-b from-rose-500/25 to-rose-950/40 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/10'
                                : 'bg-slate-800/90 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-0.5 bg-[#ED1B24] shrink-0">
                              <AirtelLogo className="w-full h-full rounded-[10px]" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-100 leading-tight">
                                Airtel
                              </p>
                              <span className="text-[7.5px] sm:text-[8px] font-bold text-rose-400 uppercase tracking-tight block mt-0.5">
                                *115# Pop-up
                              </span>
                            </div>
                            {momoNetwork === 'Airtel Money' && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow">
                                ✓
                              </span>
                            )}
                          </button>

                          {/* Zamtel */}
                          <button
                            type="button"
                            onClick={() => setMomoNetwork('Zamtel Kwacha')}
                            className={`relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                              momoNetwork === 'Zamtel Kwacha'
                                ? 'bg-gradient-to-b from-emerald-500/25 to-emerald-950/40 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-800/90 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-0.5 bg-[#00A84D] shrink-0">
                              <ZamtelLogo className="w-full h-full rounded-[10px]" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-100 leading-tight">
                                Zamtel
                              </p>
                              <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-400 uppercase tracking-tight block mt-0.5">
                                *115# Pop-up
                              </span>
                            </div>
                            {momoNetwork === 'Zamtel Kwacha' && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow">
                                ✓
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Indicated below network buttons with dimming animation */}
                        <div className="pt-2.5 pb-1 flex justify-center">
                          <PaymentLogosIndicator theme="dark" compact={false} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                          2. Enter Mobile Money Phone Number (Recipient of USSD Pop-up)
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                            placeholder="e.g. 0961622222 or 097... / 095..."
                            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-extrabold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                            Zambia (+260)
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-normal">
                          Tip: Enter standard Zambian number (096..., 097..., 077..., 095..., 076...).
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMomoPrompt}
                        disabled={isInitiatingMomo}
                        className="w-full py-3.5 bg-gradient-to-r from-[#00A86B] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                      >
                        {isInitiatingMomo ? (
                          <>
                            <Loader2 size={16} className="animate-spin text-white" />
                            <span>Contacting Mobile Network...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={16} className="text-amber-300" />
                            <span>Send USSD Pop-up Prompt (ZMK {selectedPlanInfo?.price})</span>
                            <ArrowRight size={14} className="text-white/80" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2 text-[9.5px] text-slate-400 justify-center">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        <span>Instant automated activation. No manual review delay. Official receipt issued instantly.</span>
                      </div>
                    </div>
                  )}
                </div>

              {/* Subscription Registration & Activation Claim Form */}
              <div className="bg-[#f4faf7] border border-emerald-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="border-b border-emerald-200/60 pb-2.5">
                  <h5 className="text-[11px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">📝</span>
                    Subscription Registration & Activation Claim Form
                  </h5>
                  <p className="text-[9.5px] text-emerald-700/90 font-bold uppercase mt-0.5 leading-relaxed">
                    If you made payment via USSD pop-up or Mobile Money and the system did not automatically activate your circle, log your payment details below. Fortunes Developer will instantly verify and activate your circle upon receiving your notification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Subscriber Full Name</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter subscriber name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sender Mobile Money Number</label>
                    <input
                      type="text"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="e.g. 0961622222"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Payment Channel Network</label>
                    <select
                      value={registerPaymentMethod}
                      onChange={(e) => setRegisterPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Zamtel Kwacha">Zamtel Kwacha</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Transaction Reference Code / ID (Optional)</label>
                    <input
                      type="text"
                      value={registerReferenceId}
                      onChange={(e) => setRegisterReferenceId(e.target.value)}
                      placeholder="e.g. 29384729103 or Mobile Money Ref"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Complaint / Activation Note (Optional)</label>
                  <textarea
                    value={registerComments}
                    onChange={(e) => setRegisterComments(e.target.value)}
                    placeholder="Describe your payment or complaint e.g., 'Paid ZMK 70 via MTN MoMo pop-up but subscription circle isn't activated yet...'"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all min-h-[50px] resize-none shadow-2xs"
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
                      const refId = registerReferenceId.trim();
                      const isRenewalPayment = !!refId;
                      
                      if (isRenewalPayment) {
                        // User has completed renewal payment (second payment): automatically activate subscription circle immediately!
                        const now = new Date();
                        const newLimit = selectedPlanInfo?.limit || 160;
                        const durationDays = selectedPlanInfo?.durationDays || 30;

                        const guestData = {
                          email: cleanEmail,
                          subscriptionType: selectedCircle,
                          status: 'active',
                          isWhitelisted: true,
                          circleDownloadsLimit: newLimit,
                          circleDownloadsCount: 0,
                          isQuotaExhausted: false,
                          isSubscriptionExpired: false,
                          amountPaid: selectedPlanInfo?.price || 70,
                          paymentMethod: registerPaymentMethod,
                          referenceId: refId,
                          subscriptionStart: now.toISOString(),
                          addedAt: now.toISOString(),
                          teaching_grade: 'all',
                          phone: registerPhone.trim(),
                          displayName: registerName || user.displayName || cleanEmail.split('@')[0]
                        };

                        await setDoc(doc(db, 'authorized_guests', cleanEmail), guestData, { merge: true });
                        await setDoc(doc(db, 'users', user.uid), {
                          isWhitelisted: true,
                          is_whitelisted: true,
                          status: 'active',
                          subscriptionType: selectedCircle,
                          subscriptionStart: serverTimestamp(),
                          lastRenewedAt: serverTimestamp()
                        }, { merge: true });

                        await setDoc(doc(db, 'subscription_requests', requestId), {
                          id: requestId,
                          uid: user.uid,
                          email: cleanEmail,
                          displayName: registerName || user.displayName || cleanEmail.split('@')[0],
                          subscriptionType: selectedCircle,
                          amount: selectedPlanInfo?.price || 70,
                          phone: registerPhone.trim(),
                          paymentMethod: registerPaymentMethod,
                          referenceId: refId,
                          comments: registerComments.trim(),
                          grade: 'all',
                          timestamp: serverTimestamp(),
                          status: 'approved',
                          approvedAt: serverTimestamp(),
                          autoActivated: true
                        }, { merge: true });

                        const renewedDetails = {
                          subscriptionType: selectedCircle,
                          label: selectedPlanInfo?.label || 'Monthly',
                          subscriptionStart: now,
                          durationDays: durationDays,
                          circleDownloadsLimit: newLimit,
                          circleDownloadsCount: 0,
                          isQuotaExhausted: false,
                          isSubscriptionExpired: false,
                          isTrialMode: false,
                          isWhitelisted: true,
                          daysRemaining: durationDays,
                          downloadsRemaining: newLimit
                        };

                        try {
                          safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({
                            details: renewedDetails,
                            grades: ['all']
                          }));
                          safeLocalStorage.setItem(`eduplan_subscription_cache_${user.uid}`, JSON.stringify({
                            details: renewedDetails,
                            grades: ['all']
                          }));
                        } catch (e) {}

                        toast.success(`Subscription circle renewed and automatically activated! You have ${newLimit} downloads.`);
                        window.dispatchEvent(new Event('subscription-updated'));
                      } else {
                        await setDoc(doc(db, 'subscription_requests', requestId), {
                          id: requestId,
                          uid: user.uid,
                          email: cleanEmail,
                          displayName: registerName || user.displayName || cleanEmail.split('@')[0],
                          subscriptionType: selectedCircle,
                          amount: selectedPlanInfo?.price || 70,
                          phone: registerPhone.trim(),
                          paymentMethod: registerPaymentMethod,
                          referenceId: refId,
                          comments: registerComments.trim(),
                          grade: 'all',
                          timestamp: serverTimestamp(),
                          status: 'pending'
                        }, { merge: true });
                        
                        toast.success("Activation claim submitted to developer terminal! Fortunes Developer will verify and activate your circle.");
                      }
                      
                      setRegisterReferenceId('');
                      setRegisterComments('');
                      setActiveModalTab('status');
                    } catch (err: any) {
                      console.warn("Firestore logging failed, continuing to WhatsApp:", err);
                    } finally {
                      setIsSubmittingForm(false);
                    }

                    const msg = encodeURIComponent(`Hello Fortunes Edutech Developer! I have submitted my subscription activation claim:\n` +
                      `- Name: ${registerName || 'N/A'}\n` +
                      `- Email: ${user?.email || 'N/A'}\n` +
                      `- Circle: ${selectedPlanInfo?.label || 'Monthly'}\n` +
                      `- Amount: ZMK ${selectedPlanInfo?.price || 70}\n` +
                      `- Payment Channel: ${registerPaymentMethod}\n` +
                      `- Sender Phone: ${registerPhone}\n` +
                      `- Reference ID: ${registerReferenceId.trim() || 'Not Provided'}\n` +
                      `- Note/Complaint: ${registerComments.trim() || 'Payment completed, awaiting activation'}\n` +
                      `Please verify and activate my subscription circle.`);
                    window.open(`https://wa.me/260961622222?text=${msg}`, '_blank');
                  }}
                  disabled={isSubmittingForm}
                  className="px-6 py-2.5 bg-[#00A86B] text-white hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  {isSubmittingForm ? "Submitting..." : `Submit Activation Claim (ZMK ${selectedPlanInfo?.price})`}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* WHOLE SCHOOL REGISTRATION POP-UP MODAL */}
      <SchoolRegistrationModal
        isOpen={isSchoolRegModalOpen}
        onClose={() => setIsSchoolRegModalOpen(false)}
        paymentData={schoolRegPaymentData}
        onCompleted={async (school) => {
          await refreshSubscription();
          setIsSchoolRegModalOpen(false);
          onClose();
        }}
      />
    </AnimatePresence>
  );
}
