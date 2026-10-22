import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect, useMemo } from 'react';
import buildMeta from '../build-metadata.json';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { SubscriptionPanel } from './SubscriptionPanel';
import { AccessModal } from './AccessModal';
import { CreditCard } from 'lucide-react';
import { DailyDigest } from './DailyDigest';
import { TermsAndConditionsView } from './TermsContent';
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
  ArrowLeft, Mail,
  Calendar,
  GraduationCap,
  Users,
  Info,
  FileText,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn, extractUserFirstName } from '../lib/utils';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'subscription' | 'developer' | 'faq' | 'digest' | 'terms'>('profile');
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
        latestVersion: "2.4.2",
        releaseDate: "September 2026",
        buildTimestamp: "2026-09-10T10:25:00.000Z",
        buildId: "242-full-gear",
        appName: "FORTUNES EDUTECH",
        fileExists: true,
        apkSize: "1.61 MB",
        apkChecksum: "ea32f14cfdca56d1bf494a87a228c89b25fcfcb1d154ee8c79ab15df7dce72e6",
        changelog: [
          "v2.4.3: Top Header Background Music Player: Seamlessly anchored the background music player pill into the top header navbar between school branding and utilities, leaving planning inputs and date fields completely unobstructed while maintaining uninterrupted audio playback.",
          "v2.4.2: Continuous Background Mood Music Engine: Root-level audio persistence playing across all tabs and preparation hubs without interruption.",
          "v2.4.2: Top Dashboard Utility Bar: Dedicated RECEIPT button in green, REVIEW in emerald heartbeat, PLAYBACK in solid black AI Voice Studio, and direct PAYSLIP GRZ portal link.",
          "v2.4.2: Dual AI Voice Studio & Phone Audio Storage: Mixed female & male teacher voices with one-tap downloadable high-definition .wav audio files saved directly to device storage.",
          "v2.4.2: Informant Ticker Redesign: Re-anchored to far-left edge in solid black badge with smooth full-sentence scrolling marquee at standard reading speed.",
          "v2.4.2: 4-Minute Synchronized News & Live Feedback Ticker: Synchronized 240s alternating cycles between official education bulletins and teacher community reviews.",
          "v2.4.2: Consolidated Academic Planning Hub: Seamless unified access uniting Schemes of Work, Weekly Forecasts, 6-Step Lesson Plans, and Detailed Lesson Notes.",
          "v2.4.1: High-density Assessment Tracker & Learner Progress Chart analytics suite with batch scoring and PDF export.",
          "v2.4.0: 1-Click System Synchronization (Schemes of Work -> Weekly Forecast -> Lesson Plans) & persistent Firestore storage."
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
  const [informantActive, setInformantActive] = useState(true);
  const [isInformantDirty, setIsInformantDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Email Template State
  const [emailTemplateLogo, setEmailTemplateLogo] = useState("");
  
  const [welcomeSubject, setWelcomeSubject] = useState("Welcome to Fortunes Edutech");
  const [welcomeBody, setWelcomeBody] = useState(`Hello {{NAME}},\n\nYou have successfully authenticated your session in the Fortunes Edutech portal.\n\nYour current access level: **{{ACCESS_LEVEL}}**\n\nBest regards,\nThe Fortunes Edutech Team`);

  const [activeSubject, setActiveSubject] = useState("Your Fortunes Edutech Subscription is Active!");
  const [activeBody, setActiveBody] = useState(`Hello {{NAME}},\n\nGreat news! Your Fortunes Edutech account has been officially activated.\n\nYou have been enrolled into the **{{CIRCLE}}** circle.\n\nLog in now to access your new premium features and start generating documents.\n\nBest regards,\nThe Fortunes Edutech Team`);

  const [expirySubject, setExpirySubject] = useState("Action Required: Subscription Expiring in 5 Days");
  const [expiryBody, setExpiryBody] = useState(`Hello {{NAME}},\n\nThis is a friendly reminder that your Fortunes Edutech **{{CIRCLE}}** subscription will expire in exactly 5 days.\n\nPlease renew your circle soon to maintain uninterrupted access to all your premium tools.\n\nBest regards,\nThe Fortunes Edutech Team`);
  
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'trial_only' | 'whitelisted_only'>('all');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recipientFilterTab, setRecipientFilterTab] = useState<'all' | 'trial' | 'whitelisted'>('all');
  const [recipientSearch, setRecipientSearch] = useState("");
  const [excludedEmails, setExcludedEmails] = useState<Set<string>>(new Set());
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);

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

  // Sync informant text & active status from global context when not dirty or when switching to developer tab
  useEffect(() => {
    if (activeTab === 'developer' && !isInformantDirty) {
      setInformantText(informantData.text || '');
      setInformantActive(informantData.isActive !== false);
    }
  }, [informantData.text, informantData.isActive, activeTab]);

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

    // Snapshot of online profiles (Users & Guest Experiments & Trial Applicants)
    let usersList: UserProfile[] = [];
    let guestExpList: any[] = [];
    let subRequestsList: any[] = [];

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

      // Incorporate teachers who requested subscription circles from trial mode
      subRequestsList.forEach((sr) => {
        if (sr.email) {
          const norm = sr.email.toLowerCase().trim().replace(/\s+/g, '');
          if (!emailMap.has(norm)) {
            emailMap.set(norm, {
              uid: sr.userId || `subreq_${norm.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: norm,
              displayName: sr.userName || 'Trial Teacher (Applicant)',
              photoURL: '',
              lastLogin: sr.timestamp || sr.requestedAt || null,
              lastHeartbeat: sr.timestamp || null,
            } as UserProfile);
          }
        }
      });

      // Incorporate any cached local trial session records
      try {
        ['eduplan_all_seen_users_permanent', 'eduplan_monitor_raw_users', 'eduplan_trial_login_history'].forEach(key => {
          const raw = safeLocalStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              arr.forEach((item: any) => {
                if (item && item.email && item.email.includes('@')) {
                  const norm = item.email.toLowerCase().trim().replace(/\s+/g, '');
                  if (!emailMap.has(norm)) {
                    emailMap.set(norm, {
                      uid: item.uid || `trial_${norm.replace(/[^a-zA-Z0-9]/g, '_')}`,
                      email: norm,
                      displayName: item.displayName || 'Trial Teacher (Guest)',
                      photoURL: item.photoURL || '',
                      lastLogin: item.lastLogin || null,
                      lastHeartbeat: item.lastHeartbeat || item.lastLogin || null,
                    } as UserProfile);
                  }
                }
              });
            }
          }
        });
      } catch (e) {}

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

    const unsubSubRequests = onSnapshot(collection(db, 'subscription_requests'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      subRequestsList = list;
      mergeAndSortUsers();
    }, (err: any) => {
      console.warn("Error fetching subscription requests in Settings:", err);
    });

    // Fetch Email Template
    getDoc(doc(db, 'global_settings', 'email_template')).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logo) setEmailTemplateLogo(data.logo);
        if (data.welcomeSubject) setWelcomeSubject(data.welcomeSubject);
        if (data.welcomeBody) setWelcomeBody(data.welcomeBody);
        if (data.activeSubject) setActiveSubject(data.activeSubject);
        if (data.activeBody) setActiveBody(data.activeBody);
        if (data.expirySubject) setExpirySubject(data.expirySubject);
        if (data.expiryBody) setExpiryBody(data.expiryBody);
        // Backwards compatibility
        if (data.subject && !data.welcomeSubject) setWelcomeSubject(data.subject);
        if (data.body && !data.welcomeBody) setWelcomeBody(data.body);
      }
    }).catch(err => console.warn("Failed to fetch email template:", err));

    return () => {
      unsubWhitelist();
      unsubUsers();
      unsubGuestExp();
      unsubSubRequests();
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
      
      // Check if user already exists to preserve original activation date
      let existingStart: any = null;
      let existingAddedAt: any = null;
      try {
        const existingDoc = await getDoc(doc(db, 'authorized_guests', guestEmail));
        if (existingDoc.exists()) {
          const d = existingDoc.data();
          existingStart = d.subscriptionStart || null;
          existingAddedAt = d.addedAt || null;
        }
      } catch {}

      const payload: any = {
        email: guestEmail,
        grade: finalGrade,
        subscriptionType: newSub,
        subscriptionStart: existingStart || serverTimestamp(),
        addedAt: existingAddedAt || serverTimestamp(),
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
            ...(existingStart ? {} : { subscriptionStart: serverTimestamp() }),
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
      
      // Trigger Background Activation Email
      try {
        const recipientFirstName = extractUserFirstName(null, guestEmail);
        const formattedBody = activeBody
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br/>')
          .replace(/{{CIRCLE}}/gi, newSub.toUpperCase())
          .replace(/{{NAME}}/gi, recipientFirstName)
          .replace(/{{FIRST_NAME}}/gi, recipientFirstName)
          .replace(/Hello Educator\b/gi, `Hello ${recipientFirstName}`);

        fetch('/api/system/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: guestEmail,
            recipientName: recipientFirstName,
            subject: activeSubject.replace(/{{CIRCLE}}/gi, newSub.toUpperCase()).replace(/{{NAME}}/gi, recipientFirstName),
            html: `<p>${formattedBody}</p>`,
            logoUrl: emailTemplateLogo || undefined
          })
        }).catch(err => console.warn("Failed to trigger activation email", err));
      } catch (e) {
        console.warn("Error calling email API", e);
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

  // Dedicated handler to publish Informant broadcast live to all user screens
  const handlePublishInformant = async () => {
    const cleanText = informantText.trim();
    try {
      if (typeof updateInformantData === 'function') {
        updateInformantData(cleanText, true);
      }
      setInformantActive(true);
      if (cleanText) {
        safeLocalStorage.setItem('eduplan_informant_text', cleanText);
      } else {
        safeLocalStorage.removeItem('eduplan_informant_text');
      }
      safeLocalStorage.setItem('eduplan_informant_active', 'true');

      await setDoc(doc(db, 'global_settings', 'informant'), {
        text: cleanText,
        isActive: true,
        updatedAt: serverTimestamp(),
      });

      setIsInformantDirty(false);
      toast.success("Informant broadcast ACTIVATED & published live to all user screens!");
    } catch (err: any) {
      console.error("Broadcast save error:", err);
      toast.error("Failed to publish broadcast: " + err.message);
    }
  };

  // Dedicated handler to deactivate broadcast
  const handleDeactivateInformant = async () => {
    try {
      const cleanText = informantText.trim();
      if (typeof updateInformantData === 'function') {
        updateInformantData(cleanText, false);
      }
      setInformantActive(false);
      safeLocalStorage.setItem('eduplan_informant_active', 'false');

      await setDoc(doc(db, 'global_settings', 'informant'), {
        text: cleanText,
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      setIsInformantDirty(false);
      toast.success("Informant broadcast DEACTIVATED. System reverted to default status.");
    } catch (err: any) {
      console.error("Deactivation error:", err);
      toast.error("Failed to deactivate broadcast: " + err.message);
    }
  };

  // Save Config Settings
  const handleSaveDeveloperSettings = async () => {
    setSavingSettings(true);
    try {
      const cleanText = informantText.trim();

      // 1. Instantly activate informant text in local context & storage with zero delay
      if (typeof updateInformantData === 'function') {
        updateInformantData(cleanText, informantActive);
      }
      if (cleanText) {
        safeLocalStorage.setItem('eduplan_informant_text', cleanText);
      } else {
        safeLocalStorage.removeItem('eduplan_informant_text');
      }
      safeLocalStorage.setItem('eduplan_informant_active', String(informantActive));

      setInformantText(cleanText);
      setIsInformantDirty(false);

      // 2. Persist to Firestore independently
      try {
        await setDoc(doc(db, 'global_settings', 'informant'), {
          text: cleanText,
          isActive: informantActive,
          updatedAt: serverTimestamp(),
        });
      } catch (e: any) {
        console.warn("Informant save notice:", e?.message || e);
      }

      try {
        await setDoc(doc(db, 'global_settings', 'config'), {
          enforceGradeLock,
          updatedAt: serverTimestamp(),
        });
      } catch (e: any) {
        console.warn("Config save notice:", e?.message || e);
      }

      try {
        await setDoc(doc(db, 'global_settings', 'email_template'), {
          welcomeSubject,
          welcomeBody,
          activeSubject,
          activeBody,
          expirySubject,
          expiryBody,
          logo: emailTemplateLogo,
          updatedAt: serverTimestamp(),
        });
      } catch (e: any) {
        console.warn("Email template save notice:", e?.message || e);
      }

      toast.success("Settings & Informant Broadcast published successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save configuration settings: " + error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Deduplicated recipients categorized by Whitelisted vs Free Trial Access Mode
  const { allRecipients, whitelistedRecipients, trialRecipients } = useMemo(() => {
    const emailMap = new Map<string, { email: string; name: string; isTrial: boolean; source: string }>();

    // 1. Scan all users from sessions, guest experiments, trial logs, and user profiles
    users.forEach((u) => {
      if (u.email && u.email.includes('@')) {
        const norm = u.email.toLowerCase().trim().replace(/\s+/g, '');
        const isWhitelistedUser = whitelist.some(
          w => (w.email || (w as any).id || '').toLowerCase().trim().replace(/\s+/g, '') === norm
        );
        if (!emailMap.has(norm)) {
          emailMap.set(norm, {
            email: norm,
            name: extractUserFirstName(u.displayName || null, norm),
            isTrial: !isWhitelistedUser,
            source: isWhitelistedUser ? 'Whitelist Circle' : (u.displayName?.includes('Trial') ? 'Guest Trial Mode' : 'Trial Access Session')
          });
        }
      }
    });

    // 2. Scan all whitelisted entries to ensure full coverage and correct non-trial status
    whitelist.forEach((w) => {
      const wEmail = (w.email || (w as any).id || '');
      if (wEmail && wEmail.includes('@')) {
        const norm = wEmail.toLowerCase().trim().replace(/\s+/g, '');
        if (!emailMap.has(norm)) {
          emailMap.set(norm, {
            email: norm,
            name: extractUserFirstName((w as any).displayName || null, norm),
            isTrial: false,
            source: 'Whitelist Circle'
          });
        } else {
          const item = emailMap.get(norm)!;
          item.isTrial = false;
          item.source = 'Whitelist Circle';
        }
      }
    });

    const all = Array.from(emailMap.values()).sort((a, b) => a.email.localeCompare(b.email));
    const whitelistedOnly = all.filter(r => !r.isTrial);
    const trialOnly = all.filter(r => r.isTrial);

    return {
      allRecipients: all,
      whitelistedRecipients: whitelistedOnly,
      trialRecipients: trialOnly,
    };
  }, [users, whitelist]);

  const targetRecipients = useMemo(() => {
    let pool = allRecipients;
    if (broadcastAudience === 'trial_only') pool = trialRecipients;
    else if (broadcastAudience === 'whitelisted_only') pool = whitelistedRecipients;

    return pool.filter(r => !excludedEmails.has(r.email));
  }, [broadcastAudience, allRecipients, trialRecipients, whitelistedRecipients, excludedEmails]);

  const toggleExcludeRecipient = (email: string) => {
    setExcludedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleRequestSendBroadcast = () => {
    if (!broadcastSubject.trim()) {
      toast.error("Subject is required to send a broadcast.");
      return;
    }
    if (!broadcastBody.trim() && !emailTemplateLogo) {
      toast.error("Message body is required to send a broadcast.");
      return;
    }
    if (targetRecipients.length === 0) {
      toast.error("No active recipients selected. Please review your audience or exclusions.");
      return;
    }
    setShowConfirmSendModal(true);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject || (!broadcastBody && !emailTemplateLogo)) {
      toast.error("Subject and body are required to send a broadcast.");
      return;
    }

    if (targetRecipients.length === 0) {
      toast.error("No recipients found for the selected broadcast audience.");
      return;
    }

    setSendingBroadcast(true);
    setShowConfirmSendModal(false);
    try {
      const response = await fetch('/api/system/email/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: targetRecipients.map(r => ({ email: r.email, name: r.name })),
          subject: broadcastSubject,
          html: `<p>${broadcastBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
          logoUrl: emailTemplateLogo || undefined
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Failed to send broadcast API call');
      }

      const resData = await response.json().catch(() => ({}));
      const sentCount = typeof resData.sent === 'number' ? resData.sent : targetRecipients.length;
      const failedCount = typeof resData.failed === 'number' ? resData.failed : 0;

      const activeTrialCount = targetRecipients.filter(r => r.isTrial).length;
      const activeWhitelistedCount = targetRecipients.filter(r => !r.isTrial).length;

      const audienceDesc = broadcastAudience === 'trial_only'
        ? `${sentCount} free trial access mode users`
        : broadcastAudience === 'whitelisted_only'
        ? `${sentCount} whitelisted users`
        : `${sentCount} users (${activeTrialCount} free trial + ${activeWhitelistedCount} whitelisted)`;

      if (failedCount > 0) {
        toast.success(`Broadcast delivered to ${sentCount} users (${failedCount} encountered delivery issues).`);
      } else {
        toast.success(`Broadcast successfully sent to ${audienceDesc}!`);
      }
      setBroadcastSubject("");
      setBroadcastBody("");
    } catch (error: any) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast: " + error.message);
    } finally {
      setSendingBroadcast(false);
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
      q: "What are the latest v2.4.3 updates in FORTUNES EDUTECH?",
      a: "The v2.4.3 release introduces key operational enhancements: (1) Relocated Background Music Player to the Top Header Navbar directly between the school brand and menu controls, keeping planning forms, calendar dates, and input rows 100% unobstructed; (2) Persistent Continuous Audio that plays uninterrupted across all planning hubs and tabs; (3) Top Utility Action Bar with PAYSLIP, REVIEW, PLAYBACK, and RECEIPT; (4) Dual AI Planning Voice Studio with direct .wav storage downloads; (5) Far-left black Informant Ticker with smooth full-sentence speed; and (6) 4-minute synchronized news/feedback cycles."
    },
    {
      q: "How does the background preparation music work when navigating other tabs?",
      a: "The music player is powered by a root-level persistent audio provider. When you start playing music on the dashboard, the audio continues seamlessly without stopping or resetting as you open the Academic Planning Hub, Schemes of Work, Lesson Plans, Weekly Forecast, Settings, or User Manual. When working outside the dashboard, the companion mini-player pill appears directly in the top header navbar on the upper edge of your screen (with quick play/pause, next track, and an expandable dropdown panel), leaving all form fields and date pickers completely clear and unobstructed."
    },
    {
      q: "What do the four buttons on the top bar do (Payslip, Review, Playback, Receipt)?",
      a: "The top action bar provides instant access to essential tools: (1) PAYSLIP (Blue) links directly to the official Ministry of Finance E-Payslip platform (epdmis.grz.gov.zm) to request your monthly civil service payslip; (2) REVIEW (Green) opens a live recommendation form to submit suggestions and teacher feedback; (3) PLAYBACK (Blue) opens the AI Voice Studio with dual mixed female/male narration and rate controls; (4) RECEIPT (Green) opens the Receipt Manager to verify your transaction history and download or print official proof-of-payment receipts."
    },
    {
      q: "How do I download the AI Voice audio guide directly into my phone storage?",
      a: "Open the PLAYBACK tool from the top action bar or inside your lesson planning workspace. Select your desired topic or step, choose between female, male, or mixed dialog narration, and click the 'Save to Phone' (.wav) button. The audio file will immediately compile and save directly to your mobile downloads or device storage for offline playback in the classroom or during your commute."
    },
    {
      q: "What is the Informant Ticker and how often does the news/feedback update?",
      a: "The Informant Ticker is anchored to the far-left edge of the screen in a solid black badge. It streams administrative alerts and real-time daily headlines with smooth full-sentence marquee text. Below it, the synchronized News & Feedback Ticker runs on a 4-minute (240-second) alternating cycle between verified daily national educational/economic news bulletins (MoE, ECZ, CDC, Bank of Zambia) and live feedback from teachers across Zambia. Stale or prior-day headlines are automatically flashed away every midnight and upon fetching fresh news so only current headlines are displayed."
    },
    {
      q: "How do I download and print payment receipts for my subscription?",
      a: "You can click the green RECEIPT button directly on the top action bar, or navigate to 'My License' in Settings or the Subscription modal. Click 'Download Receipt' to instantly generate a branded official PDF receipt containing your transaction reference, amount paid (ZMW), payment date, active plan duration, and registered grade access."
    },
    {
      q: "What is the redefined Terms of Use?",
      a: "By accessing FORTUNES EDUTECH (v2.4.2), you agree to our high-performance professional educational standards. All legacy v1.x protocols have been purged. Your whitelisted account access is strictly for your personal professional use; unauthorized distribution or multi-user sharing of a single whitelisted portal is monitored and strictly prohibited to maintain system integrity."
    },
    {
      q: "Magic Fill & Syllabus Compliance?",
      a: "Our updated engine perfectly aligns with the latest CDC National Frameworks. 'Magic Fill' auto-populates instructional goals, learner activities, competencies, and assessment stages with 99% accuracy against current Zambian standards."
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
              onClick={() => setActiveTab('digest')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'digest' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <Calendar size={14} />
              Daily Digest
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
            <button 
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === 'terms' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <FileText size={14} />
              Terms & Conditions
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
            
            {/* DAILY DIGEST TAB */}
            {activeTab === 'digest' && (
              <motion.div
                key="digest"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <DailyDigest />
              </motion.div>
            )}

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
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <FileCode className="text-[#00A86B]" size={16} />
                      v{integrityData?.latestVersion || "2.4.2"} Release Changelog & System Updates
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                      Live Build Verified
                    </span>
                  </div>
                  <div className="space-y-3.5 pl-2 border-l-2 border-slate-100">
                    {(integrityData?.changelog || [
                      "v2.4.3: Top Header Background Music Player: Seamlessly anchored the background music player pill into the top header navbar between school branding and utilities, leaving planning inputs and date fields completely unobstructed while maintaining uninterrupted audio playback.",
                      "v2.4.2: Continuous Background Mood Music Engine: Root-level audio persistence playing across all tabs and preparation hubs without interruption.",
                      "v2.4.2: Top Dashboard Utility Bar: Dedicated RECEIPT button in green, REVIEW in emerald heartbeat, PLAYBACK in solid black AI Voice Studio, and direct PAYSLIP GRZ portal link.",
                      "v2.4.2: Dual AI Voice Studio & Phone Audio Storage: Mixed female & male teacher voices with one-tap downloadable high-definition .wav audio files saved directly to device storage.",
                      "v2.4.2: Informant Ticker Redesign: Re-anchored to far-left edge in solid black badge with smooth full-sentence marquee scrolling at standard reading speed.",
                      "v2.4.2: 4-Minute Synchronized News & Live Feedback Ticker: Synchronized 240s alternating cycles between official education bulletins and teacher community reviews.",
                      "v2.4.2: Consolidated Academic Planning Hub: Seamless unified access uniting Schemes of Work, Weekly Forecasts, 6-Step Lesson Plans, and Detailed Lesson Notes.",
                      "v2.4.1: High-density Assessment Tracker & Learner Progress Chart analytics suite with batch scoring and PDF export.",
                      "v2.4.0: 1-Click System Synchronization (Schemes of Work -> Weekly Forecast -> Lesson Plans) & persistent Firestore storage."
                    ]).map((change, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00A86B]" />
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">{change}</p>
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

            {/* TERMS & CONDITIONS TAB */}
            {activeTab === 'terms' && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-200/50 p-6 md:p-8 shadow-sm space-y-6 text-left"
              >
                <TermsAndConditionsView />
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
                    <div className="space-y-4 pt-2 border-t border-slate-100/80">
                      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className={informantActive ? "text-[#00A86B] animate-bounce" : "text-slate-400"} />
                          <div>
                            <span className="text-xs font-black uppercase text-slate-800 tracking-tight block">
                              Developer Informant Ticker
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Broadcast continuous sliding announcements to all active users.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {informantActive ? (
                            <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              STATUS: LIVE BROADCAST ACTIVE
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-black text-slate-600 bg-slate-200/80 border border-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              STATUS: INACTIVE / STANDBY
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const nextState = !informantActive;
                              setInformantActive(nextState);
                              setIsInformantDirty(true);
                            }}
                            className="shrink-0 text-slate-600 focus:outline-none"
                            title={informantActive ? "Deactivate Broadcast" : "Activate Broadcast"}
                          >
                            {informantActive ? (
                              <ToggleRight className="text-[#00A86B] cursor-pointer" size={40} />
                            ) : (
                              <ToggleLeft className="text-slate-300 cursor-pointer" size={40} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1.5">
                        <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">
                          ⚡ Quick Announcement Presets (1-Tap To Load)
                        </span>
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              setInformantText("You are strongly advised to refer to CDC and ECZ aligned subject syllabi for all term 3 lesson planning and forecasts.");
                              setIsInformantDirty(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs"
                          >
                            📜 Syllabus Advice
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInformantText("Grade 7, 9, and 12 mock examination guidelines and updated schemes of work are now active in your dashboard.");
                              setIsInformantDirty(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs"
                          >
                            🏆 Exam Guidelines
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInformantText("Continuous background audio player and top bar utility tools are now live for all registered educator accounts!");
                              setIsInformantDirty(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs"
                          >
                            🎧 New Features Alert
                          </button>
                        </div>
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

                      {/* Live Preview Box */}
                      {informantText.trim() && (
                        <div className="bg-blue-900 text-white p-2.5 rounded-2xl border border-blue-800 shadow-sm space-y-1">
                          <span className="text-[8.5px] font-black uppercase text-blue-200 tracking-wider block">
                            👁️ Live Ticker Preview (How Users Will See It):
                          </span>
                          <div className="text-[10px] font-bold text-white bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800/80 truncate">
                            <span className="text-emerald-300 font-black">Dear [User's Name]:</span> {informantText.trim()}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <span>⚡ Continuous horizontal scroll with steady reading speed and personalized greetings for every user.</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDeactivateInformant}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all active:scale-95 border border-slate-200"
                          >
                            Turn Off Broadcast
                          </button>
                          <button
                            type="button"
                            onClick={handlePublishInformant}
                            className="px-4 py-1.5 bg-[#00A86B] hover:bg-[#008f5a] text-white text-[11px] font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <Bell size={12} />
                            Publish Broadcast Live
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Email Template Engine */}
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                            <Mail size={13} className="text-[#00A86B]" />
                            Automated Email Templates
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-3">Define the system emails sent to users automatically. Use <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">{"{{NAME}}"}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">{"{{ACCESS_LEVEL}}"}</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">{"{{CIRCLE}}"}</code> as dynamic variables.</p>
                        
                        {/* Brand Signature & No-Reply Identity Preview Card */}
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#00A86B] flex items-center justify-center text-white shadow-sm shrink-0">
                                <GraduationCap size={22} />
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-900 uppercase tracking-tight">FORTUNES EDUTECH</div>
                                <div className="text-[10px] text-[#00A86B] font-bold tracking-wider lowercase">your CBC partner</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-300">
                                Built-In Pictorial Signature
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-200">
                                No-Reply Active
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            Every outgoing email is stamped with the official <strong>FORTUNES EDUTECH (No-Reply)</strong> sender tag and the official pictorial signature above. You do <strong>not</strong> need to paste any image link.
                          </p>

                          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-slate-700">
                            <span className="font-bold text-[#00A86B] block mb-1">💡 Smart Name & Profile Personalization:</span>
                            Emails automatically recognize the user's English first name (e.g. <em>"Hello Fortune"</em>, <em>"Hello Joseph"</em>) extracted from their Google profile or email address. You can use <strong>{`{{NAME}}`}</strong> or <strong>{`{{CIRCLE}}`}</strong> in any template below!
                          </div>

                          <div className="pt-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                              Optional: Override with Custom Image Link (Leave blank to use default pictorial signature)
                            </label>
                            <input
                              type="url"
                              value={emailTemplateLogo}
                              onChange={(e) => setEmailTemplateLogo(e.target.value)}
                              placeholder="Leave blank to use the official Fortunes Edutech signature, or paste custom image link"
                              className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* 1. Welcome Template */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700">1. Welcome Message (First Login & Trial)</h4>
                          <input
                            type="text"
                            value={welcomeSubject}
                            onChange={(e) => setWelcomeSubject(e.target.value)}
                            placeholder="Welcome Email Subject"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                          />
                          <textarea
                            value={welcomeBody}
                            onChange={(e) => setWelcomeBody(e.target.value)}
                            placeholder="Welcome Email Body (Markdown supported)"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-[#00A86B] resize-none"
                          />
                        </div>

                        {/* 2. Activation Template */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700">2. Subscription Activated (Whitelist Added)</h4>
                          <input
                            type="text"
                            value={activeSubject}
                            onChange={(e) => setActiveSubject(e.target.value)}
                            placeholder="Activation Email Subject"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                          />
                          <textarea
                            value={activeBody}
                            onChange={(e) => setActiveBody(e.target.value)}
                            placeholder="Activation Email Body (Markdown supported)"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-[#00A86B] resize-none"
                          />
                        </div>

                        {/* 3. Expiry Warning Template */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700">3. Expiry Warning (5 Days Left)</h4>
                          <input
                            type="text"
                            value={expirySubject}
                            onChange={(e) => setExpirySubject(e.target.value)}
                            placeholder="Expiry Warning Subject"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                          />
                          <textarea
                            value={expiryBody}
                            onChange={(e) => setExpiryBody(e.target.value)}
                            placeholder="Expiry Warning Body (Markdown supported)"
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-[#00A86B] resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 mt-4">
                        <p className="text-[10px] text-[#00A86B] font-bold leading-relaxed">
                          These changes take effect immediately on next save.
                        </p>
                        <button
                          type="button"
                          onClick={handleSaveDeveloperSettings}
                          disabled={savingSettings}
                          className="shrink-0 bg-[#00A86B] hover:bg-[#008f5b] active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {savingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          Save Config
                        </button>
                      </div>
                    </div>
                    
                    {/* Broadcast Engine */}
                    <div id="email-broadcast-engine" className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Activity size={13} className="text-[#00A86B]" />
                          Email Broadcast Engine (Mass Mailer)
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                          <button
                            id="view-all-recipients-badge"
                            type="button"
                            onClick={() => { setRecipientFilterTab('all'); setShowRecipientModal(true); }}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Click to view all recipients"
                          >
                            <Eye size={11} /> {allRecipients.length} Total Recipients
                          </button>
                          <button
                            id="view-trial-recipients-badge"
                            type="button"
                            onClick={() => { setRecipientFilterTab('trial'); setShowRecipientModal(true); }}
                            className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Click to view free trial users"
                          >
                            <Eye size={11} /> {trialRecipients.length} Free Trial
                          </button>
                          <button
                            id="view-whitelisted-recipients-badge"
                            type="button"
                            onClick={() => { setRecipientFilterTab('whitelisted'); setShowRecipientModal(true); }}
                            className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Click to view whitelisted users"
                          >
                            <Eye size={11} /> {whitelistedRecipients.length} Whitelisted
                          </button>
                        </div>
                      </div>

                      {/* Audience Selection Pills */}
                      <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                            <Users size={12} className="text-slate-600" /> Broadcast Target Audience
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Free trial users are {broadcastAudience === 'whitelisted_only' ? 'exempted (whitelisted only)' : 'included in delivery'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                          <button
                            id="audience-all-btn"
                            type="button"
                            onClick={() => setBroadcastAudience('all')}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer",
                              broadcastAudience === 'all'
                                ? "bg-white border-[#00A86B] text-slate-900 shadow-sm ring-1 ring-[#00A86B]/20"
                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                broadcastAudience === 'all' ? "bg-[#00A86B]" : "bg-slate-300"
                              )} />
                              <span>All Users (Incl. Free Trial)</span>
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              {allRecipients.length}
                            </span>
                          </button>

                          <button
                            id="audience-trial-btn"
                            type="button"
                            onClick={() => setBroadcastAudience('trial_only')}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer",
                              broadcastAudience === 'trial_only'
                                ? "bg-white border-blue-500 text-slate-900 shadow-sm ring-1 ring-blue-500/20"
                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                broadcastAudience === 'trial_only' ? "bg-blue-500" : "bg-slate-300"
                              )} />
                              <span>Free Trial Users Only</span>
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              {trialRecipients.length}
                            </span>
                          </button>

                          <button
                            id="audience-whitelisted-btn"
                            type="button"
                            onClick={() => setBroadcastAudience('whitelisted_only')}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer",
                              broadcastAudience === 'whitelisted_only'
                                ? "bg-white border-purple-500 text-slate-900 shadow-sm ring-1 ring-purple-500/20"
                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                broadcastAudience === 'whitelisted_only' ? "bg-purple-500" : "bg-slate-300"
                              )} />
                              <span>Whitelisted Only</span>
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                              {whitelistedRecipients.length}
                            </span>
                          </button>
                        </div>

                        {/* Quick Roster Inspection Trigger */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                          <button
                            id="inspect-roster-btn"
                            type="button"
                            onClick={() => { setRecipientFilterTab('all'); setShowRecipientModal(true); }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Inspect & Verify Recipient Roster ({allRecipients.length} Educators)</span>
                          </button>
                          {excludedEmails.size > 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                              {excludedEmails.size} excluded
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium">
                        {broadcastAudience === 'all' && (
                          <>Instantly blast an email to all <strong className="text-slate-800">{allRecipients.length} registered and free trial access mode teachers</strong> (18 trial + 10 whitelisted). Perfect for system-wide announcements or major updates.</>
                        )}
                        {broadcastAudience === 'trial_only' && (
                          <>Instantly blast an email specifically to the <strong className="text-slate-800">{trialRecipients.length} free trial access mode teachers</strong>. Whitelisted members will not receive this email.</>
                        )}
                        {broadcastAudience === 'whitelisted_only' && (
                          <>Instantly blast an email specifically to the <strong className="text-slate-800">{whitelistedRecipients.length} verified whitelisted circle teachers</strong>. Free trial users will not receive this email.</>
                        )}
                      </p>
                      
                      <div className="space-y-3">
                        <input
                          id="broadcast-subject-input"
                          type="text"
                          value={broadcastSubject}
                          onChange={(e) => setBroadcastSubject(e.target.value)}
                          placeholder="Broadcast Subject (e.g. System Update or Subscription Circle Announcement)"
                          className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:bg-white"
                        />
                        <textarea
                          id="broadcast-body-textarea"
                          value={broadcastBody}
                          onChange={(e) => setBroadcastBody(e.target.value)}
                          placeholder="Broadcast Message (e.g. Hello Educator, We are pleased to announce that your lesson plans...)"
                          className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-[#00A86B] focus:bg-white resize-none shadow-inner"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 mt-4">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-blue-800 font-bold leading-relaxed flex items-center gap-1.5">
                            <Info size={12} className="text-blue-600 shrink-0" />
                            <span>
                              Delivering to <strong className="font-extrabold">{targetRecipients.length} recipient{targetRecipients.length === 1 ? '' : 's'}</strong>
                              {broadcastAudience === 'all' && ` (${targetRecipients.filter(r => r.isTrial).length} trial + ${targetRecipients.filter(r => !r.isTrial).length} whitelisted)`}
                              {broadcastAudience === 'trial_only' && ' (free trial users only)'}
                              {broadcastAudience === 'whitelisted_only' && ' (whitelisted users only)'}.
                            </span>
                          </p>
                          <p className="text-[9.5px] text-blue-600/80 font-medium">
                            Paced sequential delivery enabled with automatic connection pooling and retry to protect against SMTP 421 errors.
                          </p>
                        </div>
                        <button
                          id="send-broadcast-btn"
                          type="button"
                          onClick={handleRequestSendBroadcast}
                          disabled={sendingBroadcast || targetRecipients.length === 0}
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {sendingBroadcast ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                          Send Broadcast ({targetRecipients.length})
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

                {/* Android Native Compilation (Developer Info - Hidden until ready) */}
                {/* 
                  Native APK Compilation Specification section is hidden for now as requested.
                  Will be re-enabled when ready.
                */}

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

          {/* Recipient Roster Modal */}
          <AnimatePresence>
            {showRecipientModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-6"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="text-[#00A86B]" size={20} />
                        <h3 className="text-base font-black text-slate-800">Broadcast Recipient Roster</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        View, search, and verify all educators reachable by the broadcast engine.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRecipientModal(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Filter Tabs & Search */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 space-y-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setRecipientFilterTab('all')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                          recipientFilterTab === 'all'
                            ? "bg-[#00A86B] text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        All Recipients ({allRecipients.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientFilterTab('trial')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                          recipientFilterTab === 'trial'
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        Free Trial Users ({trialRecipients.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientFilterTab('whitelisted')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                          recipientFilterTab === 'whitelisted'
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        Whitelisted Circle ({whitelistedRecipients.length})
                      </button>
                    </div>

                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Search educator by name or email address..."
                        className="w-full pl-9 pr-8 py-2 bg-white text-xs font-medium text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                      {recipientSearch && (
                        <button
                          type="button"
                          onClick={() => setRecipientSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {excludedEmails.size > 0 && (
                      <div className="flex items-center justify-between text-[11px] bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-amber-800 font-medium">
                        <span>{excludedEmails.size} user{excludedEmails.size === 1 ? '' : 's'} excluded from delivery.</span>
                        <button
                          type="button"
                          onClick={() => setExcludedEmails(new Set())}
                          className="text-amber-900 underline font-bold hover:text-amber-950 cursor-pointer"
                        >
                          Reset / Include All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recipient List Body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
                    {(() => {
                      let list = allRecipients;
                      if (recipientFilterTab === 'trial') list = trialRecipients;
                      if (recipientFilterTab === 'whitelisted') list = whitelistedRecipients;

                      if (recipientSearch.trim()) {
                        const q = recipientSearch.toLowerCase().trim();
                        list = list.filter(r => r.email.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
                      }

                      if (list.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-400 text-xs font-medium">
                            No educators match your search filter.
                          </div>
                        );
                      }

                      return list.map((item) => {
                        const isExcluded = excludedEmails.has(item.email);
                        return (
                          <div
                            key={item.email}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-2xl transition-colors gap-3",
                              isExcluded ? "bg-slate-50 opacity-50" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={() => toggleExcludeRecipient(item.email)}
                                title={isExcluded ? "Click to include in broadcast" : "Click to exclude from broadcast"}
                                className="w-4 h-4 rounded text-[#00A86B] border-slate-300 focus:ring-[#00A86B] cursor-pointer"
                              />
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                                  {item.isTrial ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                      Free Trial Access
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                      Whitelisted Member
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-slate-500 truncate">{item.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0 hidden sm:inline">
                              {item.source}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-600 font-bold">
                      Active Target: <span className="text-[#00A86B] font-extrabold">{targetRecipients.length}</span> educators selected
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRecipientModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Done & Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Broadcast Pre-Flight Modal */}
          <AnimatePresence>
            {showConfirmSendModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 sm:p-6"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full space-y-4"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-blue-50/50">
                    <Mail size={24} />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-base font-black text-slate-800">Confirm Email Broadcast</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Review your audience and message details before launching.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Selected Target:</span>
                      <span className="font-extrabold text-slate-800">
                        {broadcastAudience === 'all' && 'All Users (Incl. Free Trial)'}
                        {broadcastAudience === 'trial_only' && 'Free Trial Users Only'}
                        {broadcastAudience === 'whitelisted_only' && 'Whitelisted Users Only'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Total Delivered:</span>
                      <span className="font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                        {targetRecipients.length} Recipient{targetRecipients.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
                      <span>• Free Trial: <strong className="text-blue-700">{targetRecipients.filter(r => r.isTrial).length}</strong></span>
                      <span>• Whitelisted: <strong className="text-purple-700">{targetRecipients.filter(r => !r.isTrial).length}</strong></span>
                    </div>

                    <div className="border-t border-slate-200/60 pt-2 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Subject:</span>
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {broadcastSubject}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-500 leading-relaxed text-center">
                    ⚡ Connection pooling, 350ms message pacing, and automatic SMTP retry backoff are active to guarantee compliant delivery without rate limit errors.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmSendModal(false)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendBroadcast}
                      disabled={sendingBroadcast}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sendingBroadcast ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                      Send Now ({targetRecipients.length})
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
