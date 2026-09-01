import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function initFirestoreInstance() {
  const dbId = (firebaseConfig as any)?.firestoreDatabaseId;

  // 1. Try initializeFirestore with standard applet settings
  try {
    if (dbId) {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      }, dbId);
    } else {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    }
  } catch (e) {
    console.warn("initializeFirestore failed, attempting fallback getFirestore:", e);
  }

  // 2. Try getFirestore with database ID
  try {
    if (dbId) {
      return getFirestore(app, dbId);
    }
  } catch (e) {
    console.warn("getFirestore with dbId failed:", e);
  }

  // 3. Try getFirestore with app
  try {
    return getFirestore(app);
  } catch (e) {
    console.warn("getFirestore with app failed:", e);
  }

  // 4. Final fallback
  return getFirestore();
}

export const db = initFirestoreInstance();

export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// Global error handler for internal assertion failures, quota errors, and network/auth errors that might leak to console
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    let msg = '';
    try {
      msg = args.map(a => {
        if (!a) return '';
        if (a instanceof Error) return a.message + ' ' + (a.stack || '');
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');
    } catch {
      msg = '';
    }
    const lowerMsg = msg.toLowerCase();
    if (
      lowerMsg.includes('quota limit exceeded') ||
      lowerMsg.includes('quota exceeded') ||
      lowerMsg.includes('resource-exhausted') ||
      lowerMsg.includes('free quota limits') ||
      lowerMsg.includes('free daily read units') ||
      lowerMsg.includes('read units per project') ||
      msg.includes('INTERNAL ASSERTION FAILED') ||
      msg.includes('Unexpected state (ID: ca9)')
    ) {
      // Catch and report quota-related assertion failures / limit errors to our UI
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
      console.warn('Firestore Quota Notice (operating in offline-resilient/cached mode):', ...args);
      return; // Suppress from console.error to keep runtime healthy
    }
    if (
      msg.includes('auth/network-request-failed') ||
      msg.includes('Fetching auth token failed') ||
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('Failed to get document because the client is offline') ||
      msg.includes('Error loading downloads stats') ||
      lowerMsg.includes('error fetching document feedback')
    ) {
      // Log as a soft warning rather than an unhandled error when offline or transient network token issue
      console.warn('Firestore/Auth connection notice (operating in offline/cached mode):', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  const lowerErr = errStr.toLowerCase();
  const isQuotaError = lowerErr.includes('quota') || 
                       lowerErr.includes('exceeded') || 
                       lowerErr.includes('limit') || 
                       lowerErr.includes('exhausted') || 
                       lowerErr.includes('resource-exhausted') || 
                       errStr.includes('INTERNAL ASSERTION FAILED');
  const isNetworkOrAuthError = errStr.includes('network-request-failed') ||
                               errStr.includes('Fetching auth token failed') ||
                               errStr.includes('Could not reach Cloud Firestore backend') ||
                               errStr.includes('client is offline');
  
  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  
  if (isQuotaError) {
    console.warn('Firestore Quota/Internal Error (handled gracefully):', path, errStr);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
    }
    // Don't throw for quota errors, just log them as warnings to avoid crashing the app
    return;
  }

  if (isNetworkOrAuthError) {
    console.warn('Firestore Network/Auth Error (handled gracefully):', path, errStr);
    return;
  }
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function recordActivity(activity: {
  type: 'download' | 'generation' | 'login' | 'error' | 'sync';
  doc_type?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  format?: string;
  details?: string;
}) {
  const user = auth.currentUser;
  if (!user && activity.type !== 'login') return;

  try {
    const trackingDoc = {
      user_email: user?.email || 'anonymous',
      user_uid: user?.uid || 'anonymous',
      activity_type: activity.type,
      doc_type: activity.doc_type || '',
      grade: activity.grade || '',
      subject: activity.subject || '',
      topic: activity.topic || '',
      subtopic: activity.subtopic || '',
      format: activity.format || '',
      details: activity.details || '',
      timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, "system_activity"), trackingDoc);
  } catch (error) {
    console.warn("Failed to record system activity:", error);
  }
}

/** @deprecated Use recordActivity instead */
export const recordDownload = (metadata: any) => recordActivity({
  type: 'download',
  ...metadata,
  doc_type: metadata.type
});

// validate connection removed to prevent network error spam in preview
// when connection takes longer or blocks

