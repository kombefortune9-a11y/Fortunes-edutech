import { ActivityFeed } from './ActivityFeed';
import { safeLocalStorage } from "../lib/storage";
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, getDocs, getDoc, Timestamp, deleteDoc, doc, writeBatch, limit, setDoc, serverTimestamp, where, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, recordActivity } from '../lib/firebase';
import { checkIsQuotaError, useAuth } from './FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, History, Mail, RefreshCcw, Trash2, Clock, ShieldAlert, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Download, BarChart2, Calendar, FileText, Plus, UserCheck, Shield, Search, Lock, Unlock, Edit2, Activity, ThumbsUp, ThumbsDown, Sparkles, ArrowLeft, Check, CheckCircle2, School } from 'lucide-react';
import { cn, extractUserFirstName } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { GRADES, OBC_LEVELS, SUBSCRIPTION_PLANS, isDeveloperEmail } from '../constants';
import CircleDownloadTracker from './CircleDownloadTracker';
import { SubscriptionAnalytics } from './SubscriptionAnalytics';
import { fetchAllSchools } from '../lib/schoolService';
import { SchoolCircle } from '../lib/schoolTypes';

// Centralized OperationType and handleFirestoreError are imported from ../lib/firebase

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastLogin: Timestamp;
  lastHeartbeat?: Timestamp;
  teaching_grade?: string;
  isWhitelisted?: boolean;
  subscriptionType?: string;
  subscriptionStart?: any;
  addedAt?: any;
  status?: string;
  userType?: string;
  isOnline?: boolean;
}

function safeToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (e) {
      console.warn("Error calling toDate() on timestamp:", e);
    }
  }
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

function getInitials(displayName: string, email: string) {
  const cleanName = displayName && displayName !== 'Pending Name...' ? displayName.trim() : '';
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const cleanEmail = email ? email.split('@')[0].trim() : '';
  if (cleanEmail) {
    return cleanEmail.slice(0, 2).toUpperCase();
  }
  return '??';
}

function getAvatarBg(email: string) {
  const colors = [
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-indigo-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
    'bg-sky-600 text-white'
  ];
  if (!email) return colors[0];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function safeToMillis(timestamp: any): number {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === 'function') {
    try {
      return timestamp.toMillis();
    } catch (e) {
      console.warn("Error calling toMillis() on timestamp:", e);
    }
  }
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp.seconds === 'number') {
    return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
  }
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed.getTime();
  return 0;
}

interface GradeMultiSelectorProps {
  selectedGradesString: string;
  onChange: (newGradesString: string) => void;
  allAvailableGrades: string[];
  themeColor?: "emerald" | "blue";
}

