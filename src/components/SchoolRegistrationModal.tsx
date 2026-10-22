import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  School, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Phone, 
  Users, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from './FirebaseProvider';
import { BASE_SCHOOL_TEACHERS, EXTRA_TEACHER_PRICE, SchoolCircle } from '../lib/schoolTypes';
import { registerSchoolCircle } from '../lib/schoolService';

interface SchoolRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData?: {
    amount: number;
    referenceId: string;
    network: string;
    phone: string;
    purchasedTeachersLimit?: number;
  } | null;
  onCompleted?: (school: SchoolCircle) => void;
}

export function SchoolRegistrationModal({
  isOpen,
  onClose,
  paymentData,
  onCompleted,
}: SchoolRegistrationModalProps) {
  const { user, refreshSubscription } = useAuth();

  const [schoolName, setSchoolName] = useState('');
  const [representativeName, setRepresentativeName] = useState(user?.displayName || '');
  const [representativeEmail, setRepresentativeEmail] = useState(user?.email || '');
  const [representativePhone, setRepresentativePhone] = useState(paymentData?.phone || '');

  // Teacher input fields for adding next teacher
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');

  // List of teachers entered so far
  const [teachersList, setTeachersList] = useState<{ name: string; email: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxAllowed = paymentData?.purchasedTeachersLimit || BASE_SCHOOL_TEACHERS;

  useEffect(() => {
    if (user?.email && !representativeEmail) {
      setRepresentativeEmail(user.email);
    }
    if (user?.displayName && !representativeName) {
      setRepresentativeName(user.displayName);
    }
  }, [user]);

  // Seed representative as the first member if list is empty
  useEffect(() => {
    if (representativeEmail && teachersList.length === 0) {
      setTeachersList([
        {
          name: representativeName || user?.displayName || 'Teacher Representative',
          email: representativeEmail.toLowerCase().trim().replace(/\s+/g, ''),
        },
      ]);
    }
  }, [representativeEmail, representativeName]);

  if (!isOpen) return null;

  const handleAddTeacher = () => {
    const cleanMail = newTeacherEmail.toLowerCase().trim().replace(/\s+/g, '');
    const cleanName = newTeacherName.trim();

    if (!cleanName) {
      toast.error('Please enter the teacher name (e.g. Mr. Mwansa)');
      return;
    }
    if (!cleanMail || !cleanMail.includes('@')) {
      toast.error('Please enter a valid teacher email address.');
      return;
    }

    if (teachersList.length >= maxAllowed) {
      toast.error(
        `Capacity limit reached! The Whole School Circle is limited to ${maxAllowed} teachers. More than that requires adding ZMK ${EXTRA_TEACHER_PRICE} per teacher at the 5% rate.`,
        { duration: 7000 }
      );
      return;
    }

    if (teachersList.some((t) => t.email === cleanMail)) {
      toast.error('This teacher email is already entered in the list.');
      return;
    }

    setTeachersList((prev) => [...prev, { name: cleanName, email: cleanMail }]);
    setNewTeacherName('');
    setNewTeacherEmail('');
    toast.success(`Added ${cleanName} to school list!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      toast.error('Please enter your School Name (e.g. Chembe Primary School)');
      return;
    }
    if (!representativeName.trim()) {
      toast.error('Please enter the Teacher Representative name.');
      return;
    }
    if (!representativeEmail.trim() || !representativeEmail.includes('@')) {
      toast.error('Please provide a valid Teacher Representative email.');
      return;
    }
    if (teachersList.length === 0) {
      toast.error('Please add at least one teacher to the school account.');
      return;
    }
    if (teachersList.length > maxAllowed) {
      toast.error(
        `Total teachers (${teachersList.length}) exceeds maximum limit (${maxAllowed}). Please remove excess teachers or add ZMK ${EXTRA_TEACHER_PRICE} per extra teacher.`
      );
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading('Registering School Circle and activating all teachers...');

    try {
      const school = await registerSchoolCircle({
        schoolName: schoolName.trim(),
        representativeName: representativeName.trim(),
        representativeEmail: representativeEmail.trim(),
        representativePhone: representativePhone.trim(),
        teachers: teachersList,
        amountPaid: paymentData?.amount || 800,
        paymentReference: paymentData?.referenceId || `SCH_PAY_${Date.now()}`,
        paymentMethod: paymentData?.network ? `Lipila (${paymentData.network})` : 'Lipila Mobile Money',
        maxTeachers: maxAllowed,
      });

      await refreshSubscription();
      toast.dismiss(loadToast);
      toast.success(
        `🎉 ${school.schoolName} successfully activated! All ${school.teachers.length} teachers now have Unlimited Access!`,
        { duration: 9000 }
      );

      if (onCompleted) {
        onCompleted(school);
      }
      onClose();
    } catch (err: any) {
      toast.dismiss(loadToast);
      console.error('Error registering school:', err);
      toast.error(err.message || 'Error completing school registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 relative flex items-center justify-between border-b border-indigo-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <School size={22} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                  Instant Payment Verified
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight">
                  WHOLE SCHOOL TERMLY CIRCLE REGISTRATION
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {/* Information Notice */}
            <div className="bg-gradient-to-r from-indigo-50 via-teal-50/50 to-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold uppercase text-[11px]">
                <Sparkles size={15} className="text-indigo-600 shrink-0" />
                <span>Unlimited Termly Subscription Circle for All Your School Teachers</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-600">
                Payment of <strong className="text-indigo-900 font-black">ZMK {paymentData?.amount || 800}</strong> has been received in full. Complete this one-time registration form to activate your school app account immediately. Each registered teacher will receive an activation update email.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 text-[10px] text-indigo-800 font-bold">
                <span>Maximum capacity: <strong className="font-black">{maxAllowed} Teachers</strong></span>
                <span>Term duration: <strong className="font-black">90 Days (Termly)</strong></span>
              </div>
            </div>

            {/* School & Representative Profile Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <School size={13} className="text-indigo-600" />
                  <span>1. Registered School Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Chembe Primary School"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserCheck size={13} className="text-indigo-600" />
                  <span>Representative Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="e.g. Mr. Jones"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-600" />
                  <span>Representative Email (One-time entry) *</span>
                </label>
                <input
                  type="email"
                  required
                  value={representativeEmail}
                  onChange={(e) => setRepresentativeEmail(e.target.value)}
                  placeholder="e.g. jones@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Phone size={13} className="text-indigo-600" />
                  <span>Representative Phone Number (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={representativePhone}
                  onChange={(e) => setRepresentativePhone(e.target.value)}
                  placeholder="e.g. 0961622222"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Teacher Members Entry Section */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    2. Add School Teachers ({teachersList.length}/{maxAllowed})
                  </h4>
                </div>
                <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase border ${
                  teachersList.length >= maxAllowed
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {maxAllowed - teachersList.length} slots remaining
                </span>
              </div>

              {/* Add Teacher Input Row */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="Teacher Name (e.g. Mr Mwansa)"
                    disabled={teachersList.length >= maxAllowed}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                  <input
                    type="email"
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    placeholder="Teacher Email (e.g. mwansa@gmail.com)"
                    disabled={teachersList.length >= maxAllowed}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[9.5px] text-slate-500 font-medium">
                    Only registered emails at this school can log into this School Termly Circle.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddTeacher}
                    disabled={teachersList.length >= maxAllowed}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Teacher</span>
                  </button>
                </div>
              </div>

              {/* Capacity Limit Notification if reached */}
              {teachersList.length >= maxAllowed && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-[10.5px] text-amber-900">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black uppercase tracking-tight">Maximum Capacity Limit Reached ({maxAllowed} Teachers)</strong>
                    <p className="mt-0.5 text-amber-800 leading-snug">
                      The base Whole School Circle accommodates up to {BASE_SCHOOL_TEACHERS} teachers. Adding more than {BASE_SCHOOL_TEACHERS} teachers is calculated at the rate of 5% and requires adding <strong className="font-black">ZMK {EXTRA_TEACHER_PRICE}</strong> per teacher added.
                    </p>
                  </div>
                </div>
              )}

              {/* Added Teachers Roster */}
              <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
                {teachersList.map((teacher, idx) => {
                  const isRep = idx === 0 || teacher.email === representativeEmail.toLowerCase().trim().replace(/\s+/g, '');
                  return (
                    <div
                      key={teacher.email || idx}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[9px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="font-extrabold text-slate-800 text-[11px] truncate">
                            {teacher.name}
                          </p>
                          <p className="text-[9.5px] text-slate-400 font-mono truncate">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isRep ? (
                          <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                            Representative
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[8px] font-bold uppercase px-2 py-0.5 rounded-md">
                            Teacher
                          </span>
                        )}
                        <span className="text-[9px] text-emerald-600 font-black flex items-center gap-0.5">
                          <CheckCircle2 size={12} />
                          <span>Connected</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Activating Whole School Circle...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Complete Registration &amp; Activate School Account</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                🔒 Protected School Access • Receipt issued in school name • Instant Activation
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
