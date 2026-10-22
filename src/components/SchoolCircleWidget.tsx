import React, { useState } from 'react';
import { 
  School, 
  Users, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SchoolCircle, SchoolTeacherMember, BASE_SCHOOL_TEACHERS, EXTRA_TEACHER_PRICE } from '../lib/schoolTypes';
import { addTeacherToSchool } from '../lib/schoolService';

interface SchoolCircleWidgetProps {
  schoolCircle: SchoolCircle | null;
  currentTeacherEmail?: string;
  isRepresentative?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function SchoolCircleWidget({
  schoolCircle,
  currentTeacherEmail,
  isRepresentative,
  onRefresh,
  className = '',
}: SchoolCircleWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!schoolCircle) return null;

  const cleanCurrentEmail = currentTeacherEmail?.toLowerCase().trim().replace(/\s+/g, '');
  const currentMember = schoolCircle.teachers?.find(
    (t) => t.email?.toLowerCase().trim() === cleanCurrentEmail
  );

  const maxAllowed = schoolCircle.maxTeachers || BASE_SCHOOL_TEACHERS;
  const currentCount = schoolCircle.teachers?.length || 0;
  const canAddMore = isRepresentative && currentCount < maxAllowed;

  const isExpired = new Date() > new Date(schoolCircle.subscriptionEndDate);

  const handleAddLeftOutTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) {
      toast.error('Please enter the teacher name (e.g. Mr. Mwansa)');
      return;
    }
    const cleanMail = newTeacherEmail.toLowerCase().trim().replace(/\s+/g, '');
    if (!cleanMail || !cleanMail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (currentCount >= maxAllowed) {
      toast.error(
        `Capacity limit reached! Maximum ${maxAllowed} teachers connected. Additional teachers require adding ZMK ${EXTRA_TEACHER_PRICE} per teacher at 5% rate.`
      );
      return;
    }

    setIsAdding(true);
    try {
      await addTeacherToSchool(schoolCircle.id, schoolCircle.representativeEmail, {
        name: newTeacherName.trim(),
        email: cleanMail,
      });

      toast.success(`🎉 ${newTeacherName} was added to ${schoolCircle.schoolName}! An activation email has been sent.`);
      setNewTeacherName('');
      setNewTeacherEmail('');
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add teacher.');
    } finally {
      setIsAdding(false);
    }
  };

  // Helper to determine online status
  const checkIsOnline = (teacher: SchoolTeacherMember) => {
    if (teacher.email === cleanCurrentEmail) return true; // current viewer is online
    if (!teacher.lastActive) return false;
    const diffMs = Date.now() - new Date(teacher.lastActive).getTime();
    return diffMs < 180000; // < 3 minutes
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-4 sm:p-5 border border-indigo-500/30 shadow-xl overflow-hidden relative ${className}`}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[70px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/50 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <School size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/30">
                Whole School Termly Circle
              </span>
              <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                isExpired 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isExpired ? 'Cycle Ended (Trial Access)' : 'Active (Unlimited Downloads)'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black tracking-tight uppercase text-white mt-0.5 leading-tight">
              {schoolCircle.schoolName}
            </h3>
            <p className="text-[10px] text-slate-300 font-medium">
              Welcome {schoolCircle.schoolName} ({currentMember?.name || 'Educator'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {isRepresentative && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={currentCount >= maxAllowed}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title={currentCount >= maxAllowed ? `Maximum capacity of ${maxAllowed} teachers reached` : "Add teacher who was left out during registration"}
            >
              <Plus size={13} />
              <span>Add Left-Out Teacher</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse School Hub' : 'Expand School Hub'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Subscription Summary Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 pb-1 text-slate-300 relative z-10 text-[10.5px]">
        <div className="bg-slate-800/50 border border-indigo-500/20 p-2.5 rounded-xl">
          <span className="text-[8.5px] font-black uppercase text-indigo-300 block">Amount Paid</span>
          <span className="font-extrabold text-white text-xs">ZMK {schoolCircle.amountPaid}</span>
        </div>
        <div className="bg-slate-800/50 border border-indigo-500/20 p-2.5 rounded-xl">
          <span className="text-[8.5px] font-black uppercase text-indigo-300 block">Activation Date</span>
          <span className="font-bold text-white text-[10px] truncate block">
            {new Date(schoolCircle.subscriptionStartDate).toLocaleDateString('en-GB')}
          </span>
        </div>
        <div className="bg-slate-800/50 border border-indigo-500/20 p-2.5 rounded-xl">
          <span className="text-[8.5px] font-black uppercase text-indigo-300 block">Ending Date</span>
          <span className="font-bold text-amber-300 text-[10px] truncate block">
            {new Date(schoolCircle.subscriptionEndDate).toLocaleDateString('en-GB')}
          </span>
        </div>
        <div className="bg-slate-800/50 border border-indigo-500/20 p-2.5 rounded-xl">
          <span className="text-[8.5px] font-black uppercase text-indigo-300 block">Connected Teachers</span>
          <span className="font-extrabold text-emerald-300 text-xs">
            {currentCount} / {maxAllowed} Users
          </span>
        </div>
      </div>

      {/* Expanded Teachers Download Tracker & Online Leaderboard */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-indigo-800/40 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-200">
              <Download size={14} className="text-indigo-400" />
              <span>Teacher Download Tracker &amp; Online Status</span>
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">
              Live School Account Sharing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {schoolCircle.teachers?.map((t, idx) => {
              const online = checkIsOnline(t);
              const isMe = t.email === cleanCurrentEmail;
              return (
                <div
                  key={t.email || idx}
                  className={`bg-slate-850/80 border rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors ${
                    isMe
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-indigo-500/20 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-[11px] truncate">
                        {idx + 1}. {t.name}
                      </span>
                      {isMe && (
                        <span className="text-[7.5px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded-sm shrink-0">
                          You
                        </span>
                      )}
                      {t.role === 'representative' && (
                        <span className="text-[7.5px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 rounded-sm shrink-0">
                          Rep
                        </span>
                      )}
                    </div>
                    {/* Format required: e.g. Mr jones-----34 downloads */}
                    <p className="text-[10px] text-indigo-300 font-mono mt-0.5">
                      {t.name}-----<strong className="text-white font-extrabold">{t.downloadsCount || 0} downloads</strong>
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    {online ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Online</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8.5px] font-bold uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <span>Offline</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-[9.5px] text-indigo-300 font-semibold border-t border-indigo-900/60">
            <span>🛡️ Shared School Assessment records &amp; Report cards unlocked for all teachers</span>
            <span>Unlimited downloads during active term</span>
          </div>
        </div>
      )}

      {/* Representative Add Left-Out Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <h4 className="text-sm font-black uppercase text-slate-900">
                  Add Left-Out Teacher to School
                </h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLeftOutTeacher} className="space-y-4 pt-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950">
                <p className="font-bold">
                  School: <strong>{schoolCircle.schoolName}</strong>
                </p>
                <p className="text-[11px] text-indigo-800 mt-1">
                  Remaining teacher capacity: <strong>{maxAllowed - currentCount} of {maxAllowed}</strong> slots. Users already added cannot be removed.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  Teacher Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="e.g. Mr. Kennedy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  Teacher Email *
                </label>
                <input
                  type="email"
                  required
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="e.g. kennedy@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Adding Teacher...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Add &amp; Send Activation Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
