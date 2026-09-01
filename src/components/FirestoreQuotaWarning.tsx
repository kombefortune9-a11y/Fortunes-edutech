import React, { useEffect, useState } from 'react';
import { useAuth } from './FirebaseProvider';
import { ADMIN_EMAIL } from '../constants';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

export function FirestoreQuotaWarning() {
  const { isQuotaExceeded, user } = useAuth();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (isQuotaExceeded && !hasShownToast) {
      const isAdmin = user?.email?.toLowerCase().trim() === ADMIN_EMAIL;
      
      if (isAdmin) {
        toast.error(
          (t) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Database Quota Exceeded
              </div>
              <p className="text-xs opacity-90 leading-tight">
                Daily free tier limit reached. Content may not load until reset or upgrade.
              </p>
              <button 
                onClick={() => {
                  window.open("https://console.firebase.google.com/project/project-9e0fee52-feb4-4b1a-a01/firestore/databases/ai-studio-e20867b2-6dc4-4cb6-9a2c-76983697a60f/data?openUpgradeDialog=true", "_blank");
                  toast.dismiss(t.id);
                }}
                className="mt-2 text-[10px] uppercase font-black tracking-widest bg-amber-600 text-white px-2 py-1 rounded"
              >
                Upgrade DB
              </button>
            </div>
          ),
          { 
            duration: 10000,
            id: 'quota-exceeded-toast',
            style: {
              background: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FDE68A',
            }
          }
        );
      } else {
        // For non-admins, we don't show the scary quota message as requested.
        // We just log it silently for debugging if they happen to open console.
        console.warn("Firestore Quota Exceeded (Silently hidden from user)");
      }
      setHasShownToast(true);
    }
  }, [isQuotaExceeded, user, hasShownToast]);

  const isAdmin = user?.email?.toLowerCase().trim() === ADMIN_EMAIL;

  if (!isQuotaExceeded || !isAdmin) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 leading-tight">
              Firestore Database Quota Exceeded (Free Tier)
            </h3>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed max-w-3xl">
              Your application has reached its daily free read unit limit ('Free daily read units per project (free tier database)'). 
              This quota resets automatically tomorrow. Detailed quota information is available under the <strong>Spark plan</strong> column in the <strong>Enterprise edition</strong> section of the <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950">Firebase Pricing Guide</a>.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
          <a
            href="https://console.firebase.google.com/project/project-9e0fee52-feb4-4b1a-a01/firestore/databases/ai-studio-e20867b2-6dc4-4cb6-9a2c-76983697a60f/data?openUpgradeDialog=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm whitespace-nowrap"
          >
            Upgrade Firestore Database
          </a>
        </div>
      </div>
    </div>
  );
}
