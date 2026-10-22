import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, MessageSquare, X, Send, User } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { ADMIN_EMAIL } from '../constants';
import { NewsAndFeedbackTicker } from './NewsAndFeedbackTicker';

interface Review {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  text: string;
  rating: number;
  timestamp: any;
  isTrial?: boolean;
}

export const ReviewTicker: React.FC<{ className?: string }> = ({ className }) => {
  return <NewsAndFeedbackTicker className={className} />;
};

export const ReviewSystem: React.FC<{ 
  showFloatingButton?: boolean;
  isExternalOpen?: boolean;
  onClose?: () => void;
}> = ({ showFloatingButton = true, isExternalOpen, onClose }) => {
  const { 
    user, 
    subscriptionDetails, 
    userType,
    schoolCircle,
    schoolTeacher,
    isSchoolRepresentative
  } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isExternalOpen !== undefined ? isExternalOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (onClose && !val) onClose();
    setInternalIsOpen(val);
  };

  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!name) {
      if (schoolCircle) {
        const teacherName = schoolTeacher?.name || user?.displayName || 'Teacher';
        setName(`${schoolCircle.schoolName} (${teacherName})`);
      } else if (user?.displayName) {
        setName(user.displayName);
      } else if (user?.email) {
        // Extract just the one name from the email (e.g. kombefortune9@gmail.com -> Kombefortune)
        const localPart = user.email.split('@')[0];
        const namePart = localPart.split(/[\.\-\_]/)[0]; // split by common separators
        const cleanName = namePart.replace(/[0-9]/g, ''); // remove numbers
        if (cleanName) {
          const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
          setName(capitalizedName);
        }
      }
    }
  }, [user?.displayName, user?.email, schoolCircle, schoolTeacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !name.trim()) {
      toast.error("Please provide both your name and comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewName = name.trim();
      const reviewEmail = user?.email || (user?.uid ? `${user.uid}@fortunesedutech.com` : 'trial_teacher@fortunesedutech.com');
      const reviewPhoto = user?.photoURL || '';
      const isTrial = !user || !!(subscriptionDetails?.isTrialMode || userType === 'guest');

      await addDoc(collection(db, 'reviews'), {
        name: reviewName,
        email: reviewEmail,
        photoURL: reviewPhoto,
        text: text.trim(),
        rating,
        isTrial: isTrial,
        timestamp: serverTimestamp()
      });
      setText('');
      setRating(5);
      setIsOpen(false);
      toast.success("Thank you for your recommendation!");
    } catch (err: any) {
      console.warn("Could not submit review to Firestore directly, saving feedback locally:", err);
      // Fallback: Store locally so trial or offline users' feedback is recorded
      try {
        const localReviewsKey = 'eduplan_local_reviews_submitted';
        const existingLocal = safeLocalStorage.getItem(localReviewsKey);
        const list = existingLocal ? JSON.parse(existingLocal) : [];
        list.push({
          name: name.trim() || 'Teacher',
          email: user?.email || 'teacher@fortunesedutech.com',
          text: text.trim(),
          rating,
          timestamp: new Date().toISOString()
        });
        safeLocalStorage.setItem(localReviewsKey, JSON.stringify(list));
      } catch (e) {}

      setText('');
      setRating(5);
      setIsOpen(false);
      toast.success("Thank you for your recommendation!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Pulsing Button Tab */}
      {showFloatingButton && (
        <div className="fixed bottom-36 right-6 z-50">
          <motion.button
            onClick={() => setIsOpen(true)}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-red-500 text-white p-4 rounded-full shadow-2xl shadow-red-200 flex items-center gap-2 hover:bg-red-600 transition-colors"
          >
            <Heart fill="white" size={24} />
            <span className="font-black text-xs uppercase tracking-widest pr-2">Recommend</span>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-red-500 p-8 text-white relative">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 text-white hover:text-red-500 hover:bg-white transition-all bg-white/10 p-2 rounded-full z-[70] flex items-center justify-center cursor-pointer shadow-md"
                  aria-label="Close recommendations"
                >
                  <X size={18} />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
                  <Heart fill="white" size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Recommend App</h2>
                <p className="text-red-100 font-bold mt-2 text-sm opacity-90 underline underline-offset-4 decoration-red-300">Share your feedback with the community</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Name / Review As</label>
                    {schoolCircle && (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        🏫 {schoolCircle.schoolName}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-red-100 transition-all text-xs sm:text-sm"
                    required
                  />
                  {schoolCircle && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setName(`${schoolCircle.schoolName} (${schoolTeacher?.name || user?.displayName || 'Teacher'})`)}
                        className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                      >
                        Teacher: {schoolCircle.schoolName} ({schoolTeacher?.name || 'Teacher'})
                      </button>
                      {isSchoolRepresentative && (
                        <>
                          <button
                            type="button"
                            onClick={() => setName(`${schoolCircle.schoolName} (Representative)`)}
                            className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Rep: {schoolCircle.schoolName} (Representative)
                          </button>
                          <button
                            type="button"
                            onClick={() => setName(schoolCircle.schoolName)}
                            className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                          >
                            School: {schoolCircle.schoolName}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Experience</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-all ${rating >= star ? 'text-amber-400 scale-110' : 'text-slate-200'}`}
                      >
                        <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comments</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us what you like about the app..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-red-100 transition-all min-h-[120px] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'SUBMITTING...' : (
                    <>
                      <Send size={18} />
                      SUBMIT RECOMMENDATION
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
