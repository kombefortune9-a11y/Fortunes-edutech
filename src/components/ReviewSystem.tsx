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
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Load from cache initially
    try {
      const cached = safeLocalStorage.getItem('eduplan_reviews_cache');
      if (cached) setReviews(JSON.parse(cached));
    } catch (e) {
      console.warn("Error loading cached reviews");
    }

    const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(data);
      // Cache successful fetch
      safeLocalStorage.setItem('eduplan_reviews_cache', JSON.stringify(data));
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });
    return unsubscribe;
  }, []);

  const DEFAULT_REVIEWS: Review[] = [
    {
      id: 'default-1',
      name: 'Chipo Banda',
      email: 'chipo@fortunes.edu',
      text: 'This tool has made lesson planning so easy! I generate my schemes of work in minutes.',
      rating: 5,
      timestamp: null,
      isTrial: true
    },
    {
      id: 'default-2',
      name: 'Mwansa Tembo',
      email: 'mwansa@fortunes.edu',
      text: 'The syllabus integration is seamless. Highly recommended for Zambian teachers.',
      rating: 5,
      timestamp: null
    },
    {
      id: 'default-3',
      name: 'Fortune Kombe',
      email: 'fortune@fortunes.edu',
      text: 'Excellent platform. The lesson plans align perfectly with the CBC curriculum.',
      rating: 5,
      timestamp: null
    },
    {
      id: 'default-4',
      name: 'Albert Phiri',
      email: 'albert@fortunes.edu',
      text: 'Saves me so many hours of typing. The weekly forecasts sync beautifully!',
      rating: 5,
      timestamp: null
    },
    {
      id: 'default-5',
      name: 'Mutale Mulenga',
      email: 'mutale@fortunes.edu',
      text: 'A game changer for lesson notes. Instant, accurate, and professional.',
      rating: 5,
      timestamp: null
    }
  ];

  const displayReviews = reviews.length > 0 ? [...reviews, ...DEFAULT_REVIEWS] : DEFAULT_REVIEWS;
  const isDeveloper = user?.email?.toLowerCase().trim() === ADMIN_EMAIL;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2 ml-1">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic drop-shadow-sm">Live Feedback</span>
      </div>
      
      <div className="overflow-hidden h-10 flex items-center bg-white/60 backdrop-blur-md rounded-2xl border border-emerald-200/50 px-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <motion.div 
          className="flex whitespace-nowrap gap-12 text-[11px] font-bold text-slate-700 tracking-tight"
          animate={{ x: [0, -2500] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {[...displayReviews, ...displayReviews, ...displayReviews].map((rev, idx) => (
            <div key={`${rev.id}-${idx}`} className="flex items-center gap-3">
              <span className="text-emerald-700 font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                {rev.name}
                {isDeveloper && rev.isTrial && rev.email && (
                  <span className="text-[9px] text-rose-600 font-extrabold lowercase ml-1 px-1.5 py-0.5 bg-rose-50 rounded border border-rose-100 flex items-center gap-1 select-all">
                    <span className="w-1 h-1 rounded-full bg-rose-400 animate-pulse" />
                    {rev.email} (trial)
                  </span>
                )}
              </span>
              <span className="text-slate-600 italic">"{rev.text}"</span>
              <div className="flex gap-0.5 text-amber-400 drop-shadow-sm">
                {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} size={10} fill="currentColor" />) }
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export const ReviewSystem: React.FC<{ 
  showFloatingButton?: boolean;
  isExternalOpen?: boolean;
  onClose?: () => void;
}> = ({ showFloatingButton = true, isExternalOpen, onClose }) => {
  const { user, subscriptionDetails, userType } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isExternalOpen !== undefined ? isExternalOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (onClose && !val) onClose();
    setInternalIsOpen(val);
  };

  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to leave a review");
      return;
    }
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        name: user.displayName || 'Teacher',
        email: user.email,
        photoURL: user.photoURL,
        text: text.trim(),
        rating,
        isTrial: !!(subscriptionDetails?.isTrialMode || userType === 'guest'),
        timestamp: serverTimestamp()
      });
      setText('');
      setRating(5);
      setIsOpen(false);
      toast.success("Thank you for your recommendation!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
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
