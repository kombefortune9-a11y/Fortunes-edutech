import { safeLocalStorage } from "../lib/storage";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot, collection, query, where, getDocs, getCountFromServer, limit, Timestamp, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, recordActivity } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { ADMIN_EMAIL, SUBSCRIPTION_PLANS, isDeveloperEmail, DEVELOPER_EMAILS } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  registeredGrades: string[];
  isWhitelisted: boolean;
  userType: 'guest' | 'registered' | 'developer';
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  downloadRecords: any[];
  totalDownloads: number;
  circleDownloadsCount: number;
  refreshDownloads: () => Promise<void>;
  incrementLocalDownloads: (docType: string, grade: string, rawDoc: any) => void;
  subscriptionDetails: any;
  isQuotaExceeded: boolean;
  globalConfig: { enforceGradeLock: boolean };
  informantData: { text: string; updatedAt: any };
  updateInformantData: (text: string) => void;
  switchSubscriptionCircle: (newCircle: string) => Promise<boolean>;
  isLoggingIn: boolean;
  authError: string | null;
  refreshSubscription: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  registeredGrades: [],
  isWhitelisted: false,
  userType: 'guest',
  signInWithGoogle: async () => {},
  signInAsGuest: async () => false,
  logout: async () => {},
  downloadRecords: [],
  totalDownloads: 0,
  circleDownloadsCount: 0,
  refreshDownloads: async () => {},
  incrementLocalDownloads: () => {},
  subscriptionDetails: {
    subscriptionType: 'guest_trial',
    subscriptionStart: null,
    unlimitedDownloads: false,
    subscriptionEnd: null,
    isSubscriptionExpired: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    circleDownloadsLimit: 6,
    circleDownloadsCount: 0,
    isTrialMode: true,
    allowedTools: [],
  },
  isQuotaExceeded: false,
  globalConfig: { enforceGradeLock: true },
  informantData: { text: '', updatedAt: null },
  updateInformantData: () => {},
  switchSubscriptionCircle: async () => false,
  isLoggingIn: false,
  authError: null,
  refreshSubscription: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const checkIsQuotaError = (err: any): boolean => {
  if (!err) return false;
  const errStr = (err?.message || String(err)).toLowerCase();
  const errCode = (err?.code || '').toLowerCase();
  return (
    errStr.includes('quota') ||
    errStr.includes('exceeded') ||
    errStr.includes('limit') ||
    errStr.includes('exhausted') ||
    errCode === 'resource-exhausted' ||
    errStr.includes('assertion failed')
  );
};

