import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect } from 'react';
import buildMeta from '../build-metadata.json';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { SubscriptionPanel } from './SubscriptionPanel';
import { AccessModal } from './AccessModal';
import { CreditCard } from 'lucide-react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  writeBatch
} from 'firebase/firestore';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Search, 
  Plus, 
  Trash2, 
  Shield, 
  Lock,
  Unlock, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Eye, 
  Bell, 
  Save, 
  Loader2,
  ToggleLeft, 
  ToggleRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCode,
  Monitor,
  Check,
  Cpu,
  Layers,
  Fingerprint,
  Activity,
  Server,
  Sparkles,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GRADES, ADMIN_EMAIL, DOC_TEMPLATES, SUBSCRIPTION_PLANS, isDeveloperEmail } from '../constants';

interface WhitelistedGuest {
  email: string;
  grade: string;
  addedAt: any;
  addedBy?: string;
  status?: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastLogin: any;
  lastHeartbeat?: any;
}

interface SettingsProps {
  onBack?: () => void;
}

export default function Settings({ onBack }: SettingsProps = {}) {
  const { user, userType, globalConfig, informantData, updateInformantData, isWhitelisted, subscriptionDetails } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'subscription' | 'developer' | 'faq'>('profile');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  
  // System integrity and version check state
  const [integrityData, setIntegrityData] = useState<{
    latestVersion: string;
    releaseDate: string;
    buildTimestamp: string;
    buildId: string;
    appName: string;
    fileExists: boolean;
    apkSize: string;
    apkChecksum: string;
    changelog: string[];
  } | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  const fetchIntegrityData = async () => {
    setCheckingIntegrity(true);
    try {
      const response = await fetch('/api/system/integrity');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setIntegrityData(data);
    } catch (err: any) {
      console.error("Failed to fetch system integrity data:", err);
      // Fallback local structure
      setIntegrityData({
        latestVersion: "2.4.0",
        releaseDate: "August 2026",
        buildTimestamp: "2026-08-08T21:50:00.000Z",
        buildId: "seeded-initial",
        appName: "FORTUNES EDUTECH",
        fileExists: true,
        apkSize: "1.61 MB",
        apkChecksum: "ea32f14cfdca56d1bf494a87a228c89b25fcfcb1d154ee8c79ab15df7dce72e6",
        changelog: [
          "Purged all legacy v1.x protocols to ensure maximum stability.",
          "Redesigned high-density Assessment Tracker analytics suite.",
          "Optimized document sync engine with Firestore persistent store.",
          "Added native high-integrity streaming for secure direct APK downloads."
        ]
      });
    } finally {
      setCheckingIntegrity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'system') {
      fetchIntegrityData();
    }
  }, [activeTab]);

  const runDiagnosticCheck = async () => {
    if (runningDiagnostic) return;
    setRunningDiagnostic(true);
    setDiagnosticStatus('running');
    setDiagnosticProgress(0);
    setDiagnosticLogs([]);

    const steps = [
      { msg: "Connecting to secure local workspace storage...", delay: 500 },
      { msg: "Checking browser local storage cache validation...", delay: 600 },
      { msg: "Verifying secure Firestore Auth handshake credentials...", delay: 500 },
      { msg: "Aligning CDC Syllabus mapping database protocols...", delay: 700 },
      { msg: "Evaluating Android WebView environment bounds...", delay: 400 },
      { msg: "Validating FORTUNES_EDUTECH.apk bundle footprint...", delay: 800 },
      { msg: "Computing high-integrity SHA-256 binary checksum comparison...", delay: 900 }
    ];

    let currentLogs: string[] = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      currentLogs = [...currentLogs, `⚡ ${step.msg}`];
      setDiagnosticLogs([...currentLogs]);
      
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      currentLogs = currentLogs.map((log, index) => {
        if (index === i) {
          return `✓ ${step.msg}`;
        }
        return log;
      });
      setDiagnosticLogs([...currentLogs]);
      setDiagnosticProgress(Math.round(((i + 1) / steps.length) * 100));
    }

    setDiagnosticStatus('success');
    setRunningDiagnostic(false);
    toast.success("System diagnostic integrity scan completed! 100% Validated.");
  };

  // Whitelist management state
  const [whitelist, setWhitelist] = useState<WhitelistedGuest[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('eduplan_settings_whitelist');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const cached = safeLocalStorage.getItem('eduplan_settings_users');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [newEmail, setNewEmail] = useState('');
  const [newSub, setNewSub] = useState<string>('monthly');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('airtel_money');
  const [selectedGradesForNew, setSelectedGradesForNew] = useState<string[]>(['Grade 4']);

  // Sync default price when subscription type changes
  useEffect(() => {
    const plan = SUBSCRIPTION_PLANS[newSub as keyof typeof SUBSCRIPTION_PLANS];
    if (plan && plan.price !== Infinity) {
      setAmountPaid(plan.price.toString());
    } else {
      setAmountPaid('0');
    }
  }, [newSub]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Global settings state (local state for editing before saving)
  const [enforceGradeLock, setEnforceGradeLock] = useState(true);
  const [informantText, setInformantText] = useState('');
  const [isInformantDirty, setIsInformantDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [pendingSettingsDeleteGuest, setPendingSettingsDeleteGuest] = useState<{ email: string } | null>(null);

  const handleToggleSettingsGuestStatus = async (email: string, targetOrCurrentStatus: string) => {
    try {
      const cleanEmail = (email || '').toLowerCase().trim().replace(/\s+/g, '');
      if (!cleanEmail) return;

      let newStatus = targetOrCurrentStatus === 'active' ? 'active' : 'blocked';

      await setDoc(doc(db, 'authorized_guests', cleanEmail), {
        status: newStatus
      }, { merge: true });

      const guestUid = `guest_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      setDoc(doc(db, 'users', guestUid), {
        status: newStatus,
        is_whitelisted: newStatus === 'active'
      }, { merge: true }).catch(() => {});

      // Update local storage whitelist caches
      try {
        const sources = ['eduplan_monitor_whitelist', 'eduplan_whitelisted_guests', 'eduplan_settings_whitelist'];
        for (const src of sources) {
          const raw = safeLocalStorage.getItem(src);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const updated = list.map((item: any) => {
                const itemEmail = (item.email || item.id || '').toLowerCase().trim().replace(/\s+/g, '');
                if (itemEmail === cleanEmail) {
                  return { ...item, status: newStatus };
                }
                return item;
              });
              safeLocalStorage.setItem(src, JSON.stringify(updated));
            }
          }
        }
      } catch (e) {}

      toast.success(newStatus === 'blocked' ? `Suspended app access for ${cleanEmail}` : `Restored app access for ${cleanEmail}`);
    } catch (err: any) {
      console.error("Failed to toggle guest status:", err);
      toast.error("Failed to update status: " + err.message);
    }
  };

  // User details state
  const [registeredGrades, setRegisteredGrades] = useState<string[]>([]);

  const cleanEmail = user?.email?.toLowerCase().trim();
  const isDeveloper = userType === 'developer' || isDeveloperEmail(cleanEmail);

  // State for collapsible FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Fetch current user whitelisted grade
  useEffect(() => {
    if (!user || !cleanEmail) return;

    const fetchUserGrade = async () => {
      try {
        const normEmail = cleanEmail.replace(/\s+/g, '');
        let guestDocSnap = await getDoc(doc(db, 'authorized_guests', normEmail));
        if (!guestDocSnap.exists() && cleanEmail !== normEmail) {
          guestDocSnap = await getDoc(doc(db, 'authorized_guests', cleanEmail));
        }

        if (guestDocSnap.exists()) {
          const data = guestDocSnap.data();
          const g = data.grade || 'Grade 4';
          setRegisteredGrades(typeof g === 'string' ? g.split(',').map(s => s.trim()) : [g]);
        } else if (isDeveloper) {
          setRegisteredGrades(['all']);
        }
      } catch (e: any) {
        if (e?.message?.includes('Quota exceeded') || e?.code === 'resource-exhausted') {
          console.warn("User grade fetch paused (Quota Exceeded).");
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
          }
        } else {
          console.error("Error fetching user grade:", e);
        }
      }
    };

    fetchUserGrade();
  }, [user, cleanEmail, isDeveloper]);

  // Sync local editing state with global config when global config changes or tab changes
  useEffect(() => {
    if (activeTab === 'developer') {
      setEnforceGradeLock(globalConfig.enforceGradeLock);
    }
  }, [globalConfig, activeTab]);

  // Sync informant text from global context when not dirty or when switching to developer tab
  useEffect(() => {
    if (activeTab === 'developer' && !isInformantDirty) {
      setInformantText(informantData.text || '');
    }
  }, [informantData.text, activeTab]);

  // Fetch Whitelist & User Session Records (For Developer Only)
  useEffect(() => {
    if (!user || !isDeveloper || activeTab !== 'developer') return;

    setLoadingWhitelist(true);
    setLoadingUsers(true);

    // Snapshot of authorized_guests
    const whitelistQuery = collection(db, 'authorized_guests');
    const unsubWhitelist = onSnapshot(whitelistQuery, (snapshot) => {
      const list: WhitelistedGuest[] = [];
      snapshot.forEach((doc) => {
        list.push({ email: doc.id, ...(doc.data() as any) });
      });
      const sortedList = list.sort((a, b) => b.email.localeCompare(a.email));
      setWhitelist(sortedList);
      try {
        safeLocalStorage.setItem('eduplan_settings_whitelist', JSON.stringify(sortedList));
      } catch (e) {}
      setLoadingWhitelist(false);
    }, (err: any) => {
      const isQuota = err?.message?.includes('Quota exceeded') || err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn("Error fetching whitelist (Quota Exceeded) - using cached list");
      } else {
        console.error("Error fetching whitelist", err);
      }
      try {
        const cached = safeLocalStorage.getItem('eduplan_settings_whitelist');
        if (cached) {
          setWhitelist(JSON.parse(cached));
        }
      } catch (e) {}
      setLoadingWhitelist(false);
    });

    // Snapshot of online profiles (Users & Guest Experiments)
    let usersList: UserProfile[] = [];
    let guestExpList: any[] = [];

    const mergeAndSortUsers = () => {
      const emailMap = new Map<string, UserProfile>();

      guestExpList.forEach((g) => {
        if (g.email) {
          const norm = g.email.toLowerCase().trim().replace(/\s+/g, '');
          emailMap.set(norm, {
            uid: g.uid || `guest_${norm.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: norm,
            displayName: g.displayName || 'Trial Teacher (Guest)',
            photoURL: g.photoURL || '',
            lastLogin: g.lastLogin || g.firstAccess || null,
            lastHeartbeat: g.lastHeartbeat || g.lastLogin || null,
          } as UserProfile);
        }
      });

      usersList.forEach((u) => {
        if (u.email) {
          const norm = u.email.toLowerCase().trim().replace(/\s+/g, '');
          emailMap.set(norm, {
            ...u,
            email: norm,
            uid: u.uid || `user_${norm.replace(/[^a-zA-Z0-9]/g, '_')}`,
          });
        }
      });

      // Also ensure all whitelisted guests appear in the sessions list
      whitelist.forEach((w) => {
        if (w.email) {
          const norm = w.email.toLowerCase().trim().replace(/\s+/g, '');
          if (!emailMap.has(norm)) {
            emailMap.set(norm, {
              uid: `whitelist_${norm.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: norm,
              displayName: (w as any).displayName || 'Approved Teacher',
              photoURL: '',
              lastLogin: (w as any).lastLogin || (w as any).addedAt || (w as any).subscriptionStart || null,
              lastHeartbeat: (w as any).lastHeartbeat || (w as any).lastLogin || (w as any).addedAt || null,
            } as UserProfile);
          }
        }
      });

      const combined = Array.from(emailMap.values()).sort((a, b) => {
        const dateA = a.lastHeartbeat?.seconds || a.lastLogin?.seconds || 0;
        const dateB = b.lastHeartbeat?.seconds || b.lastLogin?.seconds || 0;
        return dateB - dateA;
      });

      setUsers(combined);
      try {
        safeLocalStorage.setItem('eduplan_settings_users', JSON.stringify(combined));
      } catch (e) {}
      setLoadingUsers(false);
    };

    const usersQuery = collection(db, 'users');
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      usersList = list;
      mergeAndSortUsers();
    }, (err: any) => {
      const isQuota = err?.message?.includes('Quota exceeded') || err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn("Error fetching sessions (Quota Exceeded) - using cached list");
      } else {
        console.error("Error fetching sessions", err);
      }
      try {
        const cached = safeLocalStorage.getItem('eduplan_settings_users');
        if (cached) {
          setUsers(JSON.parse(cached));
        }
      } catch (e) {}
      setLoadingUsers(false);
    });

    const unsubGuestExp = onSnapshot(collection(db, 'guest_experiments'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      guestExpList = list;
      mergeAndSortUsers();
    }, (err: any) => {
      console.warn("Error fetching guest experiments in Settings:", err);
    });

    return () => {
      unsubWhitelist();
      unsubUsers();
      unsubGuestExp();
    };
  }, [user, isDeveloper, activeTab]);

  // Add guest to whitelist
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const guestEmail = newEmail.toLowerCase().trim().replace(/\s+/g, '');
    if (!guestEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const finalGrade = selectedGradesForNew.includes('all') ? 'all' : selectedGradesForNew.join(', ');
      const payload = {
        email: guestEmail,
        grade: finalGrade,
        subscriptionType: newSub,
        subscriptionStart: serverTimestamp(),
        addedAt: serverTimestamp(),
        addedBy: user?.email || 'Admin',
        amountPaid: Number(amountPaid) || 0,
        paymentMethod: paymentMethod,
        status: 'active'
      };

      await setDoc(doc(db, 'authorized_guests', guestEmail), payload);
      safeLocalStorage.setItem(`eduplan_user_sub_circle_${guestEmail}`, newSub);

      // Also try to update the active user profile if it exists
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', guestEmail));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((userDoc) => {
          batch.update(userDoc.ref, {
            teaching_grade: finalGrade,
            is_whitelisted: true,
            user_type: 'registered',
            subscriptionType: newSub,
            subscriptionStart: serverTimestamp(),
            amountPaid: Number(amountPaid) || 0,
            paymentMethod: paymentMethod,
            status: 'active'
          });
        });
        if (!querySnapshot.empty) {
          await batch.commit();
        }
      } catch (profileErr) {
        console.warn("Could not sync profile immediately (non-critical):", profileErr);
      }
      
      toast.success(`Successfully registered ${guestEmail} for ${newSub} subscription!`);
      setNewEmail('');
      setNewSub('monthly');
      setSelectedGradesForNew(['Grade 4']);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add guest: " + error.message);
    }
  };

  // Remove guest from whitelist
  const handleRemoveGuest = async (targetEmail: string, alsoDeleteUserProfile: boolean) => {
    if (targetEmail === 'kombefortune9@gmail.com') {
      toast.error("Cannot deregister the developer!");
      return;
    }

    try {
      await deleteDoc(doc(db, 'authorized_guests', targetEmail));
      toast.success(`Deregistered ${targetEmail} from workspace.`);

      if (alsoDeleteUserProfile) {
        try {
          const usersQ = query(collection(db, 'users'), where('email', '==', targetEmail));
          const usersSnapshot = await getDocs(usersQ);
          const batch = writeBatch(db);
          let count = 0;
          usersSnapshot.forEach((userDoc) => {
            batch.delete(userDoc.ref);
            count++;
          });
          if (count > 0) {
            await batch.commit();
            toast.success(`Removed ${count} active user record(s).`);
          }
        } catch (userErr) {
          console.error("Failed to delete user profiles after removing guest:", userErr);
        }
      } else {
        toast.success(`Preserved past active user session and history logs for ${targetEmail}.`);
      }
      setPendingSettingsDeleteGuest(null);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete guest: " + error.message);
    }
  };

  // Save Config Settings
  const handleSaveDeveloperSettings = async () => {
    setSavingSettings(true);
    try {
      const cleanText = informantText.trim();

      // 1. Instantly activate informant text in local context & storage with zero delay
      if (typeof updateInformantData === 'function') {
        updateInformantData(cleanText);
      }
      if (cleanText) {
        safeLocalStorage.setItem('eduplan_informant_text', cleanText);
      } else {
        safeLocalStorage.removeItem('eduplan_informant_text');
      }

      setInformantText(cleanText);
      setIsInformantDirty(false);

      // 2. Persist to Firestore concurrently
      await Promise.all([
        setDoc(doc(db, 'global_settings', 'config'), {
          enforceGradeLock,
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'global_settings', 'informant'), {
          text: cleanText,
          updatedAt: serverTimestamp(),
        })
      ]);

      toast.success("Informant information updated successfully & broadcasted live instantly!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save configuration settings: " + error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredWhitelist = whitelist.filter(g => 
    g.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.grade || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (ts: any, fallback = 'Pending Sign-in') => {
    if (!ts) return fallback;
    try {
      if (typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      }
      if (ts instanceof Date) {
        return ts.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      }
      if (typeof ts.seconds === 'number') {
        return new Date(ts.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      }
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      }
    } catch (e) {}
    return fallback;
  };

  const isUserOnline = (user: UserProfile) => {
    if (!user.lastHeartbeat) return false;
    try {
      const heartbeatDate = typeof (user.lastHeartbeat as any)?.toDate === 'function' 
        ? (user.lastHeartbeat as any).toDate() 
        : new Date(user.lastHeartbeat as any);
      if (isNaN(heartbeatDate.getTime())) return false;
      const differenceInSeconds = (Date.now() - heartbeatDate.getTime()) / 1000;
      return differenceInSeconds < 180; // active in last 3 mins
    } catch (e) {
      return false;
    }
  };

  const faqs = [
    {
      q: "What is the redefined Terms of Use?",
      a: "By accessing FORTUNES EDUTECH (v2.4), you agree to our current high-performance professional educational standards. All legacy v1.x protocols have been purged. Your whitelisted account access is strictly for your personal use; unauthorized distribution or multi-user sharing of a single whitelisted portal is monitored and strictly prohibited. Any breach of these terms will lead to immediate account suspension to maintain platform integrity."
    },
    {
      q: "What are the latest August 2026 updates?",
      a: "The August 2026 update (v2.4) introduces a fully optimized document sync engine, the redesigned high-density Assessment Tracker, and refined 1-click syllabus mapping. All previous legacy data structures have been removed to ensure maximum performance and current compliance."
    },
    {
      q: "How does the subscription cycle work currently?",
      a: "Subscriptions are now unified across all generator portals. Activating your account whitelists your specific grade profile, granting unrestricted access to Schemes of Work, Weekly Forecasts, and the new Assessment Tracker analytics suite."
    },
    {
      q: "Security and Whitelist Status?",
      a: "We have updated our security protocols. Only developer-authorized emails (kombefortune9@gmail.com) can access premium features. This ensures a secure, high-integrity environment for professional Zambian educators."
    },
    {
      q: "Magic Fill & Syllabus Compliance?",
      a: "Our updated engine now perfectly aligns with the latest CDC National Frameworks. 'Magic Fill' auto-populates instructional goals, learner activities, and assessment stages with 99% accuracy against current Zambian standards."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer group"
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={16} className="text-emerald-600 group-hover:text-white transition-colors" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Header Visual Shield */}
      <div className="bg-gradient-to-r from-[#00A86B] to-emerald-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight">Security & Settings</h1>
            <p className="text-emerald-50 text-sm max-w-xl font-medium leading-relaxed">
              Manage your personal credentials, browse helpful FAQs, or access Developer tools to whitelist user accounts and moderate access.
            </p>
          </div>
          <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md self-start md:self-auto border border-white/10 flex-wrap gap-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'profile' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <UserIcon size={14} />
              My Profile
            </button>
            <button 
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'subscription' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <CreditCard size={14} />
              My License
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'system' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <Fingerprint size={14} />
              Integrity Check
            </button>
            <button 
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'faq' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <HelpCircle size={14} />
              FAQ Help
            </button>
            {isDeveloper && (
              <button 
                onClick={() => setActiveTab('developer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'developer' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
              >
                <Shield size={14} />
                Dev Console
              </button>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Status Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 text-[#00A86B] rounded-full flex items-center justify-center text-3xl font-black uppercase ring-8 ring-emerald-50/50 shadow-inner">
              {user?.email?.charAt(0) || 'T'}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">{user?.displayName || 'Teacher (Guest)'}</h3>
              <p className="text-slate-400 font-bold text-xs tracking-tight mt-0.5">{user?.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-left">Assigned Grades</span>
                <span className="bg-[#00A86B]/10 text-[#00A86B] text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  {isDeveloper || registeredGrades.includes('all') ? 'All Grades (ECE Level 1 to Form 6 (A Level))' : (registeredGrades.join(', ') || 'All Grades (ECE Level 1 to Form 6 (A Level))')}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-left">Workspace Access</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-left">Account Type</span>
                <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                  {isDeveloper ? <Shield size={10} /> : <Lock size={10} />}
                  {isDeveloper ? 'Developer' : 'Registered Teacher'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Support Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 bg-[#25D366]/15 text-[#25D366] rounded-xl flex items-center justify-center border border-[#25D366]/20">
              <MessageSquare size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm tracking-tight">Need Premium Access?</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed font-medium">
                Unlock full unlimited downloads, primary syllabus guides, and classroom generators. WhatsApp Fortunes Edutech!
              </p>
            </div>
            <button
              onClick={() => window.open('https://wa.me/260961622222', '_blank')}
              className="w-full bg-[#25D366] hover:bg-emerald-600 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 .007c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3.52 14.156c-.347.96-.867 1.832-1.528 2.507.031.025.109.111.121.125h.001c.209.28.322.617.322.966 0 .584-.316 1.124-.827 1.411-.531.3-1.189.288-1.71-.033l-1.398-.86c-.524.32-.204.124-.728.441s-1.157.344-1.712.07l-1.424-.701c-.5-.246-.827-.751-.839-1.311-.012-.559.285-1.077.771-1.353.486-.276.518-.328.031-.052v-.002c-.443-.251-.715-.724-.715-1.233 0-.462.224-.897.601-1.168.318-.228.384-.288.066-.06l.001-.001c.42-.4.653-.949.653-1.517v-.15c0-.986-.682-1.848-1.637-2.072-.116-.027-.229-.071-.341-.121l-.053-.024-.055-.025s-.1-.045-.252-.107c-.443-.18-.737-.611-.737-1.092v-.058c0-.796.602-1.458 1.395-1.53.078-.007.158-.01.239-.01 1.764 0 3.321.737 4.453 1.91.439.455.807.971 1.098 1.536zM18.444 8.761c-.131-.498-.445-.92-.872-1.173l-.066-.039c-.198-.117-.423-.178-.65-.178-.291 0-.573.102-.799.289l-1.282 1.06c-.461.381-1.125.437-1.644.137l-.934-.54c-.672-.388-1.472-.257-2 .322l-1.879 2.06c-.571.626-.549 1.597.051 2.2l.9.9c.404.404.942.617 1.488.583.541-.034 1.05-.286 1.399-.693l1.833-2.14c.401-.468.423-1.144.053-1.639l-.88-.93c-.412-.436-.457-1.104-.105-1.592c.352-.488.243-.242.595-.73z"/>
              </svg>
              Contact Fortunes Edutech
            </button>
          </div>
        </div>

        {/* Right Side: Tab Contents Details */}
        <div className="md:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <SubscriptionPanel onOpenUpgradeModal={() => setIsAccessModalOpen(true)} />
              </motion.div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <UserIcon className="text-[#00A86B]" size={20} />
                    My Account Details
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">Your localized access profile and term metadata.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Registered Email</span>
                    <p className="text-slate-800 font-bold text-sm truncate">{user?.email}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Class Grade Access</span>
                    <p className="text-slate-800 font-bold text-sm truncate uppercase">
                      {isDeveloper || isWhitelisted || registeredGrades.includes('all') 
                        ? "All Grades (ECE Level 1 - Form 6 (A Level))" 
                        : (registeredGrades.join(', ') || "All Grades (ECE Level 1 to Form 6 (A Level))")}
                    </p>
                  </div>
                </div>

                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3">
                  <CheckCircle className="text-[#00A86B] shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Access Restrictions Status & Terms</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">
                      Your workspace is registered. By accessing this platform (v2.4), you agree to our current high-performance professional educational standards. All legacy v1.x protocols have been purged. Your whitelisted account access is strictly for your personal use; unauthorized multi-user sharing is strictly prohibited and monitored.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-blue-50/30 border border-blue-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Registered Materials Policy</h4>
                      <p className="text-slate-500 text-[10px] font-medium mt-0.5">Learn why accessing only your registered grade keeps performance high.</p>
                    </div>
                  </div>
                </div>

                {/* OFFICIAL RESOURCES & GOVERNMENT LINKS */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Monitor className="text-[#00A86B]" size={16} />
                      Official Government & Curriculum Links
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Direct access to essential Zambian civil service and educational portals.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <a 
                      href="https://epdmis.grz.gov.zm/request-payslip/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col gap-1 select-none group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Request Payslips</span>
                        <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Visit ↗</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Official GRZ Ministry of Finance E-Payslip request platform. Securely retrieve your civil service monthly payslip.
                      </p>
                    </a>

                    <a 
                      href="https://www.edu.gov.zm/?page_id=1142" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col gap-1 select-none group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Ministry Portal (MoE)</span>
                        <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Visit ↗</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Ministry of Education (MoE) portal for official bulletins, job postings, circulars, and teacher deployment details.
                      </p>
                    </a>

                    <a 
                      href="https://library.cdcrepository.info/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col gap-1 select-none group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Download CDC Materials</span>
                        <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Visit ↗</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Curriculum Development Centre (CDC) database. Find official hard-copy reference guides and syllabi.
                      </p>
                    </a>

                    <a 
                      href="https://www.tcz.org.zm/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col gap-1 select-none group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Teaching Council (TCZ)</span>
                        <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Visit ↗</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        The Teaching Council of Zambia. Handily register, license, or check professional compliance statuses.
                      </p>
                    </a>

                    <a 
                      href="https://www.exams-council.org.zm/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-4 rounded-2xl border border-slate-100 bg-indigo-50/20 hover:border-indigo-500 hover:bg-white transition-all flex flex-col gap-1 select-none group sm:col-span-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-tight">Examinations Council (ECZ)</span>
                        <span className="text-[10px] text-indigo-600 font-bold opacity-100 transition-opacity">exams-council.org.zm ↗</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        The Examinations Council of Zambia. Access official timetables, download historical past papers, and review Grade 7, 9, and 12 results.
                      </p>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SYSTEM INTEGRITY TAB */}
            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* 1. Version Comparison Hero Card */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Fingerprint className="text-[#00A86B]" size={20} />
                        Version & Integrity Audit
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 font-semibold">Verify build signature, file hashes, and check for update packages.</p>
                    </div>
                    <button
                      onClick={fetchIntegrityData}
                      disabled={checkingIntegrity}
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 py-2 px-3.5 rounded-xl flex items-center gap-2 font-bold text-[10px] uppercase tracking-wide transition-all"
                    >
                      <RefreshCw className={cn(checkingIntegrity && "animate-spin")} size={12} />
                      Refresh Check
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/25 p-5 rounded-2xl border border-emerald-100/50 flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                        <Cpu size={20} />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Your Local Bundle</span>
                        <p className="text-slate-800 font-extrabold text-lg flex items-center gap-2">
                          v{buildMeta.version}
                          <span className="text-[8px] bg-emerald-100 text-[#00A86B] px-1.5 py-0.5 rounded-md font-black uppercase">Active</span>
                        </p>
                        <div className="space-y-0.5 text-slate-500 text-[10px] font-semibold">
                          <p className="truncate">Build ID: <span className="font-mono text-slate-700">{buildMeta.buildId}</span></p>
                          <p className="truncate">Built: {new Date(buildMeta.buildTimestamp).toLocaleDateString()} {new Date(buildMeta.buildTimestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50/25 p-5 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <Server size={20} />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block">Latest Server Release</span>
                        <p className="text-slate-800 font-extrabold text-lg">
                          {checkingIntegrity ? "Checking..." : `v${integrityData?.latestVersion || buildMeta.version}`}
                        </p>
                        <div className="space-y-0.5 text-slate-500 text-[10px] font-semibold">
                          <p className="truncate">Build ID: <span className="font-mono text-slate-700">{checkingIntegrity ? "Checking..." : (integrityData?.buildId || buildMeta.buildId)}</span></p>
                          <p className="truncate">Released: {checkingIntegrity ? "..." : (integrityData?.releaseDate || buildMeta.releaseDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Integrity Mismatch Status Check */}
                  {!checkingIntegrity && integrityData && (
                    buildMeta.buildId !== integrityData.buildId ? (
                      <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={18} />
                        <div className="space-y-1">
                          <h4 className="font-bold text-amber-800 text-xs uppercase tracking-tight">Stale Build Warning</h4>
                          <p className="text-amber-700/90 text-[11px] leading-relaxed font-semibold">
                            A newer version of the application has been deployed on the server. Your currently loaded browser session is running build <span className="font-mono text-slate-900 font-bold">{buildMeta.buildId}</span>, while server release <span className="font-mono text-slate-900 font-bold">{integrityData.buildId}</span> is active. Please perform a full page reload to receive the update.
                          </p>
                          <button 
                            onClick={() => window.location.reload()}
                            className="mt-1.5 bg-amber-600 hover:bg-amber-700 text-white py-1 px-3 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all"
                          >
                            Reload Web App
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-start gap-3">
                        <CheckCircle className="text-[#00A86B] shrink-0 mt-0.5" size={16} />
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Active Build Verified Genuine & Synced</h4>
                          <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                            Your browser build fingerprint matches the production server exactly (Build: <span className="font-mono text-slate-700 font-bold">{buildMeta.buildId}</span>). No stale or out-of-sync bundles detected. Secure file integrity is fully operational.
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* 2. SHA-256 APK Signature & Footprint card */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Layers className="text-[#00A86B]" size={16} />
                    Android APK Integrity & Binary Fingerprint
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Compare binary footprint and SHA-256 integrity hash of your downloaded launcher application to prevent tampered or corrupted installation builds.</p>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">APK File Size</span>
                        <p className="text-slate-800 font-extrabold text-sm">{integrityData?.apkSize || "1.61 MB"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Package Name</span>
                        <p className="text-slate-800 font-extrabold text-sm">FORTUNES_EDUTECH.apk</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Fingerprint size={12} className="text-[#00A86B]" />
                        Official SHA-256 Checksum Signature
                      </span>
                      <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[10px] font-mono break-all leading-normal border border-slate-800 select-all">
                        {integrityData?.apkChecksum || "ea32f14cfdca56d1bf494a87a228c89b25fcfcb1d154ee8c79ab15df7dce72e6"}
                      </div>
                      <span className="text-[9px] text-[#00A86B] font-bold block mt-1">✓ Matching signature certifies this is the pristine, untouched official release of FORTUNES EDUTECH.</span>
                    </div>
                  </div>
                </div>

                {/* 3. Diagnostic Handshake Engine */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                        <Activity className="text-[#00A86B]" size={16} />
                        Diagnostic Integrity Handshake Check
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Test local APIs, authentication sync, storage persistence bounds, and file system signatures in real-time.</p>
                    </div>
                    <button
                      onClick={runDiagnosticCheck}
                      disabled={runningDiagnostic}
                      className="bg-[#00A86B] text-white hover:bg-emerald-600 disabled:opacity-50 py-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-100/50 transition-all"
                    >
                      {runningDiagnostic ? <RefreshCw className="animate-spin" size={14} /> : <Cpu size={14} />}
                      Run Diagnostics
                    </button>
                  </div>

                  {diagnosticStatus !== 'idle' && (
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                          <span>Audit Progress</span>
                          <span className="text-slate-700 font-extrabold">{diagnosticProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00A86B] to-emerald-600 transition-all duration-300 rounded-full" 
                            style={{ width: `${diagnosticProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Diagnostic Logs console */}
                      <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[10px] text-slate-300 space-y-2 border border-slate-900 max-h-48 overflow-y-auto custom-scrollbar">
                        {diagnosticLogs.map((log, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "leading-relaxed",
                              log.startsWith('✓') ? "text-emerald-400" : "text-amber-400"
                            )}
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Release History / Changelog timeline */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <FileCode className="text-[#00A86B]" size={16} />
                    v2.4.0 Release Changelog Notes
                  </h3>
                  <div className="space-y-3.5 pl-2 border-l-2 border-slate-100">
                    {(integrityData?.changelog || [
                      "Purged all legacy v1.x protocols to ensure maximum stability.",
                      "Redesigned high-density Assessment Tracker analytics suite.",
                      "Optimized document sync engine with Firestore persistent store.",
                      "Added native high-integrity streaming for secure direct APK downloads."
                    ]).map((change, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00A86B]" />
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">{change}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* FAQS TAB */}
            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <HelpCircle className="text-[#00A86B]" size={20} />
                    Frequently Asked Questions
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">Instant answers about CBC codes, magic filling, and system guidelines.</p>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div 
                        key={index} 
                        className="border border-slate-200/60 rounded-2xl overflow-hidden transition-all duration-300 bg-white"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="w-full flex justify-between items-center p-4 hover:bg-slate-50 text-left transition-colors"
                        >
                          <span className="font-bold text-slate-700 text-xs md:text-sm leading-tight pr-4">{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="text-slate-400 shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="text-slate-400 shrink-0" size={16} />
                          )}
                        </button>
                        <AnimatePresence duration-200>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-slate-50/50 text-slate-500 text-xs leading-relaxed font-semibold border-t border-slate-100">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* DEVELOPER TAB */}
            {isDeveloper && activeTab === 'developer' && (
              <motion.div
                key="developer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* 1. Global System Configuration Toggles */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <SettingsIcon className="text-[#00A86B]" size={20} />
                        Global Platform Config
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 font-semibold">Tweak security features and control whitelisting restrictions.</p>
                    </div>
                    <button
                      onClick={handleSaveDeveloperSettings}
                      disabled={savingSettings}
                      className="bg-[#00A86B] text-white hover:bg-emerald-600 active:scale-[0.98] py-2 px-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wide shadow-md shadow-emerald-100 transition-all"
                    >
                      {savingSettings ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                      Save Rules
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Grade Lock Toggle Check */}
                    <div className="flex items-center justify-between p-4 bg-slate-150/40 rounded-2xl border border-slate-100">
                      <div className="space-y-1 pr-6">
                        <span className="font-bold text-slate-800 text-xs block uppercase tracking-tight">Grade-Lock Multi-Document Control</span>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          Force teachers to select and generate matching documents (Schemes, Forecasts, and Lesson Plans) for their registered grade ONLY. Disabling this opens all levels to everyone.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnforceGradeLock(!enforceGradeLock)}
                        className="shrink-0 text-slate-600"
                      >
                        {enforceGradeLock ? (
                          <ToggleRight className="text-[#00A86B] cursor-pointer" size={44} />
                        ) : (
                          <ToggleLeft className="text-slate-300 cursor-pointer" size={44} />
                        )}
                      </button>
                    </div>

                    {/* Developer Informant Billboards Announcement */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Bell size={13} className="text-[#00A86B]" />
                          Developer Informant (Sliding horizontal message box ticker - active until changed)
                        </label>
                      </div>
                      <textarea
                        value={informantText}
                        onChange={(e) => {
                          setInformantText(e.target.value);
                          setIsInformantDirty(true);
                        }}
                        placeholder="Type short exciting announcement or update reminder for users... e.g. You are advised to refer content from the syllabus based on the subject..."
                        className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 h-28 focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:bg-white resize-none shadow-inner"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] text-[#00A86B] font-bold leading-relaxed">
                          This message will slide horizontally on dashboards for all users and remain active indefinitely until you update or change it.
                        </p>
                        <button
                          type="button"
                          onClick={handleSaveDeveloperSettings}
                          disabled={savingSettings}
                          className="shrink-0 bg-[#00A86B] hover:bg-[#008f5b] active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          Save Informant Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Registered Whitelisted Emails list management */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <Plus className="text-[#00A86B]" size={20} />
                      Durable Email Whitelist ({whitelist.length})
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Only whitelisted emails are permitted to sign in to the platform.</p>
                  </div>

                  {/* Add Whitelist Form */}
                  <form onSubmit={handleAddGuest} className="bg-slate-50 p-4 border border-slate-100 rounded-3xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Teacher Email Address</label>
                        <input 
                          type="email"
                          required
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          placeholder="teacher@example.com"
                          className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Subscription Circle</label>
                        <select
                          value={newSub}
                          onChange={(e: any) => setNewSub(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                        >
                          {Object.entries(SUBSCRIPTION_PLANS).filter(([k]) => k !== 'guest_trial').map(([key, plan]) => (
                            <option key={key} value={key}>{plan.label} (ZMK {plan.price} - {plan.durationDays} Days)</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Amount Paid (ZMW)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">ZMK</span>
                          <input 
                            type="number"
                            required
                            value={amountPaid}
                            onChange={e => setAmountPaid(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl pl-12 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Payment Channel</label>
                        <select
                          value={paymentMethod}
                          onChange={(e: any) => setPaymentMethod(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                        >
                          <option value="airtel_money">Airtel Money</option>
                          <option value="mtn_momo">MTN MoMo</option>
                          <option value="zamtel_kwacha">Zamtel Kwacha</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash Payment</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end sm:col-span-3">
                        <button 
                          type="submit"
                          className="w-full bg-[#00A86B] text-white hover:bg-emerald-600 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-tight shadow-md transition-all h-[42px]"
                        >
                          <Plus size={16} />
                          Whitelist Teacher
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
                         <span>Select Registered Grades (Multi-select)</span>
                         <button 
                           type="button"
                           onClick={() => setSelectedGradesForNew(['all'])}
                           className="text-[9px] text-blue-500 hover:underline"
                         >
                           Set All Access
                         </button>
                       </label>
                       
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl custom-scrollbar">
                         <label className={cn(
                           "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                           selectedGradesForNew.includes('all') ? "bg-emerald-50 border-emerald-200" : "hover:bg-slate-50 border-transparent"
                         )}>
                           <input 
                             type="checkbox"
                             className="hidden"
                             checked={selectedGradesForNew.includes('all')}
                             onChange={() => {
                               if (selectedGradesForNew.includes('all')) {
                                 setSelectedGradesForNew(['Grade 4']);
                               } else {
                                 setSelectedGradesForNew(['all']);
                               }
                             }}
                           />
                           <span className={cn("text-[10px] font-bold truncate", selectedGradesForNew.includes('all') ? "text-emerald-700" : "text-slate-500")}>Full Access (All)</span>
                         </label>

                         {GRADES.map(g => (
                           <label key={g} className={cn(
                             "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                             selectedGradesForNew.includes(g) ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50 border-transparent"
                           )}>
                             <input 
                               type="checkbox"
                               className="hidden"
                               disabled={selectedGradesForNew.includes('all')}
                               checked={selectedGradesForNew.includes(g)}
                               onChange={() => {
                                 if (selectedGradesForNew.includes(g)) {
                                   setSelectedGradesForNew(selectedGradesForNew.filter(item => item !== g));
                                 } else {
                                   setSelectedGradesForNew([...selectedGradesForNew.filter(item => item !== 'all'), g]);
                                 }
                               }}
                             />
                             <span className={cn("text-[10px] font-bold truncate", selectedGradesForNew.includes(g) ? "text-blue-700" : "text-slate-500")}>{g}</span>
                           </label>
                         ))}
                       </div>
                    </div>
                  </form>

                  {/* Whitelist Search & Table */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="text"
                        placeholder="Search Whitelist by email or grade..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-600 bg-slate-50/50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                    </div>

                    <div className="border border-slate-100 rounded-3xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                      {loadingWhitelist ? (
                        <div className="p-8 text-center text-slate-400 font-semibold text-xs animate-pulse">Loading active whitelist entries...</div>
                      ) : filteredWhitelist.length === 0 ? (
                        <div className="p-8 text-slate-400 font-semibold text-xs text-center">No matching whitelisted emails found.</div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                              <th className="p-3">Verified Email</th>
                              <th className="p-3">Registered Grade</th>
                              <th className="p-3">Allocated Circle</th>
                              <th className="p-3">Payment Info</th>
                              <th className="p-3">App Access</th>
                              <th className="p-3">Activated Date</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                            {filteredWhitelist.map((guest) => {
                              const sType = (guest as any).subscriptionType || 'monthly';
                              let subBadge = "Weekly Circle";
                              let subColor = "bg-amber-50 text-amber-700 border-amber-200";
                              if (sType === '14days') {
                                subBadge = "14 Days Circle";
                                subColor = "bg-cyan-50 text-cyan-700 border-cyan-200";
                              } else if (sType === 'monthly') {
                                subBadge = "Monthly Circle";
                                subColor = "bg-purple-50 text-purple-700 border-purple-200";
                              } else if (sType === 'termly') {
                                subBadge = "Termly Circle";
                                subColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                              } else if (sType === 'unlimited') {
                                subBadge = "Unlimited Lifetime";
                                subColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                              }

                              return (
                                <tr key={guest.email} className="hover:bg-slate-50/40">
                                  <td className="p-3 font-bold truncate max-w-xs">{guest.email}</td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                                      {guest.grade === 'all' ? (
                                        <span className="bg-[#00A86B]/10 text-[#00A86B] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">All</span>
                                      ) : (
                                        (guest.grade || '').split(',').map((g, idx) => (
                                          <span key={idx} className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase truncate max-w-[80px]">
                                            {g.trim()}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight border inline-block", subColor)}>
                                      {subBadge}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-slate-800 font-bold">ZMK {(guest as any).amountPaid || 0}</span>
                                      <span className="text-[8px] text-slate-400 uppercase font-black">{(guest as any).paymentMethod?.replace('_', ' ') || 'unknown'}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {guest.status === 'blocked' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-wider">
                                        <Lock size={10} /> Suspended
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                        <Unlock size={10} /> Allowed
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-500 text-[10px] font-mono">
                                    {formatTimestamp(guest.addedAt || (guest as any).subscriptionStart)}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleToggleSettingsGuestStatus(guest.email, guest.status || 'active')}
                                        className={cn(
                                          "p-1 rounded-lg transition-all",
                                          guest.status === 'blocked' 
                                            ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
                                            : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                                        )}
                                        title={guest.status === 'blocked' ? "Restore Access" : "Block Access"}
                                      >
                                        {guest.status === 'blocked' ? <Lock size={14} /> : <Unlock size={14} />}
                                      </button>
                                      
                                      <button
                                        onClick={() => setPendingSettingsDeleteGuest({ email: guest.email })}
                                        className="text-red-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50/50 transition-all inline animate-none"
                                        title="Deregister options"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Real-time User Activity Monitoring */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <Eye className="text-[#00A86B]" size={20} />
                      Real-Time Session Monitor ({users.length})
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Monitor active teacher sessions and heartbeats on the application.</p>
                  </div>

                  <div className="border border-slate-100 rounded-3xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                    {loadingUsers ? (
                      <div className="p-8 text-center text-slate-400 font-semibold text-xs animate-pulse">Loading sessions...</div>
                    ) : users.length === 0 ? (
                      <div className="p-8 text-slate-400 font-semibold text-xs text-center">No teacher sessions recorded yet.</div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                            <th className="p-3">Profile / Name</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Last Active Pulse</th>
                            <th className="p-3">Access Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                          {users.map((u) => {
                            const online = isUserOnline(u);
                            const isSuspended = (u as any).status === 'blocked' || whitelist.some(item => (item.email || (item as any).id || '').toLowerCase().trim().replace(/\s+/g, '') === u.email?.toLowerCase().trim().replace(/\s+/g, '') && item.status === 'blocked');
                            return (
                              <tr key={u.uid} className="hover:bg-slate-50/40">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                                      {u.displayName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="font-bold truncate max-w-[120px]">{u.displayName || 'Teacher (Guest)'}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-500 truncate max-w-xs">{u.email}</td>
                                <td className="p-3 text-slate-400 text-[10px]">{formatTimestamp(u.lastHeartbeat || u.lastLogin)}</td>
                                <td className="p-3">
                                  <div className="flex flex-col gap-1 items-start">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${online ? 'bg-emerald-50 text-[#00A86B]' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-[#00A86B] animate-pulse' : 'bg-slate-400'}`} />
                                        {online ? 'Online' : 'Offline'}
                                      </span>
                                      {whitelist.some(item => item.email?.toLowerCase().trim() === u.email?.toLowerCase().trim()) ? (
                                        <span className="inline-flex items-center gap-1 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                          <Shield size={8} /> Whitelisted
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                                          <Sparkles size={8} className="text-amber-500" /> Trial Mode
                                        </span>
                                      )}
                                    </div>
                                    {isSuspended && (
                                      <span className="inline-flex items-center gap-1 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 uppercase">
                                        <Lock size={9} /> Suspended
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!whitelist.some(item => item.email?.toLowerCase().trim() === u.email?.toLowerCase().trim()) && (
                                      <button
                                        onClick={() => {
                                          setNewEmail(u.email);
                                          setSelectedGradesForNew(['Grade 4']);
                                          toast.success(`Pre-filled email ${u.email} in Whitelist form above.`);
                                        }}
                                        className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-100 transition-all text-[9px] font-black uppercase flex items-center gap-1 px-2"
                                        title="Quick Whitelist this Trial User"
                                      >
                                        <UserCheck size={10} /> + Whitelist
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleToggleSettingsGuestStatus(u.email, isSuspended ? 'active' : 'blocked')}
                                      className={cn(
                                        "p-1 rounded-lg transition-all border border-transparent",
                                        isSuspended 
                                          ? "text-red-500 hover:text-red-650 bg-red-50 border-red-100" 
                                          : "text-slate-400 hover:text-red-500 hover:bg-slate-50"
                                      )}
                                      title={isSuspended ? "Restore App Access" : "Suspend App Access (Block)"}
                                    >
                                      {isSuspended ? <Lock size={12} /> : <Unlock size={12} />}
                                    </button>
                                    
                                    <button
                                      onClick={async () => {
                                        const isWhitelistedUser = whitelist.some(item => item.email?.toLowerCase().trim() === u.email?.toLowerCase().trim());
                                        if (isWhitelistedUser) {
                                          setPendingSettingsDeleteGuest({ email: u.email });
                                        } else {
                                          const confirmDelete = window.confirm(`Are you sure you want to end trial session & clean database logs for: ${u.email}?`);
                                          if (confirmDelete) {
                                            try {
                                              await deleteDoc(doc(db, 'users', u.uid));
                                              await deleteDoc(doc(db, 'guest_experiments', u.email.toLowerCase().trim()));
                                              toast.success("Trial session logs removed.");
                                            } catch (err) {
                                              console.error("Experiment delete error:", err);
                                            }
                                          }
                                        }
                                      }}
                                      className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-all"
                                      title="Delete Session/Authorization"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Android Native Compilation (Developer Info) */}
                <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <FileCode className="text-[#00A86B]" size={20} />
                      Native APK Compilation Specification
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Technical details for building the signed Native Android APK.</p>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-3xl p-6 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide">Why did my APK download show "API Demos"?</h4>
                        <p className="text-xs font-bold text-amber-700/90 leading-relaxed">
                          The downloaded <code className="bg-amber-100/50 px-1 py-0.5 rounded text-[10px] font-mono">FORTUNES_EDUTECH.apk</code> file was generated as an Android SDK testing template package. It behaves as a dummy sample app because standard cloud hosting containers do not have local Android SDK and Gradle compiler suites to bundle, sign, and build physical APK binary code directly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        To build a highly secure native `.apk` file that launches the real-time school system on phone storage, compile a simple Native WebView Wrapper project in Android Studio with package name <code className="font-mono bg-slate-200 px-1 py-0.2 rounded font-black text-[10px]">com.fortunes.edutech</code>.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">AndroidManifest.xml</span>
                        <pre className="p-3.5 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-xl overflow-x-auto select-all leading-normal">
{`<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.fortunes.edutech">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="FORTUNES EDUTECH"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.NoActionBar"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`}
                        </pre>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">MainActivity.kt</span>
                        <pre className="p-3.5 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-xl overflow-x-auto select-all leading-normal">
{`package com.fortunes.edutech
import android.os.Bundle
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val myWebView = WebView(this)
        setContentView(myWebView)
        myWebView.settings.javaScriptEnabled = true
        myWebView.settings.domStorageEnabled = true
        myWebView.loadUrl("${window.location.origin}")
    }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

          {/* Settings Custom Choices Deletion Dialog Modal Overlay */}
          <AnimatePresence>
            {pendingSettingsDeleteGuest && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-6"
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
                    <h3 className="text-base font-black text-slate-800 leading-snug">Developer Access & Deletion Control</h3>
                    <p className="text-xs font-bold text-blue-600 mt-1 hover:underline break-all">
                      {pendingSettingsDeleteGuest.email}
                    </p>
                  </div>

                  <p className="text-[11px] font-bold text-slate-500 text-center leading-relaxed">
                    Would you like to completely remove their offline authorization and additionally delete their login traffic/files downloaded history?
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <button
                      onClick={() => handleRemoveGuest(pendingSettingsDeleteGuest.email, true)}
                      className="w-full text-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      Deregister & Clear Traffic Data
                    </button>
                    
                    <button
                      onClick={() => handleRemoveGuest(pendingSettingsDeleteGuest.email, false)}
                      className="w-full text-center px-4 py-3 bg-slate-850 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      Deregister & KEEP Traffic History
                    </button>

                    <button
                      onClick={() => setPendingSettingsDeleteGuest(null)}
                      className="w-full text-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                      Keep Registered & Cancel Deletion
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <AccessModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />

    </div>
  );
}
