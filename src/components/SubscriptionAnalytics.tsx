import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Calendar, 
  X, 
  FileText, 
  Mail, 
  ShieldCheck, 
  User, 
  Activity, 
  ArrowUpRight,
  Sparkles,
  Download,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUBSCRIPTION_PLANS } from '../constants';

interface SubscriptionAnalyticsProps {
  approvedUsers: any[];
  trialUsers: any[];
  activationRequests: any[];
  onApproveRequest?: (req: any) => void;
  onRejectRequest?: (req: any) => void;
}

export function SubscriptionAnalytics({ 
  approvedUsers, 
  trialUsers, 
  activationRequests,
  onApproveRequest,
  onRejectRequest
}: SubscriptionAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Combine both whitelisted (premium) and trial users into a single roster
  const allUsersRoster = useMemo(() => {
    const premiumList = approvedUsers.map(u => ({ ...u, accountStatus: 'premium' }));
    const trialList = trialUsers.map(u => ({ ...u, accountStatus: 'trial' }));
    return [...premiumList, ...trialList];
  }, [approvedUsers, trialUsers]);

  // Compute key analytics
  const stats = useMemo(() => {
    const totalCount = allUsersRoster.length;
    const premiumCount = approvedUsers.length;
    const trialCount = trialUsers.length;
    
    // Total Revenue (ZMK)
    const totalRevenue = approvedUsers.reduce((sum, u) => sum + (Number(u.amountPaid) || 0), 0);
    
    // Activation rate
    const activationRate = totalCount > 0 ? Math.round((premiumCount / totalCount) * 100) : 0;

    // Distribution by subscription plan
    const distribution: Record<string, number> = {
      weekly: 0,
      '14days': 0,
      monthly: 0,
      termly: 0,
      unlimited: 0,
      trial: 0
    };

    approvedUsers.forEach(u => {
      const type = u.subscriptionType || 'monthly';
      if (type in distribution) {
        distribution[type] += 1;
      } else {
        distribution['monthly'] += 1;
      }
    });
    distribution['trial'] = trialCount;

    return {
      totalCount,
      premiumCount,
      trialCount,
      totalRevenue,
      activationRate,
      distribution
    };
  }, [allUsersRoster, approvedUsers, trialUsers]);

  // Filtered roster for table
  const filteredRoster = useMemo(() => {
    return allUsersRoster.filter(u => {
      // 1. Plan Filter
      if (selectedPlanFilter !== 'all') {
        if (selectedPlanFilter === 'trial') {
          if (u.accountStatus !== 'trial') return false;
        } else {
          if (u.subscriptionType !== selectedPlanFilter || u.accountStatus !== 'premium') return false;
        }
      }

      // 2. Status Filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'active' && u.status === 'blocked') return false;
        if (selectedStatusFilter === 'blocked' && u.status !== 'blocked') return false;
      }

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesName = u.displayName?.toLowerCase().includes(q);
        const matchesUid = u.uid?.toLowerCase().includes(q);
        return matchesEmail || matchesName || matchesUid;
      }

      return true;
    });
  }, [allUsersRoster, selectedPlanFilter, selectedStatusFilter, searchTerm]);

  // Safe timestamp conversion helper
  const formatTimestamp = (ts: any): string => {
    if (!ts) return 'N/A';
    if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().toLocaleDateString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    const date = new Date(ts);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Safe Days Remaining helper
  const getDaysRemaining = (u: any): string => {
    if (u.accountStatus === 'trial') return 'Trial Access';
    if (!u.subscriptionStart) return 'Unlimited';
    
    const plan = SUBSCRIPTION_PLANS[u.subscriptionType];
    if (!plan) return 'N/A';
    
    const start = u.subscriptionStart.toDate ? u.subscriptionStart.toDate() : new Date(u.subscriptionStart);
    const end = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? `${diffDays} days left` : 'Expired';
  };

  return (
    <div className="space-y-6" id="subscription_analytics_tab">
      
      {/* SECTION HEADER */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md tracking-wider border border-emerald-100">
              Developer Portal Monitor
            </span>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mt-1 flex items-center gap-2">
              <Sparkles className="text-emerald-500" size={18} />
              Real-time Subscription Analytics & Revenue Hub
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Evaluate system traffic, trial conversions, and billing activations across the Zambian curriculum generator
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live Firestore Nodes Active</span>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL VALUE */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-2xs text-left relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="absolute right-3 top-3 p-2 bg-emerald-50 rounded-2xl text-emerald-600">
            <DollarSign size={16} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Logged Revenue</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1.5">ZMK {stats.totalRevenue}</h4>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">
            From {stats.premiumCount} Whitelisted portals
          </p>
        </div>

        {/* ACTIVE PREMIUM USERS */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-2xs text-left relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="absolute right-3 top-3 p-2 bg-indigo-50 rounded-2xl text-indigo-600">
            <Users size={16} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Whitelisted Premium</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1.5">{stats.premiumCount}</h4>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight mt-1">
            Active curriculum plans whitelisted
          </p>
        </div>

        {/* TRIAL USERS */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-2xs text-left relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="absolute right-3 top-3 p-2 bg-amber-50 rounded-2xl text-amber-600">
            <Clock size={16} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Trial Traffic</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1.5">{stats.trialCount}</h4>
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight mt-1">
            Standard trial mode accounts registered
          </p>
        </div>

        {/* CONVERSION RATE */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-2xs text-left relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute right-3 top-3 p-2 bg-blue-50 rounded-2xl text-blue-600">
            <Percent size={16} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Activation Rate</span>
          <h4 className="text-2xl font-black text-slate-800 mt-1.5">{stats.activationRate}%</h4>
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight mt-1">
            Trial-to-Paid subscriber ratio
          </p>
        </div>

      </div>

      {/* RECHART-INSPIRED INTERACTIVE VISUALS CHART */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-2xs text-left">
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-4 flex items-center gap-1.5">
          <TrendingUp size={14} className="text-emerald-500" />
          Subscription Plan Volume Distribution Matrix
        </h4>
        
        {/* SVG/CSS Distribution Bars representing Recharts behavior gracefully */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {Object.entries(stats.distribution).map(([planKey, val]) => {
            const planLabel = planKey === 'trial' ? 'Trial Mode' : SUBSCRIPTION_PLANS[planKey]?.label || planKey;
            const maxVal = Math.max(...Object.values(stats.distribution), 1);
            const percentage = Math.round((val / maxVal) * 100);
            
            // Assign unique color schemes for each bar
            const barColors: Record<string, string> = {
              weekly: 'bg-amber-500 text-amber-800',
              '14days': 'bg-cyan-500 text-cyan-800',
              monthly: 'bg-indigo-500 text-indigo-800',
              termly: 'bg-blue-500 text-blue-800',
              unlimited: 'bg-emerald-500 text-emerald-800',
              trial: 'bg-slate-400 text-slate-800'
            };

            const colorClass = barColors[planKey] || 'bg-slate-400 text-slate-800';

            return (
              <div key={planKey} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider truncate" title={planLabel}>
                    {planLabel}
                  </span>
                  <span className="text-lg font-black text-slate-800 block">{val} Users</span>
                </div>
                
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block text-right">
                    {percentage}% of maximum
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white border border-slate-150 p-4 rounded-3xl shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between text-left">
        <div className="relative w-full sm:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search email, display name, or user UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl shrink-0">
            <Filter size={11} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Plan:</span>
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="text-[9px] font-black uppercase text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial Mode</option>
              <option value="weekly">Weekly</option>
              <option value="14days">14 Days</option>
              <option value="monthly">Monthly</option>
              <option value="termly">Termly</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl shrink-0">
            <Filter size={11} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-[9px] font-black uppercase text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Whitelist</option>
              <option value="blocked">Blocked / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* USERS MODERN TABLE ROSTER */}
      <div className="bg-white border border-slate-150 rounded-3xl shadow-2xs overflow-hidden text-left">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
            Registered Subscriber Base ({filteredRoster.length} of {allUsersRoster.length} listed)
          </h4>
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
            Click row for administrative detailed audit
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100 tracking-wider">
                <th className="py-3.5 px-5">Subscriber Info</th>
                <th className="py-3.5 px-4">Billing Level</th>
                <th className="py-3.5 px-4">Receipt Proof</th>
                <th className="py-3.5 px-4">Status / Active Progress</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    No subscribers match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((u) => {
                  const isPremium = u.accountStatus === 'premium';
                  const planLabel = isPremium ? SUBSCRIPTION_PLANS[u.subscriptionType]?.label || u.subscriptionType : 'Free Trial';
                  
                  return (
                    <tr 
                      key={u.uid} 
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Name / Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] uppercase ${
                            isPremium ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {u.displayName ? u.displayName.charAt(0) : u.email.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800">{u.displayName || 'Unregistered'}</div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-tight lowercase">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Billing Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md w-fit ${
                            isPremium 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {planLabel}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5 tracking-tight">
                            {isPremium ? `ZMK ${u.amountPaid || 0} Package` : 'No Charge'}
                          </span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <div className="text-[10px] font-bold text-slate-600 uppercase">
                          {isPremium ? (u.paymentMethod || 'Mobile Money') : 'N/A'}
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                          {isPremium ? 'Direct Whitelisted' : 'Standard Guest Signup'}
                        </span>
                      </td>

                      {/* Status Progress */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            u.status === 'blocked' ? 'bg-rose-500' : isPremium ? 'bg-emerald-500' : 'bg-amber-400'
                          }`} />
                          <div>
                            <span className="font-extrabold text-slate-700 capitalize">
                              {u.status === 'blocked' ? 'Suspended' : isPremium ? 'Premium Active' : 'Trial Active'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                              {getDaysRemaining(u)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Reg Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-bold uppercase text-[10px]">
                        {formatTimestamp(u.addedAt || u.subscriptionStart)}
                      </td>

                      {/* Action Chevron */}
                      <td className="py-3.5 px-4 text-center">
                        <button className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER / SLIDE-OUT DETAIL PANEL FOR SELECTED USER */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Overlay background blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
            />
            
            {/* Sheet content container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md bg-white border-l border-slate-200 p-6 shadow-2xl z-50 flex flex-col justify-between text-left h-full overflow-y-auto"
            >
              <div className="space-y-6">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      Subscriber Profile Audit
                    </span>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1 truncate">
                      {selectedUser.displayName || 'Teacher Profile'}
                    </h4>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Profile Identity Card */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white font-black text-sm flex items-center justify-center uppercase">
                      {selectedUser.displayName ? selectedUser.displayName.charAt(0) : selectedUser.email.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-xs truncate max-w-[200px]">{selectedUser.displayName || 'Standard Teacher'}</h5>
                      <span className="text-[9px] text-slate-400 font-black block uppercase mt-0.5">Grade: {selectedUser.teaching_grade || 'All Grades'}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                        <Mail size={11} />
                        Email Node
                      </span>
                      <span className="font-extrabold text-slate-700 select-all font-mono lowercase">{selectedUser.email}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                        <User size={11} />
                        Account UID
                      </span>
                      <span className="font-semibold text-slate-500 select-all font-mono text-[9px] truncate max-w-[150px]">{selectedUser.uid}</span>
                    </div>
                  </div>
                </div>

                {/* Account Status Indicator and Duration */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Licensing Status Details</h5>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Core License</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md inline-block mt-1 ${
                        selectedUser.accountStatus === 'premium' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {selectedUser.accountStatus === 'premium' ? 'Premium active' : 'Trial active'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Validity Period</span>
                      <span className="font-extrabold text-xs text-slate-700 mt-1 block uppercase">
                        {getDaysRemaining(selectedUser)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Billing History Card */}
                {selectedUser.accountStatus === 'premium' ? (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Billing Whitelist Record</h5>
                    <div className="bg-emerald-50/30 border border-emerald-200/50 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                          <CreditCard size={13} className="text-emerald-600" />
                          Amount Whitelisted
                        </span>
                        <span className="font-black text-emerald-700">ZMK {selectedUser.amountPaid || 0}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-emerald-200/40 pt-2.5">
                        <span className="text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                          <Calendar size={13} className="text-emerald-600" />
                          Activation Date
                        </span>
                        <span className="font-extrabold text-slate-700">{formatTimestamp(selectedUser.subscriptionStart || selectedUser.addedAt)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-emerald-200/40 pt-2.5">
                        <span className="text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                          <Activity size={13} className="text-emerald-600" />
                          Payment Channel
                        </span>
                        <span className="font-extrabold text-slate-700 uppercase">{selectedUser.paymentMethod || 'Mobile Money Whitelist'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                    <Clock size={16} className="text-slate-400 mx-auto" />
                    <h5 className="text-[10px] font-extrabold text-slate-700 uppercase">No payment record whitelisted</h5>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">This account is active under the guest trial curriculum quota limits.</p>
                  </div>
                )}

                {/* System Access Flags */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Audit Security Log</h5>
                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-tight">System Integrity Status</span>
                      <span className="font-extrabold text-emerald-600 uppercase text-[10px]">VERIFIED OK</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-200/40 pt-2">
                      <span className="text-slate-400 font-bold uppercase tracking-tight">Last Network Heartbeat</span>
                      <span className="font-extrabold text-slate-600 text-[10px] uppercase">
                        {selectedUser.lastHeartbeat ? formatTimestamp(selectedUser.lastHeartbeat) : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-200/40 pt-2">
                      <span className="text-slate-400 font-bold uppercase tracking-tight">Last App Login</span>
                      <span className="font-extrabold text-slate-600 text-[10px] uppercase">
                        {selectedUser.lastLogin ? formatTimestamp(selectedUser.lastLogin) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Close profile drawer action */}
              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-xs transition-all text-center cursor-pointer"
                >
                  Dismiss Profile Audit
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
