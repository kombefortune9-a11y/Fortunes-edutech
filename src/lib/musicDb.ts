/**
 * Dedicated IndexedDB Storage Service for Developer & User Music Tracks
 * Stores binary Blobs directly in IndexedDB for 100% reliable offline audio playback.
 */

export interface StoredAudioTrack {
  id: string;
  title: string;
  artist: string;
  addedBy: string;
  addedAt: number;
  mimeType: string;
  blob?: Blob;
  dataUrl?: string;
}

const DB_NAME = 'FortunesMusicStudio_IndexedDB';
const DB_VERSION = 1;
const STORE_NAME = 'music_tracks';

let dbInstance: IDBDatabase | null = null;

// Initialize or get the open IndexedDB instance
export const getMusicDb = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('addedAt', 'addedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("IndexedDB Open Error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Save an audio track (including binary Blob) into local IndexedDB
 */
export const saveTrackToIndexedDB = async (track: StoredAudioTrack): Promise<void> => {
  const db = await getMusicDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get a single audio track by ID from IndexedDB
 */
export const getTrackFromIndexedDB = async (id: string): Promise<StoredAudioTrack | null> => {
  try {
    const db = await getMusicDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("Failed to read track from IndexedDB:", err);
    return null;
  }
};

/**
 * Get all audio tracks stored in local IndexedDB
 */
export const getAllTracksFromIndexedDB = async (): Promise<StoredAudioTrack[]> => {
  try {
    const db = await getMusicDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as StoredAudioTrack[]) || [];
        // Sort by addedAt descending
        results.sort((a, b) => b.addedAt - a.addedAt);
        resolve(results);
      };

      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn("Failed to get all tracks from IndexedDB:", err);
    return [];
  }
};

/**
 * Delete an audio track from local IndexedDB
 */
export const deleteTrackFromIndexedDB = async (id: string): Promise<void> => {
  try {
    const db = await getMusicDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch (err) {
    console.warn("Failed to delete track from IndexedDB:", err);
  }
};

/**
 * Utility to convert Base64 string to a Blob object
 */
export const base64ToBlob = (base64: string, mimeType: string = 'audio/mp3'): Blob => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

/**
 * Utility to convert File or ArrayBuffer to Base64
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};
