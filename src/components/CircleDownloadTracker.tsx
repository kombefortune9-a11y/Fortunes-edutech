import { safeLocalStorage } from "../lib/storage";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Search, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  RefreshCcw, 
  User, 
  FileText 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SUBSCRIPTION_PLANS, ADMIN_EMAIL, isDeveloperEmail } from '../constants';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastLogin: any;
  lastHeartbeat?: any;
  teaching_grade?: string;
  isWhitelisted?: boolean;
  subscriptionType?: string;
  subscriptionStart?: any;
  addedAt?: any;
  status?: string;
  userType?: string;
}

interface CircleDownloadTrackerProps {
  approvedUsers: UserProfile[];
  hideLogs?: boolean;
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

// Sub-component for a single user row, managing its own real-time listener
function UserDownloadRow({ user }: { user: UserProfile }) {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cleanUserEmail = user.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
  const isDev = isDeveloperEmail(cleanUserEmail);
  const amtPaid = (user as any).amountPaid !== undefined ? Number((user as any).amountPaid) : 0;
  let rawSub = user.subscriptionType;
  if (amtPaid >= 1500) rawSub = 'unlimited';
  else if (amtPaid >= 250) rawSub = 'termly';
  else if (!rawSub || rawSub === 'guest_trial') {
    if (amtPaid >= 90) rawSub = 'monthly';
    else if (amtPaid >= 40) rawSub = '14days';
    else if (amtPaid >= 20) rawSub = 'weekly';
  }
  const subType = isDev ? 'unlimited' : ((rawSub && rawSub !== 'guest_trial' && rawSub in SUBSCRIPTION_PLANS) ? rawSub : (user.isWhitelisted ? 'monthly' : 'guest_trial'));
  const subStart = useMemo(() => {
    if (isDev) return new Date(2025, 0, 1);
    return safeToDate(user.subscriptionStart) || safeToDate(user.addedAt) || new Date();
  }, [user.subscriptionStart, user.addedAt, isDev]);

  const subDetails = useMemo(() => {
    const plan = SUBSCRIPTION_PLANS[subType] || SUBSCRIPTION_PLANS.monthly;

    const subEnd = plan.durationDays === Infinity 
      ? null 
      : new Date(subStart.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    return { 
      limit: plan.limit, 
      durationDays: plan.durationDays, 
      label: plan.label, 
      colorClass: plan.colorClass, 
      subEnd 
    };
  }, [subType, subStart, isDev]);

  // Set up real-time listener for this user's downloads
  useEffect(() => {
    const isInvited = user.uid.startsWith('invited_');
    if (isInvited) {
      setDownloads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const downloadsRef = collection(db, 'users', user.uid, 'downloads');
    const q = query(downloadsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = safeToDate(data.timestamp);
        // Only count downloads within the current subscription circle
        if (timestamp && timestamp.getTime() >= subStart.getTime()) {
          list.push({ id: doc.id, ...data });
        }
      });
      setDownloads(list);
      try {
        safeLocalStorage.setItem(`eduplan_tracker_downloads_${user.uid}`, JSON.stringify(list));
      } catch (e) {}
      setLoading(false);
    }, (err: any) => {
      const errStr = err?.message || String(err);
      const isQuota = errStr.includes('Quota exceeded') || err?.code === 'resource-exhausted';
      const isNetworkOrAuth = errStr.includes('network-request-failed') ||
                             errStr.includes('Fetching auth token failed') ||
                             errStr.includes('Could not reach Cloud Firestore backend');
      if (isQuota) {
        console.warn(`Error loading downloads for user ${user.email} (Quota Exceeded) - using cached list`);
      } else if (isNetworkOrAuth) {
        console.warn(`Error loading downloads for user ${user.email} (Network/Auth) - using cached list`);
      } else {
        console.error(`Error loading downloads for user ${user.email}:`, err);
      }
      
      try {
        const cached = safeLocalStorage.getItem(`eduplan_tracker_downloads_${user.uid}`);
        if (cached) {
          setDownloads(JSON.parse(cached));
        } else {
          const mainCached = safeLocalStorage.getItem(`eduplan_downloads_cache_${user.uid}`);
          if (mainCached) {
            const parsed = JSON.parse(mainCached);
            const list = parsed.map((d: any) => ({ ...d, timestamp: safeToDate(d.timestamp) }))
                               .filter((d: any) => d.timestamp && d.timestamp.getTime() >= subStart.getTime());
            setDownloads(list);
          }
        }
      } catch (e) {}
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, subStart]);

  const gradesList = useMemo(() => {
    const g = user.teaching_grade || 'Grade 4';
    return g.split(',').map(s => s.trim()).filter(Boolean);
  }, [user.teaching_grade]);

  const gradeCounts = useMemo(() => {
    const counts: { [grade: string]: number } = {};
    downloads.forEach(d => {
      const gName = (d.grade || '').trim();
      if (gName) {
        counts[gName] = (counts[gName] || 0) + 1;
      }
    });
    return counts;
  }, [downloads]);

  const isCombinedTracker = gradesList.length > 2;
  const baseLimit = subDetails.limit;

  const isTimeExpired = useMemo(() => {
    if (isDev || baseLimit >= 99999) return false;
    if (!subDetails.subEnd) return false;
    return Date.now() > subDetails.subEnd.getTime();
  }, [subDetails.subEnd, isDev, baseLimit]);

  const isQuotaDepleted = useMemo(() => {
    if (baseLimit === Infinity) return false;
    return downloads.length >= baseLimit;
  }, [downloads.length, baseLimit]);

  const isDepletedOrEnded = isTimeExpired || isQuotaDepleted || user.status === 'blocked';

  const timeRemainingStr = useMemo(() => {
    if (isDev || !subDetails.subEnd) return 'Lifetime Access';
    const diff = subDetails.subEnd.getTime() - Date.now();
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  }, [subDetails.subEnd, isDev]);

  return (
    <div className={cn(
      "p-5 rounded-3xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all",
      isDepletedOrEnded 
        ? "border-red-100 hover:border-red-200/60 bg-red-50/5" 
        : "border-slate-100 hover:border-slate-200/60 hover:shadow-sm"
    )}>
      {/* Left side: User details */}
      <div className="flex-1 min-w-0 flex items-start gap-4">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName} 
            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
            <User size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black text-slate-800 truncate leading-none">
              {user.displayName || 'Teacher (Offline)'}
            </h4>
            <span className={cn(
              "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shrink-0",
              subDetails.colorClass
            )}>
              {subDetails.label}
            </span>
            {user.status === 'blocked' && (
              <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-red-50 text-red-600 border-red-100 shrink-0 animate-pulse">
                Blocked
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-bold truncate leading-none">{user.email}</p>
          <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-tight">Grades:</span>
              <span className="font-extrabold text-slate-600">
                {(!user.teaching_grade || user.teaching_grade.toLowerCase() === 'all' || user.teaching_grade.toLowerCase() === 'all grades')
                  ? 'All Grades (ECE Level 1 to Form 6 (A Level))'
                  : user.teaching_grade}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-lg">
              <Calendar size={10} className="text-slate-400" />
              <span className="font-bold">{subStart.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Progress Bar & Download stats */}
      <div className="w-full md:w-80 shrink-0 space-y-2">
        {loading ? (
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Syncing tracker...
          </div>
        ) : subDetails.limit === Infinity ? (
          <div className={cn(
            "p-3 rounded-2xl flex justify-between items-center text-xs font-black uppercase tracking-widest border",
            isDev 
              ? "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm" 
              : "bg-emerald-50 border-emerald-100 text-emerald-700"
          )}>
            <span>{isDev ? 'Master Developer Access' : 'Unlimited Access'}</span>
            <span className="text-sm">♾️</span>
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const used = downloads.length;
              const remaining = Math.max(0, baseLimit - used);
              const pct = Math.min(100, (used / baseLimit) * 100);
              const isGradeDepleted = used >= baseLimit || isTimeExpired || user.status === 'blocked';
              
              return (
                <div className="space-y-0.5">
                  <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">Total downloads tracker</span>
                    <span className={isGradeDepleted ? "text-red-500 font-black" : "text-slate-700"}>
                      {used} / {baseLimit} ({remaining} Left)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 border border-slate-200/50 rounded-full h-2 overflow-hidden relative">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isGradeDepleted ? "bg-red-500" : "bg-[#00A86B]"
                      )} 
                      style={{ width: `${isGradeDepleted ? 100 : pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Status Line */}
        <div className="flex justify-between items-center text-[10px] font-extrabold tracking-wide uppercase leading-none">
          <span className={cn(
            "flex items-center gap-1",
            isDepletedOrEnded ? "text-red-500 font-black" : "text-slate-500"
          )}>
            {isTimeExpired ? (
              <span className="flex items-center gap-1"><AlertTriangle size={10} /> Circle Expired</span>
            ) : isQuotaDepleted ? (
              <span className="flex items-center gap-1"><AlertTriangle size={10} /> Downloads Exhausted</span>
            ) : user.status === 'blocked' ? (
              <span className="flex items-center gap-1"><AlertTriangle size={10} /> Subscription Suspended</span>
            ) : (
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-[#00A86B]" /> Circle Active</span>
            )}
          </span>
          <span className={cn(
            "font-black tracking-tight",
            isTimeExpired ? "text-red-500" : "text-slate-500"
          )}>
            {timeRemainingStr}
          </span>
        </div>
      </div>
    </div>
  );
}

function getDocTypeLabel(type: string): string {
  const t = (type || '').toLowerCase();
  if (t === 'lesson_plan') return 'Lesson Plan';
  if (t === 'schemes_of_work') return 'Schemes of Work';
  if (t === 'weekly_forecast') return 'Weekly Forecast';
  if (t === 'lesson_notes') return 'Lesson Notes';
  if (t === 'catch_up') return 'Catch Up';
  if (t === 'individual_work_plan') return 'Individual Work Plan';
  if (t === 'assessments') return 'Assessments';
  return type || 'Document';
}

function getDocBadgeStyles(type: string): string {
  const t = (type || '').toLowerCase();
  if (t === 'lesson_plan') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (t === 'schemes_of_work') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (t === 'weekly_forecast') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (t === 'lesson_notes') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (t === 'catch_up') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (t === 'individual_work_plan') return 'bg-violet-50 text-violet-700 border-violet-200';
  if (t === 'assessments') return 'bg-teal-50 text-teal-700 border-teal-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function CircleDownloadTracker({ approvedUsers, hideLogs = false }: CircleDownloadTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'progress' | 'history'>(hideLogs ? 'progress' : 'history');
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Subscribe to central download_tracking for real-time live activity logs
  useEffect(() => {
    const q = query(
      collection(db, 'system_activity'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGlobalLogs(logsList);
      try {
        safeLocalStorage.setItem('eduplan_global_logs_cache', JSON.stringify(logsList));
      } catch (e) {}
      setLogsLoading(false);
    }, (error: any) => {
      const errStr = error?.message || String(error);
      const isQuota = errStr.includes('Quota exceeded') || error?.code === 'resource-exhausted';
      const isNetworkOrAuth = errStr.includes('network-request-failed') ||
                             errStr.includes('Fetching auth token failed') ||
                             errStr.includes('Could not reach Cloud Firestore backend');
      if (isQuota) {
        console.warn("Error listening to global download logs (Quota Exceeded) - using cached logs");
      } else if (isNetworkOrAuth) {
        console.warn("Error listening to global download logs (Network/Auth) - using cached logs");
      } else {
        console.error("Error listening to global download logs:", error);
      }
      
      try {
        const cached = safeLocalStorage.getItem('eduplan_global_logs_cache');
        if (cached) {
          setGlobalLogs(JSON.parse(cached));
        }
      } catch (e) {}
      setLogsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    const list = approvedUsers.filter(u => u.isWhitelisted && u.subscriptionType !== 'guest_trial');
    if (!searchQuery.trim()) return list;
    const queryStr = searchQuery.toLowerCase();
    return list.filter(u => 
      u.email?.toLowerCase().includes(queryStr) || 
      u.displayName?.toLowerCase().includes(queryStr)
    );
  }, [approvedUsers, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return globalLogs;
    const queryStr = searchQuery.toLowerCase();
    return globalLogs.filter(log => 
      (log.user_email || '').toLowerCase().includes(queryStr) ||
      (log.doc_type || '').toLowerCase().includes(queryStr) ||
      (log.grade || '').toLowerCase().includes(queryStr)
    );
  }, [globalLogs, searchQuery]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white overflow-hidden">
      {/* Sub-header inside the tab panel */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Download size={16} className="text-[#00A86B]" />
            Subscription Circle Download Tracking
          </h4>
          <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
            Real-time visual monitoring of teacher depletion & downloads progress bars.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('progress')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
              activeSubTab === 'progress' 
                ? "bg-white text-slate-800 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Progress Bars
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
              activeSubTab === 'history' 
                ? "bg-white text-slate-800 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Clock size={12} className={activeSubTab === 'history' ? "text-emerald-500 animate-pulse" : ""} />
            Live Logs Feed
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSubTab === 'progress' ? "Search registered user..." : "Search log entries..."}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#00A86B] transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Main content pane */}
      <div className="flex-1 overflow-y-auto p-5 pb-16 space-y-4 custom-scrollbar">
        {activeSubTab === 'progress' ? (
          filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic font-medium">
              No registered users matching your search.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserDownloadRow key={user.uid} user={user} />
            ))
          )
        ) : (
          logsLoading ? (
            <div className="text-center py-16 text-slate-500 font-bold tracking-wider uppercase text-[10px] animate-pulse">
              Syncing Real-time Activity Logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic font-medium">
              No live downloads found matching search terms.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
              {filteredLogs.map((log) => {
                const date = safeToDate(log.timestamp);
                const formattedTime = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending...';
                const formattedDate = date ? date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) : '';
                
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#00A86B] font-black text-xs shrink-0 border border-slate-200/50">
                        {log.user_email ? log.user_email.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-slate-700 truncate max-w-[180px] sm:max-w-xs">{log.user_email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0", getDocBadgeStyles(log.doc_type))}>
                            {getDocTypeLabel(log.doc_type)}
                          </span>
                          <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200/30 shrink-0 uppercase tracking-tight">
                            {log.grade || 'General'}
                          </span>
                          {log.format && (
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md border border-blue-200/30 shrink-0 uppercase tracking-tight">
                              {log.format}
                            </span>
                          )}
                          {log.subject && (
                             <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 shrink-0">
                               {log.subject}
                             </span>
                          )}
                        </div>
                        {(log.topic || log.subtopic) && (
                          <div className="mt-1 flex items-center gap-2">
                             {log.topic && <span className="text-[9px] text-slate-500 italic max-w-[150px] truncate">T: {log.topic}</span>}
                             {log.subtopic && <span className="text-[9px] text-slate-400 italic max-w-[150px] truncate">S: {log.subtopic}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-slate-800">{formattedTime}</p>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">{formattedDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Tracker metrics summary info */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
        <span>
          {activeSubTab === 'progress' 
            ? `Total Monitored Users: ${filteredUsers.length}` 
            : `Latest Download Log Actions: ${filteredLogs.length}`}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </div>
    </div>
  );
}
