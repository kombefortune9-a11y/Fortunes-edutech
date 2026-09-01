import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Activity, 
  Download, 
  Zap, 
  LogIn, 
  AlertCircle, 
  RefreshCcw,
  Clock,
  User as UserIcon,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ActivityItem {
  id: string;
  user_email: string;
  activity_type: 'download' | 'generation' | 'login' | 'error' | 'sync';
  doc_type?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  format?: string;
  details?: string;
  timestamp: Timestamp;
}

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'system_activity'), 
      orderBy('timestamp', 'desc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: ActivityItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ActivityItem);
      });
      setActivities(items);
      try {
        localStorage.setItem('eduplan_cached_activities', JSON.stringify(items));
      } catch (e) {}
      setLoading(false);
    }, (error) => {
      console.warn("Activity feed error (handled gracefully):", error);
      const isQuota = error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted' || error?.message?.includes('free quota limits');
      if (isQuota) {
        setIsQuotaExceeded(true);
      }
      try {
        const cached = localStorage.getItem('eduplan_cached_activities');
        if (cached) {
          setActivities(JSON.parse(cached));
        }
      } catch (e) {}
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'download': return <Download size={14} className="text-emerald-500" />;
      case 'generation': return <Zap size={14} className="text-amber-500" />;
      case 'login': return <LogIn size={14} className="text-blue-500" />;
      case 'error': return <AlertCircle size={14} className="text-red-500" />;
      case 'sync': return <RefreshCcw size={14} className="text-purple-500" />;
      default: return <Activity size={14} className="text-slate-400" />;
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '...';
    try {
      if (typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (ts.seconds !== undefined && typeof ts.seconds === 'number') {
        return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (ts instanceof Date) {
        return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      console.warn("Date formatting error in ActivityFeed:", e);
    }
    return '...';
  };

  const getDocTypeLabel = (type?: string) => {
    if (!type) return '';
    return type.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Live Activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          <h3 className="font-black text-slate-800 uppercase tracking-tighter">Live Activity Stream</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Real-time</span>
        </div>
      </div>

      {isQuotaExceeded && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-black text-amber-800 leading-tight">Database Quota Active</p>
            <p className="text-[10px] font-bold text-amber-700/90 mt-1">
              Free daily read limits have been reached. Displaying local fallback cache of last active events.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-slate-400 font-bold">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-4 hover:bg-slate-50 transition-colors group flex items-start gap-4"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    activity.activity_type === 'download' ? "bg-emerald-50" :
                    activity.activity_type === 'generation' ? "bg-amber-50" :
                    activity.activity_type === 'login' ? "bg-blue-50" :
                    activity.activity_type === 'error' ? "bg-red-50" : "bg-slate-50"
                  )}>
                    {getIcon(activity.activity_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-black text-slate-900 truncate">
                          {activity.user_email}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter border shrink-0",
                          activity.activity_type === 'download' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          activity.activity_type === 'generation' ? "bg-amber-100 text-amber-700 border-amber-200" :
                          activity.activity_type === 'login' ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {activity.activity_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 shrink-0">
                        <Clock size={10} />
                        <span className="text-[10px] font-bold">{formatTime(activity.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {activity.doc_type && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <FileText size={10} className="text-slate-300" />
                          <span>{getDocTypeLabel(activity.doc_type)}</span>
                        </div>
                      )}
                      {activity.subject && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{activity.subject}</span>
                        </div>
                      )}
                      {activity.grade && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{activity.grade}</span>
                        </div>
                      )}
                      {activity.format && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-black uppercase tracking-tighter">
                          <span>[{activity.format}]</span>
                        </div>
                      )}
                    </div>

                    {activity.topic && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate italic">
                        "{activity.topic}"
                      </p>
                    )}

                    {activity.details && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Showing last 100 system events
          </p>
        </div>
      </div>
    </div>
  );
};
