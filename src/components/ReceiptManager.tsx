import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Receipt, 
  Download, 
  Plus, 
  Trash2, 
  CreditCard, 
  Calendar, 
  User, 
  School, 
  FileText, 
  CheckCircle2, 
  Printer, 
  X,
  History,
  Sparkles,
  Info,
  Mail,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';
import { safeLocalStorage } from '../lib/storage';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ADMIN_EMAIL } from '../constants';
import { saveAs } from 'file-saver';
import { loadHtml2Pdf } from '../lib/pdfLoader';
import { shareOrSavePdfBlob } from '../lib/pdfShareHelper';
import { prepareDocumentForPdfExport, sanitizeClonedDoc } from '../lib/pdfUtils';

export interface ReceiptData {
  id?: string;
  schoolName: string;
  payerName: string;
  payerEmail: string;
  paymentMethod: string;
  packageName: string;
  amount: number;
  referenceNumber: string;
  transactionDate: string;
  createdAt?: any;
  subscriptionType?: string;
  downloadsLimit?: number;
  allocatedGrades?: string;
  subscriptionDateTime?: string;
  subscriptionEndDateTime?: string;
  year?: string | number;
  term?: string;
}

interface ReceiptManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptManager({ isOpen, onClose }: ReceiptManagerProps) {
  const { user, subscriptionDetails, registeredGrades } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [schoolName, setSchoolName] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MTN Mobile Money');
  const [packageType, setPackageType] = useState('monthly');
  const [customPackageName, setCustomPackageName] = useState('');
  const [amount, setAmount] = useState(100);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Selection
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history');
  
  const receiptPreviewRef = useRef<HTMLDivElement>(null);

  // Generate dynamic automated reference code as F[YYYYMMDD]-SUB[0000][CircleCode]
  const generateReferenceCode = (subType: string, index: number) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const codeMap: Record<string, string> = {
      weekly: 'W',
      '14days': 'D',
      monthly: 'M',
      termly: 'T',
      unlimited: 'U'
    };
    const circleCode = codeMap[subType] || 'X';
    const seqStr = String(index).padStart(4, '0');