function GradeMultiSelector({
  selectedGradesString,
  onChange,
  allAvailableGrades,
  themeColor = "emerald",
}: GradeMultiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedList = useMemo(() => {
    if (!selectedGradesString) return [];
    return selectedGradesString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [selectedGradesString]);

  const toggleGrade = (grade: string) => {
    let newList: string[];
    if (selectedList.includes(grade)) {
      newList = selectedList.filter((g) => g !== grade);
    } else {
      newList = [...selectedList, grade];
    }
    // Maintain consistent order matching allAvailableGrades
    const orderedList = allAvailableGrades.filter((g) => newList.includes(g));
    onChange(orderedList.join(", "));
  };

  const selectAll = () => {
    onChange(allAvailableGrades.join(", "));
  };

  const clearAll = () => {
    onChange("");
  };

  const selectPrimary = () => {
    const primary = allAvailableGrades.filter(
      (g) => !g.toLowerCase().includes("(obc)") && !g.toLowerCase().includes("(cbc)")
    );
    onChange(primary.join(", "));
  };


  const selectCBC = () => {
    const cbc = allAvailableGrades.filter((g) => g.toLowerCase().includes("(cbc)"));
    onChange(cbc.join(", "));
  };

  const filteredGrades = useMemo(() => {
    if (!search.trim()) return allAvailableGrades;
    const query = search.toLowerCase();
    return allAvailableGrades.filter((g) => g.toLowerCase().includes(query));
  }, [search, allAvailableGrades]);

  const isEmerald = themeColor === "emerald";
  const accentClass = isEmerald 
    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" 
    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700";
  const accentText = isEmerald 
    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50";

  return (
    <div className="w-full space-y-2 mt-1">
      {/* Trigger & Badge Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white border rounded-2xl p-3 cursor-pointer select-none transition-all hover:border-slate-300 shadow-xs flex items-center justify-between gap-3 min-h-[44px]",
          isOpen ? (isEmerald ? "border-emerald-500 ring-2 ring-emerald-50" : "border-blue-500 ring-2 ring-blue-50") : "border-slate-200"
        )}
      >
        <div className="flex-1">
          {selectedList.length === 0 ? (
            <span className="text-xs font-bold text-slate-400">Click to select grades...</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto py-0.5 custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              {selectedList.map((g) => (
                <span 
                  key={g} 
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                    isEmerald ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                  )}
                >
                  {g}
                  <button 
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className="hover:scale-110 active:scale-95 text-slate-400 hover:text-red-500 transition-all font-black text-[12px] ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-slate-400 flex items-center gap-2">
          <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase tracking-widest">
            {selectedList.length} Selected
          </span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expandable Grade Selection Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3.5 shadow-inner"
          >
            {/* Search and Quick Filters */}
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                placeholder="Type to filter grades..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-400 transition-all shadow-xs"
              />
              
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className={cn("text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-white border border-slate-200 transition-all", accentText)}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={selectPrimary}
                  className={cn("text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-white border border-slate-200 transition-all", accentText)}
                >
                  Primary
                </button>

                <button
                  type="button"
                  onClick={selectCBC}
                  className={cn("text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-white border border-slate-200 transition-all", accentText)}
                >
                  CBC
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all ml-auto"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Chips Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
              {filteredGrades.map((g) => {
                const isSelected = selectedList.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-between gap-1",
                      isSelected
                        ? (isEmerald ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-blue-600 text-white border-blue-600 shadow-xs")
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span>{g}</span>
                    {isSelected && <Check size={10} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


const isDeveloperOverride = (email?: string) => {
  if (!email) return false;
  const clean = email.toLowerCase().trim().replace(/\s+/g, '');
  return clean === 'kombefortune9@gmail.com' || clean === 'admin@fortunesedutech.com';
};
const SUBSCRIPTION_PACKAGES = SUBSCRIPTION_PLANS;
const PRIMARY_GRADES = GRADES.slice(0, 7);
const SECONDARY_GRADES = GRADES.slice(7);

export function UserMonitor({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user: currentUser, userType } = useAuth();
  const cleanCurrentEmail = currentUser?.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
  const isAdmin = userType === 'developer' || isDeveloperEmail(cleanCurrentEmail) || isDeveloperOverride(cleanCurrentEmail);
  const isDev = isAdmin;

  const [rawUsers, setRawUsers] = useState<UserProfile[]>(() => {
    try {
      const userMap = new Map<string, UserProfile>();
      ['eduplan_all_seen_users_permanent', 'eduplan_monitor_raw_users', 'eduplan_trial_login_history'].forEach(key => {
        try {
          const raw = safeLocalStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach(u => {
                if (u && u.email) {
                  const cleanEmail = u.email.toLowerCase().trim().replace(/\s+/g, '');
                  if (cleanEmail && !userMap.has(cleanEmail)) {
                    userMap.set(cleanEmail, {
                      uid: u.uid || ('user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')),
                      displayName: u.displayName || 'Trial Teacher (Guest)',
                      email: cleanEmail,
                      photoURL: u.photoURL || '',
                      lastLogin: u.lastLogin || u.timestamp || u.firstAccess || null,
                      lastHeartbeat: u.lastHeartbeat || u.lastLogin || u.timestamp || null,
                      isOnline: false,
                      isWhitelisted: u.isWhitelisted || false,
                      userType: u.userType || 'guest',
                      teaching_grade: u.teaching_grade || u.teachingGrade || 'Trial Access',
                      subscriptionType: u.subscriptionType || 'guest_trial',
                      addedAt: u.addedAt || u.timestamp || u.firstAccess || null,
                      status: u.status || 'active'
                    });
                  }
                }
              });
            }
          }
        } catch {}
      });
      return Array.from(userMap.values());
    } catch {
      return [];
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<any>(null);
  const [userHistory, setUserHistory] = useState<Record<string, any>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<'traffic' | 'trial' | 'schools' | 'requests' | 'tracker' | 'activity' | 'feedback' | 'analytics' | 'lipila'>('traffic');
  const [activationRequests, setActivationRequests] = useState<any[]>([]);
  const [lipilaTransactions, setLipilaTransactions] = useState<any[]>([]);
  const [lipilaSummary, setLipilaSummary] = useState<any>(null);
  const [lipilaLoading, setLipilaLoading] = useState(false);

  const fetchLipilaHistory = async () => {
    setLipilaLoading(true);
    try {
      const res = await fetch('/api/payments/lipila/history');
      const data = await res.json();
      if (data.success) {
        setLipilaTransactions(data.transactions || []);
        setLipilaSummary(data.summary || null);
      }
    } catch (err) {
      console.warn("Failed to fetch Lipila history:", err);
    } finally {
      setLipilaLoading(false);
    }
  };

  const handleDownloadStatement = () => {
    window.open('/api/payments/lipila/statement.csv', '_blank');
    toast.success("📥 Compiled customer transaction statement downloaded successfully!");
  };

  const [schoolsList, setSchoolsList] = useState<SchoolCircle[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('eduplan_all_schools_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const list = await fetchAllSchools();
      setSchoolsList(list);
    } catch (e) {
      console.warn("Error fetching schools in UserMonitor:", e);
    } finally {
      setSchoolsLoading(false);
    }
  };

  const [feedbackList, setFeedbackList] = useState<any[]>(() => {
    try {
      const raw = safeLocalStorage.getItem('eduplan_monitor_feedback');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const q = query(collection(db, 'document_feedback'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setFeedbackList(list);
      try {
        safeLocalStorage.setItem('eduplan_monitor_feedback', JSON.stringify(list));
      } catch {}
    } catch (e: any) {
      console.warn('Document feedback fetch notice:', e);
      try {
        const raw = safeLocalStorage.getItem('eduplan_monitor_feedback');
        if (raw) setFeedbackList(JSON.parse(raw));
      } catch {}
    } finally {
      setFeedbackLoading(false);
    }
  };

  const [whitelist, setWhitelist] = useState<any[]>(() => {
    try {
      const raw = safeLocalStorage.getItem('eduplan_monitor_whitelist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [whitelistLoading, setWhitelistLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Guest Form State
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestGrade, setNewGuestGrade] = useState('all');
  const [newGuestSub, setNewGuestSub] = useState('monthly');
  const [newGuestSubIndex, setNewGuestSubIndex] = useState('1');
  const [newGuestPaymentMethod, setNewGuestPaymentMethod] = useState('MTN Mobile Money');
  const [newGuestAmount, setNewGuestAmount] = useState('90');
  const [newGuestStartDate, setNewGuestStartDate] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Edit / Action States
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);
  const [pendingDeleteGuest, setPendingDeleteGuest] = useState<any>(null);

  // Activation Modal States
  const [activatingUser, setActivatingUser] = useState<any>(null);
  const [activationSub, setActivationSub] = useState('monthly');
  const [activationGrade, setActivationGrade] = useState('all');
  const [activationAmount, setActivationAmount] = useState('90');
  const [activationPaymentMethod, setActivationPaymentMethod] = useState('MTN Mobile Money');
  const [activationDate, setActivationDate] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [activationSubIndex, setActivationSubIndex] = useState('1');
  const [isActivating, setIsActivating] = useState(false);
  const [isResettingTrials, setIsResettingTrials] = useState(false);

  const [now, setNow] = useState(Date.now());
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const resetSuccess = !!resetSuccessMsg;

  const newGuestAmountPaid = newGuestAmount;
  const setNewGuestAmountPaid = setNewGuestAmount;

  const [error, setError] = useState<string | null>(null);
  const loading = isRefreshing || whitelistLoading;

  const formatDocumentType = (type?: string) => type ? type.replace(/_/g, ' ').toUpperCase() : 'DOCUMENT';
  const toggleUserExpand = (uid: string) => setExpandedUserId(prev => prev === uid ? null : uid);
  
  const userDownloads: Record<string, any[]> = {};
  const downloadsLoading: Record<string, boolean> = {};

  const handleResetAllTrialUsers = async () => {
    setIsResettingTrials(true);
    try {
      safeLocalStorage.removeItem('eduplan_trial_login_history');
      setResetSuccessMsg('Trial accounts successfully reset!');
      toast.success('Trial accounts reset successfully');
      await fetchUsers();
    } catch (e: any) {
      toast.error('Failed to reset trials: ' + e.message);
    } finally {
      setIsResettingTrials(false);
    }
  };

  const handleQuickRenew = async (email: string, subType?: string) => {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim().replace(/\s+/g, '');
    try {
      const now = new Date();
      await setDoc(doc(db, 'authorized_guests', cleanEmail), {
        subscriptionStart: now,
        status: 'active',
        isWhitelisted: true,
        is_whitelisted: true
      }, { merge: true });

      // Also update matching user profiles in users collection
      try {
        const qUsers = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snapUsers = await getDocs(qUsers);
        const batch = writeBatch(db);
        snapUsers.forEach(uDoc => {
          batch.set(uDoc.ref, {
            subscriptionStart: now,
            status: 'active',
            isWhitelisted: true,
            is_whitelisted: true
          }, { merge: true });
        });
        await batch.commit();
      } catch (e) {}

      safeLocalStorage.removeItem(`eduplan_sub_cache_${cleanEmail}`);
      toast.success('Subscription renewed for ' + cleanEmail);
      await fetchWhitelist();
      await fetchUsers();
    } catch (e: any) {
      toast.error('Failed to renew subscription: ' + e.message);
    }
  };

  const [isNormalizingSubs, setIsNormalizingSubs] = useState(false);

  const handleNormalizeAllSubscriptions = async () => {
    setIsNormalizingSubs(true);
    let normalizedCount = 0;
    try {
      const guestSnap = await getDocs(collection(db, 'authorized_guests'));
      const batch = writeBatch(db);

      guestSnap.forEach(gDoc => {
        const data = gDoc.data();
        const cleanEmail = (data.email || gDoc.id).toLowerCase().trim().replace(/\s+/g, '');
        if (!cleanEmail || data.status === 'blocked') return;

        let amt = Number(data.amountPaid || data.amount || 0);
        let rawSub = data.subscriptionType || data.plan || data.circle || data.subType;

        let normalizedSub = rawSub;
        if (!normalizedSub || normalizedSub === 'guest_trial' || !(normalizedSub in SUBSCRIPTION_PLANS)) {
          if (amt >= 1500) normalizedSub = 'unlimited';
          else if (amt >= 800) normalizedSub = 'termly';
          else if (amt >= 90) normalizedSub = 'monthly';
          else if (amt >= 40) normalizedSub = '14days';
          else if (amt >= 20) normalizedSub = 'weekly';
          else {
            normalizedSub = 'monthly';
          }
        }

        const subType = (normalizedSub in SUBSCRIPTION_PLANS && normalizedSub !== 'guest_trial') ? normalizedSub : 'monthly';
        const plan = SUBSCRIPTION_PLANS[subType] || SUBSCRIPTION_PLANS.monthly;
        const correctAmount = amt > 0 ? amt : plan.price;
        const subStart = data.subscriptionStart || data.addedAt || data.createdAt || new Date().toISOString();

        batch.set(gDoc.ref, {
          email: cleanEmail,
          subscriptionType: subType,
          amountPaid: correctAmount,
          circleDownloadsLimit: plan.limit,
          subscriptionStart: subStart,
          addedAt: data.addedAt || subStart,
          status: 'active',
          isWhitelisted: true,
          is_whitelisted: true
        }, { merge: true });

        // Sync to matching user profile in users collection
        const targetUid = 'guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        batch.set(doc(db, 'users', targetUid), {
          uid: targetUid,
          email: cleanEmail,
          subscriptionType: subType,
          amountPaid: correctAmount,
          circleDownloadsLimit: plan.limit,
          subscriptionStart: subStart,
          addedAt: data.addedAt || subStart,
          status: 'active',
          isWhitelisted: true,
          is_whitelisted: true,
          userType: 'registered',
          user_type: 'registered'
        }, { merge: true });

        normalizedCount++;
      });

      await batch.commit();
      toast.success(`Successfully audited & normalized ${normalizedCount} subscription records!`);
      await fetchWhitelist();
      await fetchUsers();
    } catch (e: any) {
      toast.error("Normalization notice: " + e.message);
    } finally {
      setIsNormalizingSubs(false);
    }
  };


  useEffect(() => {
    let price = 90;
    if (newGuestSub === 'weekly') price = 20;
    else if (newGuestSub === '14days') price = 40;
    else if (newGuestSub === 'monthly') price = 90;
    else if (newGuestSub === 'termly_individual') price = 220;
    else if (newGuestSub === 'termly') price = 800;
    setNewGuestAmount(price.toString());
  }, [newGuestSub]);

  useEffect(() => {
    let price = 90;
    if (activationSub === 'weekly') price = 20;
    else if (activationSub === '14days') price = 40;
    else if (activationSub === 'monthly') price = 90;
    else if (activationSub === 'termly_individual') price = 220;
    else if (activationSub === 'termly') price = 800;
    setActivationAmount(price.toString());
  }, [activationSub]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const getUserSubscriptionInfo = (user: any) => {
    const cleanEmail = (user?.email || '').toLowerCase().trim().replace(/\s+/g, '');
    const isDevUser = isDeveloperOverride(cleanEmail);
    const isUserWhitelisted = user.isWhitelisted === true || user.is_whitelisted === true || user.status === 'active' || user.status === 'approved';
    
    if (!isDevUser && !isUserWhitelisted && (user.subscriptionType === 'guest_trial' || !user.subscriptionType)) {
      return {
        subType: 'guest_trial',
        circleLabel: 'Free Trial Access (View-Only)',
        cost: 'Free Trial (K0)',
        subBadgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
        startDate: null,
        endDate: null,
        isExpired: false,
        remainingText: 'Unlimited Previews (No Downloads)'
      };
    }

    let rawSub = user.subscriptionType || user.plan || user.circle || user.subType;
    const amt = user.amountPaid !== undefined && user.amountPaid !== null ? Number(user.amountPaid) : 0;
    if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PACKAGES)) {
      if (amt >= 800) rawSub = 'termly';
      else if (amt >= 200) rawSub = 'termly_individual';
      else if (amt >= 90) rawSub = 'monthly';
      else if (amt >= 40) rawSub = '14days';
      else if (amt >= 20) rawSub = 'weekly';
      else rawSub = 'monthly';
    }
    const subType = isDevUser ? 'unlimited' : ((rawSub && rawSub in SUBSCRIPTION_PACKAGES) ? rawSub : 'monthly');
    const startMs = safeToMillis(user.subscriptionStart || user.addedAt || (isDevUser ? new Date(2025, 0, 1) : null));
    let durationMs = 30 * 24 * 60 * 60 * 1000;
    let circleLabel = 'Monthly Circle (30 Days)';
    let cost = 'K90';
    let subBadgeClass = 'text-purple-700 bg-purple-50 border-purple-200';

    if (subType === 'weekly') { durationMs = 7 * 24 * 60 * 60 * 1000; circleLabel = 'Weekly Circle (7 Days)'; cost = 'K20'; subBadgeClass = 'text-amber-700 bg-amber-50 border-amber-200'; }
    else if (subType === '14days') { durationMs = 14 * 24 * 60 * 60 * 1000; circleLabel = '14 Days Circle (14 Days)'; cost = 'K40'; subBadgeClass = 'text-cyan-700 bg-cyan-50 border-cyan-200'; }
    else if (subType === 'monthly') { durationMs = 30 * 24 * 60 * 60 * 1000; circleLabel = 'Monthly Circle (30 Days)'; cost = 'K90'; subBadgeClass = 'text-purple-700 bg-purple-50 border-purple-200'; }
    else if (subType === 'termly_individual') { durationMs = 90 * 24 * 60 * 60 * 1000; circleLabel = 'Individual Termly Circle (90 Days - 300 Downloads)'; cost = 'K220'; subBadgeClass = 'text-teal-700 bg-teal-50 border-teal-200'; }
    else if (subType === 'termly') { durationMs = 90 * 24 * 60 * 60 * 1000; circleLabel = 'School Termly Circle (90 Days - Unlimited)'; cost = 'K800'; subBadgeClass = 'text-indigo-700 bg-indigo-50 border-indigo-200'; }
    else if (subType === 'unlimited') { durationMs = 10 * 365 * 24 * 60 * 60 * 1000; circleLabel = 'Unlimited Access (Lifetime)'; cost = 'Lifetime'; subBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }

    const startDate = startMs > 0 ? new Date(startMs) : null;
    const endDate = isDevUser || subType === 'unlimited' ? null : (startDate ? new Date(startDate.getTime() + durationMs) : null);
    const isExpired = isDevUser || subType === 'unlimited' ? false : (endDate ? now > endDate.getTime() : false);

    let remainingText = '';
    if (isDevUser || subType === 'unlimited') remainingText = 'Lifetime Active';
    else if (endDate) {
      const diff = endDate.getTime() - now;
      if (diff <= 0) remainingText = 'Expired';
      else {
        const days = Math.ceil(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        remainingText = days > 0 ? (days + ' Days Left') : (hours + ' Hours Left');
      }
    }

    return { subType, circleLabel, cost, subBadgeClass, startDate, endDate, isExpired, remainingText };
  };

  const approvedUsers = useMemo(() => {
    return whitelist.map(w => {
      const cleanEmail = (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '');
      const liveUser = rawUsers.find(u => u.email.toLowerCase().trim().replace(/\s+/g, '') === cleanEmail);
      let rawSub = w.subscriptionType || w.plan || w.circle || w.subType || liveUser?.subscriptionType;
      const amt = w.amountPaid !== undefined && w.amountPaid !== null ? Number(w.amountPaid) : ((liveUser as any)?.amountPaid !== undefined ? Number((liveUser as any).amountPaid) : 0);
      if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PLANS)) {
        if (amt >= 800) rawSub = 'termly';
        else if (amt >= 90) rawSub = 'monthly';
        else if (amt >= 40) rawSub = '14days';
        else if (amt >= 20) rawSub = 'weekly';
        else rawSub = 'monthly';
      }
      const subType = (rawSub in SUBSCRIPTION_PLANS && rawSub !== 'guest_trial') ? rawSub : 'monthly';
      const subStart = w.subscriptionStart || w.addedAt || liveUser?.subscriptionStart || liveUser?.addedAt || null;
      return {
        uid: liveUser?.uid || w.id || ('whitelisted_' + cleanEmail),
        email: cleanEmail,
        displayName: liveUser?.displayName || w.displayName || cleanEmail.split('@')[0],
        photoURL: liveUser?.photoURL || '',
        isWhitelisted: w.status !== 'blocked',
        userType: 'registered',
        teaching_grade: w.grade || w.teaching_grade || 'all',
        subscriptionType: subType,
        subscriptionStart: subStart,
        addedAt: w.addedAt || liveUser?.addedAt || subStart,
        amountPaid: amt || 90,
        paymentMethod: w.paymentMethod || 'MTN Mobile Money',
        subscriptionIndex: w.subscriptionIndex !== undefined ? Number(w.subscriptionIndex) : 1,
        lastLogin: liveUser?.lastLogin || w.lastLogin || w.addedAt || null,
        lastHeartbeat: liveUser?.lastHeartbeat || w.lastHeartbeat || null,
        status: w.status || 'active'
      };
    });
  }, [whitelist, rawUsers]);

  const trialUsers = useMemo(() => {
    return rawUsers.filter(u => {
      const cleanEmail = u.email.toLowerCase().trim().replace(/\s+/g, '');
      const isDev = isDeveloperEmail(cleanEmail) || u.userType === 'developer';
      if (isDev) return false;
      const isApprovedInWhitelist = whitelist.some(w => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') === cleanEmail && w.status !== 'blocked');
      return !isApprovedInWhitelist;
    });
  }, [rawUsers, whitelist]);
  const currentUsersList = useMemo(() => {
    const list = activeTab === "traffic" ? approvedUsers : trialUsers;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(u => 
      (u.email && u.email.toLowerCase().includes(q)) || 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.uid && u.uid.toLowerCase().includes(q))
    );
  }, [activeTab, approvedUsers, trialUsers, searchQuery]);

  const allAvailableGrades = useMemo(() => [...new Set([...PRIMARY_GRADES, ...SECONDARY_GRADES])], []);

  const isUserOnline = (user: any) => {
    if (!user.lastHeartbeat) return false;
    const ms = safeToMillis(user.lastHeartbeat);
    return ms > 0 && (now - ms < 150000);
  };
  const isOnline = isUserOnline;


  const formatRealityTime = (dateObj: any, fallback = 'Pending First Login') => {
    const d = safeToDate(dateObj);
    return d ? d.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : fallback;
  };

  const getSessionDuration = (login: any, heartbeat: any) => {
    const start = safeToMillis(login);
    const end = safeToMillis(heartbeat);
    if (!start || !end || end <= start) return null;
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return hrs + 'h ' + remMins + 'm';
    if (mins > 0) return mins + 'm';
    return '1m';
  };

  const fetchWhitelist = async () => {
    if (!auth.currentUser) return;
    setWhitelistLoading(true);
    try {
      const q = collection(db, 'authorized_guests');
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        const cleanEmail = (data.email || d.id || '').toLowerCase().trim().replace(/\s+/g, '');
        if (cleanEmail) {
          list.push({
            id: cleanEmail,
            email: cleanEmail,
            displayName: data.displayName || cleanEmail.split('@')[0],
            grade: data.grade || data.teaching_grade || 'all',
            subscriptionType: data.subscriptionType || 'monthly',
            amountPaid: data.amountPaid !== undefined && data.amountPaid !== null ? Number(data.amountPaid) : 90,
            paymentMethod: data.paymentMethod || 'MTN Mobile Money',
            subscriptionIndex: data.subscriptionIndex !== undefined ? Number(data.subscriptionIndex) : 1,
            status: data.status || 'active',
            isWhitelisted: data.status !== 'blocked',
            is_whitelisted: data.status !== 'blocked',
            subscriptionStart: data.subscriptionStart || data.addedAt || null,
            addedAt: data.addedAt || data.subscriptionStart || null,
            ...data
          });
        }
      });
      list.sort((a, b) => safeToMillis(b.addedAt || b.subscriptionStart) - safeToMillis(a.addedAt || a.subscriptionStart));
      setWhitelist(list);
      try {
        safeLocalStorage.setItem('eduplan_monitor_whitelist', JSON.stringify(list));
        safeLocalStorage.setItem('eduplan_whitelisted_guests', JSON.stringify(list));
        safeLocalStorage.setItem('eduplan_settings_whitelist', JSON.stringify(list));
      } catch {}
    } catch (e: any) {
      console.warn('Fetch whitelist notice:', e);
      try {
        const raw = safeLocalStorage.getItem('eduplan_monitor_whitelist') || safeLocalStorage.getItem('eduplan_whitelisted_guests');
        setWhitelist(raw ? JSON.parse(raw) : []);
      } catch {}
    } finally {
      setWhitelistLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      const userMap = new Map<string, UserProfile>();

      try {
        ['eduplan_all_seen_users_permanent', 'eduplan_monitor_raw_users', 'eduplan_trial_login_history'].forEach(key => {
          const raw = safeLocalStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              arr.forEach(u => {
                if (u && u.email) {
                  const cleanEmail = u.email.toLowerCase().trim().replace(/\s+/g, '');
                  userMap.set(cleanEmail, {
                    uid: u.uid || ('guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')),
                    displayName: u.displayName || 'Teacher',
                    email: cleanEmail,
                    photoURL: u.photoURL || '',
                    lastLogin: u.lastLogin || null,
                    lastHeartbeat: u.lastHeartbeat || null,
                    isOnline: false,
                    isWhitelisted: u.isWhitelisted || u.is_whitelisted || false,
                    userType: u.userType || 'guest',
                    teaching_grade: u.teaching_grade || u.teachingGrade || 'Trial Access',
                    subscriptionType: u.subscriptionType || 'guest_trial',
                    addedAt: u.addedAt || u.subscriptionStart || null,
                    status: u.status || 'active'
                  });
                }
              });
            }
          }
        });
      } catch (e) {}

      snap.forEach(d => {
        const data = d.data();
        if (data && data.email) {
          const cleanEmail = data.email.toLowerCase().trim().replace(/\s+/g, '');
          userMap.set(cleanEmail, {
            uid: d.id,
            displayName: data.displayName || 'Teacher',
            email: cleanEmail,
            photoURL: data.photoURL || '',
            lastLogin: data.lastLogin || data.timestamp || null,
            lastHeartbeat: data.lastHeartbeat || data.lastLogin || null,
            isOnline: false,
            isWhitelisted: data.isWhitelisted || data.is_whitelisted || false,
            userType: data.userType || 'guest',
            teaching_grade: data.teaching_grade || data.teachingGrade || 'Trial Access',
            subscriptionType: data.subscriptionType || 'guest_trial',
            addedAt: data.addedAt || data.subscriptionStart || null,
            status: data.status || 'active'
          });
        }
      });
      const list = Array.from(userMap.values());
      list.sort((a, b) => safeToMillis(b.lastLogin) - safeToMillis(a.lastLogin));
      setRawUsers(list);
    } catch (e: any) {
      console.warn('Fetch users notice:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchUsers();
    fetchWhitelist();
    fetchFeedback();
    fetchSchools();

    const unsubWhitelist = onSnapshot(collection(db, 'authorized_guests'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        const cleanEmail = (data.email || d.id || '').toLowerCase().trim().replace(/\s+/g, '');
        if (cleanEmail) {
          list.push({
            id: cleanEmail,
            email: cleanEmail,
            displayName: data.displayName || cleanEmail.split('@')[0],
            grade: data.grade || data.teaching_grade || 'all',
            subscriptionType: data.subscriptionType || 'monthly',
            amountPaid: data.amountPaid !== undefined && data.amountPaid !== null ? Number(data.amountPaid) : 90,
            paymentMethod: data.paymentMethod || 'MTN Mobile Money',
            subscriptionIndex: data.subscriptionIndex !== undefined ? Number(data.subscriptionIndex) : 1,
            status: data.status || 'active',
            isWhitelisted: data.status !== 'blocked',
            is_whitelisted: data.status !== 'blocked',
            subscriptionStart: data.subscriptionStart || data.addedAt || null,
            addedAt: data.addedAt || data.subscriptionStart || null,
            ...data
          });
        }
      });
      list.sort((a, b) => safeToMillis(b.addedAt || b.subscriptionStart) - safeToMillis(a.addedAt || a.subscriptionStart));
      setWhitelist(list);
      try {
        safeLocalStorage.setItem('eduplan_monitor_whitelist', JSON.stringify(list));
        safeLocalStorage.setItem('eduplan_whitelisted_guests', JSON.stringify(list));
        safeLocalStorage.setItem('eduplan_settings_whitelist', JSON.stringify(list));
      } catch (e) {}
    }, (err) => {
      console.warn("Real-time whitelist snapshot notice:", err);
    });

    const unsubRequests = onSnapshot(collection(db, 'subscription_requests'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data
        });
      });
      list.sort((a, b) => safeToMillis(b.timestamp) - safeToMillis(a.timestamp));
      setActivationRequests(list);
    }, (err) => {
      console.warn("Real-time requests snapshot notice:", err);
    });

    return () => {
      unsubWhitelist();
      unsubRequests();
    };
  }, [isOpen]);


  const openActivationModal = (user: any) => {
    setActivatingUser(user);
    setActivationGrade(user.teaching_grade || user.grade || 'all');
    const existingSub = user.subscriptionType && user.subscriptionType in SUBSCRIPTION_PACKAGES ? user.subscriptionType : 'monthly';
    setActivationSub(existingSub);
    setActivationAmount(user.amountPaid ? String(user.amountPaid) : String(SUBSCRIPTION_PACKAGES[existingSub]?.price || 90));
    setActivationPaymentMethod(user.paymentMethod || 'MTN Mobile Money');
    
    // Preserve existing subscriptionStart if already set so it doesn't shift
    const existingDate = user.subscriptionStart || user.addedAt;
    if (existingDate) {
      const d = safeToDate(existingDate);
      if (d && !isNaN(d.getTime())) {
        setActivationDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      } else {
        setActivationDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      }
    } else {
      setActivationDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
    setActivationSubIndex(user.subscriptionIndex ? String(user.subscriptionIndex) : '1');
  };

  const handleActivateUser = async (user: any) => {
    if (!user || !user.email) return;
    const cleanEmail = user.email.toLowerCase().trim().replace(/\s+/g, '');
    setIsActivating(true);
    try {
      const pkg = SUBSCRIPTION_PACKAGES[activationSub] || SUBSCRIPTION_PACKAGES.monthly;
      const amt = Number(activationAmount) || pkg.price;
      const now = new Date();
      const subStart = new Date(activationDate);

      const guestData = {
        id: cleanEmail,
        email: cleanEmail,
        displayName: user.displayName || 'Approved Teacher',
        grade: activationGrade || 'all',
        subscriptionType: activationSub,
        amountPaid: amt,
        paymentMethod: activationPaymentMethod,
        subscriptionIndex: Number(activationSubIndex) || 1,
        status: 'active',
        isWhitelisted: true,
        is_whitelisted: true,
        isTrialMode: false,
        subscriptionStart: subStart,
        addedAt: now,
        addedBy: currentUser?.email || 'kombefortune9@gmail.com'
      };

      await setDoc(doc(db, 'authorized_guests', cleanEmail), guestData, { merge: true });

      // Batch update all matching user profiles in 'users' collection so Google Login and UID queries match instantly
      try {
        const qUsers = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snapUsers = await getDocs(qUsers);
        const batch = writeBatch(db);
        snapUsers.forEach(uDoc => {
          batch.set(uDoc.ref, {
            isWhitelisted: true,
            is_whitelisted: true,
            userType: 'registered',
            user_type: 'registered',
            subscriptionType: activationSub,
            teaching_grade: activationGrade || 'all',
            status: 'active',
            amountPaid: amt,
            paymentMethod: activationPaymentMethod,
            subscriptionStart: subStart,
            addedAt: now
          }, { merge: true });
        });

        const targetUid = user.uid || ('guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'));
        batch.set(doc(db, 'users', targetUid), {
          uid: targetUid,
          email: cleanEmail,
          displayName: user.displayName || 'Approved Teacher',
          isWhitelisted: true,
          is_whitelisted: true,
          userType: 'registered',
          user_type: 'registered',
          subscriptionType: activationSub,
          teaching_grade: activationGrade || 'all',
          status: 'active',
          amountPaid: amt,
          subscriptionStart: subStart,
          addedAt: now
        }, { merge: true });

        await batch.commit();
      } catch (err) {
        console.warn("User sync error on activate:", err);
      }

      try {
        safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({
          details: {
            subscriptionType: activationSub,
            subscriptionStart: subStart,
            isTrialMode: false,
            isWhitelisted: true,
            circleDownloadsLimit: pkg.limit,
            circleDownloadsCount: 0,
            isQuotaExhausted: false,
            isSubscriptionExpired: false,
            gradeCounts: {},
            daysRemaining: pkg.durationDays === Infinity ? 9999 : pkg.durationDays
          },
          grades: activationGrade === 'all' ? ['all'] : activationGrade.split(',').map((s: string) => s.trim())
        }));

        const rawWhitelisted = safeLocalStorage.getItem('eduplan_whitelisted_guests') || safeLocalStorage.getItem('eduplan_monitor_whitelist');
        const listWhitelisted = rawWhitelisted ? JSON.parse(rawWhitelisted) : [];
        const filteredW = Array.isArray(listWhitelisted) ? listWhitelisted.filter((w: any) => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') !== cleanEmail) : [];
        filteredW.unshift(guestData);
        safeLocalStorage.setItem('eduplan_whitelisted_guests', JSON.stringify(filteredW));
        safeLocalStorage.setItem('eduplan_monitor_whitelist', JSON.stringify(filteredW));
        safeLocalStorage.setItem('eduplan_settings_whitelist', JSON.stringify(filteredW));
      } catch (e) {}

      setWhitelist(prev => [guestData, ...prev.filter(w => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') !== cleanEmail)]);
      setRawUsers(prev => prev.map(u => {
        if (u.email.toLowerCase().trim().replace(/\s+/g, '') === cleanEmail) {
          return {
            ...u,
            isWhitelisted: true,
            userType: 'registered',
            subscriptionType: activationSub,
            teaching_grade: activationGrade || 'all',
            status: 'active'
          };
        }
        return u;
      }));

      // Trigger Background Activation Email with personalized first name
      try {
        const recipientFirstName = extractUserFirstName(user.displayName, cleanEmail);
        getDoc(doc(db, 'global_settings', 'email_template')).then((tplSnap) => {
          const tplData = tplSnap.exists() ? tplSnap.data() : {};
          const rawSubject = tplData.activeSubject || "Your Fortunes Edutech Subscription is Active!";
          const rawBody = tplData.activeBody || "Hello {{NAME}},\n\nGreat news! Your Fortunes Edutech account has been officially activated.\n\nYou have been enrolled into the **{{CIRCLE}}** circle.\n\nLog in now to access your new premium features and start generating documents.\n\nBest regards,\nThe Fortunes Edutech Team";
          
          const formattedBody = rawBody
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
            .replace(/{{CIRCLE}}/gi, activationSub.toUpperCase())
            .replace(/{{NAME}}/gi, recipientFirstName)
            .replace(/{{FIRST_NAME}}/gi, recipientFirstName)
            .replace(/Hello Educator\b/gi, `Hello ${recipientFirstName}`);

          fetch('/api/system/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: cleanEmail,
              recipientName: recipientFirstName,
              subject: rawSubject.replace(/{{CIRCLE}}/gi, activationSub.toUpperCase()).replace(/{{NAME}}/gi, recipientFirstName),
              html: `<p>${formattedBody}</p>`,
              logoUrl: tplData.logo || undefined
            })
          }).catch(err => console.warn("Background activation email failed", err));
        }).catch(() => {});
      } catch (emailErr) {
        console.warn("Activation email trigger error:", emailErr);
      }

      toast.success('Activated ' + cleanEmail + ' for ' + activationSub + ' (' + activationGrade + ')');
      setActivatingUser(null);
      await fetchWhitelist();
      await fetchUsers();
    } catch (e: any) {
      toast.error('Activation failed: ' + e.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleApproveRequest = async (request: any) => {
    if (!request || !request.email) return;
    const cleanEmail = request.email.toLowerCase().trim().replace(/\s+/g, '');
    const reqSub = request.subscriptionType || 'monthly';
    const reqGrade = request.grade || 'all';
    const reqAmount = request.amount !== undefined ? Number(request.amount) : 90;
    const reqPaymentMethod = request.paymentMethod || 'MTN Mobile Money';
    
    const toastId = toast.loading(`Activating ${cleanEmail}...`);
    try {
      const pkg = SUBSCRIPTION_PACKAGES[reqSub] || SUBSCRIPTION_PACKAGES.monthly;
      const now = new Date();
      const subStart = new Date();

      const guestData = {
        id: cleanEmail,
        email: cleanEmail,
        displayName: request.displayName || cleanEmail.split('@')[0],
        grade: reqGrade,
        subscriptionType: reqSub,
        amountPaid: reqAmount,
        paymentMethod: reqPaymentMethod,
        subscriptionIndex: 1,
        status: 'active',
        isWhitelisted: true,
        is_whitelisted: true,
        isTrialMode: false,
        subscriptionStart: subStart,
        addedAt: now,
        addedBy: currentUser?.email || 'kombefortune9@gmail.com'
      };

      await setDoc(doc(db, 'authorized_guests', cleanEmail), guestData, { merge: true });

      try {
        const qUsers = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snapUsers = await getDocs(qUsers);
        const batch = writeBatch(db);
        snapUsers.forEach(uDoc => {
          batch.set(uDoc.ref, {
            isWhitelisted: true,
            is_whitelisted: true,
            userType: 'registered',
            user_type: 'registered',
            subscriptionType: reqSub,
            teaching_grade: reqGrade,
            status: 'active',
            amountPaid: reqAmount,
            paymentMethod: reqPaymentMethod,
            subscriptionStart: subStart,
            addedAt: now
          }, { merge: true });
        });

        const targetUid = request.uid || ('guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'));
        batch.set(doc(db, 'users', targetUid), {
          uid: targetUid,
          email: cleanEmail,
          displayName: request.displayName || cleanEmail.split('@')[0],
          isWhitelisted: true,
          is_whitelisted: true,
          userType: 'registered',
          user_type: 'registered',
          subscriptionType: reqSub,
          teaching_grade: reqGrade,
          status: 'active',
          amountPaid: reqAmount,
          subscriptionStart: subStart,
          addedAt: now
        }, { merge: true });

        // Update the request status to approved
        batch.set(doc(db, 'subscription_requests', request.id), {
          status: 'approved',
          approvedAt: serverTimestamp()
        }, { merge: true });

        await batch.commit();
      } catch (err) {
        console.warn("User sync error on approve:", err);
      }

      try {
        safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({
          details: {
            subscriptionType: reqSub,
            subscriptionStart: subStart,
            isTrialMode: false,
            isWhitelisted: true,
            circleDownloadsLimit: pkg.limit,
            circleDownloadsCount: 0,
            isQuotaExhausted: false,
            isSubscriptionExpired: false,
            gradeCounts: {},
            daysRemaining: pkg.durationDays === Infinity ? 9999 : pkg.durationDays
          },
          grades: reqGrade === 'all' ? ['all'] : reqGrade.split(',').map((s: string) => s.trim())
        }));
      } catch (e) {}

      setWhitelist(prev => [guestData, ...prev.filter(w => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') !== cleanEmail)]);
      setRawUsers(prev => prev.map(u => {
        if (u.email.toLowerCase().trim().replace(/\s+/g, '') === cleanEmail) {
          return {
            ...u,
            isWhitelisted: true,
            is_whitelisted: true,
            userType: 'registered',
            subscriptionType: reqSub,
            teaching_grade: reqGrade,
            status: 'active'
          };
        }
        return u;
      }));

      // Trigger Background Activation Email with personalized first name
      try {
        const recipientFirstName = extractUserFirstName(request.displayName, cleanEmail);
        getDoc(doc(db, 'global_settings', 'email_template')).then((tplSnap) => {
          const tplData = tplSnap.exists() ? tplSnap.data() : {};
          const rawSubject = tplData.activeSubject || "Your Fortunes Edutech Subscription is Active!";
          const rawBody = tplData.activeBody || "Hello {{NAME}},\n\nGreat news! Your Fortunes Edutech account has been officially activated.\n\nYou have been enrolled into the **{{CIRCLE}}** circle.\n\nLog in now to access your new premium features and start generating documents.\n\nBest regards,\nThe Fortunes Edutech Team";
          
          const formattedBody = rawBody
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
            .replace(/{{CIRCLE}}/gi, reqSub.toUpperCase())
            .replace(/{{NAME}}/gi, recipientFirstName)
            .replace(/{{FIRST_NAME}}/gi, recipientFirstName)
            .replace(/Hello Educator\b/gi, `Hello ${recipientFirstName}`);

          fetch('/api/system/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: cleanEmail,
              recipientName: recipientFirstName,
              subject: rawSubject.replace(/{{CIRCLE}}/gi, reqSub.toUpperCase()).replace(/{{NAME}}/gi, recipientFirstName),
              html: `<p>${formattedBody}</p>`,
              logoUrl: tplData.logo || undefined
            })
          }).catch(err => console.warn("Background activation email failed", err));
        }).catch(() => {});
      } catch (emailErr) {
        console.warn("Activation email trigger error:", emailErr);
      }

      toast.success(`Activated ${cleanEmail} for ${reqSub}!`, { id: toastId });
      recordActivity({ type: 'sync', details: `Approved Activation Request for ${cleanEmail} (${reqSub})` });
      
      fetchWhitelist();
      fetchUsers();
    } catch (e: any) {
      toast.error('Activation failed: ' + e.message, { id: toastId });
    }
  };

  const handleRejectRequest = async (request: any) => {
    if (!window.confirm(`Are you sure you want to dismiss this activation request from ${request.email}?`)) return;
    try {
      await setDoc(doc(db, 'subscription_requests', request.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      }, { merge: true });
      toast.success("Request dismissed.");
    } catch (err: any) {
      toast.error(`Failed to dismiss: ${err.message}`);
    }
  };

  const handleToggleGuestStatus = async (guestOrEmail: any, newStatusOverride?: string) => {
    const email = typeof guestOrEmail === 'string' ? guestOrEmail : guestOrEmail?.email;
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim().replace(/\s+/g, '');
    const currentStatus = typeof guestOrEmail === 'object' ? guestOrEmail?.status : 'active';
    const newStatus = newStatusOverride || (currentStatus === 'active' ? 'suspended' : 'active');
    try {
      await setDoc(doc(db, 'authorized_guests', cleanEmail), { status: newStatus }, { merge: true });
      toast.success('Updated status to ' + newStatus);
      fetchWhitelist();
    } catch (e: any) {
      toast.error('Failed to update status: ' + e.message);
    }
  };

  const handleDeleteGuest = async (email: string, removeSessions: boolean) => {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim().replace(/\s+/g, '');
    try {
      await deleteDoc(doc(db, 'authorized_guests', cleanEmail));
      if (removeSessions) {
        const userDocRef = doc(db, 'users', 'guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'));
        await deleteDoc(userDocRef);
      }
      toast.success("Guest removed from whitelist");
      setPendingDeleteGuest(null);
      fetchWhitelist();
      fetchUsers();
    } catch (e: any) {
      toast.error('Failed to delete guest: ' + e.message);
    }
  };

  const handleSaveGuestEdit = async () => {
    if (!editingGuest || !editingGuest.email) return;
    const cleanEmail = editingGuest.email.toLowerCase().trim().replace(/\s+/g, '');
    setIsUpdatingGrade(true);
    try {
      const subType = editingGuest.subscriptionType || 'monthly';
      const pkg = SUBSCRIPTION_PACKAGES[subType] || SUBSCRIPTION_PACKAGES.monthly;
      const amt = editingGuest.amountPaid !== undefined && editingGuest.amountPaid !== null ? Number(editingGuest.amountPaid) : pkg.price;
      const now = new Date();

      const updatePayload: any = {
        id: cleanEmail,
        email: cleanEmail,
        grade: editingGuest.grade || 'all',
        subscriptionType: subType,
        amountPaid: amt,
        paymentMethod: editingGuest.paymentMethod || 'MTN Mobile Money',
        subscriptionIndex: Number(editingGuest.subscriptionIndex) || 1,
        status: 'active',
        isWhitelisted: true,
        is_whitelisted: true
      };

      if (editingGuest.resetSubscription) {
        updatePayload.subscriptionStart = now;
        updatePayload.addedAt = now;
      }

      // 1. Update authorized_guests document
      await setDoc(doc(db, 'authorized_guests', cleanEmail), updatePayload, { merge: true });

      // 2. Batch update users collection for all matching user profiles
      try {
        const qUsers = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snapUsers = await getDocs(qUsers);
        const batch = writeBatch(db);
        snapUsers.forEach(uDoc => {
          const userUpdate: any = {
            teaching_grade: editingGuest.grade || 'all',
            isWhitelisted: true,
            is_whitelisted: true,
            userType: 'registered',
            user_type: 'registered',
            subscriptionType: subType,
            amountPaid: amt,
            paymentMethod: editingGuest.paymentMethod || 'MTN Mobile Money',
            status: 'active'
          };
          if (editingGuest.resetSubscription) {
            userUpdate.subscriptionStart = now;
          }
          batch.set(uDoc.ref, userUpdate, { merge: true });
        });
        
        // Also update guest_ cleanEmail doc
        const guestUid = 'guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        batch.set(doc(db, 'users', guestUid), {
          uid: guestUid,
          email: cleanEmail,
          teaching_grade: editingGuest.grade || 'all',
          isWhitelisted: true,
          is_whitelisted: true,
          userType: 'registered',
          subscriptionType: subType,
          amountPaid: amt,
          status: 'active',
          ...(editingGuest.resetSubscription ? { subscriptionStart: now } : {})
        }, { merge: true });

        await batch.commit();
      } catch (err) {
        console.warn("User profile sync notice:", err);
      }

      // 3. Clear/Update local caches
      try {
        safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({
          details: {
            subscriptionType: subType,
            subscriptionStart: editingGuest.resetSubscription ? now : (editingGuest.subscriptionStart || now),
            isTrialMode: false,
            isWhitelisted: true,
            circleDownloadsLimit: pkg.limit,
            circleDownloadsCount: 0,
            isQuotaExhausted: false,
            isSubscriptionExpired: false,
            daysRemaining: pkg.durationDays === Infinity ? 9999 : pkg.durationDays
          },
          grades: editingGuest.grade === 'all' ? ['all'] : editingGuest.grade.split(',').map((s: string) => s.trim())
        }));

        safeLocalStorage.setItem(`eduplan_user_sub_circle_${cleanEmail}`, subType);

        const rawWhitelisted = safeLocalStorage.getItem('eduplan_whitelisted_guests') || safeLocalStorage.getItem('eduplan_monitor_whitelist');
        const listWhitelisted = rawWhitelisted ? JSON.parse(rawWhitelisted) : [];
        const filteredW = Array.isArray(listWhitelisted) ? listWhitelisted.filter((w: any) => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') !== cleanEmail) : [];
        filteredW.unshift(updatePayload);
        safeLocalStorage.setItem('eduplan_whitelisted_guests', JSON.stringify(filteredW));
        safeLocalStorage.setItem('eduplan_monitor_whitelist', JSON.stringify(filteredW));
        safeLocalStorage.setItem('eduplan_settings_whitelist', JSON.stringify(filteredW));
      } catch (e) {}

      toast.success(`Updated ${cleanEmail} to ${subType.toUpperCase()} (${editingGuest.grade})`);
      setEditingGuest(null);
      await fetchWhitelist();
      await fetchUsers();
    } catch (e: any) {
      toast.error('Failed to update circle: ' + e.message);
    } finally {
      setIsUpdatingGrade(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestEmail) return;
    const cleanEmail = newGuestEmail.toLowerCase().trim().replace(/\s+/g, '');
    setIsAddingGuest(true);
    try {
      const pkg = SUBSCRIPTION_PACKAGES[newGuestSub] || SUBSCRIPTION_PACKAGES.monthly;
      const amt = Number(newGuestAmountPaid) || pkg.price;
      const now = new Date();
      const guestData = {
        id: cleanEmail,
        email: cleanEmail,
        grade: newGuestGrade || 'all',
        subscriptionType: newGuestSub,
        subscriptionStart: now,
        addedAt: now,
        addedBy: currentUser?.email || 'kombefortune9@gmail.com',
        status: 'active',
        amountPaid: amt,
        paymentMethod: newGuestPaymentMethod,
        subscriptionIndex: Number(newGuestSubIndex) || 1,
        is_whitelisted: true,
        isWhitelisted: true
      };

      await setDoc(doc(db, 'authorized_guests', cleanEmail), guestData, { merge: true });

      const targetUid = 'guest_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'users', targetUid), {
        uid: targetUid,
        email: cleanEmail,
        displayName: 'Approved Teacher',
        isWhitelisted: true,
        is_whitelisted: true,
        userType: 'registered',
        subscriptionType: newGuestSub,
        teaching_grade: newGuestGrade || 'all',
        status: 'active',
        subscriptionStart: now,
        addedAt: now
      }, { merge: true });

      try {
        safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({
          details: {
            subscriptionType: newGuestSub,
            subscriptionStart: now,
            isTrialMode: false,
            isWhitelisted: true,
            circleDownloadsLimit: pkg.limit,
            circleDownloadsCount: 0,
            isQuotaExhausted: false,
            isSubscriptionExpired: false,
            gradeCounts: {},
            daysRemaining: pkg.durationDays === Infinity ? 9999 : pkg.durationDays
          },
          grades: newGuestGrade === 'all' ? ['all'] : newGuestGrade.split(',').map((s: string) => s.trim())
        }));

        const rawWhitelisted = safeLocalStorage.getItem('eduplan_whitelisted_guests') || safeLocalStorage.getItem('eduplan_monitor_whitelist');
        const listWhitelisted = rawWhitelisted ? JSON.parse(rawWhitelisted) : [];
        const filteredW = Array.isArray(listWhitelisted) ? listWhitelisted.filter((w: any) => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') !== cleanEmail) : [];
        filteredW.unshift(guestData);
        safeLocalStorage.setItem('eduplan_whitelisted_guests', JSON.stringify(filteredW));
        safeLocalStorage.setItem('eduplan_monitor_whitelist', JSON.stringify(filteredW));
        safeLocalStorage.setItem('eduplan_settings_whitelist', JSON.stringify(filteredW));
      } catch (e) {}

      setWhitelist(prev => [guestData, ...prev.filter(w => (w.email || w.id || '').toLowerCase().trim().replace(/\s+/g, '') !== cleanEmail)]);
      setRawUsers(prev => prev.map(u => {
        if (u.email.toLowerCase().trim().replace(/\s+/g, '') === cleanEmail) {
          return {
            ...u,
            isWhitelisted: true,
            userType: 'registered',
            subscriptionType: newGuestSub,
            teaching_grade: newGuestGrade || 'all',
            status: 'active'
          };
        }
        return u;
      }));

      toast.success('Added ' + cleanEmail + ' to whitelist');
      setNewGuestEmail('');
      await fetchWhitelist();
      await fetchUsers();
    } catch (e: any) {
      toast.error('Failed to add guest: ' + e.message);
    } finally {
      setIsAddingGuest(false);
    }
  };

  const cleanupInactiveUsers = async () => {
    setIsCleaning(true);
    try {
      toast("Cleaning up inactive users...", { icon: "ℹ️" });
      await fetchUsers();
      toast.success("Cleanup completed");
    } catch (e: any) {
      toast.error('Cleanup error: ' + e.message);
    } finally {
      setIsCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-br from-[#f2f9f5] via-white to-[#eaf5ef] min-h-screen py-6 px-4 sm:px-8 text-left relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="bg-white w-full max-w-7xl mx-auto rounded-[2.5rem] border border-emerald-100/80 shadow-xs overflow-hidden flex flex-col min-h-[85vh]"
      >
        {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300",
                  activeTab === 'traffic' ? "bg-blue-600 text-white shadow-blue-100" :
                  activeTab === 'trial' ? "bg-amber-600 text-white shadow-amber-100" :
                  "bg-indigo-600 text-white shadow-indigo-100"
                )}>
                  {activeTab === 'traffic' ? <Users size={24} /> :
                    activeTab === 'trial' ? <Clock size={24} /> :
                    activeTab === 'tracker' ? <Download size={24} /> :
                    <Activity size={24} />}
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">
                     {activeTab === 'traffic' ? "Whitelisted / Approved" :
                      activeTab === 'trial' ? "Trial Users" :
                      activeTab === 'tracker' ? "Circle Download Tracker" :
                      "Global Activity Feed"}
                   </h3>
                   <div className="flex items-center gap-2">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                       {activeTab === 'traffic' ? "Manage Whitelisted Guests & Premium Traffic Logs" :
                        activeTab === 'trial' ? "Real-time Trial Mode Traffic" :
                        activeTab === 'tracker' ? "Monitor Circle Depletion Progress" :
                        "Comprehensive Real-time Activity Hub"}
                     </p>
                    {(isRefreshing && (activeTab === 'traffic' || activeTab === 'trial')) && <RefreshCcw size={10} className="text-blue-500 animate-spin" />}
                    {whitelistLoading && activeTab === 'traffic' && <RefreshCcw size={10} className="text-emerald-500 animate-spin" />}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeTab !== 'tracker' ? (
                  <>
                    <button
                      onClick={async () => {
                        await fetchUsers();
                        await fetchWhitelist();
                      }}
                      disabled={isRefreshing || whitelistLoading}
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all hover:shadow-md active:scale-90"
                      title="Manual Refresh"
                    >
                      <RefreshCcw size={20} className={(isRefreshing || whitelistLoading) ? "animate-spin" : ""} />
                    </button>
                    {isAdmin && activeTab === 'traffic' && (
                      <button
                        onClick={cleanupInactiveUsers}
                        disabled={isCleaning}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all disabled:opacity-50"
                        title="Cleanup users inactive for > 7 days"
                      >
                        <ShieldAlert size={14} />
                        {isCleaning ? "Cleaning..." : "Cleanup"}
                      </button>
                    )}
                  </>
                ) : null}
                <button 
                  onClick={onClose}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:text-slate-900 transition-all hover:shadow-md active:scale-95 text-xs font-black uppercase tracking-wider cursor-pointer"
                  title="Return to Main Dashboard"
                >
                  <ArrowLeft size={16} className="text-emerald-600" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:shadow-md active:scale-90 cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-slate-50/40 border-b border-slate-100 overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth">
              <button
                onClick={() => setActiveTab('traffic')}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex-shrink-0 cursor-pointer",
                  activeTab === 'traffic'
                    ? "bg-[#7a1824] text-white shadow-md shadow-[#7a1824]/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Whitelisted / Approved ({approvedUsers.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('schools');
                  fetchSchools();
                }}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer",
                  activeTab === 'schools'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <School size={13} />
                <span>School Circles ({schoolsList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('trial')}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex-shrink-0 cursor-pointer",
                  activeTab === 'trial'
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Trial Mode ({trialUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer",
                  activeTab === 'requests'
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <span>Pending Activations</span>
                {activationRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white font-black text-[8px] rounded-full leading-none animate-pulse shrink-0">
                    {activationRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex-shrink-0 cursor-pointer",
                  activeTab === 'analytics'
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Analytics Hub
              </button>
              <button
                onClick={() => setActiveTab('tracker')}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex-shrink-0 cursor-pointer",
                  activeTab === 'tracker'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Circle ({approvedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex-shrink-0 cursor-pointer",
                  activeTab === 'activity'
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Activity Feed
              </button>
              <button
                onClick={() => {
                  setActiveTab('lipila');
                  fetchLipilaHistory();
                }}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-2xl transition-all text-center flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer",
                  activeTab === 'lipila'
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/10 transform scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <Download size={13} />
                <span>Lipila Payments</span>
              </button>
            </div>

            {/* Search Bar */}
            {activeTab !== 'tracker' && activeTab !== 'feedback' && activeTab !== 'requests' && activeTab !== 'analytics' && activeTab !== 'lipila' && (
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search email or name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#00A86B] focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Whitelist Add Guest Form Form removed from outside and integrated into scrollable body */}

            {/* Tab Contents */}
            {activeTab === 'lipila' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-black uppercase text-slate-900 tracking-tight">Lipila Mobile Money Transactions & Customer Statement</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Compiled transaction history for all customers paying through Lipila. Download the official customer statement for business returns and developer reference.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadStatement}
                    className="px-6 py-3 bg-[#00A86B] hover:bg-[#008f5d] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download size={16} />
                    <span>Download Compiled Statement (CSV)</span>
                  </button>
                </div>

                {/* Summary Metric Cards */}
                {lipilaSummary && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">Total Lipila Revenue</p>
                      <p className="text-2xl font-black text-emerald-700">ZMW {lipilaSummary.totalRevenue?.toLocaleString() || 0}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{lipilaSummary.completedCount} completed payments</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">Total Transactions</p>
                      <p className="text-2xl font-black text-slate-800">{lipilaSummary.totalTransactions || 0}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{lipilaSummary.pendingCount} pending, {lipilaSummary.failedCount} failed</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">Mobile Networks</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-1">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-lg">MTN: {lipilaSummary.networkBreakdown?.mtn || 0}</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-lg">Airtel: {lipilaSummary.networkBreakdown?.airtel || 0}</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-lg">Zamtel: {lipilaSummary.networkBreakdown?.zamtel || 0}</span>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">Statement Reference</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">Official Business Return Ready</p>
                      <p className="text-[10px] text-emerald-600 font-bold">Auto-compiled with customer details</p>
                    </div>
                  </div>
                )}

                {/* Transactions Table */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">Transaction Records ({lipilaTransactions.length})</h5>
                    <button
                      onClick={fetchLipilaHistory}
                      disabled={lipilaLoading}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCcw size={12} className={lipilaLoading ? "animate-spin" : ""} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] border-b border-slate-200">
                          <th className="p-3">Reference / ID</th>
                          <th className="p-3">Customer Name & Email</th>
                          <th className="p-3">Phone / Account</th>
                          <th className="p-3">Plan / Package</th>
                          <th className="p-3 text-right">Amount (ZMW)</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lipilaTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-semibold">
                              {lipilaLoading ? "Loading Lipila transactions..." : "No Lipila payment transactions recorded yet."}
                            </td>
                          </tr>
                        ) : (
                          lipilaTransactions.map((tx: any) => (
                            <tr key={tx.referenceId} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 font-mono text-[11px] font-bold text-slate-800">
                                {tx.referenceId}
                                {tx.identifier && <span className="block text-[9px] text-slate-400 font-normal">Ext: {tx.identifier}</span>}
                              </td>
                              <td className="p-3 align-top">
                                <p className="font-bold text-slate-800">{tx.displayName || 'Customer'}</p>
                                <p className="text-[11px] text-slate-500">{tx.email || 'N/A'}</p>
                              </td>
                              <td className="p-3 font-mono text-xs font-bold text-slate-700">
                                {tx.accountNumber || 'N/A'}
                              </td>
                              <td className="p-3 font-bold text-slate-700">
                                {tx.planTitle || tx.planId || 'Subscription'}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700">
                                ZMW {Number(tx.amount || 0).toLocaleString()}
                              </td>
                              <td className="p-3 text-center">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                                  tx.status === 'completed' ? "bg-emerald-100 text-emerald-800" :
                                  tx.status === 'failed' ? "bg-rose-100 text-rose-800" :
                                  "bg-amber-100 text-amber-800"
                                )}>
                                  {tx.status || 'pending'}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'activity' ? (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
                <ActivityFeed />
              </div>
            ) : activeTab === 'tracker' ? (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Keep circle tracker strictly displaying approved/whitelisted paid educators */}
                <CircleDownloadTracker approvedUsers={approvedUsers} hideLogs={true} />
              </div>
            ) : activeTab === 'analytics' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                <SubscriptionAnalytics 
                  approvedUsers={approvedUsers} 
                  trialUsers={trialUsers} 
                  activationRequests={activationRequests} 
                  onApproveRequest={handleApproveRequest}
                  onRejectRequest={handleRejectRequest}
                />
              </div>
            ) : activeTab === 'requests' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Teacher Activation Requests Queue</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Review and approve incoming Zambian curriculum subscription circle payments in real-time
                  </p>
                </div>

                {activationRequests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest bg-white border border-slate-100 rounded-2xl">
                    No activation requests logged yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activationRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const plan = SUBSCRIPTION_PLANS[req.subscriptionType] || { label: req.subscriptionType, price: req.amount || 0 };
                      
                      return (
                        <div 
                          key={req.id} 
                          className={cn(
                            "bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative transition-all",
                            isPending ? "border-indigo-200 bg-indigo-50/10 hover:border-indigo-300" : "opacity-75"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-[9px] shrink-0 leading-tight",
                                isPending ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                              )}>
                                <span>ZMK</span>
                                <span className="text-[11px] font-black">{plan.price}</span>
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-800">{req.email}</span>
                                  <span className={cn(
                                    "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md",
                                    isPending 
                                      ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                      : req.status === 'approved' 
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "bg-slate-150 text-slate-600"
                                  )}>
                                    {req.status || 'pending'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">
                                  Requested Plan: <strong className="text-indigo-600 font-black">{plan.label}</strong> // 
                                  Name: {req.displayName || 'Teacher'}
                                </p>
                                {(req.phone || req.referenceId || req.comments || req.paymentMethod) && (
                                  <div className="mt-2 p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] space-y-1 text-slate-600 font-semibold max-w-lg">
                                    {req.phone && (
                                      <div>
                                        📞 Mobile Money Number: <span className="text-slate-800 font-black select-all">{req.phone}</span>
                                      </div>
                                    )}
                                    {req.paymentMethod && (
                                      <div>
                                        💳 Network Channel: <span className="text-slate-800 font-black">{req.paymentMethod}</span>
                                      </div>
                                    )}
                                    {req.referenceId && (
                                      <div>
                                        🔍 Transaction Reference ID: <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 select-all">{req.referenceId}</span>
                                      </div>
                                    )}
                                    {req.comments && (
                                      <div className="text-slate-500 italic font-medium pt-1 border-t border-slate-200/50 mt-1">
                                        💬 Note: "{req.comments}"
                                      </div>
                                    )}
                                  </div>
                                )}
                                <p className="text-[9px] text-slate-400 font-semibold mt-1">
                                  Requested on: {safeToDate(req.timestamp)?.toLocaleString() || "N/A"}
                                </p>
                              </div>
                            </div>

                            {isPending ? (
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                >
                                  <Check size={12} />
                                  <span>Approve Activation</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[9px] text-slate-400 font-bold uppercase text-right self-end sm:self-center">
                                {req.status === 'approved' ? (
                                  <span className="text-emerald-600 flex items-center gap-1 justify-end font-extrabold">
                                    <CheckCircle2 size={12} />
                                    Approved
                                  </span>
                                ) : (
                                  "Dismissed"
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'feedback' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">AI Quality Logs</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Review thumbs up & thumbs down flags from teachers</p>
                  </div>
                  <button
                    onClick={fetchFeedback}
                    disabled={feedbackLoading}
                    className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCcw size={14} className={cn(feedbackLoading && "animate-spin text-emerald-500")} />
                  </button>
                </div>

                {feedbackLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading feedback feed...</p>
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest bg-white border border-slate-100 rounded-2xl">
                    No document feedback flags recorded yet.
                  </div>
                ) : (
                  feedbackList.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-xl text-white shrink-0",
                            item.feedbackType === 'up' ? "bg-emerald-500" : "bg-rose-500"
                          )}>
                            {item.feedbackType === 'up' ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              {item.userEmail}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700">
                              {item.grade} // {item.subject} // {item.docType}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete/resolve this feedback?")) {
                              try {
                                await deleteDoc(doc(db, 'document_feedback', item.id));
                                toast.success("Feedback resolved and removed!");
                                fetchFeedback();
                              } catch (e) {
                                toast.error("Failed to delete feedback");
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Resolve / Delete feedback"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {item.comment && (
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Teacher Comment:</p>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                            "{item.comment}"
                          </p>
                        </div>
                      )}

                      {item.contentSnippet && (
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Snippet of Flagged Output:</p>
                          <pre className="text-[10px] font-mono text-slate-600 bg-white border border-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-[120px] whitespace-pre-wrap leading-tight">
                            {item.contentSnippet}
                          </pre>
                        </div>
                      )}

                      <div className="mt-3 flex justify-between items-center text-[9px] font-bold text-slate-400 border-t border-slate-50 pt-2">
                        <span>Curriculum: {item.curriculumType || "Standard"}</span>
                        <span>{safeToDate(item.timestamp)?.toLocaleString() || "No Timestamp"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'schools' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black">
                      <School size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        Registered Whole School Circles ({schoolsList.length})
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        Termly Unlimited Access accounts &amp; connected teachers roster
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchSchools}
                    disabled={schoolsLoading}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCcw size={12} className={cn(schoolsLoading && "animate-spin")} />
                    <span>Refresh Schools</span>
                  </button>
                </div>

                {schoolsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest bg-white border border-slate-100 rounded-2xl">
                    No School Circles registered yet. Once a school pays via Lipila, their registration form activates automatically here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schoolsList.map((school) => {
                      const isExpired = new Date() > new Date(school.subscriptionEndDate);
                      return (
                        <div
                          key={school.id}
                          className="bg-white border-2 border-indigo-100 hover:border-indigo-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-all"
                        >
                          {/* School Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                                <School size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    {school.schoolName}
                                  </h3>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                                    isExpired
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  )}>
                                    {isExpired ? "Term Ended (Trial)" : "Active (Unlimited)"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Representative: <strong className="text-slate-800">{school.representativeName}</strong> ({school.representativeEmail}) • Phone: {school.representativePhone || 'N/A'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto text-right">
                              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <span className="text-[8.5px] font-black uppercase text-slate-400 block">Amount Paid</span>
                                <span className="text-xs font-black text-indigo-700">ZMK {school.amountPaid}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <span className="text-[8.5px] font-black uppercase text-slate-400 block">Term Ending</span>
                                <span className="text-xs font-bold text-amber-600">
                                  {new Date(school.subscriptionEndDate).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Teachers Roster with Download Count and Online Status */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Users size={13} className="text-indigo-600" />
                                <span>Connected Teachers ({school.teachers?.length || 0} / {school.maxTeachers || 15} max)</span>
                              </p>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">
                                Live Usage &amp; Online Status
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {school.teachers?.map((teacher, idx) => {
                                const diffMs = teacher.lastActive ? Date.now() - new Date(teacher.lastActive).getTime() : 9999999;
                                const isOnline = diffMs < 180000; // active in last 3 mins

                                return (
                                  <div
                                    key={teacher.email || idx}
                                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-slate-800 text-[11px] truncate">
                                          {idx + 1}. {teacher.name}
                                        </span>
                                        {teacher.role === 'representative' && (
                                          <span className="text-[7.5px] font-black uppercase bg-indigo-100 text-indigo-700 px-1 rounded-sm">
                                            Rep
                                          </span>
                                        )}
                                      </div>
                                      {/* Format: Mr jones-----34 downloads */}
                                      <p className="text-[9.5px] font-mono text-slate-600 mt-0.5">
                                        {teacher.name}-----<strong className="text-indigo-900 font-black">{teacher.downloadsCount || 0} downloads</strong>
                                      </p>
                                    </div>

                                    <div className="shrink-0">
                                      {isOnline ? (
                                        <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          <span>Online</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[8.5px] font-bold uppercase text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                          <span>Offline</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {/* Trial Access Header & Reset Tool */}
                {activeTab === 'trial' && isAdmin && (
                  <div className="mb-4 space-y-2.5">
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-xs">
                          {trialUsers.length}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">Free Trial Access Teachers</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            Quota limit: 1 Scheme of Work, 1 Weekly Forecast, 2 Lesson Plans (4 Total)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleResetAllTrialUsers}
                          disabled={isResettingTrials}
                          className={cn(
                            "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer border",
                            resetSuccess
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-400/30 shadow-md"
                              : "bg-amber-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 disabled:opacity-50 text-amber-800 border-amber-200"
                          )}
                          title="Clean up trial list and reset all trial users to fresh Free Trial access"
                        >
                          {resetSuccess ? (
                            <>
                              <Check size={13} className="text-white shrink-0" />
                              <span>All Users Set to Trial Mode</span>
                            </>
                          ) : (
                            <>
                              <RefreshCcw size={12} className={cn(isResettingTrials && "animate-spin")} />
                              <span>{isResettingTrials ? "Setting Users to Trial Mode..." : "Reset All to Fresh Trial"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Interactive Green Confirmation Feedback Banner */}
                    <AnimatePresence>
                      {resetSuccessMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <CheckCircle2 size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-emerald-900">All users have been set to trial mode</p>
                              <p className="text-[10px] font-bold text-emerald-700">
                                Quotas and user access permissions have been updated to clean Free Trial mode.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResetSuccessMsg(null)}
                            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
                            title="Dismiss notification"
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Whitelist Add Guest form embedded right at the top of traffic/approved tab */}
                {activeTab === 'traffic' && isAdmin && (
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600 font-black text-xs">
                          {approvedUsers.length}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">Approved Premium Teachers</p>
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                            {whitelist.length} in whitelist • {approvedUsers.length} total active
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleNormalizeAllSubscriptions}
                          disabled={isNormalizingSubs}
                          className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 active:scale-95 disabled:opacity-50"
                          title="Audit and normalize all active subscription records across Firestore"
                        >
                          <CheckCircle2 size={13} className={cn(isNormalizingSubs && "animate-spin")} />
                          {isNormalizingSubs ? "Auditing..." : "Normalize Subscriptions"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAddTeacherOpen(!isAddTeacherOpen)}
                          className={cn(
                            "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                            isAddTeacherOpen 
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200" 
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          )}
                        >
                          <Plus size={13} className={cn("transition-transform", isAddTeacherOpen && "rotate-45")} />
                          {isAddTeacherOpen ? "Close Form" : "Add Teacher"}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isAddTeacherOpen && (
                        <motion.form 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          onSubmit={handleAddGuest} 
                          className="overflow-hidden p-5 bg-emerald-50/40 border border-emerald-150 rounded-3xl flex flex-col gap-4 shadow-sm"
                        >
                          {/* Row 1 */}
                          <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
                            <div className="flex-[2] min-w-[200px] w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Teacher Email Address</label>
                              <input 
                                type="email"
                                value={newGuestEmail}
                                onChange={(e) => setNewGuestEmail(e.target.value)}
                                placeholder="Enter teacher's email address..."
                                required
                                disabled={isAddingGuest}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 shadow-inner mt-1"
                              />
                            </div>
                            <div className="flex-[3] min-w-[240px] w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Allocation (Multi-Select)</label>
                              <GradeMultiSelector
                                selectedGradesString={newGuestGrade}
                                onChange={setNewGuestGrade}
                                allAvailableGrades={allAvailableGrades}
                                themeColor="emerald"
                              />
                            </div>
                            <div className="flex-1 min-w-[140px] w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Circle</label>
                              <select
                                value={newGuestSub}
                                onChange={(e) => setNewGuestSub(e.target.value)}
                                disabled={isAddingGuest}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner appearance-none cursor-pointer mt-1"
                              >
                                <option value="weekly">Weekly Circle (7d - K20)</option>
                                <option value="14days">14 Days Circle (14d - K40)</option>
                                <option value="monthly">Monthly Circle (30d - K90)</option>
                                <option value="termly_individual">Individual Termly Circle (90d - K220)</option>
                                <option value="termly">Whole School Termly Circle (90d - K800)</option>
                              </select>
                            </div>
                          </div>

                          {/* Row 2 */}
                          <div className="flex flex-col lg:flex-row gap-4 items-end w-full border-t border-slate-100 pt-3">
                            <div className="flex-1 min-w-[150px] w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                              <select
                                value={newGuestPaymentMethod}
                                onChange={(e) => setNewGuestPaymentMethod(e.target.value)}
                                disabled={isAddingGuest}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner appearance-none cursor-pointer mt-1"
                              >
                                <option value="MTN Mobile Money">MTN Mobile Money</option>
                                <option value="Airtel Mobile Money">Airtel Mobile Money</option>
                                <option value="Zamtel Mobile Money">Zamtel Mobile Money</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash Payment">Cash Payment</option>
                                <option value="WhatsApp Direct Pay">WhatsApp Direct Pay</option>
                              </select>
                            </div>

                            <div className="flex-1 min-w-[100px] w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Paid (ZMK)</label>
                              <input 
                                type="number"
                                value={newGuestAmountPaid}
                                onChange={(e) => setNewGuestAmountPaid(e.target.value)}
                                placeholder="ZMK 90"
                                required
                                disabled={isAddingGuest}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 shadow-inner mt-1"
                              />
                            </div>

                            <div className="flex-1 min-w-[100px] w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub Count (Index)</label>
                              <input 
                                type="number"
                                value={newGuestSubIndex}
                                onChange={(e) => setNewGuestSubIndex(e.target.value)}
                                placeholder="1"
                                min="1"
                                required
                                disabled={isAddingGuest}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 shadow-inner mt-1"
                              />
                            </div>

                            <div className="shrink-0 w-full lg:w-auto">
                              <button
                                type="submit"
                                disabled={isAddingGuest || !newGuestEmail.trim() || !newGuestGrade.trim()}
                                className="w-full lg:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 h-[46px]"
                              >
                                <Plus size={14} />
                                {isAddingGuest ? "Adding..." : "Add Approved Teacher"}
                              </button>
                            </div>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {error && (
                  <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-black text-red-600 leading-tight">System Notice</p>
                      <p className="text-xs font-bold text-red-500/80 mt-1">{error}</p>
                    </div>
                  </div>
                )}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Data...</p>
                  </div>
                ) : currentUsersList.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-medium italic">
                    {activeTab === 'traffic' ? "No approved premium teachers active yet." : "No trial guest users active yet."}
                  </div>
                ) : (
                  currentUsersList.map((user) => {
                    const isExpanded = expandedUserId === user.uid;
                    const uDocs = userDownloads[user.uid] || [];
                    const uLoading = downloadsLoading[user.uid];

                    // compute stats
                    const totalCount = uDocs.length;
                    const typeDistribution: { [key: string]: number } = {};
                    const formatDistribution: { [key: string]: number } = {};
                    uDocs.forEach((d) => {
                      const typeLabel = formatDocumentType(d.type);
                      typeDistribution[typeLabel] = (typeDistribution[typeLabel] || 0) + 1;

                      const formatLabel = d.format ? String(d.format).toUpperCase() : "OTHER";
                      formatDistribution[formatLabel] = (formatDistribution[formatLabel] || 0) + 1;
                    });

                    const isSuspended = user.status === 'blocked' || whitelist.some(item => (item.email || item.id || '').toLowerCase().trim().replace(/\s+/g, '') === user.email?.toLowerCase().trim().replace(/\s+/g, '') && item.status === 'blocked');

                    return (
                      <div 
                        key={user.uid} 
                        className={cn(
                          "group bg-white border rounded-3xl transition-all flex flex-col overflow-hidden relative",
                          isExpanded 
                            ? "border-blue-200 shadow-md ring-4 ring-blue-50/50 bg-slate-50/30" 
                            : "border-slate-100 hover:bg-slate-50 hover:shadow-sm"
                        )}
                      >
                        {/* Interactive click area */}
                        <div 
                          onClick={() => toggleUserExpand(user.uid)}
                          className="p-5 flex items-center gap-5 cursor-pointer select-none"
                        >
                          <div className="relative">
                            {user.photoURL ? (
                              <img 
                                src={user.photoURL} 
                                alt={user.displayName} 
                                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-blue-100 transition-all"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black tracking-wider transition-all shadow-inner shrink-0",
                                getAvatarBg(user.email)
                              )}>
                                {getInitials(user.displayName, user.email)}
                              </div>
                            )}
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full shadow-sm",
                              isOnline(user) ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <h4 className="text-base font-black text-slate-800 truncate leading-tight max-w-[150px] xs:max-w-[200px] sm:max-w-none">{user.displayName || 'Pending Name...'}</h4>
                                {(() => {
                                  const cleanEmail = user.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
                                  const isDev = isDeveloperEmail(cleanEmail) || user.userType === 'developer';
                                  const subInfo = getUserSubscriptionInfo(user);

                                  if (isDev) {
                                    return (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[8px] font-black uppercase tracking-tight flex items-center gap-1 shadow-sm">
                                          <Shield size={9} className="text-indigo-600" /> Master Developer
                                        </div>
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[8px] font-black uppercase tracking-tighter">
                                          Unlimited Lifetime Access
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[8px] font-black uppercase tracking-tighter">
                                          Master Key
                                        </span>
                                      </div>
                                    );
                                  }

                                  if (user.isWhitelisted) {
                                    return (
                                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                        <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 shrink-0">
                                          <Shield size={8} /> Premium
                                        </div>
                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border", subInfo.subBadgeClass)}>
                                          {subInfo.circleLabel}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[8px] font-black uppercase tracking-tighter">
                                          Fee: {subInfo.cost}
                                        </span>
                                        {subInfo.isExpired ? (
                                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[8px] font-black uppercase tracking-tighter">
                                            Expired
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[8px] font-black uppercase tracking-tighter">
                                            {subInfo.remainingText}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      <div className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[8px] font-black uppercase tracking-tight flex items-center gap-1 shrink-0">
                                        <Sparkles size={8} className="text-blue-500" /> Trial Access Mode
                                      </div>
                                      {(user as any).isLocalFallback && (
                                        <div className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-300 rounded text-[8px] font-black uppercase tracking-tight flex items-center gap-1 shrink-0 animate-pulse">
                                          Local Quota Fallback Log
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                {isSuspended && (
                                  <div className="px-1.5 py-0.5 bg-red-50 text-red-650 border border-red-100 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 animate-pulse shrink-0">
                                    <Lock size={8} /> Suspended
                                  </div>
                                )}
                                {user.isWhitelisted ? (
                                  <div className={cn(
                                    "px-1.5 py-0.5 border rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 shrink-0",
                                    user.teaching_grade?.toLowerCase() === 'all'
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  )}>
                                    {user.teaching_grade?.toLowerCase() === 'all' ? 'Universal Access' : user.teaching_grade}
                                  </div>
                                ) : (
                                  <div className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-black uppercase tracking-tighter shrink-0">
                                    Trial Quota (1 Scheme / 1 Forecast / 2 Lessons)
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto mt-1 sm:mt-0">
                                 <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded-full shrink-0">
                                     <Clock size={10} className="text-blue-500" />
                                     <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">Time: {getSessionDuration(user.lastLogin || (user as any).addedAt, user.lastHeartbeat || user.lastLogin)}</span>
                                 </div>
                                 
                                 {isAdmin && (!user.isWhitelisted || getUserSubscriptionInfo(user).isExpired) && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openActivationModal(user);
                                                      }}
                                     className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm shrink-0 active:scale-95 cursor-pointer" 
                                     title={user.isWhitelisted ? "Renew Subscription Circle" : "Activate Teacher Full Subscription"}
                                   >
                                     <Sparkles size={11} /> {user.isWhitelisted ? "Renew Circle" : "Activate"}
                                   </button>
                                 )}
                                 
                                 {/* BLOCK / RESTORE TOGGLE BUTTON */}
                                 {isAdmin && (
                                   <button
                                     onClick={async (e) => {
                                       e.stopPropagation();
                                       await handleToggleGuestStatus(user.email, isSuspended ? 'active' : 'blocked');
                                     }}
                                     className={cn(
                                       "p-2 rounded-xl transition-all border flex items-center justify-center shrink-0",
                                       isSuspended 
                                         ? "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200 ring-2 ring-red-100" 
                                         : "text-slate-400 hover:text-red-500 bg-transparent hover:bg-slate-100 border-transparent"
                                     )}
                                     title={isSuspended ? "Access Locked (Click to Unlock & Restore App Access)" : "Access Unlocked (Click to Lock & Suspend App Access)"}
                                   >
                                     {isSuspended ? <Lock size={14} className="text-red-500 animate-pulse" /> : <Unlock size={14} />}
                                   </button>
                                 )}

                                 {/* RE-STYLED DELETE SWITCH */}
                                 {isAdmin && (
                                   <button 
                                     onClick={async (e) => {
                                       e.stopPropagation();
                                       if ((user as any).isWhitelisted) {
                                         setPendingDeleteGuest({ id: user.uid, email: user.email });
                                       } else {
                                         const confirmDelete = window.confirm(`Are you sure you want to completely end trial access and purge traffic logs for guest user: ${user.email}?`);
                                         if (confirmDelete) {
                                           await deleteDoc(doc(db, 'users', user.uid));
                                           try {
                                             await deleteDoc(doc(db, 'guest_experiments', user.email.toLowerCase().trim()));
                                           } catch (err) {
                                             console.warn("Experiment delete notice (handled):", err);
                                           }
                                           toast.success("Trial session logs removed.");
                                           fetchUsers();
                                         }
                                       }
                                     }}
                                     className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                                     title="Remove & Cancel access"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 )}

                                 {isExpanded ? (
                                   <ChevronUp size={16} className="text-slate-400 transition-transform" />
                                 ) : (
                                   <ChevronDown size={16} className="text-slate-400 transition-transform" />
                                 )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-1.5">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Mail size={12} className="shrink-0" />
                                <p className="text-xs font-bold truncate tracking-tight text-slate-700">{user.email}</p>
                              </div>
                              
                              {/* Subscriptions & Connected Dates Row */}
                              {(() => {
                                const cleanEmail = user.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
                                const isDev = isDeveloperEmail(cleanEmail);
                                const subInfo = getUserSubscriptionInfo(user);

                                return (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {user.isWhitelisted || isDev ? (
                                      <>
                                        {/* Activation Date & Time (When Connected by Developer) */}
                                        <div className="text-[10px] font-bold text-slate-600 bg-emerald-50/70 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                          <span className="font-extrabold uppercase text-[9px] tracking-tighter text-emerald-700">Activated:</span>
                                          <span className="font-mono text-emerald-900 font-black">
                                            {formatRealityTime(subInfo.startDate, "Pending Activation")}
                                          </span>
                                        </div>

                                        {/* End of Subscription Date & Time */}
                                        {subInfo.subType === 'unlimited' || isDev ? (
                                          <div className="text-[10px] font-bold text-slate-600 bg-indigo-50/70 border border-indigo-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                            <span className="font-extrabold uppercase text-[9px] tracking-tighter text-indigo-700">End of Sub:</span>
                                            <span className="font-mono text-indigo-900 font-black">Never (Lifetime)</span>
                                          </div>
                                        ) : subInfo.endDate ? (
                                          <div className={cn(
                                            "text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border",
                                            subInfo.isExpired 
                                              ? "bg-rose-50 text-rose-700 border-rose-200" 
                                              : "bg-amber-50/80 text-amber-800 border-amber-200"
                                          )}>
                                            <span className={cn("font-extrabold uppercase text-[9px] tracking-tighter", subInfo.isExpired ? "text-rose-600" : "text-amber-700")}>
                                              {subInfo.isExpired ? "Expired On:" : "End of Sub:"}
                                            </span>
                                            <span className="font-mono font-black">
                                              {formatRealityTime(subInfo.endDate, "N/A")}
                                            </span>
                                          </div>
                                        ) : null}
                                      </>
                                    ) : (
                                      /* Trial Mode Tag */
                                      <div className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                        <span className="font-extrabold uppercase text-[9px] tracking-tighter text-amber-700">Access Mode:</span>
                                        <span className="font-mono text-amber-900 font-black">Free Trial (No Active Circle)</span>
                                      </div>
                                    )}

                                    {/* First Access */}
                                    <div className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/60 transition-colors px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200/50">
                                      <span className="font-extrabold uppercase text-[9px] tracking-tighter text-slate-500">First Access:</span>
                                      <span className="font-mono text-slate-700">{formatRealityTime(user.lastLogin || (user as any).firstAccess || (user as any).addedAt, "Pending First Login")}</span>
                                    </div>

                                    {/* Last Pulse */}
                                    <div className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/60 transition-colors px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200/50">
                                      <span className="font-extrabold uppercase text-[9px] tracking-tighter text-slate-500">{isOnline(user) ? "Active Now:" : "Last Pulse:"}</span>
                                      <span className="font-mono text-slate-700">{formatRealityTime(user.lastHeartbeat || user.lastLogin || (user as any).addedAt, "Pending First Pulse")}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Activity Console */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 bg-slate-50/50"
                            >
                              <div className="p-5 space-y-5">
                                {uLoading ? (
                                  <div className="flex items-center justify-center py-8 gap-3">
                                    <div className="w-5 h-5 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving User Activities...</span>
                                  </div>
                                ) : (
                                  <>
                                    {/* Subscription Lifecycle Widget */}
                                    {(() => {
                                      const subInfo = getUserSubscriptionInfo(user);
                                      const cleanEmail = user.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
                                      const isDev = isDeveloperEmail(cleanEmail) || user.userType === 'developer';

                                      return (
                                        <div className="bg-white p-4 sm:p-5 border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Shield size={16} />
                                              </div>
                                              <div>
                                                <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                                  Subscription Circle & Connection Details
                                                </h6>
                                                <p className="text-[10px] font-bold text-slate-400">
                                                  Educator allocation and subscription period
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              {user.isWhitelisted || isDev ? (
                                                <>
                                                  <span className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                                    subInfo.isExpired 
                                                      ? "bg-rose-50 text-rose-600 border-rose-200" 
                                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  )}>
                                                    {subInfo.isExpired ? "Subscription Expired" : (isDev ? "Master Developer Active" : `Active (${subInfo.remainingText})`)}
                                                  </span>

                                                  {isAdmin && (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleQuickRenew(user.email, (user as any).subscriptionType);
                                                        }}
                                                        title="Reset subscription timer to start today"
                                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm"
                                                      >
                                                        <RefreshCcw size={10} /> Renew Cycle
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setEditingGuest({
                                                            id: (user.email || user.uid).toLowerCase().trim().replace(/\s+/g, ''),
                                                            email: user.email,
                                                            grade: user.teaching_grade || 'Grade 4',
                                                            subscriptionType: (user as any).subscriptionType || 'monthly',
                                                            amountPaid: (user as any).amountPaid || 90,
                                                            paymentMethod: (user as any).paymentMethod || 'MTN Mobile Money',
                                                            subscriptionIndex: (user as any).subscriptionIndex || 1
                                                          });
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                                      >
                                                        <Edit2 size={10} /> Edit Circle
                                                      </button>
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-amber-50 text-amber-800 border-amber-200">
                                                    Trial Access Mode (Pending Activation)
                                                  </span>
                                                  {isAdmin && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivatingUser(user);
                                                        setActivationSub('monthly');
                                                        setActivationGrade('all');
                                                        setActivationAmount('90');
                                                        setActivationPaymentMethod('MTN Mobile Money');
                                                      }}
                                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                                    >
                                                      <Sparkles size={12} /> Activate Teacher (Full Access)
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                              <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Allocated Circle</p>
                                              <p className="text-xs font-black text-slate-800 mt-1">
                                                {user.isWhitelisted || isDev ? subInfo.circleLabel : 'Free Trial Access (View-Only)'}
                                              </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                              <p className="text-[9px] font-extrabold uppercase text-emerald-600 tracking-wider">Connected / Activated</p>
                                              <p className="text-xs font-black text-slate-800 mt-1 font-mono">
                                                {user.isWhitelisted || isDev ? formatRealityTime(subInfo.startDate, "Pending") : 'Pending Paid Activation'}
                                              </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                              <p className="text-[9px] font-extrabold uppercase text-amber-600 tracking-wider">End of Subscription</p>
                                              <p className="text-xs font-black text-slate-800 mt-1 font-mono">
                                                {subInfo.subType === 'unlimited' || isDev ? 'Lifetime Access' : (user.isWhitelisted && subInfo.endDate ? formatRealityTime(subInfo.endDate, "N/A") : 'Until Quota Used')}
                                              </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                              <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Fee / Pricing</p>
                                              <p className="text-xs font-black text-slate-800 mt-1">
                                                {user.isWhitelisted || isDev ? subInfo.cost : 'Free Trial Access'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Stats widgets */}
                                    <div className="space-y-3">
                                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <BarChart2 size={12} className="text-slate-400" />
                                        Activity Summary
                                      </h5>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Grade Access Widget */}
                                        <div className="bg-white p-4 border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm sm:col-span-1">
                                          <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            user.isWhitelisted ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                          )}>
                                            <Shield size={18} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Grade Access</p>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {user.isWhitelisted ? (
                                                user.teaching_grade?.toLowerCase() === 'all' || !user.teaching_grade ? (
                                                  <span className="text-xs font-black text-emerald-600 uppercase">Universal Access</span>
                                                ) : (
                                                  user.teaching_grade.split(',').map((g, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-tighter border border-blue-100">{g.trim()}</span>
                                                  ))
                                                )
                                              ) : (
                                                <span className="text-xs font-black text-blue-600 uppercase">Free Trial Access (Limited Quota)</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Total Downloads Widget */}
                                        <div className="bg-white p-4 border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm">
                                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Download size={18} />
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">Total Downloads</p>
                                            <p className="text-lg font-black text-slate-800 mt-0.5">{totalCount} documents</p>
                                          </div>
                                        </div>

                                        {/* Document Formats Widget */}
                                        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-center">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight mb-2">Formats Used</p>
                                          {Object.keys(formatDistribution).length === 0 ? (
                                            <p className="text-xs font-medium italic text-slate-400">No export formats logged</p>
                                          ) : (
                                            <div className="flex flex-wrap gap-1">
                                              {Object.entries(formatDistribution).map(([format, count]) => (
                                                <span 
                                                  key={format} 
                                                  className={cn(
                                                    "px-2 py-0.5 rounded-lg text-[9px] font-black shadow-sm border",
                                                    format === "PDF" && "bg-rose-50 border-rose-100 text-rose-600",
                                                    format === "WORD" && "bg-sky-50 border-sky-100 text-sky-600",
                                                    format === "PRINT" && "bg-amber-50 border-amber-100 text-amber-600",
                                                    format === "MARKDOWN" && "bg-emerald-50 border-emerald-100 text-emerald-600",
                                                    format !== "PDF" && format !== "WORD" && format !== "PRINT" && format !== "MARKDOWN" && "bg-slate-50 border-slate-100 text-slate-600"
                                                  )}
                                                >
                                                  {format}: {count}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {!user.isWhitelisted && (
                                        <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mt-3">
                                          <div className="space-y-1">
                                            <h6 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                              <UserCheck size={14} className="text-emerald-600" />
                                              Convert Trial Access to Premium?
                                            </h6>
                                            <p className="text-[11px] font-bold text-slate-500 leading-normal">
                                              Add this trial user to a subscription circle to grant whitelisted premium access with customized grade limits.
                                            </p>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openActivationModal(user);
                                            }}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 text-center cursor-pointer"
                                          >
                                            Add to Circle
                                          </button>
                                        </div>
                                      )}

                                      {/* Subject and Document Type breakdown */}
                                      {totalCount > 0 && (
                                        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">Document Types Downloaded</p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(typeDistribution).map(([type, count]) => (
                                              <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700">
                                                <FileText size={10} className="text-indigo-400 whitespace-nowrap" />
                                                {type}: {count}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Activities List */}
                                    <div className="space-y-2">
                                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Calendar size={12} className="text-slate-400" />
                                        Recent Downloads Stream
                                      </h5>
                                      
                                      {uDocs.length === 0 ? (
                                        <div className="bg-white p-6 border border-slate-100 rounded-2xl text-center text-xs text-slate-400 italic">
                                          No download timeline activities recorded yet.
                                        </div>
                                      ) : (
                                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-50 shadow-sm custom-scrollbar">
                                          {uDocs.map((doc, idx) => {
                                            const d = safeToDate(doc.timestamp);
                                            const timestampStr = d 
                                              ? d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                                              : "N/A";
                                            return (
                                              <div key={doc.id || idx} className="p-3 hover:bg-slate-50/50 transition-colors flex items-start gap-3">
                                                <div className={cn(
                                                  "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-black",
                                                  doc.format === "pdf" && "bg-rose-50 text-rose-600",
                                                  doc.format === "word" && "bg-sky-50 text-sky-600",
                                                  doc.format === "print" && "bg-amber-50 text-amber-600",
                                                  doc.format === "markdown" && "bg-emerald-50 text-emerald-600"
                                                )}>
                                                  {String(doc.format || "pdf").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{doc.title || "Untitled Document"}</p>
                                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-slate-400">
                                                    <span className="font-semibold uppercase">{formatDocumentType(doc.type)}</span>
                                                    <span>•</span>
                                                    <span className="font-medium">{doc.subject || "No Subject"}</span>
                                                    {doc.grade && (
                                                      <>
                                                        <span>•</span>
                                                        <span className="font-medium text-slate-500">{doc.grade}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                  <p className="text-[9px] text-slate-400 font-medium mt-1">{timestampStr}</p>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === 'traffic' ? `Total Premium: ${approvedUsers.length}` : 
                   activeTab === 'trial' ? `Total Trial Users: ${trialUsers.length}` :
                   `Whitelisted Guests: ${whitelist.length}`}
                </span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Updates On</span>
                </div>
              </div>
            </div>

            {/* Edit Grade Modal Overlay */}
            <AnimatePresence>
              {editingGuest && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-6"
                  onClick={() => setEditingGuest(null)}
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-w-sm w-full space-y-6"
                  >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-blue-50/50">
                      <Edit2 size={24} />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-base font-black text-slate-800 leading-snug">Edit Teacher Access & Cycle</h3>
                      <p className="text-xs font-bold text-blue-600 mt-1 break-all">
                        {editingGuest.email}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Grade Level (Multi-Select)</label>
                        <GradeMultiSelector
                          selectedGradesString={editingGuest.grade}
                          onChange={(newVal) => setEditingGuest(prev => {
                            if (!prev) return null;
                            let base = 20;
                            const sub = prev.subscriptionType || 'termly';
                            if (sub === '14days') base = 40;
                            else if (sub === 'monthly') base = 90;
                            else if (sub === 'termly_individual') base = 220;
                            else if (sub === 'termly') base = 800;
                            return { ...prev, grade: newVal, amountPaid: base };
                          })}
                          allAvailableGrades={allAvailableGrades}
                          themeColor="blue"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subscription Circle</label>
                        <select
                          value={editingGuest.subscriptionType || 'monthly'}
                          onChange={(e) => setEditingGuest(prev => {
                            if (!prev) return null;
                            let base = 20;
                            const newSub = e.target.value;
                            if (newSub === '14days') base = 40;
                            else if (newSub === 'monthly') base = 90;
                            else if (newSub === 'termly_individual') base = 220;
                            else if (newSub === 'termly') base = 800;
                            return { ...prev, subscriptionType: newSub, amountPaid: base };
                          })}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner cursor-pointer appearance-none"
                        >
                          <option value="weekly">Weekly Circle (7 Days - K20)</option>
                          <option value="14days">14 Days Circle (14 Days - K40)</option>
                          <option value="monthly">Monthly Circle (30 Days - K90)</option>
                          <option value="termly_individual">Individual Termly Circle (90 Days - K220)</option>
                          <option value="termly">Whole School Termly Circle (90 Days - K800)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                        <select
                          value={editingGuest.paymentMethod || 'MTN Mobile Money'}
                          onChange={(e) => setEditingGuest(prev => prev ? { ...prev, paymentMethod: e.target.value } : null)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner cursor-pointer appearance-none"
                        >
                          <option value="MTN Mobile Money">MTN Mobile Money</option>
                          <option value="Airtel Mobile Money">Airtel Mobile Money</option>
                          <option value="Zamtel Mobile Money">Zamtel Mobile Money</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash Payment">Cash Payment</option>
                          <option value="WhatsApp Direct Pay">WhatsApp Direct Pay</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Paid (ZMK)</label>
                        <input
                          type="number"
                          value={editingGuest.amountPaid !== undefined ? editingGuest.amountPaid : ''}
                          onChange={(e) => setEditingGuest(prev => prev ? { ...prev, amountPaid: Number(e.target.value) } : null)}
                          placeholder="Amount Paid (ZMK)"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub Count (Index)</label>
                        <input
                          type="number"
                          value={editingGuest.subscriptionIndex !== undefined ? editingGuest.subscriptionIndex : 1}
                          onChange={(e) => setEditingGuest(prev => prev ? { ...prev, subscriptionIndex: Number(e.target.value) } : null)}
                          placeholder="Subscription Count Index"
                          min="1"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 px-1 py-1 bg-blue-50/50 rounded-2xl border border-blue-100/50 p-3">
                        <input
                          type="checkbox"
                          id="reset-subscription"
                          checked={!!editingGuest.resetSubscription}
                          onChange={(e) => setEditingGuest(prev => prev ? { ...prev, resetSubscription: e.target.checked } : null)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="reset-subscription" className="text-[11px] font-extrabold text-blue-700 cursor-pointer select-none leading-tight">
                          Restart subscription timer (starts cycle from now)
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setEditingGuest(null)}
                        className="flex-1 text-center px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleSaveGuestEdit}
                        disabled={isUpdatingGrade || !editingGuest.grade.trim()}
                        className="flex-[2] text-center px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {isUpdatingGrade ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trial User Activation Modal */}
            <AnimatePresence>
              {activatingUser && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
                  onClick={() => setActivatingUser(null)}
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-w-xl w-full space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-slate-800">Activate Subscription Circle</h3>
                          <p className="text-[11px] font-bold text-slate-400">Upgrade trial user to an approved billing circle</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActivatingUser(null)}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                        title="Close modal"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Teacher Account Summary Card */}
                    <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Teacher Account</p>
                        <p className="text-xs sm:text-sm font-black text-slate-800 break-all font-mono">{activatingUser.email}</p>
                        {activatingUser.displayName && (
                          <p className="text-[11px] font-bold text-slate-500">{activatingUser.displayName}</p>
                        )}
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          Free Trial Mode
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* 1. Subscription Circle Plan Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <span>1. Subscription Circle Plan</span>
                          <span className="text-[9px] text-emerald-600 font-bold">(Select paid circle)</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(SUBSCRIPTION_PLANS).map(([k, p]) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                setActivationSub(k);
                                setActivationAmount(String(p.price));
                              }}
                              className={cn(
                                "p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between",
                                activationSub === k
                                  ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs"
                                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-black text-slate-800 leading-tight">{p.label}</span>
                                  {activationSub === k && (
                                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                      <Check size={10} />
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] font-black text-emerald-600 mt-1">
                                  {p.price === 1500 ? 'K1,500' : p.price === 0 ? 'Free' : `K${p.price}`}
                                </p>
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
                                {p.limit >= 999999 || !isFinite(p.limit) ? 'Unlimited' : `${p.limit} downloads`}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Activation Date & Start Time */}
                      <div className="space-y-1.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" />
                            <span>2. Activation / Start Date</span>
                          </label>
                          
                          {/* Quick Preset Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const localIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                setActivationDate(localIso);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black transition-all cursor-pointer shadow-2xs"
                            >
                              ⚡ Right Now
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const todayStart = new Date();
                                todayStart.setHours(0, 0, 0, 0);
                                const localIso = new Date(todayStart.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                setActivationDate(localIso);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black transition-all cursor-pointer shadow-2xs"
                            >
                              📅 Today (00:00)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                const localIso = new Date(yesterday.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                setActivationDate(localIso);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black transition-all cursor-pointer shadow-2xs"
                            >
                              ⏮️ Yesterday
                            </button>
                          </div>
                        </div>

                        <input
                          type="datetime-local"
                          value={activationDate}
                          onChange={(e) => setActivationDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner"
                          required
                        />
                        <p className="text-[9px] font-bold text-slate-400 ml-1">
                          Subscription countdown and active duration will calculate automatically from this timestamp.
                        </p>
                      </div>

                      {/* 3. Teaching Grade Allocation (Multi-Selector) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <Shield size={12} className="text-slate-400" />
                          <span>3. Teaching Grade Allocation</span>
                        </label>
                        <GradeMultiSelector
                          selectedGradesString={activationGrade}
                          onChange={setActivationGrade}
                          allAvailableGrades={allAvailableGrades}
                          themeColor="emerald"
                        />
                      </div>

                      {/* 4. Payment Details: Amount, Method, Index */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Paid (ZMK)</label>
                          <input
                            type="number"
                            value={activationAmount}
                            onChange={(e) => setActivationAmount(e.target.value)}
                            placeholder="e.g. 90"
                            min="0"
                            required
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                          <select
                            value={activationPaymentMethod}
                            onChange={(e) => setActivationPaymentMethod(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer appearance-none shadow-inner"
                          >
                            <option value="MTN Mobile Money">MTN Mobile Money</option>
                            <option value="Airtel Mobile Money">Airtel Mobile Money</option>
                            <option value="Zamtel Mobile Money">Zamtel Mobile Money</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash Payment">Cash Payment</option>
                            <option value="WhatsApp Direct Pay">WhatsApp Direct Pay</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub Count (Index)</label>
                          <input
                            type="number"
                            value={activationSubIndex}
                            onChange={(e) => setActivationSubIndex(e.target.value)}
                            placeholder="1"
                            min="1"
                            required
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActivatingUser(null)}
                        className="flex-1 text-center px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleActivateUser(activatingUser)}
                        disabled={isActivating}
                        className="flex-[2] text-center px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isActivating ? (
                          <>
                            <RefreshCcw size={14} className="animate-spin" />
                            <span>Activating Teacher...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Complete Activation & Grant Access</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Choices Deletion Dialog Modal Overlay */}
            <AnimatePresence>
              {pendingDeleteGuest && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-sm w-full space-y-4"
                  >
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-amber-50/50">
                      <AlertTriangle size={24} />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-base font-black text-slate-800 leading-snug">Choose Access & Deletion Control</h3>
                      <p className="text-xs font-bold text-[#00A86B] mt-1 hover:underline break-all">
                        {pendingDeleteGuest.email}
                      </p>
                    </div>

                    <p className="text-[11px] font-bold text-slate-500 text-center leading-relaxed">
                      Would you like to completely remove their offline authorization and additionally delete their login traffic/files downloaded history?
                    </p>

                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={() => handleDeleteGuest(pendingDeleteGuest.email, true)}
                        className="w-full text-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                      >
                        Delete Whitelist & Clear Sessions
                      </button>
                      
                      <button
                        onClick={() => handleDeleteGuest(pendingDeleteGuest.email, false)}
                        className="w-full text-center px-4 py-3 bg-slate-850 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                      >
                        Delete Whitelist & KEEP Sessions Log
                      </button>

                      <button
                        onClick={() => setPendingDeleteGuest(null)}
                        className="w-full text-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                      >
                        Keep Whitelist & Cancel Deletion
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
  );
}
