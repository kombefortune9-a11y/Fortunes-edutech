import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface TelemetryEvent {
  id: string; // Unique offline event ID
  userId: string;
  userEmail: string;
  feature: string;
  action: string;
  details: string;
  count: number;
  timestamp: string; // ISO string
  offline: boolean;
}

const DB_NAME = 'FortunesTelemetryDB';
const STORE_NAME = 'interactions';
const DB_VERSION = 1;

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save event to IndexedDB
export async function saveToIndexedDB(event: TelemetryEvent): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(event);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all events from IndexedDB
export async function getPendingFromIndexedDB(): Promise<TelemetryEvent[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Could not read from IndexedDB", e);
    return [];
  }
}

// Delete single event from IndexedDB
export async function deleteFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Helper: retrieve cached user ID
function getCachedUserId(): string | null {
  try {
    const guestUserStr = localStorage.getItem('eduplan_guest_user');
    if (guestUserStr) {
      const parsed = JSON.parse(guestUserStr);
      return parsed.uid || null;
    }
    const googleUserStr = localStorage.getItem('eduplan_google_user');
    if (googleUserStr) {
      const parsed = JSON.parse(googleUserStr);
      return parsed.uid || null;
    }
  } catch (e) {
    console.warn("Error getting cached user ID:", e);
  }
  return null;
}

// Helper: retrieve cached user Email
function getCachedUserEmail(): string | null {
  try {
    const guestUserStr = localStorage.getItem('eduplan_guest_user');
    if (guestUserStr) {
      const parsed = JSON.parse(guestUserStr);
      return parsed.email || null;
    }
    const googleUserStr = localStorage.getItem('eduplan_google_user');
    if (googleUserStr) {
      const parsed = JSON.parse(googleUserStr);
      return parsed.email || null;
    }
  } catch (e) {
    console.warn("Error getting cached user Email:", e);
  }
  return null;
}

// Primary Tracking Function
export async function trackInteraction(feature: string, action: string, details?: string) {
  try {
    const userId = auth.currentUser?.uid || getCachedUserId() || 'guest_teacher';
    const userEmail = auth.currentUser?.email || getCachedUserEmail() || 'guest@fortunesedutech.com';
    const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

    const existingEvents = await getPendingFromIndexedDB();
    
    // Find an event that has same userId, feature, action, and details
    const matchingEvent = existingEvents.find(e => 
      e.userId === userId && 
      e.feature === feature && 
      e.action === action && 
      e.details === (details || '')
    );

    if (matchingEvent) {
      // Increment count on matching event
      matchingEvent.count += 1;
      matchingEvent.timestamp = new Date().toISOString();
      // If we are currently offline, mark it as offline; otherwise retain online status or set based on current state
      if (!isOnline) {
        matchingEvent.offline = true;
      }
      await saveToIndexedDB(matchingEvent);
    } else {
      // Create new event
      const newEvent: TelemetryEvent = {
        id: `${userId}_${feature}_${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userEmail,
        feature,
        action,
        details: details || '',
        count: 1,
        timestamp: new Date().toISOString(),
        offline: !isOnline
      };
      await saveToIndexedDB(newEvent);
    }

    // Trigger local updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('telemetry-updated'));
    }

    // If online, immediately attempt to sync
    if (isOnline) {
      syncPendingTelemetry().catch(err => {
        console.warn("Failed background telemetry sync:", err);
      });
    }
  } catch (error) {
    console.warn("Error tracking telemetry interaction:", error);
  }
}

// Sync function to push to Firestore
let isSyncing = false;
export async function syncPendingTelemetry(): Promise<void> {
  if (isSyncing) return;
  const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
  if (!isOnline) return;

  try {
    isSyncing = true;
    const pendingEvents = await getPendingFromIndexedDB();
    if (pendingEvents.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`Telemetry Syncing: found ${pendingEvents.length} logs to upload...`);

    for (const event of pendingEvents) {
      // Zero-Trust verification payload format matches rules definition exactly
      const firestoreDoc = {
        id: event.id,
        userId: event.userId,
        userEmail: event.userEmail,
        feature: event.feature,
        action: event.action,
        details: event.details || '',
        count: event.count,
        timestamp: Timestamp.fromDate(new Date(event.timestamp)),
        offline: event.offline
      };

      try {
        // Sync document
        await setDoc(doc(db, 'users', event.userId, 'telemetry', event.id), firestoreDoc);
        // Delete from local DB on success
        await deleteFromIndexedDB(event.id);
      } catch (err) {
        console.warn(`Failed to sync event ${event.id}:`, err);
        // If permission error or schema mismatch, delete it to avoid stuck queues, but for network errors keep it
        const errStr = String(err);
        if (errStr.includes('permission-denied') || errStr.includes('Missing or insufficient permissions')) {
          await deleteFromIndexedDB(event.id);
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('telemetry-updated'));
    }
  } catch (e) {
    console.warn("Error during telemetry sync process:", e);
  } finally {
    isSyncing = false;
  }
}

// Retrieve aggregate stats for UI
export interface TelemetryStats {
  featureUsage: { [feature: string]: number };
  actionUsage: { [action: string]: number };
  totalPendingSync: number;
  totalEventsTracked: number;
}

export async function getLocalTelemetryStats(): Promise<TelemetryStats> {
  const events = await getPendingFromIndexedDB();
  const featureUsage: { [feature: string]: number } = {};
  const actionUsage: { [action: string]: number } = {};
  let totalEventsTracked = 0;

  events.forEach(event => {
    featureUsage[event.feature] = (featureUsage[event.feature] || 0) + event.count;
    actionUsage[event.action] = (actionUsage[event.action] || 0) + event.count;
    totalEventsTracked += event.count;
  });

  return {
    featureUsage,
    actionUsage,
    totalPendingSync: events.length,
    totalEventsTracked
  };
}

// Automatically listen for connection restore to trigger sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log("Device is online. Triggering telemetry synchronization...");
    syncPendingTelemetry();
  });
}