    return `F${dateStr}-SUB${seqStr}${circleCode}`;
  };

  // Helper to format payer name from email prefix cleanly (e.g. kombefortune9 -> kombe fortune)
  const formatPayerNameFromEmail = (email: string | null | undefined): string => {
    if (!email) return 'Guest';
    let prefix = email.split('@')[0];
    
    // 1. Remove trailing numbers
    prefix = prefix.replace(/\d+$/, ''); // e.g. kombefortune9 -> kombefortune
    
    // 2. Separate into "surname space first name"
    if (prefix.toLowerCase() === 'kombefortune') {
      return 'kombe fortune';
    }
    
    if (prefix.includes('.')) {
      return prefix.split('.').map(p => p.trim()).filter(Boolean).join(' ');
    }
    if (prefix.includes('_')) {
      return prefix.split('_').map(p => p.trim()).filter(Boolean).join(' ');
    }
    if (prefix.includes('-')) {
      return prefix.split('-').map(p => p.trim()).filter(Boolean).join(' ');
    }
    
    const surnames = ['kombe', 'mulenga', 'banda', 'phiri', 'mwale', 'kapambwe', 'chilufya', 'lundu', 'tembo', 'bwalya', 'mumba'];
    const firstNames = ['fortune', 'gift', 'chansa', 'john', 'mary', 'grace', 'moses', 'peter', 'sarah', 'david', 'emmanuel'];
    
    for (const sur of surnames) {
      if (prefix.toLowerCase().startsWith(sur)) {
        const rest = prefix.substring(sur.length);
        if (rest.length > 0) {
          return `${sur} ${rest}`;
        }
      }
    }
    
    for (const fn of firstNames) {
      if (prefix.toLowerCase().endsWith(fn)) {
        const start = prefix.substring(0, prefix.length - fn.length);
        if (start.length > 0) {
          return `${start} ${fn}`;
        }
      }
    }
    
    return prefix;
  };

  // Helper to dynamically calculate subscription cycle end date and time
  const getSubscriptionEndDateTime = (receipt: ReceiptData): string => {
    if (receipt.subscriptionEndDateTime) return receipt.subscriptionEndDateTime;
    
    let start: Date;
    if (receipt.subscriptionDateTime) {
      start = new Date(receipt.subscriptionDateTime);
      if (isNaN(start.getTime())) {
        start = new Date(receipt.transactionDate + 'T08:30:00');
      }
    } else if (receipt.transactionDate) {
      start = new Date(receipt.transactionDate + 'T08:30:00');
    } else {
      start = new Date();
    }

    const type = receipt.subscriptionType || '';
    const name = (receipt.packageName || '').toLowerCase();
    
    let durationMs = 0;
    if (type === 'weekly' || name.includes('weekly')) {
      durationMs = 7 * 24 * 60 * 60 * 1000;
    } else if (type === '14days' || name.includes('14-day') || name.includes('14days')) {
      durationMs = 14 * 24 * 60 * 60 * 1000;
    } else if (type === 'monthly' || name.includes('monthly')) {
      durationMs = 30 * 24 * 60 * 60 * 1000;
    } else if (type === 'termly' || name.includes('termly')) {
      durationMs = 90 * 24 * 60 * 60 * 1000;
    } else if (type === 'unlimited' || name.includes('unlimited') || name.includes('whole school')) {
      durationMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years later
    } else {
      durationMs = 30 * 24 * 60 * 60 * 1000; // default to monthly
    }

    const end = new Date(start.getTime() + durationMs);
    return end.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Populate default fields based on user info & active subscription
  useEffect(() => {
    if (user) {
      const formattedName = user.displayName || formatPayerNameFromEmail(user.email);
      setPayerName(formattedName);
      setPayerEmail(user.email || '');
      
      const subType = subscriptionDetails?.subscriptionType || 'guest_trial';
      const refNum = generateReferenceCode(subType, receipts.length + 1);
      setReferenceNumber(refNum);
      setSchoolName('');

      if (subscriptionDetails) {
        if (subType !== 'guest_trial') {
          setPackageType(subType);
        }
      }
    }
  }, [user, subscriptionDetails, receipts.length]);

  // Adjust default amounts based on packageType
  useEffect(() => {
    if (packageType === 'weekly') {
      setAmount(20);
    } else if (packageType === '14days') {
      setAmount(40);
    } else if (packageType === 'monthly') {
      setAmount(90);
    } else if (packageType === 'termly') {
      setAmount(800);
    } else if (packageType === 'unlimited') {
      setAmount(1500);
    }
  }, [packageType]);

  // Helper to format date and time string matching Dashboard card format
  const formatDateTimeStamp = (dateVal: Date | string | number | null | undefined): string => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Cache key helper
  const getCacheKey = () => `eduplan_receipts_${user?.email || user?.uid || 'default'}`;

  const getLocalReceipts = (): ReceiptData[] => {
    try {
      const raw = safeLocalStorage.getItem(getCacheKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  };

  const saveLocalReceipts = (list: ReceiptData[]) => {
    try {
      safeLocalStorage.setItem(getCacheKey(), JSON.stringify(list));
    } catch {}
  };

  // Helper for network queries with strict timeout (never hang UI on slow networks)
  const withTimeout = async <T,>(promise: Promise<T>, ms: number = 2500): Promise<T | null> => {
    let timer: any;
    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), ms);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timer);
    }
  };

  // Helper to build active subscription receipt dynamically based on subscriptionDetails or current user
  const buildActiveReceipt = (): ReceiptData => {
    const isDev = isDeveloperEmail(user?.email) || user?.email === ADMIN_EMAIL;
    const subType = (subscriptionDetails?.subscriptionType && subscriptionDetails.subscriptionType !== 'guest_trial')
      ? subscriptionDetails.subscriptionType
      : (isDev ? 'unlimited' : 'termly');

    const subStart = subscriptionDetails?.subscriptionStart 
      ? new Date(subscriptionDetails.subscriptionStart) 
      : new Date();
    
    let subEnd: Date;
    if (subscriptionDetails?.subscriptionEnd) {
      subEnd = new Date(subscriptionDetails.subscriptionEnd);
    } else {
      const durationMs = subType === 'weekly' ? 7 * 86400000 :
                         subType === '14days' ? 14 * 86400000 :
                         subType === 'monthly' ? 30 * 86400000 :
                         subType === 'termly' || subType === 'termly_individual' ? 90 * 86400000 :
                         10 * 365 * 86400000;
      subEnd = new Date(subStart.getTime() + durationMs);
    }

    const yyyy = subStart.getFullYear();
    const mm = String(subStart.getMonth() + 1).padStart(2, '0');
    const dd = String(subStart.getDate()).padStart(2, '0');
    const dateYmd = `${yyyy}-${mm}-${dd}`;
    const dateCompact = `${yyyy}${mm}${dd}`;

    const codeMap: Record<string, string> = {
      weekly: 'W',
      '14days': '14D',
      monthly: 'M',
      termly: 'T',
      termly_individual: 'TI',
      unlimited: 'U'
    };
    const circleCode = codeMap[subType] || 'T';
    const subIndex = subscriptionDetails?.subscriptionIndex || 1;
    const refNum = `F${dateCompact}-SUB${String(subIndex).padStart(4, '0')}${circleCode}`;

    const packageNameMapped = 
      subType === '14days' ? '14 Days Circle Access' :
      subType === 'monthly' ? 'Monthly Circle Access' :
      'Termly Circle Access (with Assignment & Research Hub)';

    let autoAmount = 180;
    if (subType === '14days') autoAmount = 40;
    else if (subType === 'monthly') autoAmount = 70;
    else if (subType === 'termly' || subType === 'termly_individual') autoAmount = 180;

    if (subscriptionDetails?.amountPaid !== undefined && subscriptionDetails.amountPaid > 0) {
      autoAmount = subscriptionDetails.amountPaid;
    }

    const limit = subscriptionDetails?.circleDownloadsLimit || (
      subType === '14days' ? 75 :
      subType === 'monthly' ? 160 :
      300
    );

    const finalPayerName = user?.displayName || formatPayerNameFromEmail(user?.email) || 'Mr. Fortune Kombe';
    const gradesAllocated = 'All Grades (ECE Level 1 to Form 6 (A Level))';

    return {
      id: `active-sub-${user?.uid || 'user'}`,
      schoolName: '',
      payerName: finalPayerName,
      payerEmail: user?.email || ADMIN_EMAIL,
      paymentMethod: subscriptionDetails?.paymentMethod || 'Mobile Money - MTN (Lipila)',
      packageName: packageNameMapped,
      amount: autoAmount,
      referenceNumber: refNum,
      transactionDate: dateYmd,
      subscriptionType: subType,
      downloadsLimit: limit,
      allocatedGrades: gradesAllocated,
      subscriptionDateTime: formatDateTimeStamp(subStart),
      subscriptionEndDateTime: formatDateTimeStamp(subEnd),
    };
  };

  // Load receipts from Firestore (Non-blocking background sync)
  const loadReceipts = async (isManualSync: boolean = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const activeReceipt = buildActiveReceipt();
      const currentMap = new Map<string, ReceiptData>();
      if (activeReceipt) {
        currentMap.set(activeReceipt.referenceNumber, activeReceipt);
      }

      // Pre-seed with any local receipts
      const cached = getLocalReceipts();
      cached.forEach(c => {
        if (!currentMap.has(c.referenceNumber)) {
          currentMap.set(c.referenceNumber, c);
        }
      });

      // 1. Load from the active logged-in user's subcollection with timeout
      try {
        const qReceipts = query(collection(db, 'users', user.uid, 'receipts'));
        const snap = await withTimeout(getDocs(qReceipts), 2500);
        if (snap) {
          snap.forEach((docSnap) => {
            const data = docSnap.data() as any;
            const refNum = data.referenceNumber || data.receiptNumber || docSnap.id;
            const item: ReceiptData = {
              id: docSnap.id,
              schoolName: data.schoolName || '',
              payerName: data.payerName || user.displayName || 'Teacher',
              payerEmail: data.payerEmail || user.email || '',
              paymentMethod: data.paymentMethod || 'Mobile Money - MTN (Lipila)',
              packageName: data.packageName || data.packageType || 'Premium Cycle Access',
              amount: Number(data.amount || 0),
              referenceNumber: refNum,
              transactionDate: data.transactionDate || data.date || new Date().toISOString().split('T')[0],
              createdAt: data.createdAt,
              subscriptionType: data.subscriptionType || data.packageType,
              downloadsLimit: data.downloadsLimit,
              allocatedGrades: data.allocatedGrades || 'All Grades',
              subscriptionDateTime: data.subscriptionDateTime,
              subscriptionEndDateTime: data.subscriptionEndDateTime,
            };
            currentMap.set(refNum, item);
          });
        }
      } catch (err) {
        console.warn("User receipts fetch warning:", err);
      }

      // 2. Load from global receipts collection where payerEmail matches user's email
      if (user.email) {
        try {
          const qGlobal = query(
            collection(db, 'receipts'),
            where('payerEmail', '==', user.email)
          );
          const globalSnap = await withTimeout(getDocs(qGlobal), 2500);
          if (globalSnap) {
            globalSnap.forEach((docSnap) => {
              const data = docSnap.data() as any;
              const refNum = data.referenceNumber || data.receiptNumber || docSnap.id;
              const item: ReceiptData = {
                id: docSnap.id,
                schoolName: data.schoolName || '',
                payerName: data.payerName || user.displayName || 'Teacher',
                payerEmail: data.payerEmail || user.email || '',
                paymentMethod: data.paymentMethod || 'Mobile Money - MTN (Lipila)',
                packageName: data.packageName || data.packageType || 'Premium Cycle Access',
                amount: Number(data.amount || 0),
                referenceNumber: refNum,
                transactionDate: data.transactionDate || data.date || new Date().toISOString().split('T')[0],
                createdAt: data.createdAt,
                subscriptionType: data.subscriptionType || data.packageType,
                downloadsLimit: data.downloadsLimit,
                allocatedGrades: data.allocatedGrades || 'All Grades',
                subscriptionDateTime: data.subscriptionDateTime,
                subscriptionEndDateTime: data.subscriptionEndDateTime,
              };
              currentMap.set(refNum, item);
            });
          }
        } catch (err) {
          console.warn("Global receipts fetch warning:", err);
        }
      }

      const mergedList = Array.from(currentMap.values());
      // Sort in memory: newest first, keeping active receipt top
      mergedList.sort((a, b) => {
        if (a.id?.startsWith('active-sub-')) return -1;
        if (b.id?.startsWith('active-sub-')) return 1;
        return (b.transactionDate || '').localeCompare(a.transactionDate || '');
      });

      if (mergedList.length > 0) {
        setReceipts(mergedList);
        saveLocalReceipts(mergedList);
        setSelectedReceipt(prev => {
          if (prev && mergedList.some(r => r.id === prev.id || r.referenceNumber === prev.referenceNumber)) {
            return prev;
          }
          return mergedList[0];
        });
      }

      if (isManualSync) {
        toast.success("Receipts synchronized successfully!");
      }
    } catch (err) {
      console.error("Error loading receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Instantly populate receipts on open or tab change, followed by background sync
  useEffect(() => {
    if (!isOpen) return;

    const activeReceipt = buildActiveReceipt();
    const cached = getLocalReceipts();
    const initialList: ReceiptData[] = [];
    
    if (activeReceipt) {
      initialList.push(activeReceipt);
    }
    cached.forEach(c => {
      if (!initialList.some(r => r.id === c.id || r.referenceNumber === c.referenceNumber)) {
        initialList.push(c);
      }
    });

    setReceipts(initialList);
    setSelectedReceipt(prev => prev || initialList[0] || activeReceipt);
    saveLocalReceipts(initialList);

    // Non-blocking background sync from Firestore
    if (user) {
      loadReceipts();
    }
  }, [isOpen, user?.uid, user?.email, subscriptionDetails?.subscriptionType]);

  // Auto-generate / sync active subscription receipt in background if whitelisted
  useEffect(() => {
    const autoGen = async () => {
      if (!user) return;
      const activeReceipt = buildActiveReceipt();
      if (!activeReceipt) return;

      try {
        const qCheck = query(
          collection(db, 'users', user.uid, 'receipts'),
          where('referenceNumber', '==', activeReceipt.referenceNumber)
        );
        const checkSnap = await withTimeout(getDocs(qCheck), 2500);
        if (checkSnap && checkSnap.empty) {
          await addDoc(collection(db, 'users', user.uid, 'receipts'), {
            ...activeReceipt,
            createdAt: serverTimestamp()
          }).catch(() => {});
          await addDoc(collection(db, 'receipts'), {
            ...activeReceipt,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Background receipt sync notice:", err);
      }
    };

    autoGen();
  }, [user?.uid, subscriptionDetails?.subscriptionType]);

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!payerName.trim()) {
      toast.error("Please enter the payer's name.");
      return;
    }
    if (!referenceNumber.trim()) {
      toast.error("Please provide or generate a reference number.");
      return;
    }

    setSaving(true);
    const packageNameMapped = 
      packageType === 'weekly' ? 'Weekly Premium Cycle Access' :
      packageType === '14days' ? '14-Day Cycle Premium Access' :
      packageType === 'monthly' ? 'Monthly Premium Cycle Access' :
      packageType === 'termly' ? 'Termly Elite Cycle Access' :
      packageType === 'unlimited' ? 'Whole School Unlimited Access' :
      customPackageName || 'Fortunes Edutech Custom Subscription Pack';

    const subType = subscriptionDetails?.subscriptionType || 'guest_trial';
    const subLimit = subscriptionDetails?.circleDownloadsLimit || 6;
    const gradesAllocated = registeredGrades && registeredGrades.length > 0 ? registeredGrades.join(', ') : 'Trial Access';

    const subStart = subscriptionDetails?.subscriptionStart 
      ? new Date(subscriptionDetails.subscriptionStart) 
      : new Date(transactionDate);
    const subDateTimeStr = subStart.toLocaleString([], { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const targetEmail = payerEmail.trim() || user.email || '';

    const newReceipt: ReceiptData = {
      schoolName: '',
      payerName: payerName.trim(),
      payerEmail: targetEmail,
      paymentMethod,
      packageName: packageNameMapped,
      amount,
      referenceNumber: referenceNumber.trim(),
      transactionDate,
      subscriptionType: subType,
      downloadsLimit: subLimit,
      allocatedGrades: gradesAllocated,
      subscriptionDateTime: subDateTimeStr,
    };
    newReceipt.subscriptionEndDateTime = getSubscriptionEndDateTime(newReceipt);

    try {
      // 1. Save to the global 'receipts' collection so it exists globally by email
      const globalDocRef = await addDoc(collection(db, 'receipts'), {
        ...newReceipt,
        createdAt: serverTimestamp()
      });

      // 2. Query 'users' collection to see if a registered user exists with this email
      let targetUid = user.uid; // fallback
      let hasTargetUser = false;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', targetEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          targetUid = querySnapshot.docs[0].id;
          hasTargetUser = true;
        }
      } catch (e) {
        console.warn("Could not check for registered user UID:", e);
      }

      // 3. Save to their user-specific 'receipts' subcollection
      let savedDocId = globalDocRef.id;
      try {
        const subDocRef = await addDoc(collection(db, 'users', targetUid, 'receipts'), {
          ...newReceipt,
          createdAt: serverTimestamp()
        });
        if (!hasTargetUser) {
          savedDocId = subDocRef.id;
        }
      } catch (err) {
        console.warn("Could not save to user subcollection:", err);
      }
      
      const saved: ReceiptData = { ...newReceipt, id: savedDocId };
      setReceipts(prev => [saved, ...prev]);
      setSelectedReceipt(saved);
      toast.success("Receipt generated and saved successfully!");
      
      // Auto switch view or tab
      setActiveTab('history');
      // Regenerate reference for next time
      setReferenceNumber(generateReferenceCode(packageType, receipts.length + 2));
    } catch (err) {
      console.error("Failed to save receipt:", err);
      toast.error("Failed to save receipt in cloud. Please retry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReceipt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;

    if (!window.confirm("Are you sure you want to delete this receipt from your history?")) {
      return;
    }

    try {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'receipts', id));
      } catch (err) {
        console.warn("Could not delete from user receipts subcollection:", err);
      }
      try {
        await deleteDoc(doc(db, 'receipts', id));
      } catch (err) {
        console.warn("Could not delete from root receipts collection:", err);
      }
      setReceipts(prev => prev.filter(r => r.id !== id));
      if (selectedReceipt?.id === id) {
        setSelectedReceipt(null);
      }
      toast.success("Receipt removed.");
    } catch (err) {
      console.error("Error deleting receipt:", err);
      toast.error("Could not delete the receipt record.");
    }
  };

  // Download receipt as PDF directly to phone storage using html2pdf
  const handleDownloadPDF = async (receipt: ReceiptData) => {
    toast.success("To download a selectable PDF, please choose 'Save as PDF' in the print dialog.", { duration: 5000 });
    setTimeout(() => {
      handlePrint(receipt);
    }, 1500);
  };

  const handlePrint = (receipt: ReceiptData) => {
    const finalGrades = 'All Grades (ECE Level 1 to Form 6 (A Level))';
    const finalLimit = receipt.downloadsLimit || 
      (receipt.packageName.includes('Weekly') ? 30 :
       receipt.packageName.includes('14-Day') || receipt.packageName.includes('14days') ? 60 :
       receipt.packageName.includes('Monthly') ? 120 :
       receipt.packageName.includes('Termly') ? 300 :
       receipt.packageName.includes('Yearly') ? 1500 :
       receipt.packageName.includes('Unlimited') ? 999999 : 30);
    const finalLimitStr = finalLimit === 999999 ? 'Unlimited Access' : `${finalLimit} Downloads`;

    const generationDateTime = new Date().toLocaleString([], { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    const subDateTime = receipt.subscriptionDateTime || 
      (receipt.transactionDate 
        ? `${new Date(receipt.transactionDate).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })} 08:30 AM` 
        : generationDateTime);

    const subEndDateTime = getSubscriptionEndDateTime(receipt);

    const receiptHtml = `
      <div class="print-container" style="max-width: 650px; margin: 0 auto; padding: 1.5rem; background: white; border: 1px solid #cbd5e1; border-radius: 1rem; position: relative; box-sizing: border-box;">
        
        <!-- Header Strip -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="background: linear-gradient(135deg, #064223, #00A86B); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; border: 1px solid rgba(16, 185, 129, 0.4); shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 50 15 L 85 32 L 50 49 L 15 32 Z" fill="#76E000" />
                  <path d="M 28 42 L 28 68 C 28 75, 72 75, 72 68 L 72 42" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
                  <path d="M 85 32 L 85 58" stroke="#76E000" stroke-width="5" stroke-linecap="round" />
                </svg>
              </div>
              <h1 style="font-size: 20px; font-weight: 900; letter-spacing: -0.05em; color: #0f172a; margin: 0;">FORTUNES <span style="color: #10b981;">EDUTECH</span></h1>
            </div>
            <p style="font-size: 9px; font-weight: 800; color: #00A86B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px 0;">Zambia national curriculum support system web app</p>
            <p style="font-size: 9px; color: #94a3b8; margin: 0;">PACRA BN No.: 320261079581 | ZRA TPIN: 1005958991 | WhatsApp Activations: +260 96 1622222 | Lusaka, Zambia</p>
          </div>
          <div style="text-align: right;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; display: inline-block; letter-spacing: 0.05em;">
              TAX INVOICE & RECEIPT
            </div>
            <p style="font-size: 10px; color: #64748b; margin: 6px 0 0 0;">Receipt No: <strong style="color: #0f172a;">${receipt.referenceNumber}</strong></p>
            <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Date: <strong style="color: #0f172a;">${receipt.transactionDate}</strong></p>
          </div>
        </div>

        <!-- Concentric Circular Rubber Stamp (Outer circle, inside circle, dashed center circle) -->
        <div style="position: absolute; top: 12%; right: 8%; transform: rotate(-12deg); border: 2.5px solid #059669; border-radius: 9999px; width: 126px; height: 126px; display: flex; align-items: center; justify-content: center; background: rgba(236, 253, 245, 0.95); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); z-index: 10; text-align: center; padding: 3px;">
          <div style="border: 1.5px solid #10b981; border-radius: 9999px; width: 114px; height: 114px; display: flex; align-items: center; justify-content: center; padding: 2px;">
            <div style="border: 1.5px dashed #059669; border-radius: 9999px; width: 100px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px;">
              <span style="font-size: 6.5px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 0.06em;">FORTUNES EDUTECH</span>
              <span style="font-size: 11px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.1em; margin: 1px 0;">PAID</span>
              <span style="font-size: 6px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.02em;">@${receipt.year || 2026} ${(() => {
                const t = (receipt.term || 'Term 3').toLowerCase();
                if (t.includes('1') || t.includes('one')) return 'TERM ONE';
                if (t.includes('2') || t.includes('two')) return 'TERM TWO';
                return 'TERM THREE';
              })()}</span>
            </div>
          </div>
        </div>

        <!-- Client & Payer Info Grid (No School Name / No System Username) -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; margin-bottom: 1rem; background: #f8fafc; padding: 1rem; border-radius: 0.75rem; border: 1px solid #f1f5f9;">
          <div>
            <h3 style="font-size: 9px; font-weight: 800; text-transform: uppercase; tracking: 0.05em; color: #64748b; margin: 0 0 4px 0;">Authorized Payer Account:</h3>
            <p style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0;">${receipt.payerName}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0;">Email: ${receipt.payerEmail}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="font-size: 9px; font-weight: 800; text-transform: uppercase; tracking: 0.05em; color: #64748b; margin: 0 0 4px 0;">Payment Transaction:</h3>
            <p style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0;">Method: <strong>${receipt.paymentMethod}</strong></p>
            <p style="font-size: 10px; color: #10b981; font-weight: 800; margin: 2px 0 0 0;">STATUS: APPROVED</p>
          </div>
        </div>

        <!-- Subscription & Allocated Grades Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 1rem; background: #f0fdf4; padding: 0.75rem; border-radius: 0.75rem; border: 1px solid #bbf7d0;">
          <div>
            <h4 style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #166534; margin: 0 0 2px 0;">Subscription Activated:</h4>
            <p style="font-size: 11px; font-weight: 800; color: #14532d; margin: 0;">${receipt.packageName}</p>
          </div>
          <div>
            <h4 style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #166534; margin: 0 0 2px 0;">Subscription Circle Limit:</h4>
            <p style="font-size: 11px; font-weight: 800; color: #14532d; margin: 0;">${finalLimitStr}</p>
          </div>
          <div>
            <h4 style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #166534; margin: 0 0 2px 0;">Grades Allocated:</h4>
            <p style="font-size: 11px; font-weight: 800; color: #14532d; margin: 0;">${finalGrades}</p>
          </div>
        </div>

        <!-- Transaction Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 8px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b;">Item Description</th>
              <th style="padding: 8px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: center; width: 60px;">Qty</th>
              <th style="padding: 8px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: right; width: 100px;">Unit Price</th>
              <th style="padding: 8px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: right; width: 100px;">Total (ZMW)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; vertical-align: top;">
                <p style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0;">Fortunes Edutech Premium Cycle Access Activation</p>
                <p style="font-size: 9px; color: #64748b; margin: 0; line-height: 1.3;">Gives full digital generation of lesson plans, weekly forecasts, syllabi matrices, exams, and schemes of work mapped onto Fortunes Edutech educational standards.</p>
              </td>
              <td style="padding: 12px 0; text-align: center; font-size: 11px; font-weight: 600; color: #334155; vertical-align: top;">1</td>
              <td style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #334155; vertical-align: top;">ZMK ${receipt.amount.toFixed(2)}</td>
              <td style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 700; color: #0f172a; vertical-align: top;">ZMK ${receipt.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Summary & Signatures -->
        <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; border-top: 2px solid #f1f5f9; padding-top: 1rem; align-items: start;">
          <div>
            <!-- System Verification Stamp with fortunes edutech app name & received by F kombe -->
            <div style="border: 1.5px solid #10b981; border-radius: 0.5rem; padding: 8px 10px; background: #f0fdf4; color: #047857; font-family: monospace; display: inline-block; text-align: left; box-sizing: border-box; width: 100%; margin-bottom: 8px;">
              <div style="font-size: 8px; font-weight: 900; letter-spacing: 0.05em; color: #065f46; text-transform: uppercase; margin-bottom: 2px;">★ SYSTEM VERIFICATION STAMP ★</div>
              <div style="font-size: 7.5px; font-weight: 700; color: #0f766e; margin-bottom: 2px;">APP LICENSE: FORTUNES EDUTECH</div>
              <div style="font-size: 7.5px; color: #047857; font-weight: 800; margin-bottom: 1px;">RECEIVED BY: LIPILA PAYMENTS GATEWAY (LPL-${receipt.referenceNumber || '94821093'})</div>
              <div style="font-size: 7.5px; color: #047857; font-weight: 800; margin-bottom: 1px; text-transform: uppercase;">SUBSCRIPTION DATE & TIME: ${subDateTime}</div>
              <div style="font-size: 7.5px; color: #047857; font-weight: 800; margin-bottom: 1px; text-transform: uppercase;">SUBSCRIPTION CYCLE END: ${subEndDateTime}</div>
              <div style="font-size: 7.5px; color: #047857; font-weight: 800; text-transform: uppercase;">RECEIPT DOWNLOADED ON: ${new Date().toLocaleString()} (VERIFIED DIGITAL STAMP)</div>
            </div>
            <p style="font-size: 7.5px; color: #64748b; line-height: 1.3; margin: 0;">
              This document is an electronically generated receipt verified by Fortunes Edutech. Under Fortunes Edutech accounting standards, this serves as official proof of payment for teacher professional funding reimbursable allocations.
            </p>
          </div>
          <div style="text-align: right;">
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
              <p style="font-size: 8px; color: #64748b; margin: 0; font-family: monospace;">ZRA TPIN: <strong>1005958991</strong></p>
              <p style="font-size: 9px; color: #64748b; margin: 0;">Net Amount: <strong style="color: #334155;">ZMK ${(receipt.amount * 0.97).toFixed(2)}</strong></p>
              <p style="font-size: 9px; color: #64748b; margin: 0;">Business Tax / Turnover (3%): <strong style="color: #334155;">ZMK ${(receipt.amount * 0.03).toFixed(2)}</strong></p>
              <div style="width: 120px; height: 1px; background: #e2e8f0; margin: 4px 0;"></div>
              <p style="font-size: 11px; color: #0f172a; margin: 0;">Total Paid: <strong style="color: #10b981; font-weight: 900;">ZMK ${receipt.amount.toFixed(2)}</strong></p>
            </div>
            
            <div style="margin-top: 10px; display: inline-flex; flex-direction: column; align-items: center; text-align: center;">
              <!-- Official Stamp & Merchant Signature -->
              <div style="border: 1.5px dashed #059669; background: #ecfdf5; border-radius: 6px; padding: 4px 8px; margin-bottom: 4px;">
                <span style="font-family: monospace; font-size: 8.5px; font-weight: 900; color: #065f46; letter-spacing: 0.05em;">PAID VIA LIPILA</span>
              </div>
              <div style="border-top: 1px dashed #cbd5e1; padding-top: 4px; min-width: 120px;">
                <p style="font-family: 'Georgia', serif; font-style: italic; font-size: 11px; margin: 0 0 1px 0; color: #065f46; font-weight: bold;">Lipila Payments Gateway</p>
                <p style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Authorized MoMo Merchant</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Print utilizing our dynamic iframe helper
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const docObj = iframe.contentWindow?.document || iframe.contentDocument;
    if (!docObj) return;

    docObj.write(`
      <html>
        <head>
          <title>Payment Receipt - Fortunes Edutech</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #f8fafc;
              color: #1e293b;
              padding: 20px;
              margin: 0;
              box-sizing: border-box;
            }
            @media print {
              body { 
                background: white;
                padding: 0; 
                margin: 0;
              }
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              .print-container {
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div style="padding: 10px 0;">
            ${receiptHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 200);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    docObj.close();
    toast.success("Preparing receipt layout for print / PDF download!");
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] md:h-[80vh]"
      >
        {/* Header */}
        <div className="bg-[#032532] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Receipt size={18} className="sm:hidden" />
              <Receipt size={22} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-white leading-tight truncate">Official Payment Receipts</h2>
              <p className="text-[9px] sm:text-[10px] font-medium text-emerald-300 uppercase tracking-widest mt-0.5 truncate">Fortunes Edutech • Proof of Subscription</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            {user?.email === ADMIN_EMAIL && (
              <div className="hidden sm:flex bg-white/10 rounded-xl p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                    activeTab === 'history' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  History
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                    activeTab === 'create' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  Custom Creator
                </button>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-slate-300 hover:text-white transition-all border border-white/10"
            >
              <X size={16} className="sm:hidden" />
              <X size={18} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <div className="bg-slate-50 border-b border-slate-200/60 px-4 sm:px-6 py-2.5 sm:py-3 flex items-start sm:items-center gap-2 text-slate-500 text-[10px] sm:text-[11px] font-bold shrink-0">
          <Info size={13} className="text-emerald-500 animate-pulse mt-0.5 sm:mt-0 shrink-0" />
          <span className="leading-normal sm:leading-none">Your official payment receipts are automatically generated upon cycle activation. Download or print them directly below.</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Tab 1: Create Receipt Form */}
          {user?.email === ADMIN_EMAIL && activeTab === 'create' && (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
              
              {/* Form Side */}
              <form onSubmit={handleSaveReceipt} className="flex-1 space-y-4 max-w-md">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" />
                  Customize Receipt Details
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Customize the receipt details below to map onto your school requirements or personal reimbursement guidelines.
                </p>

                {/* Payer Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <User size={11} className="text-emerald-500" />
                      Payer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="e.g. Mr. Mwansa"
                      className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 text-slate-800 focus:outline-hidden"
                    />
                    <p className="text-[9px] text-slate-400 font-medium">Specify the receipt holder's name</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Mail size={11} className="text-emerald-500" />
                      Payer Email
                    </label>
                    <input
                      type="email"
                      required
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="e.g. teacher@example.com"
                      className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 text-slate-800 focus:outline-hidden"
                    />
                    <p className="text-[9px] text-slate-400 font-medium">Specify the user's login email</p>
                  </div>
                </div>

                {/* Grid for Method & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <CreditCard size={11} className="text-emerald-500" />
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setReferenceNumber(generateReferenceCode(packageType, receipts.length + 1));
                      }}
                      disabled={!isDeveloperEmail(user?.email)}
                      className="w-full text-xs font-black uppercase tracking-wider px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="MTN Mobile Money">MTN MoMo</option>
                      <option value="Airtel Mobile Money">Airtel MoMo</option>
                      <option value="Zamtel Mobile Money">Zamtel Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash Payment">Cash</option>
                      <option value="WhatsApp Direct Pay">WhatsApp Pay</option>
                    </select>
                    <p className="text-[9px] text-slate-400 font-bold leading-tight uppercase tracking-wider mt-1">
                      {isDeveloperEmail(user?.email) 
                        ? '🟢 AUTHORIZED: DEVELOPER ACCESS' 
                        : '🔒 LOCKED: MUST BE ENTERED BY DEVELOPER ONLY'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Calendar size={11} className="text-emerald-500" />
                      Payment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                {/* Package Option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <FileText size={11} className="text-emerald-500" />
                    Portal Cycle Package
                  </label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full text-xs font-black uppercase tracking-wider px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                  >
                    <option value="14days">14 Days Circle Access (ZMK 40 - 75 Downloads)</option>
                    <option value="monthly">Monthly Circle Access (ZMK 70 - 160 Downloads)</option>
                    <option value="termly">Termly Circle Access (ZMK 180 - 300 Downloads & Research Hub)</option>
                    <option value="custom">Custom Billing Agreement</option>
                  </select>
                </div>

                {packageType === 'custom' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Custom Pack Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customPackageName}
                        onChange={(e) => setCustomPackageName(e.target.value)}
                        placeholder="e.g. Whole-Year Joint School Syllabus Activation"
                        className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Amount field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Amount Paid (ZMW / Kwacha)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-xs font-black text-slate-400">K</span>
                    <input
                      type="number"
                      required
                      min="1"
                      disabled={packageType !== 'custom'}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="Amount"
                      className="w-full text-xs font-black px-8 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Ref ID */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Transaction Reference Number
                    </label>
                    <button
                      type="button"
                      onClick={() => setReferenceNumber(generateReferenceCode(packageType, receipts.length + 1))}
                      className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Reference e.g. MM100482918"
                    className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800 uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-500 hover:bg-[#00A86B] disabled:bg-emerald-300 text-white font-black uppercase tracking-wider text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all mt-4 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 size={16} />
                  {saving ? "Saving Receipt Record..." : "Confirm & Save Receipt"}
                </button>
              </form>

              {/* Form Live Preview Column */}
              <div className="hidden lg:flex flex-col flex-1 max-w-lg bg-slate-100 p-6 rounded-3xl border border-slate-200 justify-between">
                <div className="space-y-2 mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Invoice Preview</h4>
                  <p className="text-[11px] text-slate-500">
                    This is how your final generated invoice/receipt document will look. Click "Confirm & Save Receipt" to finalize.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md relative overflow-hidden scale-95 origin-top">
                  {/* Watermark paid */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-dashed border-emerald-500/40 text-emerald-500/40 font-black text-2xl tracking-widest px-4 py-2 rounded-xl uppercase pointer-events-none select-none">
                    PREVIEW PAID
                  </div>

                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-xs">FORTUNES EDUTECH</h5>
                      <p className="text-[8px] text-slate-400 font-bold tracking-wider uppercase">SOFTWARE SERVICES</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-black uppercase">RECEIPT</span>
                      <p className="text-[8px] text-slate-500 mt-1">Ref: <span className="font-mono font-bold text-slate-700">{referenceNumber || 'GENERATING'}</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-[9px] space-y-1">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[7px]">Authorized Payer Profile</span>
                      <span className="font-extrabold text-slate-800 truncate block">{payerName || 'Guest'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase text-[7px]">Registered Email</span>
                      <span className="font-extrabold text-slate-600 truncate block">{user?.email || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Active Profile Info */}
                  <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 mb-3 text-[8px] space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500 font-bold">Plan Activated:</span><span className="font-extrabold text-slate-800">{
                      packageType === 'weekly' ? 'Weekly Premium Cycle' :
                      packageType === '14days' ? '14-Day Cycle Premium' :
                      packageType === 'monthly' ? 'Monthly Premium Cycle' :
                      packageType === 'termly' ? 'Termly Elite Cycle' :
                      packageType === 'unlimited' ? 'Whole School Unlimited' :
                      'Custom Plan'
                    }</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 font-bold">Circle Limit:</span><span className="font-extrabold text-slate-800">{
                      packageType === 'weekly' ? '30 Downloads' :
                      packageType === '14days' ? '60 Downloads' :
                      packageType === 'monthly' ? '120 Downloads' :
                      packageType === 'termly' ? '300 Downloads' :
                      packageType === 'unlimited' ? 'Unlimited' :
                      'Active Limit'
                    }</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 font-bold">Grades:</span><span className="font-extrabold text-slate-800 truncate max-w-[120px]">All Grades</span></div>
                  </div>

                  <div className="text-[9px] space-y-1.5 pb-3 border-b border-slate-100">
                    <div className="flex justify-between font-extrabold text-slate-700">
                      <span>Item</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between text-slate-500 leading-tight">
                      <span className="max-w-[200px] truncate block font-medium">
                        {packageType === 'weekly' ? 'Weekly Premium Cycle Access' :
                         packageType === '14days' ? '14-Day Cycle Premium Access' :
                         packageType === 'monthly' ? 'Monthly Premium Cycle Access' :
                         packageType === 'termly' ? 'Termly Elite Cycle Access' :
                         packageType === 'unlimited' ? 'Whole School Unlimited Access' :
                         customPackageName || 'Custom Educational Portal Activation'}
                      </span>
                      <span className="font-bold">ZMK {amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 text-slate-800">
                    <span className="text-[10px] font-black uppercase">Total Paid</span>
                    <span className="text-xs font-black text-emerald-500">ZMK {amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3 text-center">
                  Created receipts are stored permanently in your personal cloud dashboard database.
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Saved Receipts History */}
          {(activeTab === 'history' || !isDeveloperEmail(user?.email)) && (
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* Left Sidebar: List of saved receipts */}
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200/60 flex flex-col h-1/2 lg:h-full">
                <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <History size={11} className="text-emerald-500" />
                    Historic Records ({receipts.length})
                    {loading && <Loader2 size={11} className="animate-spin text-emerald-600 ml-1" />}
                  </span>
                  <button
                    onClick={() => loadReceipts(true)}
                    disabled={loading}
                    className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-200/50 transition-all text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Refresh records from cloud"
                  >
                    <RefreshCw size={11} className={cn(loading && "animate-spin text-emerald-500")} />
                    <span className="font-bold text-[9px] uppercase hidden sm:inline">Sync</span>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
                  {receipts.length === 0 && loading ? (
                    <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                      <span>Loading your receipts...</span>
                    </div>
                  ) : receipts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                      <p>No historic receipts saved yet.</p>
                      {isDeveloperEmail(user?.email) && (
                        <button 
                          onClick={() => setActiveTab('create')}
                          className="text-emerald-500 hover:underline font-bold text-[11px]"
                        >
                          Create your first receipt
                        </button>
                      )}
                    </div>
                  ) : (
                    receipts.map((r, idx) => {
                      const isSelected = selectedReceipt?.id === r.id;
                      return (
                        <div
                          key={`${r.id || 'rec'}-${idx}`}
                          onClick={() => setSelectedReceipt(r)}
                          className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-start gap-2 ${
                            isSelected 
                              ? 'bg-slate-100 border border-slate-200' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-xs text-slate-800 truncate">{r.payerName}</h5>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{r.packageName}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="font-mono text-[9px] bg-slate-200/60 text-slate-700 px-1 rounded-sm uppercase tracking-tight">{r.referenceNumber.substring(0, 8)}..</span>
                              <span className="text-[9px] text-slate-400">{r.transactionDate}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="text-xs font-black text-emerald-600">ZMK {r.amount}</span>
                            <button
                              onClick={(e) => handleDeleteReceipt(r.id!, e)}
                              className="text-slate-400 hover:text-red-500 mt-2 p-1 rounded-sm hover:bg-slate-200/50 transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right panel: Active Receipt Preview Sheet */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 flex flex-col justify-between items-center">
                {selectedReceipt ? (
                  <div className="w-full max-w-2xl space-y-6">
                    
                    {/* Action buttons on top */}
                    <div className="flex justify-between items-center gap-4 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Active Document Sheet</h4>
                        <p className="text-[10px] text-slate-500">Ref: <span className="font-mono">{selectedReceipt.referenceNumber}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(selectedReceipt)}
                          className="bg-[#00A86B] hover:bg-[#008f5a] text-white py-1.5 px-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 shadow-sm"
                          title="Save PDF directly to your device storage"
                        >
                          <Download size={13} />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handlePrint(selectedReceipt)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-slate-200"
                        >
                          <Printer size={13} />
                          Print System
                        </button>
                      </div>
                    </div>

                    {/* Official Tax Invoice Document */}
                    <div 
                      ref={receiptPreviewRef}
                      className="bg-white border-2 border-slate-200/80 p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden"
                    >
                      {/* Concentric Triple Circular Rubber Stamp */}
                      <div className="absolute top-[38%] right-[12%] -rotate-10 border-2 border-emerald-600 rounded-full w-32 h-32 flex items-center justify-center bg-emerald-50/95 p-1 shadow-md pointer-events-none select-none">
                        <div className="border border-emerald-500 rounded-full w-28 h-28 flex items-center justify-center p-1">
                          <div className="border-1.5 border-dashed border-emerald-600 rounded-full w-24 h-24 flex flex-col items-center justify-center p-1 text-center">
                            <span className="text-[7px] font-black uppercase text-emerald-900 tracking-wider">FORTUNES EDUTECH</span>
                            <span className="text-xs font-black uppercase text-emerald-600 tracking-widest my-0.5">PAID</span>
                            <span className="text-[6.5px] font-extrabold uppercase text-emerald-800 tracking-tight">
                              @{selectedReceipt.year || 2026} {(() => {
                                const t = (selectedReceipt.term || 'Term 3').toLowerCase();
                                if (t.includes('1') || t.includes('one')) return 'TERM ONE';
                                if (t.includes('2') || t.includes('two')) return 'TERM TWO';
                                return 'TERM THREE';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Receipt Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-100 pb-6 mb-6 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-[#10b981] w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base">F</div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">FORTUNES <span className="text-[#10b981]">EDUTECH</span></h2>
                          </div>
                          <p className="text-[9px] font-extrabold text-[#00A86B] uppercase tracking-widest">Zambia national curriculum support system web app</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">
                            PACRA BN No.: 320261079581 • ZRA TPIN: 1005958991<br />
                            WhatsApp Activations: +260 96 1622222 • Lusaka, Zambia
                          </p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                            TAX INVOICE & RECEIPT
                          </span>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">Receipt No: <strong className="text-slate-800 font-bold">{selectedReceipt.referenceNumber}</strong></p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Payment Date: <strong className="text-slate-800 font-bold">{selectedReceipt.transactionDate}</strong></p>
                        </div>
                      </div>

                      {/* Client info and payment details (No School Name / No System Username) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-[11px] leading-relaxed">
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Authorized Payer Profile:</h4>
                          <p className="font-extrabold text-slate-800 text-sm leading-tight">{selectedReceipt.payerName}</p>
                          <p className="text-slate-500">Registered Email: {selectedReceipt.payerEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Payment Transaction:</h4>
                          <p className="font-bold text-slate-800 leading-tight">Method: {selectedReceipt.paymentMethod}</p>
                          <p className="text-slate-500 mt-0.5">Reference: <strong className="text-slate-700">{selectedReceipt.referenceNumber}</strong></p>
                          <p className="text-emerald-600 font-extrabold text-[10px] mt-1 uppercase tracking-wider">★ TRANSACTION APPROVED</p>
                        </div>
                      </div>

                      {/* Subscription details highlight box */}
                      {(() => {
                        const finalGrades = 'All Grades (ECE Level 1 to Form 6 (A Level))';
                        const finalLimit = selectedReceipt.downloadsLimit || 
                          (selectedReceipt.packageName.includes('Weekly') ? 30 :
                           selectedReceipt.packageName.includes('14-Day') || selectedReceipt.packageName.includes('14days') ? 60 :
                           selectedReceipt.packageName.includes('Monthly') ? 120 :
                           selectedReceipt.packageName.includes('Termly') ? 300 :
                           selectedReceipt.packageName.includes('Yearly') ? 1500 :
                           selectedReceipt.packageName.includes('Unlimited') ? 999999 : 30);
                        const finalLimitStr = finalLimit === 999999 ? 'Unlimited Access' : `${finalLimit} Downloads`;

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/60 py-6 px-4 rounded-2xl border border-emerald-100 mb-6 text-[11px]">
                            <div>
                              <span className="text-emerald-700 block font-black uppercase text-[8px] tracking-wider mb-0.5">Subscription Activated</span>
                              <span className="font-extrabold text-emerald-950 leading-tight block">{selectedReceipt.packageName}</span>
                              <div className="mt-2 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-emerald-600/70 uppercase">Activated:</span>
                                  <span className="font-bold text-emerald-900 text-[10px]">{selectedReceipt.subscriptionDateTime || `${selectedReceipt.transactionDate} 08:30 AM`}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-emerald-600/70 uppercase">Cycle Ends:</span>
                                  <span className="font-bold text-emerald-900 text-[10px]">{getSubscriptionEndDateTime(selectedReceipt)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <span className="text-emerald-700 block font-black uppercase text-[8px] tracking-wider mb-0.5">Subscription Circle Limit</span>
                              <span className="font-extrabold text-emerald-950 leading-tight block">{finalLimitStr}</span>
                            </div>
                            <div>
                              <span className="text-emerald-700 block font-black uppercase text-[8px] tracking-wider mb-0.5">Teaching Grades Allocated</span>
                              <span className="font-extrabold text-emerald-950 leading-tight block">{finalGrades}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Items details table */}
                      <table className="w-full text-left text-xs border-collapse mb-8">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-2.5">Item Description</th>
                            <th className="py-2.5 text-center w-12">Qty</th>
                            <th className="py-2.5 text-right w-24">Unit Price</th>
                            <th className="py-2.5 text-right w-24">Total (ZMW)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="py-4 pr-4">
                              <p className="font-bold text-slate-800 text-xs">Fortunes Edutech Premium Cycle Access Activation</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                Gives full digital generation of national syllabi schemes of work, forecasts, and lesson notes.
                              </p>
                            </td>
                            <td className="py-4 text-center font-bold">1</td>
                            <td className="py-4 text-right font-bold text-slate-600">ZMK {selectedReceipt.amount.toFixed(2)}</td>
                            <td className="py-4 text-right font-extrabold text-slate-800">ZMK {selectedReceipt.amount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Footer & accounting details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                        <div className="space-y-3">
                          {/* System Verification Stamp with fortunes edutech app name & received by F kombe */}
                          <div className="border-2 border-emerald-500 rounded-xl p-3 bg-emerald-50/50 text-left font-mono text-[9px] text-emerald-800 leading-tight uppercase tracking-wider">
                            <div className="font-black text-[10px] text-emerald-700 mb-0.5">★ LIPILA MoMo GATEWAY STAMP ★</div>
                            <div className="font-bold text-teal-700 mb-1">BUSINESS TPIN: 1005958991 (ZRA REG.)</div>
                            <div className="font-extrabold text-emerald-900">RECEIVED BY: LIPILA PAYMENTS GATEWAY</div>
                            <div className="font-extrabold text-emerald-900">LIPILA TXN: LPL-{selectedReceipt.referenceNumber || '94821093'}</div>
                            <div className="font-extrabold text-emerald-900 mt-0.5">RECEIPT DOWNLOADED ON: {new Date().toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Terms & Verification</h5>
                            <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                              This document is electronically processed proof of payment for services provided by Fortunes Edutech. It serves as official proof of purchase for reimbursable professional educator fees under Fortunes Edutech accounting standards.
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Subtotal (Excl. Tax):</span>
                            <span className="font-bold text-slate-700">ZMK {(selectedReceipt.amount * 0.97).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Turnover Tax / VAT (3%):</span>
                            <span className="font-bold text-slate-700">ZMK {(selectedReceipt.amount * 0.03).toFixed(2)}</span>
                          </div>
                          <div className="border-t border-slate-200 my-1"></div>
                          <div className="flex justify-between text-xs items-center">
                            <span className="font-black uppercase text-slate-800">Total Paid:</span>
                            <span className="font-black text-emerald-500 text-base">ZMK {selectedReceipt.amount.toFixed(2)}</span>
                          </div>
                          
                          <div className="pt-4 flex flex-col items-center md:items-end">
                            <div className="inline-flex flex-col items-center">
                              {/* Official Stamp & Merchant Signature */}
                              <div className="border border-dashed border-emerald-600 bg-emerald-50 rounded-md px-2.5 py-1 mb-1.5 shadow-2xs">
                                <span className="font-mono text-[9px] font-black text-emerald-800 tracking-wider">PAID VIA LIPILA</span>
                              </div>
                              <div className="border-t border-dashed border-slate-300 pt-1.5 min-w-[130px] text-center">
                                <p className="font-serif italic text-emerald-800 text-xs font-bold leading-none">Lipila Payments Gateway</p>
                                <p className="text-[8px] font-black uppercase text-slate-500 mt-1 tracking-wider">Authorized MoMo Merchant</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                    <Receipt size={40} className="text-slate-300 mb-2 animate-bounce" />
                    Select a receipt from the sidebar to view full tax details, print, or download direct to your device.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>,
    document.body
  );
}
