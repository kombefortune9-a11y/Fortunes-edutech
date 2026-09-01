import { useState, useEffect } from 'react';
import { getLocalTelemetryStats, syncPendingTelemetry, TelemetryStats } from '../services/telemetryService';
import { Activity, RefreshCw, Database, CheckCircle, Wifi, WifiOff, Sparkles, ChevronRight, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function TelemetryInsights() {
  const [stats, setStats] = useState<TelemetryStats>({
    featureUsage: {},
    actionUsage: {},
    totalPendingSync: 0,
    totalEventsTracked: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStats = async () => {
    const currentStats = await getLocalTelemetryStats();
    setStats(currentStats);
  };

  useEffect(() => {
    fetchStats();

    // Listen for custom telemetry-updated events
    const handleUpdate = () => {
      fetchStats();
    };

    const handleConnectionChange = () => {
      setIsOnline(window.navigator.onLine);
    };

    window.addEventListener('telemetry-updated', handleUpdate);
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    return () => {
      window.removeEventListener('telemetry-updated', handleUpdate);
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await syncPendingTelemetry();
      await fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const featureLabels: Record<string, string> = {
    dashboard: 'Dashboard Navigation',
    generator: 'Content Planning Tool',
    records_of_work: 'Record of Work history',
    user_manual: 'User Manual Reader',
    settings: 'App Settings Panel',
    assessment_tracker: 'Assessment Tracker Hub',
    video_tutorials: 'Video Demos & Tutorials'
  };

  return (
    <div id="telemetry-insights-container" className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border border-blue-500/50 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300">
      {/* Background Subtle Accent & Elegant pure white flat lines and wave */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex items-end justify-end overflow-hidden">
        <svg className="w-full h-full absolute inset-0 text-white" viewBox="0 0 400 120" preserveAspectRatio="none">
          {/* Wave line matching user request */}
          <path d="M 0 90 Q 60 40 120 75 T 240 50 T 360 80 T 400 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Flat diagonal lines in bottom right */}
          <line x1="280" y1="120" x2="360" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="330" y1="120" x2="410" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 text-white border border-white/20 rounded-xl shrink-0">
            <Activity size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${isOnline ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {isOnline ? 'Cloud Synced' : 'Offline Buffer'}
              </span>
              <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">
                Telemetry Insights
              </span>
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-tight uppercase mt-0.5">
              Offline Action Tracker & Usage Patterns
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Sync Button */}
          {stats.totalPendingSync > 0 && isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white border border-emerald-400 hover:bg-emerald-600 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1"
          >
            <BarChart2 size={11} />
            <span>{isOpen ? 'Hide Stats' : 'View Stats'}</span>
          </button>
        </div>
      </div>

      {/* Info bar when offline */}
      {stats.totalPendingSync > 0 && !isOnline && (
        <div className="mt-3 bg-amber-500/20 border border-amber-400/30 p-2.5 rounded-xl flex items-center gap-2 text-amber-100 text-[10px] font-bold leading-relaxed relative z-10">
          <WifiOff size={12} className="text-amber-300 shrink-0" />
          <span>
            Logged <strong>{stats.totalEventsTracked} interaction{stats.totalEventsTracked > 1 ? 's' : ''}</strong> offline. We will automatically upload these to Firestore to secure your analytics once you regain connection.
          </span>
        </div>
      )}

      {/* Stats Details Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden relative z-10"
          >
            <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                <div className="p-3 bg-white/10 rounded-xl border border-white/5 text-left">
                  <span className="block text-[9px] font-black text-blue-200 uppercase tracking-widest leading-none">Unsynced Logs</span>
                  <span className="block text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
                    {stats.totalPendingSync}
                  </span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/5 text-left">
                  <span className="block text-[9px] font-black text-blue-200 uppercase tracking-widest leading-none">Total Actions</span>
                  <span className="block text-lg sm:text-xl font-extrabold text-emerald-300 tracking-tight mt-1">
                    {stats.totalEventsTracked}
                  </span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/5 text-left col-span-2 xs:col-span-1">
                  <span className="block text-[9px] font-black text-blue-200 uppercase tracking-widest leading-none">Connection</span>
                  <span className="flex items-center gap-1 text-xs font-extrabold tracking-tight mt-1.5">
                    {isOnline ? (
                      <>
                        <Wifi size={12} className="text-emerald-300" />
                        <span className="text-emerald-200 uppercase text-[10px]">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={12} className="text-amber-300 animate-pulse" />
                        <span className="text-amber-200 uppercase text-[10px]">Offline</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Feature Usage Details */}
              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-blue-200 uppercase tracking-widest pl-0.5">
                  Local Usage Density by Module
                </h5>

                {Object.keys(stats.featureUsage).length === 0 ? (
                  <p className="text-blue-200 text-xs py-4 text-center font-medium">
                    No offline interactions recorded yet. Shift between sections to log usage patterns!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.featureUsage)
                      .sort((a, b) => b[1] - a[1])
                      .map(([feature, count]) => {
                        const maxCount = Math.max(...Object.values(stats.featureUsage));
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={feature} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-extrabold text-white px-0.5">
                              <span>{featureLabels[feature] || feature}</span>
                              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[9px]">
                                {count} clicks
                              </span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