export const getWhitelistedGuestFromLocalCache = (email: string) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim().replace(/\s+/g, '');
  if (!cleanEmail) return null;

  // Check sub cache first for accurate stored subscriptionStart
  let cachedSubStart: any = null;
  try {
    const subCache = safeLocalStorage.getItem(`eduplan_sub_cache_${cleanEmail}`);
    if (subCache) {
      const parsed = JSON.parse(subCache);
      const details = parsed?.details || parsed;
      if (details && details.subscriptionStart) {
        cachedSubStart = details.subscriptionStart;
      }
    }
  } catch (e) {}

  if (cleanEmail === ADMIN_EMAIL.toLowerCase().trim()) {
    return {
      email: cleanEmail,
      grade: 'all',
      subscriptionType: 'unlimited',
      amountPaid: 0,
      paymentMethod: 'Developer Master Key',
      subscriptionIndex: 1,
      status: 'active',
      subscriptionStart: cachedSubStart || new Date('2026-01-01T00:00:00.000Z'),
      addedAt: cachedSubStart || new Date('2026-01-01T00:00:00.000Z'),
      isWhitelisted: true
    };
  }

  if (cleanEmail === 'komfortune8@gmail.com') {
    return {
      email: cleanEmail,
      grade: 'all',
      subscriptionType: 'termly',
      amountPaid: 250,
      paymentMethod: 'MTN Mobile Money',
      subscriptionIndex: 1,
      status: 'active',
      subscriptionStart: cachedSubStart || new Date('2026-08-31T12:11:00.000Z'),
      addedAt: cachedSubStart || new Date('2026-08-31T12:11:00.000Z'),
      isWhitelisted: true
    };
  }

  const sources = [
    'eduplan_monitor_whitelist',
    'eduplan_whitelisted_guests',
    'eduplan_settings_whitelist'
  ];

  for (const src of sources) {
    try {
      const raw = safeLocalStorage.getItem(src);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const match = list.find((item: any) => {
          const itemEmail = (item.email || item.id || '').toLowerCase().trim().replace(/\s+/g, '');
          return itemEmail === cleanEmail;
        });
        if (match) {
          if (match.status === 'blocked') return { isBlocked: true };
          if (match.isWhitelisted === false || match.subscriptionType === 'guest_trial') {
            return null; // Explicitly trial/non-whitelisted
          }
          const subType = match.subscriptionType && match.subscriptionType in SUBSCRIPTION_PLANS
            ? match.subscriptionType
            : 'guest_trial';
          return {
            email: cleanEmail,
            grade: match.grade || match.teaching_grade || 'all',
            subscriptionType: subType,
            amountPaid: match.amountPaid !== undefined && match.amountPaid !== null ? Number(match.amountPaid) : (SUBSCRIPTION_PLANS[subType]?.price || 90),
            paymentMethod: match.paymentMethod || 'MTN Mobile Money',
            subscriptionIndex: match.subscriptionIndex !== undefined ? Number(match.subscriptionIndex) : 1,
            status: match.status || 'active',
            subscriptionStart: match.subscriptionStart || match.addedAt || cachedSubStart || new Date(),
            addedAt: match.addedAt || match.subscriptionStart || cachedSubStart || new Date(),
            isWhitelisted: true
          };
        }
      }
    } catch (e) {}
  }

  // Check sub cache
  try {
    const subCache = safeLocalStorage.getItem(`eduplan_sub_cache_${cleanEmail}`);
    if (subCache) {
      const parsed = JSON.parse(subCache);
      const details = parsed?.details || parsed;
      if (details && details.subscriptionType && details.subscriptionType !== 'guest_trial') {
        return {
          email: cleanEmail,
          grade: 'all',
          subscriptionType: details.subscriptionType,
          amountPaid: details.amountPaid || (SUBSCRIPTION_PLANS[details.subscriptionType]?.price || 90),
          paymentMethod: details.paymentMethod || 'MTN Mobile Money',
          subscriptionIndex: details.subscriptionIndex || 1,
          status: details.status || 'active',
          subscriptionStart: details.subscriptionStart || new Date(),
          addedAt: details.addedAt || details.subscriptionStart || new Date(),
          isWhitelisted: true
        };
      }
    }
  } catch (e) {}

  return null;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredGrades, setRegisteredGrades] = useState<string[]>([]);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);
  const [userType, setUserType] = useState<'guest' | 'registered' | 'developer'>('guest');
  const [downloadRecords, setDownloadRecords] = useState<any[]>([]);
  const [totalDownloads, setTotalDownloads] = useState<number>(0);
  const [circleDownloadsCount, setCircleDownloadsCount] = useState<number>(0);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [globalConfig, setGlobalConfig] = useState({ enforceGradeLock: true });
  const [informantData, setInformantData] = useState<{ text: string; updatedAt: any }>(() => {
    const cached = safeLocalStorage.getItem('eduplan_informant_text');
    return { text: cached || '', updatedAt: null };
  });

  const updateInformantData = (text: string) => {
    const clean = text.trim();
    setInformantData({ text: clean, updatedAt: new Date() });
    if (clean) {
      safeLocalStorage.setItem('eduplan_informant_text', clean);
    } else {
      safeLocalStorage.removeItem('eduplan_informant_text');
    }
  };

  const switchSubscriptionCircle = async (newCircle: string): Promise<boolean> => {
    toast.error("Circle switching is disabled by developer policy. Subscription circles are locked.");
    return false;
  };
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileSynced, setIsProfileSynced] = useState(false);

  const recordTrialLogin = (
    email: string,
    authProvider: string,
    userType: string,
    teachingGrade: string,
    displayName: string
  ) => {
    const cleanEmail = email.toLowerCase().trim().replace(/\s+/g, '');
    if (!cleanEmail) return;

    try {
      const historyStr = safeLocalStorage.getItem('eduplan_trial_login_history');
      let history: any[] = [];
      if (historyStr) {
        try {
          history = JSON.parse(historyStr);
          if (!Array.isArray(history)) history = [];
        } catch (e) {
          history = [];
        }
      }

      // Check if we already have this user's trial history, update or append
      const existingIndex = history.findIndex(h => h.email.toLowerCase().trim() === cleanEmail);
      const newRecord = {
        email: cleanEmail,
        authProvider,
        userType,
        teachingGrade,
        displayName,
        timestamp: new Date().toISOString(),
        synced: false
      };

      if (existingIndex >= 0) {
        newRecord.timestamp = history[existingIndex].timestamp || newRecord.timestamp;
        history[existingIndex] = { ...history[existingIndex], ...newRecord };
      } else {
        history.push(newRecord);
      }

      safeLocalStorage.setItem('eduplan_trial_login_history', JSON.stringify(history));
    } catch (err) {
      console.warn("Could not save trial login record locally:", err);
    }
  };

  const syncOfflineTrialHistory = async () => {
    try {
      const historyStr = safeLocalStorage.getItem('eduplan_trial_login_history');
      if (!historyStr) return;

      let history: any[] = JSON.parse(historyStr);
      if (!Array.isArray(history) || history.length === 0) return;

      let updated = false;
      for (let i = 0; i < history.length; i++) {
        const record = history[i];
        if (!record.synced) {
          try {
            // Attempt to write to guest_experiments
            if (record.userType === 'guest') {
              await setDoc(doc(db, 'guest_experiments', record.email), {
                email: record.email,
                auth_provider: record.authProvider,
                is_whitelisted: false,
                teaching_grade: record.teachingGrade || 'any',
                user_type: 'guest',
                lastLogin: serverTimestamp(),
                firstAccess: serverTimestamp()
              }, { merge: true });
            }

            // Also attempt to write to users collection to make sure they are in the traffic monitor
            const guestUid = `guest_${record.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
            await setDoc(doc(db, 'users', guestUid), {
              uid: guestUid,
              displayName: record.displayName || 'Teacher (Guest)',
              email: record.email,
              photoURL: null,
              lastLogin: serverTimestamp(),
              lastHeartbeat: serverTimestamp(),
              isGuest: true,
              auth_provider: record.authProvider,
              is_whitelisted: false,
              teaching_grade: record.teachingGrade || 'any',
              user_type: record.userType,
            }, { merge: true });

            record.synced = true;
            updated = true;
            console.log(`Successfully synced offline trial login for ${record.email} to Firestore.`);
          } catch (error) {
            if (checkIsQuotaError(error)) {
              console.warn("Quota exceeded during offline sync, keeping unsynced local history.", error);
              break; // Stop syncing since quota is exceeded
            } else {
              console.warn(`Failed to sync offline record for ${record.email}:`, error);
            }
          }
        }
      }

      if (updated) {
        safeLocalStorage.setItem('eduplan_trial_login_history', JSON.stringify(history));
      }
    } catch (err) {
      console.warn("Error running syncOfflineTrialHistory:", err);
    }
  };
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>({
    subscriptionType: 'guest_trial',
    subscriptionStart: null,
    unlimitedDownloads: false,
    subscriptionEnd: null,
    isSubscriptionExpired: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    circleDownloadsLimit: 6,
    circleDownloadsCount: 0,
    isTrialMode: true,
  });

  const calculateSubscription = (snapData: any, downloadsCount: number, gradeCounts: { [grade: string]: number } = {}) => {
    const cleanUserEmail = user?.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
    const isDev = isDeveloperEmail(cleanUserEmail);

    if (isDev) {
      const plan = SUBSCRIPTION_PLANS.unlimited;
      const devStart = snapData?.subscriptionStart?.toDate ? snapData.subscriptionStart.toDate() : (snapData?.subscriptionStart ? new Date(snapData.subscriptionStart) : new Date(2025, 0, 1));
      const devEnd = new Date(devStart.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
      return {
        ...plan,
        subscriptionType: 'unlimited',
        subscriptionStart: devStart,
        unlimitedDownloads: true,
        subscriptionEnd: devEnd,
        isSubscriptionExpired: false,
        isQuotaExhausted: false,
        daysRemaining: 9999,
        hoursRemaining: 99999,
        circleDownloadsLimit: 999999,
        circleDownloadsCount: downloadsCount,
        isTrialMode: false,
        allowedTools: ['all'],
        amountPaid: snapData?.amountPaid ?? 0,
        paymentMethod: snapData?.paymentMethod || 'Developer Master Key',
        subscriptionIndex: 1,
        baseLimit: 999999,
        isGradeSpecific: false,
        gradeCounts: {},
        gradesList: ['all'],
      };
    }

    const isExplicitBlocked = snapData?.status === 'blocked';
    const isExplicitWhitelisted = snapData?.isWhitelisted === true || 
                                  snapData?.is_whitelisted === true || 
                                  snapData?.status === 'active' || 
                                  snapData?.status === 'approved';

    const isWhitelistedUser = !!snapData && !isExplicitBlocked && (
      isExplicitWhitelisted || 
      (snapData.subscriptionType && snapData.subscriptionType !== 'guest_trial')
    );

    const isUnpaidOrTrial = !snapData || isExplicitBlocked || !isWhitelistedUser;

    if (isUnpaidOrTrial) {
      const plan = SUBSCRIPTION_PLANS.guest_trial;
      return {
        ...plan,
        subscriptionType: 'guest_trial',
        subscriptionStart: null,
        unlimitedDownloads: false,
        subscriptionEnd: null,
        isSubscriptionExpired: false,
        daysRemaining: 1,
        hoursRemaining: 24,
        circleDownloadsLimit: plan.limit, // 4 downloads total (1 schemes, 1 weekly, 2 lesson plans)
        circleDownloadsCount: downloadsCount,
        isTrialMode: true,
        allowedTools: ['all'],
        amountPaid: 0,
        paymentMethod: 'Free Trial',
        subscriptionIndex: 1,
        baseLimit: plan.limit,
        isGradeSpecific: false,
        gradeCounts: {},
        gradesList: ['all'],
      };
    }

    let rawSub = snapData.subscriptionType || snapData.originalSubscriptionType || snapData.subType || snapData.plan || snapData.circle;
    const amt = Number(snapData.amountPaid || snapData.amount || snapData.price || 0);
    
    // Always let amount paid override rawSub if amount paid indicates a specific tier
    if (amt >= 1500) rawSub = 'unlimited';
    else if (amt >= 250) rawSub = 'termly';
    else if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PLANS)) {
      if (amt >= 90) rawSub = 'monthly';
      else if (amt >= 40) rawSub = '14days';
      else if (amt >= 20) rawSub = 'weekly';
      else rawSub = 'guest_trial';
    }
    const subType = (rawSub in SUBSCRIPTION_PLANS) ? rawSub : 'guest_trial';
    if (cleanUserEmail && subType) {
      safeLocalStorage.setItem(`eduplan_user_sub_circle_${cleanUserEmail}`, subType);
    }
    const plan = SUBSCRIPTION_PLANS[subType] || SUBSCRIPTION_PLANS.monthly;
    const unlimitedDownloads = !!snapData.unlimitedDownloads || subType === 'unlimited';
    const allowedTools = Array.isArray(snapData.allowed_tools) 
      ? snapData.allowed_tools 
      : (typeof snapData.allowed_tools === 'string' ? snapData.allowed_tools.split(',').map(s => s.trim()) : ['all']);
    
    let startMs: number | null = null;
    if (snapData.subscriptionStart) {
      if (typeof snapData.subscriptionStart.toDate === 'function') {
        startMs = snapData.subscriptionStart.toDate().getTime();
      } else if (typeof snapData.subscriptionStart === 'number') {
        startMs = snapData.subscriptionStart;
      } else if (snapData.subscriptionStart.seconds !== undefined) {
        startMs = snapData.subscriptionStart.seconds * 1000;
      } else if (snapData.subscriptionStart._seconds !== undefined) {
        startMs = snapData.subscriptionStart._seconds * 1000;
      } else {
        const parsed = new Date(snapData.subscriptionStart).getTime();
        if (!isNaN(parsed) && parsed > 0) startMs = parsed;
      }
    } else if (snapData.addedAt) {
      if (typeof snapData.addedAt.toDate === 'function') {
        startMs = snapData.addedAt.toDate().getTime();
      } else if (typeof snapData.addedAt === 'number') {
        startMs = snapData.addedAt;
      } else if (snapData.addedAt.seconds !== undefined) {
        startMs = snapData.addedAt.seconds * 1000;
      } else if (snapData.addedAt._seconds !== undefined) {
        startMs = snapData.addedAt._seconds * 1000;
      } else {
        const parsed = new Date(snapData.addedAt).getTime();
        if (!isNaN(parsed) && parsed > 0) startMs = parsed;
      }
    }

    if (!startMs || isNaN(startMs) || startMs <= 0) {
      startMs = Date.now();
    }

    const subscriptionStart = new Date(startMs);

    // Use unified pricing and limits from SUBSCRIPTION_PLANS
    const calculatedAmount = plan.price;
    let amountPaid = snapData.amountPaid !== undefined && snapData.amountPaid !== null && Number(snapData.amountPaid) > 0 
      ? Number(snapData.amountPaid) 
      : calculatedAmount;
    if (amountPaid === 450) {
      amountPaid = calculatedAmount;
    }
    const paymentMethod = snapData.paymentMethod || 'MTN Mobile Money';
    const subscriptionIndex = snapData.subscriptionIndex !== undefined ? Number(snapData.subscriptionIndex) : 1;

    let durationMs = plan.durationDays === Infinity ? 10 * 365 * 24 * 60 * 60 * 1000 : plan.durationDays * 24 * 60 * 60 * 1000;
    const baseLimit = plan.limit;

    const subscriptionEnd = new Date(subscriptionStart.getTime() + durationMs);
    const timeDiff = subscriptionEnd.getTime() - Date.now();
    
    const isTimeExpired = subType !== 'unlimited' && plan.durationDays !== Infinity && timeDiff <= 0;
    const isQuotaExhausted = !unlimitedDownloads && downloadsCount >= baseLimit;
    const isSubscriptionExpired = subType === 'unlimited' ? false : isTimeExpired;

    const daysRemaining = subType === 'unlimited' ? 9999 : Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
    const hoursRemaining = subType === 'unlimited' ? 99999 : Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));

    return {
      ...plan,
      subscriptionType: subType,
      subscriptionStart,
      unlimitedDownloads,
      subscriptionEnd,
      isSubscriptionExpired,
      isQuotaExhausted: subType === 'unlimited' ? false : isQuotaExhausted,
      daysRemaining,
      hoursRemaining,
      circleDownloadsLimit: subType === 'unlimited' ? 999999 : baseLimit,
      circleDownloadsCount: downloadsCount,
      isTrialMode: subType === 'guest_trial',
      allowedTools,
      amountPaid,
      paymentMethod,
      subscriptionIndex,
      baseLimit: subType === 'unlimited' ? 999999 : baseLimit,
      isGradeSpecific: false,
      gradeCounts,
      gradesList: ['all'],
    };
  };

  const refreshDownloads = async () => {
    if (!user) return;
    
    const cacheKey = `eduplan_downloads_cache_${user.uid}`;
    const countCacheKey = `eduplan_total_downloads_${user.uid}`;

    const countedTypes = ['lesson_plan', 'schemes_of_work', 'weekly_forecast', 'lesson_notes', 'catch_up', 'individual_work_plan', 'assessments'];

    if (user.uid === 'guest_teacher') {
      try {
        const storedStr = safeLocalStorage.getItem('eduplan_downloads');
        const current: any[] = storedStr ? JSON.parse(storedStr) : [];
        const countedDocs = current.filter(r => {
          const type = (r.type || '').toLowerCase();
          return countedTypes.includes(type);
        });
        setDownloadRecords(current.slice(0, 10));
        setTotalDownloads(countedDocs.length);
        setCircleDownloadsCount(countedDocs.length);
      } catch (err) {
        console.error("Error loading local downloads count:", err);
      }
      return;
    }

    try {
      // 1. Fetch recent records (up to 50 for trial/guest to ensure accurate local list, 10 for whitelisted)
      const limitCount = isWhitelisted ? 10 : 50;
      const qRecent = query(collection(db, 'users', user.uid, 'downloads'), orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshotRecent = await getDocs(qRecent);
      const records = snapshotRecent.docs.map(doc => doc.data());
      setDownloadRecords(records);
      safeLocalStorage.setItem(cacheKey, JSON.stringify(records));

      // 2. Efficiently get total count of counted document types via count aggregation
      const qTotal = query(
        collection(db, 'users', user.uid, 'downloads'),
        where('type', 'in', countedTypes)
      );
      const totalSnap = await getCountFromServer(qTotal);
      const count = totalSnap.data().count;
      setTotalDownloads(count);
      safeLocalStorage.setItem(countCacheKey, count.toString());
    } catch (err: any) {
      const errStr = err?.message || String(err);
      const isQuota = checkIsQuotaError(err);
      const isNetworkOrAuth = errStr.includes('network-request-failed') ||
                             errStr.includes('Fetching auth token failed') ||
                             errStr.includes('Could not reach Cloud Firestore backend') ||
                             errStr.includes('client is offline');

      if (isQuota) {
        console.warn("Downloads fetch paused (Quota Exceeded). Using cached stats.");
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
        }
      } else if (isNetworkOrAuth) {
        console.warn("Downloads fetch offline/network notice. Using cached stats.");
      } else {
        console.error("Error loading downloads stats:", err);
      }
      // Load from cache on error (e.g. quota exceeded or network issue)
      try {
        const cachedRecords = safeLocalStorage.getItem(cacheKey);
        const cachedCount = safeLocalStorage.getItem(countCacheKey);
        if (cachedRecords) setDownloadRecords(JSON.parse(cachedRecords));
        if (cachedCount) setTotalDownloads(parseInt(cachedCount, 10));
      } catch (e) {
        console.warn("Failed to load cached download records or count", e);
      }
    }
  };

  const incrementLocalDownloads = (docType: string, grade: string, rawDoc: any) => {
    if (!user) return;

    // 1. Increment local count state
    setTotalDownloads(prev => {
      const newVal = prev + 1;
      try {
        const countCacheKey = `eduplan_total_downloads_${user.uid}`;
        safeLocalStorage.setItem(countCacheKey, newVal.toString());
      } catch (e) {}
      return newVal;
    });

    setCircleDownloadsCount(prev => {
      const newVal = prev + 1;
      return newVal;
    });

    // 2. Increment grade specific count inside subscriptionDetails if applicable
    setSubscriptionDetails((prevDetails: any) => {
      if (!prevDetails) return prevDetails;

      const newCircleCount = (prevDetails.circleDownloadsCount || 0) + 1;
      const newGradeCounts = { ...(prevDetails.gradeCounts || {}) };
      const gName = (grade || '').trim();
      if (gName) {
        newGradeCounts[gName] = (newGradeCounts[gName] || 0) + 1;
      }

      const baseLimit = prevDetails.circleDownloadsLimit || prevDetails.baseLimit || 180;
      const isUnlimited = prevDetails.subscriptionType === 'unlimited' || prevDetails.unlimitedDownloads;
      const isQuotaExhausted = isUnlimited ? false : newCircleCount >= baseLimit;
      const isTimeExpired = prevDetails.subscriptionType !== 'unlimited' && prevDetails.daysRemaining <= 0;
      const isSubscriptionExpired = isUnlimited ? false : isTimeExpired;

      const updatedDetails = {
        ...prevDetails,
        circleDownloadsCount: newCircleCount,
        gradeCounts: newGradeCounts,
        isQuotaExhausted,
        isSubscriptionExpired,
        isTrialMode: prevDetails.subscriptionType === 'guest_trial'
      };

      try {
        const cachedGrades = registeredGrades;
        const subCacheKey1 = `eduplan_subscription_cache_${user.uid}`;
        safeLocalStorage.setItem(subCacheKey1, JSON.stringify({ details: updatedDetails, grades: cachedGrades }));
        
        const cleanEmail = user.email?.toLowerCase().trim();
        const normEmail = cleanEmail ? cleanEmail.replace(/\s+/g, '') : '';
        if (normEmail) {
          const subCacheKey2 = `eduplan_sub_cache_${normEmail}`;
          safeLocalStorage.setItem(subCacheKey2, JSON.stringify({ details: updatedDetails, grades: cachedGrades }));
        }
      } catch (e) {}

      return updatedDetails;
    });

    // 3. Add to cached and state downloadRecords
    setDownloadRecords((prevRecords: any[]) => {
      const formattedDoc = {
        ...rawDoc,
        timestamp: rawDoc.timestamp || { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
      };
      const updatedRecords = [formattedDoc, ...prevRecords];
      const sliceLimit = isWhitelisted ? 10 : 50;
      const slicedRecords = updatedRecords.slice(0, sliceLimit);

      try {
        const recordsCacheKey = `eduplan_downloads_cache_${user.uid}`;
        safeLocalStorage.setItem(recordsCacheKey, JSON.stringify(slicedRecords));
      } catch (e) {}

      return slicedRecords;
    });
  };

  useEffect(() => {
    if (user) {
      refreshDownloads();
    } else {
      setDownloadRecords([]);
    }
  }, [user]);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
      if (user && isWhitelisted) {
        setSubscriptionDetails((prev: any) => {
          if (!prev || prev.subscriptionType === 'guest_trial') {
            return prev;
          }
          return {
            ...prev,
            isTrialMode: false,
            isSubscriptionExpired: false,
            isQuotaExhausted: false,
          };
        });
      }
    };
    window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    };
  }, [user, registeredGrades]);

  useEffect(() => {
    // 1. Global config listener
    const configRef = doc(db, 'global_settings', 'config');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalConfig({ enforceGradeLock: data.enforceGradeLock !== false });
      }
    }, (err: any) => {
      console.warn("Global config snapshot notice:", err?.message || err);
    });

    // 2. Informant listener
    const informantRef = doc(db, 'global_settings', 'informant');
    const unsubInformant = onSnapshot(informantRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const incomingText = data.text !== undefined ? String(data.text) : '';
        setInformantData({ 
          text: incomingText, 
          updatedAt: data.updatedAt || null 
        });
        if (incomingText) {
          safeLocalStorage.setItem('eduplan_informant_text', incomingText);
        } else {
          safeLocalStorage.removeItem('eduplan_informant_text');
        }
      }
    }, (err: any) => {
      console.warn("Informant snapshot notice:", err?.message || err);
    });

    return () => {
      unsubConfig();
      unsubInformant();
    };
  }, []);

  // Keep track of active timestamp across standard mouse/keyboard events 
  useEffect(() => {
    const updateActivity = () => {
      safeLocalStorage.setItem('eduplan_last_active', Date.now().toString());
    };
    updateActivity(); // prime on mount
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity));
    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, []);

  useEffect(() => {
    // Check if there's a stored guest session on mount
    const storedGuest = safeLocalStorage.getItem('eduplan_guest_user');
    if (storedGuest) {
      try {
        const guestData = JSON.parse(storedGuest);
        
        // 1-week inactivity check on mount
        const lastActiveLocal = safeLocalStorage.getItem('eduplan_last_active');
        if (lastActiveLocal) {
          const lastActiveTime = parseInt(lastActiveLocal, 10);
          if (Date.now() - lastActiveTime > 7 * 24 * 60 * 60 * 1000) {
            console.warn("Stored guest session expired due to 1 week inactivity on mount.");
            safeLocalStorage.removeItem('eduplan_guest_user');
            safeLocalStorage.removeItem('eduplan_last_active');
            setUser(null);
            setRegisteredGrades([]);
            setIsWhitelisted(false);
            setUserType('guest');
            toast.error("You have been signed out due to 1 week of inactivity.");
            setLoading(false);
            return;
          }
        }

        const cleanEmail = guestData.email?.toLowerCase().trim();
        const normEmail = cleanEmail ? cleanEmail.replace(/\s+/g, '') : '';
        if (cleanEmail && normEmail) {
          const guestUid = `guest_${normEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          guestData.uid = guestUid;
          safeLocalStorage.setItem('eduplan_guest_user', JSON.stringify(guestData));
          
          let assignedGrade = guestData.grade || 'Grade 4';
          let gradesArray: string[] = typeof assignedGrade === 'string' ? assignedGrade.split(',').map(g => g.trim()) : [assignedGrade];
          let whitelisted = true;
          let type: 'guest' | 'registered' | 'developer' = 'registered';

          if (isDeveloperEmail(normEmail)) {
            type = 'developer';
            gradesArray = ['all'];
          }

          // Check if whitelist revoked (checking both clean and normalized)
          const checkWhitelist = async () => {
            const localWhitelisted = getWhitelistedGuestFromLocalCache(cleanEmail);
            if (localWhitelisted && !localWhitelisted.isBlocked) {
              setRegisteredGrades(['all']);
              setIsWhitelisted(true);
              setUserType(isDeveloperEmail(normEmail) ? 'developer' : 'registered');
            }

            try {
              let snap = await getDoc(doc(db, 'authorized_guests', normEmail));
              if (!snap.exists() && cleanEmail !== normEmail) {
                snap = await getDoc(doc(db, 'authorized_guests', cleanEmail));
              }

              if (snap.exists() && snap.data()?.status !== 'blocked') {
                const remoteGrade = snap.data()?.grade || 'Grade 4';
                const remoteGradesArray = typeof remoteGrade === 'string' ? remoteGrade.split(',').map(g => g.trim()) : [remoteGrade];
                setRegisteredGrades(remoteGradesArray);
                setIsWhitelisted(true);
                setUserType(isDeveloperEmail(normEmail) ? 'developer' : 'registered');
              } else if (!snap.exists() && localWhitelisted && !localWhitelisted.isBlocked) {
                // Preserved via local whitelist cache
                setRegisteredGrades(['all']);
                setIsWhitelisted(true);
                setUserType(isDeveloperEmail(normEmail) ? 'developer' : 'registered');
              } else if (!isDeveloperEmail(normEmail)) {
                if (snap.exists() && snap.data()?.status === 'blocked') {
                  safeLocalStorage.removeItem('eduplan_guest_user');
                  setUser(null);
                  setRegisteredGrades([]);
                  setIsWhitelisted(false);
                  setUserType('guest');
                  toast.error("Your whitelisted registration has been suspended by the developer.");
                } else if (!localWhitelisted) {
                  // Only remove if not whitelisted locally
                  safeLocalStorage.removeItem('eduplan_guest_user');
                  setUser(null);
                  setRegisteredGrades([]);
                  setIsWhitelisted(false);
                  setUserType('guest');
                }
              }
            } catch (err: any) {
              // On network or Firestore error, rely on localWhitelisted
              if (localWhitelisted && !localWhitelisted.isBlocked) {
                setRegisteredGrades(['all']);
                setIsWhitelisted(true);
                setUserType(isDeveloperEmail(normEmail) ? 'developer' : 'registered');
              }
              if (checkIsQuotaError(err)) {
                console.warn("Quota exceeded, allowing cached session.");
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
                }
              } else {
                console.warn("Notice checking whitelist on mount (offline/network):", err);
              }
            }
          };
          checkWhitelist();

          setUser(guestData);
          setRegisteredGrades(gradesArray);
          setIsWhitelisted(whitelisted);
          setUserType(type);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse stored guest", e);
      }
    } else {
      // Check if there's a cached Google login to restore in 0 seconds
      const storedGoogle = safeLocalStorage.getItem('eduplan_google_user');
      if (storedGoogle) {
        try {
          const cachedData = JSON.parse(storedGoogle);
          const cleanEmail = cachedData.email?.toLowerCase().trim() || '';
          const normEmail = cleanEmail.replace(/\s+/g, '');
          if (normEmail) {
            const isDeveloper = isDeveloperEmail(normEmail);
            let type: 'guest' | 'registered' | 'developer' = 'guest';
            let grades: string[] = ['Trial Access'];
            let whitelisted = false;

            if (isDeveloper) {
              type = 'developer';
              whitelisted = true;
              grades = ['all'];
            } else {
              const cacheKey = `eduplan_sub_cache_${normEmail}`;
              const subCached = safeLocalStorage.getItem(cacheKey);
              if (subCached) {
                try {
                  const parsed = JSON.parse(subCached);
                  whitelisted = true;
                  type = 'registered';
                  grades = parsed.grades || (parsed.details?.gradesList) || ['Grade 4'];
                } catch (e) {
                  console.warn("Failed to parse sub cache in mount restore");
                }
              }
            }

            setUser(cachedData);
            setRegisteredGrades(grades);
            setIsWhitelisted(whitelisted);
            setUserType(type);
            setLoading(false);
          }
        } catch (e) {
          console.warn("Failed to parse stored Google user cache", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Hard limit: force loading to false after 2.5 seconds to guarantee the app renders
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timer);
      
      if (currentUser) {
        const cleanEmail = currentUser.email?.toLowerCase().trim() || '';
        const normEmail = cleanEmail.replace(/\s+/g, '');
        const isDeveloper = isDeveloperEmail(normEmail);
        
        if (isDeveloper) {
          safeLocalStorage.setItem('cached_admin_uid', currentUser.uid);
        }

        // 1-week inactivity check during auth session load
        const lastActiveLocal = safeLocalStorage.getItem('eduplan_last_active');
        let sessionExpired = false;
        if (lastActiveLocal) {
          const lastActiveTime = parseInt(lastActiveLocal, 10);
          if (Date.now() - lastActiveTime > 7 * 24 * 60 * 60 * 1000) {
            sessionExpired = true;
          }
        }

        // DB check backup is run asynchronously in the background so it never blocks UI load
        if (!sessionExpired) {
          (async () => {
            try {
              const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const lastHb = userData.lastHeartbeat?.toDate?.() || (userData.lastHeartbeat && new Date(userData.lastHeartbeat));
                if (lastHb && (Date.now() - lastHb.getTime() > 7 * 24 * 60 * 60 * 1000)) {
                  console.warn("Auth session expired due to remote heartbeat inactivity.");
                  safeLocalStorage.removeItem('eduplan_guest_user');
                  safeLocalStorage.removeItem('eduplan_last_active');
                  await signOut(auth);
                  setUser(null);
                  setRegisteredGrades([]);
                  setIsWhitelisted(false);
                  setUserType('guest');
                  toast.error("You have been signed out due to 1 week of inactivity.");
                }
              }
            } catch (e: any) {
              if (checkIsQuotaError(e)) {
                console.warn("Quota exceeded during background remote inactivity check.");
              }
            }
          })();
        }

        if (sessionExpired) {
          console.warn("Auth session expired due to 1 week inactivity.");
          safeLocalStorage.removeItem('eduplan_guest_user');
          safeLocalStorage.removeItem('eduplan_last_active');
          await signOut(auth);
          setUser(null);
          setRegisteredGrades([]);
          setIsWhitelisted(false);
          setUserType('guest');
          toast.error("You have been signed out due to 1 week of inactivity.");
          setLoading(false);
          return;
        }
        
        // Instant Optimistic load using localStorage cache if available
        let type: 'guest' | 'registered' | 'developer' = 'guest';
        let grades: string[] = ['Trial Access'];
        let whitelisted = false;

        if (isDeveloper) {
          type = 'developer';
          whitelisted = true;
          grades = ['all'];
        } else {
          const cacheKey = `eduplan_sub_cache_${normEmail}`;
          const cached = safeLocalStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              whitelisted = true;
              type = 'registered';
              grades = parsed.grades || (parsed.details?.gradesList) || ['Grade 4'];
              if (parsed.details) {
                setSubscriptionDetails(parsed.details);
              }
            } catch (e) {
              console.warn("Failed to parse cached details");
            }
          }
        }

        // Set state immediately for extreme speed
        setRegisteredGrades(grades);
        setIsWhitelisted(whitelisted);
        setUserType(type);
        setUser(currentUser);
        setLoading(false);

        // Cache the Google profile for instant 0-second restore on next reload
        safeLocalStorage.setItem('eduplan_google_user', JSON.stringify({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL
        }));

        // Fetch fresh subscription details and whitelist status in background
        const checkWhitelist = async () => {
          if (isDeveloper) return;
          try {
            let guestDocSnap = await getDoc(doc(db, 'authorized_guests', normEmail));
            if (!guestDocSnap.exists() && cleanEmail !== normEmail) {
              guestDocSnap = await getDoc(doc(db, 'authorized_guests', cleanEmail));
            }
            
            let finalType: 'guest' | 'registered' | 'developer' = 'guest';
            let finalGrades: string[] = ['Trial Access'];
            let finalWhitelisted = false;

            if (guestDocSnap.exists()) {
              const snapData = guestDocSnap.data();
              if (snapData?.status === 'blocked') {
                safeLocalStorage.removeItem(`eduplan_sub_cache_${normEmail}`);
                await signOut(auth);
                setUser(null);
                setRegisteredGrades([]);
                setIsWhitelisted(false);
                setUserType('guest');
                toast.error("Your whitelisted registration has been suspended by the developer.");
                return;
              }
              finalWhitelisted = true;
              finalType = 'registered';
              const g = snapData?.grade || 'Grade 4';
              finalGrades = typeof g === 'string' ? g.split(',').map(s => s.trim()) : [g];

              const details = calculateSubscription(snapData, circleDownloadsCount, {});
              details.isTrialMode = false;
              setSubscriptionDetails(details);
              try {
                safeLocalStorage.setItem(`eduplan_sub_cache_${normEmail}`, JSON.stringify({ details, grades: finalGrades }));
              } catch (e) {}
            } else {
              const localWhitelisted = getWhitelistedGuestFromLocalCache(cleanEmail) || getWhitelistedGuestFromLocalCache(normEmail);
              if (localWhitelisted && !localWhitelisted.isBlocked) {
                finalWhitelisted = true;
                finalType = isDeveloperEmail(normEmail) ? 'developer' : 'registered';
                finalGrades = ['all'];
                const subType = localWhitelisted.subscriptionType || 'guest_trial';
                const planPrice = SUBSCRIPTION_PLANS[subType]?.price || 90;
                const amtPaid = (localWhitelisted.amountPaid !== undefined && localWhitelisted.amountPaid !== null && localWhitelisted.amountPaid !== 450)
                  ? Number(localWhitelisted.amountPaid)
                  : planPrice;
                const existingSubStart = localWhitelisted.subscriptionStart || localWhitelisted.addedAt || null;
                const existingAddedAt = localWhitelisted.addedAt || localWhitelisted.subscriptionStart || null;
                setDoc(doc(db, 'authorized_guests', normEmail), {
                  email: normEmail,
                  grade: localWhitelisted.grade || 'all',
                  subscriptionType: subType,
                  amountPaid: amtPaid,
                  paymentMethod: localWhitelisted.paymentMethod || 'MTN Mobile Money',
                  status: 'active',
                  lastLogin: serverTimestamp(),
                  ...(existingSubStart ? { subscriptionStart: existingSubStart } : { subscriptionStart: serverTimestamp() }),
                  ...(existingAddedAt ? { addedAt: existingAddedAt } : { addedAt: serverTimestamp() }),
                  displayName: currentUser.displayName || 'Approved Teacher'
                }, { merge: true }).catch(() => {});
              } else {
                finalWhitelisted = false;
                finalType = 'guest';
                finalGrades = ['Trial Access'];
              }
            }

            setRegisteredGrades(finalGrades);
            setIsWhitelisted(finalWhitelisted);
            setUserType(finalType);
            setUser(currentUser);
          } catch (error) {
            console.error("Failed to verify fresh whitelist status:", error);
          }
        };

        checkWhitelist();

        const localWhitelisted = getWhitelistedGuestFromLocalCache(cleanEmail) || getWhitelistedGuestFromLocalCache(normEmail);
        const currentSub = localWhitelisted?.subscriptionType || 'guest_trial';

        // Record/Update user in Firestore in the background (NON-blocking)
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Teacher',
          email: normEmail, // Normalize stored email to strip trailing/internal spaces
          photoURL: currentUser.photoURL,
          lastLogin: serverTimestamp(),
          lastHeartbeat: serverTimestamp(),
          auth_provider: 'google.com',
          is_whitelisted: whitelisted,
          isWhitelisted: whitelisted,
          teaching_grade: grades.join(', '),
          user_type: type,
          ...(whitelisted ? { status: 'active', subscriptionType: currentSub } : { subscriptionType: 'guest_trial', isGuest: true })
        }, { merge: true }).then(() => {
          recordActivity({ type: 'login', details: 'Google Login' });
        }).catch(error => {
          console.error("Error updating user profile in background:", error);
        });

        if (whitelisted) {
          setDoc(doc(db, 'authorized_guests', normEmail), {
            lastLogin: serverTimestamp(),
            lastHeartbeat: serverTimestamp(),
            displayName: currentUser.displayName || 'Approved Teacher',
          }, { merge: true }).catch(() => {});
        }

        // Separate tracking table for guest users (NON-blocking)
        if (type === 'guest') {
          recordTrialLogin(normEmail, 'google.com', 'guest', 'any', currentUser.displayName || 'Teacher');
          setDoc(doc(db, 'guest_experiments', normEmail), {
            email: normEmail,
            auth_provider: 'google.com',
            is_whitelisted: false,
            teaching_grade: 'any',
            user_type: 'guest',
            lastLogin: serverTimestamp(),
            firstAccess: serverTimestamp()
          }, { merge: true }).catch(error => {
            console.error("Error tracking guest experiment in background:", error);
          });
        }
      } else {
        const hasGuest = safeLocalStorage.getItem('eduplan_guest_user');
        if (!hasGuest) {
          setUser(null);
          setLoading(false);
        }
      }
      
      // Attempt to sync any unsynced offline trial histories on mount
      syncOfflineTrialHistory();
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Heartbeat to track session duration and online status + check inactivity in real-time
  useEffect(() => {
    if (!user) return;

    const checkAndSendHeartbeat = async () => {
      // Periodic inactivity check
      const lastActiveLocal = safeLocalStorage.getItem('eduplan_last_active');
      if (lastActiveLocal) {
        const lastActiveTime = parseInt(lastActiveLocal, 10);
        if (Date.now() - lastActiveTime > 7 * 24 * 60 * 60 * 1000) {
          console.warn("Heartbeat periodic check failed. Inactivity > 1 week.");
          toast.error("You have been signed out due to 1 week of inactivity.");
          logout();
          return;
        }
      }

      if (isQuotaExceeded) {
        console.warn("Skipping heartbeat: Firestore quota exceeded.");
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        
        // Skip getDoc check if we've already synced the profile in this session
        if (!isProfileSynced) {
          const snap = await getDoc(userRef);
          
          if (!snap.exists() || !snap.data()?.lastLogin) {
            // Re-sync full profile if document is missing or incomplete
            await setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName || 'Teacher',
              email: user.email?.toLowerCase().trim().replace(/\s+/g, '') || '',
              photoURL: user.photoURL || null,
              lastLogin: serverTimestamp(),
              lastHeartbeat: serverTimestamp(),
              auth_provider: user.uid.startsWith('guest_') ? 'guest_email' : 'google.com',
              is_whitelisted: isWhitelisted,
              teaching_grade: registeredGrades.join(', '),
              user_type: userType,
              isGuest: userType === 'guest'
            }, { merge: true });
          }
          setIsProfileSynced(true);
        }

        // Just update heartbeat without reading first
        await setDoc(userRef, {
          lastHeartbeat: serverTimestamp(),
        }, { merge: true });

        if (isWhitelisted && user.email) {
          const norm = user.email.toLowerCase().trim().replace(/\s+/g, '');
          setDoc(doc(db, 'authorized_guests', norm), {
            lastHeartbeat: serverTimestamp(),
            lastLogin: serverTimestamp(),
          }, { merge: true }).catch(() => {});
        }
      } catch (error) {
        const isQuota = checkIsQuotaError(error);
        if (isQuota) {
          setIsQuotaExceeded(true);
          console.warn("Heartbeat update paused (Firestore Quota Exceeded). App is running in offline-resilient cache mode.");
        } else {
          console.error("Heartbeat update error:", error);
        }
      }
    };

    checkAndSendHeartbeat();
    const interval = setInterval(checkAndSendHeartbeat, 180000); // 180s (3 minutes)
    return () => clearInterval(interval);
  }, [user, isProfileSynced, isWhitelisted, registeredGrades, userType, isQuotaExceeded]);

  const signInWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.getCustomParameters();
      const result = await signInWithPopup(auth, provider);
      
      const email = result.user?.email || "";
      const cleanEmail = email.toLowerCase().trim();
      const normEmail = cleanEmail.replace(/\s+/g, '');
      const isDeveloper = isDeveloperEmail(normEmail);
      
      // Instant Optimistic state setup using cache if available
      let type: 'guest' | 'registered' | 'developer' = 'guest';
      let grades: string[] = ['Trial Access'];
      let whitelisted = false;

      if (isDeveloper) {
        type = 'developer';
        whitelisted = true;
        grades = ['all'];
      } else {
        const cacheKey = `eduplan_sub_cache_${normEmail}`;
        const cached = safeLocalStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            whitelisted = true;
            type = 'registered';
            grades = parsed.grades || (parsed.details?.gradesList) || ['Grade 4'];
          } catch (e) {
            console.warn("Failed to parse cached details in Google sign-in");
          }
        }
      }

      setRegisteredGrades(grades);
      setIsWhitelisted(whitelisted);
      setUserType(type);
      setUser(result.user);

      // Cache the Google profile for instant 0-second restore on next reload
      if (result.user) {
        safeLocalStorage.setItem('eduplan_google_user', JSON.stringify({
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        }));
      }

      // Verify fresh status from DB in background
      const checkWhitelistFresh = async () => {
        if (isDeveloper) return;
        try {
          let guestDocSnap = await getDoc(doc(db, 'authorized_guests', normEmail));
          if (!guestDocSnap.exists() && cleanEmail !== normEmail) {
            guestDocSnap = await getDoc(doc(db, 'authorized_guests', cleanEmail));
          }
          
          let finalType: 'guest' | 'registered' | 'developer' = 'guest';
          let finalGrades: string[] = ['Trial Access'];
          let finalWhitelisted = false;

          if (guestDocSnap.exists()) {
            finalWhitelisted = true;
            finalType = 'registered';
            const g = guestDocSnap.data()?.grade || 'Grade 4';
            finalGrades = typeof g === 'string' ? g.split(',').map(s => s.trim()) : [g];
          }

          setRegisteredGrades(finalGrades);
          setIsWhitelisted(finalWhitelisted);
          setUserType(finalType);
        } catch (error) {
          console.error("Failed background whitelist check inside sign-in:", error);
        }
      };

      // Record trial logins offline & trigger sync to Firestore
      if (type === 'guest') {
        recordTrialLogin(normEmail, 'google.com', 'guest', 'any', result.user?.displayName || 'Teacher (Google)');
        syncOfflineTrialHistory();
      }

      checkWhitelistFresh();

      toast.success(type === 'guest' ? "Welcome! Trial Access Active." : "Successfully signed in with Google!");
    } catch (error: any) {
      console.error("Google Sign-In failed:", error);
      let userFriendlyMsg = "Sign-In failed. Please try again.";
      
      const errorCode = error?.code || "";
      if (errorCode === 'auth/cancelled-popup-request' || error?.message?.includes('cancelled-popup-request')) {
        userFriendlyMsg = "Google Sign-In popup request was interrupted. This often happens if the Sign-In button was clicked multiple times or if browser cookies/sandboxing blocks the flow. Please click the 'Open in New Tab' icon in the top right of the preview to log in successfully, or use the 'Continue as Guest' option.";
      } else if (errorCode === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
        userFriendlyMsg = "The Google Sign-In window was closed before completing. Please try again, or use the 'Continue as Guest' option.";
      } else if (errorCode === 'auth/popup-blocked' || error?.message?.includes('popup-blocked')) {
        userFriendlyMsg = "The Google Sign-In popup was blocked by your browser's pop-up blocker. Please enable popups, click 'Open in New Tab' in the preview toolbar, or use the 'Continue as Guest' option.";
      } else if (errorCode === 'auth/network-request-failed' || error?.message?.includes('network-request-failed')) {
        userFriendlyMsg = "A network error occurred during Sign-In. Please check your internet connection and try again.";
      } else {
        userFriendlyMsg = error?.message || "Sign-In failed. Please try again.";
      }
      
      setAuthError(userFriendlyMsg);
      toast.error(userFriendlyMsg, { duration: 10000 });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signInAsGuest = async (email: string): Promise<boolean> => {
    // Treat any spaces typing as a user mistake and remove them
    const cleanEmail = email.toLowerCase().replace(/\s+/g, '');
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    const isDeveloper = isDeveloperEmail(cleanEmail) || cleanEmail === ADMIN_EMAIL.toLowerCase().trim();
    const localWhitelisted = getWhitelistedGuestFromLocalCache(cleanEmail);

    if (localWhitelisted?.isBlocked) {
      toast.error("Your whitelisted registration is suspended. Please contact the developer.");
      return false;
    }

    try {
      let assignedGrades: string[] = ['all'];
      let whitelisted = false;
      let type: 'guest' | 'registered' | 'developer' = 'guest';
      let snapData: any = localWhitelisted || null;

      if (isDeveloper) {
        assignedGrades = ['all'];
        whitelisted = true;
        type = 'developer';
        snapData = { subscriptionType: 'unlimited', status: 'active' };
      } else if (localWhitelisted && !localWhitelisted.isBlocked) {
        assignedGrades = ['all'];
        whitelisted = true;
        type = 'registered';
      } else {
        try {
          let guestDocSnap = await getDoc(doc(db, 'authorized_guests', cleanEmail));
          if (guestDocSnap.exists()) {
            if (guestDocSnap.data()?.status === 'blocked') {
              toast.error("Your whitelisted registration is suspended. Please contact the developer.");
              return false;
            }
            snapData = guestDocSnap.data();
            whitelisted = true;
            type = 'registered';
            assignedGrades = ['all'];
          } else {
            whitelisted = false;
            type = 'guest';
            assignedGrades = ['Trial Access'];
          }
        } catch (netErr) {
          if (localWhitelisted && !localWhitelisted.isBlocked) {
            whitelisted = true;
            type = 'registered';
            assignedGrades = ['all'];
          } else {
            whitelisted = false;
            type = 'guest';
            assignedGrades = ['Trial Access'];
          }
        }
      }

      const guestUid = `guest_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const guestUser = {
        uid: guestUid,
        displayName: isDeveloper ? 'Developer (Guest)' : (whitelisted ? 'Approved Teacher' : 'Teacher (Guest)'),
        email: cleanEmail,
        grade: assignedGrades.join(', '),
        photoURL: null,
        isWhitelisted: whitelisted
      } as any;

      setUser(guestUser);
      setRegisteredGrades(assignedGrades);
      setIsWhitelisted(whitelisted);
      setUserType(type);
      safeLocalStorage.setItem('eduplan_guest_user', JSON.stringify(guestUser));

      if (whitelisted && snapData) {
        const details = calculateSubscription(snapData, 0, {});
        details.isTrialMode = false;
        setSubscriptionDetails(details);
        try {
          safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({ details, grades: ['all'] }));
        } catch (e) {}
      }

      // NON-blocking Firestore write for extreme speed
      setDoc(doc(db, 'users', guestUid), {
        uid: guestUid,
        displayName: guestUser.displayName,
        email: cleanEmail,
        photoURL: null,
        lastLogin: serverTimestamp(),
        lastHeartbeat: serverTimestamp(),
        isGuest: true,
        auth_provider: 'guest_email',
        is_whitelisted: whitelisted,
        teaching_grade: assignedGrades.join(', '),
        user_type: type,
        subscriptionType: snapData?.subscriptionType || (isDeveloper ? 'unlimited' : 'guest_trial')
      }, { merge: true }).then(() => {
        recordActivity({ type: 'login', details: 'Guest Email Login' });
      }).catch(error => {
        console.warn("Notice updating user profile on guest login in background:", error);
      });

      if (type === 'guest') {
        recordTrialLogin(cleanEmail, 'guest_email', 'guest', 'any', guestUser.displayName);
        syncOfflineTrialHistory();
        setDoc(doc(db, 'guest_experiments', cleanEmail), {
          email: cleanEmail,
          auth_provider: 'guest_email',
          is_whitelisted: false,
          teaching_grade: 'any',
          user_type: 'guest',
          lastLogin: serverTimestamp(),
          firstAccess: serverTimestamp()
        }, { merge: true }).catch(() => {});
      } else if (whitelisted) {
        setDoc(doc(db, 'authorized_guests', cleanEmail), {
          lastLogin: serverTimestamp(),
          lastHeartbeat: serverTimestamp(),
          displayName: guestUser.displayName || 'Approved Teacher',
        }, { merge: true }).catch(() => {});
      }

      toast.success(whitelisted ? `Welcome back! Signed in with ${snapData?.subscriptionType || 'Active'} Circle.` : "Welcome! Entered Trial Access.");
      return true;
    } catch (error: any) {
      const isQuota = checkIsQuotaError(error);
      if (isQuota) {
        setIsQuotaExceeded(true);
      }
      
      console.warn("Firestore notice during guest sign-in, applying safe instant access fallback:", error);
      
      const isLocallyWhitelisted = localWhitelisted && !localWhitelisted.isBlocked;
      const isUserWhitelisted = isLocallyWhitelisted || isQuota || isDeveloper;
      const finalType = isDeveloper ? 'developer' : (isUserWhitelisted ? 'registered' : 'guest');
      const assignedGrades = isUserWhitelisted ? ['all'] : ['Trial Access'];
      
      recordTrialLogin(cleanEmail, 'guest_email', finalType, 'any', isDeveloper ? 'Developer (Guest)' : (isUserWhitelisted ? 'Approved Teacher' : 'Teacher (Guest)'));
      
      const guestUid = `guest_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const guestUser = {
        uid: guestUid,
        displayName: isDeveloper ? 'Developer (Guest)' : (isUserWhitelisted ? 'Approved Teacher' : 'Teacher (Guest)'),
        email: cleanEmail,
        grade: assignedGrades.join(', '),
        photoURL: null,
        isWhitelisted: isUserWhitelisted
      } as any;

      setUser(guestUser);
      setRegisteredGrades(assignedGrades);
      setIsWhitelisted(isUserWhitelisted);
      setUserType(finalType);
      safeLocalStorage.setItem('eduplan_guest_user', JSON.stringify(guestUser));

      if (isUserWhitelisted) {
        const snapData = localWhitelisted || { subscriptionType: 'guest_trial', status: 'active' };
        const details = calculateSubscription(snapData, 0, {});
        details.isTrialMode = details.subscriptionType === 'guest_trial';
        setSubscriptionDetails(details);
        try {
          safeLocalStorage.setItem(`eduplan_sub_cache_${cleanEmail}`, JSON.stringify({ details, grades: ['all'] }));
        } catch (e) {}
      }
      
      toast.success(isUserWhitelisted ? "Welcome! Signed in successfully." : "Welcome! Entered Trial Access.");
      return true;
    }
  };

  const logout = async () => {
    safeLocalStorage.removeItem('eduplan_guest_user');
    safeLocalStorage.removeItem('eduplan_google_user');
    safeLocalStorage.removeItem('eduplan_last_active');
    await signOut(auth);
    setUser(null);
    setRegisteredGrades([]);
    setIsWhitelisted(false);
    setUserType('guest');
  };

  const [authTriggerCount, setAuthTriggerCount] = useState(0);

  const totalDownloadsRef = React.useRef(0);
  const userTypeRef = React.useRef(userType);
  const unsubDownloadsRef = React.useRef<any>(null);

  const refreshSubscription = async (): Promise<boolean> => {
    setAuthTriggerCount(prev => prev + 1);
    return true;
  };

  useEffect(() => {
    totalDownloadsRef.current = totalDownloads;
  }, [totalDownloads]);

  useEffect(() => {
    userTypeRef.current = userType;
  }, [userType]);

  useEffect(() => {
    if (!user) {
      setSubscriptionDetails({
        subscriptionType: 'guest_trial',
        subscriptionStart: null,
        unlimitedDownloads: false,
        subscriptionEnd: null,
        isSubscriptionExpired: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        circleDownloadsLimit: 6,
        circleDownloadsCount: 0,
        isTrialMode: true,
      });
      return;
    }

    const cleanEmail = user.email?.toLowerCase().trim();
    if (!cleanEmail) return;
    const normEmail = cleanEmail.replace(/\s+/g, '');
    const isDeveloper = isDeveloperEmail(normEmail);

    const docRef = doc(db, 'authorized_guests', normEmail);
    
    // Load cached subscription first
    const cacheKey = `eduplan_sub_cache_${normEmail}`;
    try {
      const cached = safeLocalStorage.getItem(cacheKey);
      if (cached) {
        const { details, grades } = JSON.parse(cached);
        setSubscriptionDetails(details);
        setRegisteredGrades(grades);
        setIsWhitelisted(true);
        setUserType('registered');
      } else if (isDeveloper) {
        // Safe initial fallback for developer before Firestore loads
        const devStart = new Date(2026, 5, 29, 14, 39); // Jun 29, 2026 14:39 PM
        const devEnd = new Date(devStart.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years later
        setSubscriptionDetails({
          subscriptionType: 'unlimited',
          subscriptionStart: devStart,
          unlimitedDownloads: true,
          subscriptionEnd: devEnd,
          isSubscriptionExpired: false,
          daysRemaining: 9999,
          hoursRemaining: 99999,
          circleDownloadsLimit: 999999,
          circleDownloadsCount: 0,
          isTrialMode: false,
        });
        setRegisteredGrades(['All']);
        setIsWhitelisted(true);
        setUserType('registered');
      } else if (normEmail === 'komfortune8@gmail.com') {
        const termlyStart = new Date('2026-08-31T12:11:00.000Z');
        const termlyEnd = new Date(termlyStart.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
        setSubscriptionDetails({
          subscriptionType: 'termly',
          subscriptionStart: termlyStart,
          unlimitedDownloads: false,
          subscriptionEnd: termlyEnd,
          isSubscriptionExpired: false,
          daysRemaining: 90,
          hoursRemaining: 90 * 24,
          circleDownloadsLimit: 500,
          circleDownloadsCount: 0,
          isTrialMode: false,
        });
        setRegisteredGrades(['All']);
        setIsWhitelisted(true);
        setUserType('registered');
      }
    } catch (e) {
      console.warn("Error loading cached subscription");
    }

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      // Clean up previous real-time downloads listener if it exists
      if (unsubDownloadsRef.current) {
        unsubDownloadsRef.current();
        unsubDownloadsRef.current = null;
      }

      let activeSnapData: any = null;
      let isExplicitlyBlocked = false;

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.status === 'blocked') {
          isExplicitlyBlocked = true;
        } else {
          activeSnapData = data;
        }
      } else {
        // Fallback 0: Check developer target accounts and local whitelist cache
        const localWhitelisted = getWhitelistedGuestFromLocalCache(cleanEmail) || getWhitelistedGuestFromLocalCache(normEmail);
        if (localWhitelisted) {
          if (localWhitelisted.isBlocked) {
            isExplicitlyBlocked = true;
          } else {
            let rawSub = (localWhitelisted as any).subscriptionType || (localWhitelisted as any).plan || (localWhitelisted as any).circle || (localWhitelisted as any).subType;
            const amtPaid = Number(localWhitelisted.amountPaid || 0);
            if (amtPaid >= 1500) rawSub = 'unlimited';
            else if (amtPaid >= 250) rawSub = 'termly';
            else if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PLANS)) {
              if (amtPaid >= 90) rawSub = 'monthly';
              else if (amtPaid >= 40) rawSub = '14days';
              else if (amtPaid >= 20) rawSub = 'weekly';
              else rawSub = 'monthly';
            }
            const subType = (rawSub in SUBSCRIPTION_PLANS && rawSub !== 'guest_trial') ? rawSub : 'monthly';
            activeSnapData = {
              email: normEmail,
              grade: localWhitelisted.grade || 'all',
              subscriptionType: subType,
              amountPaid: amtPaid || (SUBSCRIPTION_PLANS[subType]?.price || 90),
              paymentMethod: localWhitelisted.paymentMethod || 'MTN Mobile Money',
              subscriptionIndex: localWhitelisted.subscriptionIndex || 1,
              status: 'active',
              subscriptionStart: localWhitelisted.subscriptionStart || null,
              addedAt: localWhitelisted.addedAt || null
            };
          }
        }

        // Fallback 0.5: Query authorized_guests by email field in Firestore
        if (!activeSnapData && !isExplicitlyBlocked) {
          try {
            const qGuest = query(collection(db, 'authorized_guests'), where('email', '==', normEmail));
            const qSnap = await getDocs(qGuest);
            if (!qSnap.empty) {
              const matchedData = qSnap.docs[0].data();
              if (matchedData?.status === 'blocked') {
                isExplicitlyBlocked = true;
              } else {
                activeSnapData = matchedData;
              }
            } else if (cleanEmail !== normEmail) {
              const qGuestRaw = query(collection(db, 'authorized_guests'), where('email', '==', cleanEmail));
              const qSnapRaw = await getDocs(qGuestRaw);
              if (!qSnapRaw.empty) {
                const matchedData = qSnapRaw.docs[0].data();
                if (matchedData?.status === 'blocked') {
                  isExplicitlyBlocked = true;
                } else {
                  activeSnapData = matchedData;
                }
              }
            }
          } catch (e) {}
        }

        // Fallback 1: Try raw cleanEmail if different from normEmail
        if (!activeSnapData && !isExplicitlyBlocked && cleanEmail !== normEmail) {
          try {
            const rawSnap = await getDoc(doc(db, 'authorized_guests', cleanEmail));
            if (rawSnap.exists()) {
              if (rawSnap.data()?.status === 'blocked') {
                isExplicitlyBlocked = true;
              } else {
                activeSnapData = rawSnap.data();
              }
            }
          } catch (e) {}
        }

        // Fallback 1.5: Try legacy email format (underscores instead of special characters)
        const legacyEmail = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        if (!activeSnapData && !isExplicitlyBlocked && legacyEmail !== normEmail && legacyEmail !== cleanEmail) {
          try {
            const legacySnap = await getDoc(doc(db, 'authorized_guests', legacyEmail));
            if (legacySnap.exists()) {
              if (legacySnap.data()?.status === 'blocked') {
                isExplicitlyBlocked = true;
              } else {
                activeSnapData = legacySnap.data();
              }
            }
          } catch (e) {}
        }

        // Fallback 2: Check user profile in users collection (for direct user ID or guest user ID)
        if (!activeSnapData && !isExplicitlyBlocked) {
          try {
            const checkUids = [user.uid, `guest_${normEmail.replace(/[^a-zA-Z0-9]/g, '_')}`];
            for (const targetUid of checkUids) {
              if (!targetUid) continue;
              const userProfileSnap = await getDoc(doc(db, 'users', targetUid));
              if (userProfileSnap.exists()) {
                const uData = userProfileSnap.data();
                const isWhitelistedUser = uData.is_whitelisted === true || uData.isWhitelisted === true || uData.status === 'active' || uData.status === 'approved' || (uData.subscriptionType && uData.subscriptionType !== 'guest_trial');
                if (isWhitelistedUser) {
                  let rawSub = uData.subscriptionType || uData.plan || uData.circle || uData.subType;
                  const amtPaid = Number(uData.amountPaid || 0);
                  if (amtPaid >= 1500) rawSub = 'unlimited';
                  else if (amtPaid >= 250) rawSub = 'termly';
                  else if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PLANS)) {
                    if (amtPaid >= 90) rawSub = 'monthly';
                    else if (amtPaid >= 40) rawSub = '14days';
                    else if (amtPaid >= 20) rawSub = 'weekly';
                    else rawSub = 'monthly';
                  }
                  const subType = (rawSub in SUBSCRIPTION_PLANS && rawSub !== 'guest_trial') ? rawSub : (isDeveloper ? 'unlimited' : 'monthly');
                  activeSnapData = {
                    email: normEmail,
                    grade: uData.teaching_grade || uData.grade || 'all',
                    subscriptionType: subType,
                    amountPaid: amtPaid || (SUBSCRIPTION_PLANS[subType]?.price || 90),
                    paymentMethod: uData.paymentMethod || 'MTN Mobile Money',
                    subscriptionIndex: uData.subscriptionIndex !== undefined ? Number(uData.subscriptionIndex) : 1,
                    status: uData.status || 'active',
                    subscriptionStart: uData.subscriptionStart || null,
                    addedAt: uData.addedAt || null
                  };
                  break;
                }
              }
            }
          } catch (e) {}
        }

        // Fallback 3: Check local storage whitelist caches (eduplan_monitor_whitelist and eduplan_whitelisted_guests)
        if (!activeSnapData && !isExplicitlyBlocked) {
          try {
            const sources = ['eduplan_monitor_whitelist', 'eduplan_whitelisted_guests'];
            for (const src of sources) {
              const raw = safeLocalStorage.getItem(src);
              if (!raw) continue;
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const match = list.find((item: any) => {
                  const itemEmail = (item.email || item.id || '').toLowerCase().trim().replace(/\s+/g, '');
                  return itemEmail === normEmail || itemEmail === cleanEmail;
                });
                if (match) {
                  if (match.status === 'blocked') {
                    isExplicitlyBlocked = true;
                    break;
                  }
                  let rawSub = match.subscriptionType || match.plan || match.circle || match.subType;
                  const amtPaid = Number(match.amountPaid || 0);
                  if (amtPaid >= 1500) rawSub = 'unlimited';
                  else if (amtPaid >= 250) rawSub = 'termly';
                  else if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PLANS)) {
                    if (amtPaid >= 90) rawSub = 'monthly';
                    else if (amtPaid >= 40) rawSub = '14days';
                    else if (amtPaid >= 20) rawSub = 'weekly';
                    else rawSub = 'monthly';
                  }
                  const subType = (rawSub in SUBSCRIPTION_PLANS && rawSub !== 'guest_trial') ? rawSub : 'monthly';
                  activeSnapData = {
                    email: normEmail,
                    grade: match.grade || 'all',
                    subscriptionType: subType,
                    amountPaid: amtPaid || (SUBSCRIPTION_PLANS[subType]?.price || 90),
                    paymentMethod: match.paymentMethod || 'MTN Mobile Money',
                    subscriptionIndex: match.subscriptionIndex !== undefined ? Number(match.subscriptionIndex) : 1,
                    status: match.status || 'active',
                    subscriptionStart: match.subscriptionStart || new Date(),
                    addedAt: match.addedAt || new Date()
                  };
                  break;
                }
              }
            }
          } catch (e) {}
        }
      }

      if (activeSnapData && !isExplicitlyBlocked) {
        activeSnapData.isWhitelisted = true;
        activeSnapData.is_whitelisted = true;
        if (!activeSnapData.status) activeSnapData.status = 'active';
      }

      if (isExplicitlyBlocked) {
        safeLocalStorage.removeItem(cacheKey);
        setSubscriptionDetails({
          subscriptionType: 'guest_trial',
          subscriptionStart: null,
          unlimitedDownloads: false,
          subscriptionEnd: null,
          isSubscriptionExpired: true,
          daysRemaining: 0,
          hoursRemaining: 0,
          circleDownloadsLimit: 6,
          circleDownloadsCount: totalDownloadsRef.current,
          isTrialMode: true,
        });
        setIsWhitelisted(false);
        setUserType('guest');
        setRegisteredGrades(['Trial Access']);
        toast.error("Your subscription or access has been suspended by the administrator.");
        return;
      }

      if (activeSnapData || isDeveloper) {
        const snapData = activeSnapData || {
          subscriptionType: 'unlimited',
          unlimitedDownloads: true,
          status: 'active'
        };
        
        // Calculate the timeframe we need to count downloads for
        let startMs = Date.now();
        if (snapData.subscriptionStart) {
          if (typeof snapData.subscriptionStart.toDate === 'function') {
            startMs = snapData.subscriptionStart.toDate().getTime();
          } else if (typeof snapData.subscriptionStart === 'number') {
            startMs = snapData.subscriptionStart;
          } else if (snapData.subscriptionStart.seconds !== undefined) {
            startMs = snapData.subscriptionStart.seconds * 1000;
          } else if (snapData.subscriptionStart._seconds !== undefined) {
            startMs = snapData.subscriptionStart._seconds * 1000;
          } else {
            startMs = new Date(snapData.subscriptionStart).getTime();
          }
        } else if (snapData.addedAt) {
          if (typeof snapData.addedAt.toDate === 'function') {
            startMs = snapData.addedAt.toDate().getTime();
          } else if (typeof snapData.addedAt === 'number') {
            startMs = snapData.addedAt;
          } else if (snapData.addedAt.seconds !== undefined) {
            startMs = snapData.addedAt.seconds * 1000;
          } else if (snapData.addedAt._seconds !== undefined) {
            startMs = snapData.addedAt._seconds * 1000;
          } else {
            startMs = new Date(snapData.addedAt).getTime();
          }
        }
        
        if (isNaN(startMs) || startMs <= 0) {
          startMs = Date.now();
        }
        
        const startTimestamp = Timestamp.fromMillis(startMs);

        // Fetch circle count in real-time, grouping by grade
        const qCircle = query(
          collection(db, 'users', user.uid, 'downloads'), 
          where('timestamp', '>=', startTimestamp)
        );
        
        unsubDownloadsRef.current = onSnapshot(qCircle, async (circleSnap) => {
          let cCount = 0;
          let gradeCounts: { [grade: string]: number } = {};
          const countedTypes = ['lesson_plan', 'schemes_of_work', 'weekly_forecast', 'lesson_notes', 'catch_up', 'individual_work_plan', 'assessments'];
          
          circleSnap.forEach(dDoc => {
            const d = dDoc.data();
            const type = d.type || '';
            if (countedTypes.includes(type)) {
              cCount++;
              const gName = (d.grade || '').trim();
              if (gName) {
                gradeCounts[gName] = (gradeCounts[gName] || 0) + 1;
              }
            }
          });

          setCircleDownloadsCount(cCount);

          const details = calculateSubscription(snapData, cCount, gradeCounts);
          details.isTrialMode = false;
          setSubscriptionDetails(details);
          
          const finalGrades = ['all'];
          setRegisteredGrades(finalGrades);
          setIsWhitelisted(true);
          setUserType(isDeveloper ? 'developer' : 'registered');

          // Sync to user profile for developer monitoring (non-blocking)
          try {
            const cleanEmail = (user.email || '').toLowerCase().trim().replace(/\s+/g, '');
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: cleanEmail,
              teaching_grade: finalGrades.join(', '),
              is_whitelisted: true,
              isWhitelisted: true,
              user_type: isDeveloper ? 'developer' : 'registered',
              subscriptionType: snapData.subscriptionType || 'guest_trial',
              lastHeartbeat: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn("Could not sync grade to user profile (non-blocking):", e);
          }

          // Update cache
          try {
            safeLocalStorage.setItem(cacheKey, JSON.stringify({ details, grades: finalGrades }));
            safeLocalStorage.setItem(`eduplan_subscription_cache_${user.uid}`, JSON.stringify({ details, grades: finalGrades }));
          } catch (e) {}
        }, (err) => {
          let cachedCount = 0;
          let cachedGradeCounts: { [grade: string]: number } = {};
          try {
            const countCacheKey = `eduplan_total_downloads_${user.uid}`;
            const countVal = safeLocalStorage.getItem(countCacheKey);
            if (countVal) {
              cachedCount = parseInt(countVal, 10);
            }
            
            const subCache = safeLocalStorage.getItem(`eduplan_sub_cache_${normEmail}`) || safeLocalStorage.getItem(`eduplan_subscription_cache_${user.uid}`);
            if (subCache) {
              const parsed = JSON.parse(subCache);
              if (parsed && parsed.details && parsed.details.gradeCounts) {
                cachedGradeCounts = parsed.details.gradeCounts;
              }
            }
          } catch (e) {
            console.warn("Error reading cached downloads count on query failure:", e);
          }

          setCircleDownloadsCount(cachedCount);
          const details = calculateSubscription(snapData, cachedCount, cachedGradeCounts);
          details.isTrialMode = false;
          setSubscriptionDetails(details);

          // All registered users get all grades (ECE levels to Form 4)
          const finalGrades = ['all'];
          setRegisteredGrades(finalGrades);
          setIsWhitelisted(true);
          setUserType('registered');

          // Persist the calculated details to cache on error so that next reload doesn't show 0
          try {
            safeLocalStorage.setItem(cacheKey, JSON.stringify({ details, grades: finalGrades }));
            safeLocalStorage.setItem(`eduplan_subscription_cache_${user.uid}`, JSON.stringify({ details, grades: finalGrades }));
          } catch (e) {
            console.warn("Failed to update subscription cache in error handler:", e);
          }

          const errStr = err?.message || String(err);
          const isQuota = checkIsQuotaError(err);
          const isNetworkOrAuth = errStr.includes('network-request-failed') ||
                                 errStr.includes('Fetching auth token failed') ||
                                 errStr.includes('Could not reach Cloud Firestore backend');

          if (isQuota) {
            console.warn("Real-time downloads listener paused (Quota Exceeded). Using cached details.");
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
            }
          } else if (isNetworkOrAuth) {
            console.warn("Real-time downloads listener offline/network notice. Using cached details.");
          } else {
            console.error("Real-time downloads listener error:", err);
          }
        });
      } else {
        // Only if user has neither whitelist record, nor user profile subscription, nor cache
        const cached = safeLocalStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { details, grades } = JSON.parse(cached);
            setSubscriptionDetails(details);
            setRegisteredGrades(grades || ['all']);
            setIsWhitelisted(true);
            setUserType('registered');
            return;
          } catch (e) {}
        }

        // True guest user with no subscription
        let cCount = totalDownloadsRef.current;
        setSubscriptionDetails({
          subscriptionType: 'guest_trial',
          subscriptionStart: null,
          unlimitedDownloads: false,
          subscriptionEnd: null,
          isSubscriptionExpired: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          circleDownloadsLimit: 6,
          circleDownloadsCount: cCount,
          isTrialMode: true,
        });
        setCircleDownloadsCount(cCount);
        setIsWhitelisted(false);
        setUserType('guest');
        setRegisteredGrades(['Trial Access']);
      }
    }, (error: any) => {
      const errStr = error?.message || String(error);
      const isQuota = checkIsQuotaError(error);
      const isNetworkOrAuth = errStr.includes('network-request-failed') ||
                             errStr.includes('Fetching auth token failed') ||
                             errStr.includes('Could not reach Cloud Firestore backend');

      if (isQuota) {
        console.warn("Subscription listener paused (Quota Exceeded). Using cached details.");
        setIsQuotaExceeded(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
        }
      } else if (isNetworkOrAuth) {
        console.warn("Subscription listener offline/network notice. Using cached details.");
      } else {
        console.error("Subscription listener error:", error);
      }

      // For whitelisted users with cache, restore cached subscription truthfully
      try {
        let cachedCount = 0;
        let cachedGradeCounts: { [grade: string]: number } = {};
        try {
          const countCacheKey = `eduplan_total_downloads_${user.uid}`;
          const countVal = safeLocalStorage.getItem(countCacheKey);
          if (countVal) {
            cachedCount = parseInt(countVal, 10);
          }
          const subCache = safeLocalStorage.getItem(`eduplan_sub_cache_${normEmail}`) || safeLocalStorage.getItem(`eduplan_subscription_cache_${user.uid}`);
          if (subCache) {
            const parsed = JSON.parse(subCache);
            if (parsed && parsed.details && parsed.details.gradeCounts) {
              cachedGradeCounts = parsed.details.gradeCounts;
            }
          }
        } catch (e) {}

        const localWhitelisted = getWhitelistedGuestFromLocalCache(normEmail) || getWhitelistedGuestFromLocalCache(cleanEmail);
        if (localWhitelisted && !localWhitelisted.isBlocked) {
          const details = calculateSubscription(localWhitelisted, cachedCount, cachedGradeCounts);
          details.isTrialMode = false;
          setSubscriptionDetails(details);
          setCircleDownloadsCount(cachedCount);
          setRegisteredGrades(['all']);
          setIsWhitelisted(true);
          setUserType(isDeveloper ? 'developer' : 'registered');
          return;
        }

        const cacheKey = `eduplan_sub_cache_${normEmail}`;
        const subCache = safeLocalStorage.getItem(cacheKey) || safeLocalStorage.getItem(`eduplan_subscription_cache_${user.uid}`);
        if (subCache) {
          const parsed = JSON.parse(subCache);
          const cachedDetails = parsed.details || parsed;
          if (cachedDetails && cachedDetails.subscriptionType && cachedDetails.subscriptionType !== 'guest_trial') {
            const details = calculateSubscription(cachedDetails, cachedCount, cachedGradeCounts);
            details.isTrialMode = false;
            setSubscriptionDetails(details);
            setCircleDownloadsCount(cachedCount);
            if (parsed.grades) setRegisteredGrades(parsed.grades);
            else setRegisteredGrades(['all']);
            setIsWhitelisted(true);
            setUserType(isDeveloper ? 'developer' : 'registered');
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to parse sub cache on subscription listener error:", e);
      }

      if (isDeveloper) {
        // Fallback active subscription for developer
        const fallbackStart = new Date();
        const fallbackEnd = new Date(fallbackStart.getTime() + 365 * 24 * 60 * 60 * 1000);
        const activeDetails = {
          subscriptionType: 'unlimited',
          subscriptionStart: fallbackStart,
          unlimitedDownloads: true,
          subscriptionEnd: fallbackEnd,
          isSubscriptionExpired: false,
          isQuotaExhausted: false,
          daysRemaining: 365,
          hoursRemaining: 8760,
          circleDownloadsLimit: 999999,
          circleDownloadsCount: 0,
          isTrialMode: false,
          allowedTools: ['all'],
          amountPaid: 0,
          paymentMethod: 'Developer',
          subscriptionIndex: 1,
          baseLimit: 999999,
          isGradeSpecific: false,
          gradeCounts: {},
          gradesList: ['all'],
        };
        setSubscriptionDetails(activeDetails);
        setIsWhitelisted(true);
        setUserType('registered');
        setRegisteredGrades(['all']);
      } else {
        // Trial user remains in Trial Access mode
        setSubscriptionDetails({
          subscriptionType: 'guest_trial',
          subscriptionStart: null,
          unlimitedDownloads: false,
          subscriptionEnd: null,
          isSubscriptionExpired: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          circleDownloadsLimit: 6,
          circleDownloadsCount: totalDownloadsRef.current,
          isTrialMode: true,
          allowedTools: [],
          amountPaid: 0,
          paymentMethod: 'N/A',
          subscriptionIndex: 1,
          baseLimit: 6,
          isGradeSpecific: false,
          gradeCounts: {},
          gradesList: ['Trial Access'],
        });
        setIsWhitelisted(false);
        setUserType('guest');
        setRegisteredGrades(['Trial Access']);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDownloadsRef.current) {
        unsubDownloadsRef.current();
      }
    };
  }, [user?.uid, authTriggerCount]);


  const effectiveIsWhitelisted = isWhitelisted && subscriptionDetails && !subscriptionDetails.isTrialMode && subscriptionDetails.subscriptionType !== 'guest_trial';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      registeredGrades, 
      isWhitelisted: effectiveIsWhitelisted, 
      userType, 
      signInWithGoogle, 
      signInAsGuest, 
      logout,
      downloadRecords,
      totalDownloads,
      circleDownloadsCount,
      refreshDownloads,
      incrementLocalDownloads,
      subscriptionDetails,
      isQuotaExceeded,
      globalConfig,
      informantData,
      updateInformantData,
      switchSubscriptionCircle,
      isLoggingIn,
      authError,
      refreshSubscription
    }}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1F5F9]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[#00A86B] rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-black text-slate-700 tracking-wider uppercase">FORTUNES EDUTECH</h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1 uppercase animate-pulse">Initializing Platform...</p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
