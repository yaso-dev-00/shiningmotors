// IndexedDB wrapper for storing encrypted cache data
// Provides a simple interface for storing and retrieving data from IndexedDB

const DB_NAME = 'shining-motors-cache';
const DB_VERSION = 1;
const STORE_CONVERSATIONS = 'conversations';
const STORE_MESSAGES = 'messages';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  encrypted: string; // Base64 encrypted data
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        db.createObjectStore(STORE_CONVERSATIONS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

/**
 * Gets data from IndexedDB
 */
export async function getFromIndexedDB<T>(
  storeName: string,
  key: string
): Promise<CacheEntry<T> | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get data: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('IndexedDB get error:', error);
    return null;
  }
}

/**
 * Sets data in IndexedDB
 */
export async function setInIndexedDB<T>(
  storeName: string,
  key: string,
  entry: CacheEntry<T>
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put({ key, ...entry });

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set data: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('IndexedDB set error:', error);
    throw error;
  }
}

/**
 * Deletes data from IndexedDB
 */
export async function deleteFromIndexedDB(
  storeName: string,
  key: string
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete data: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('IndexedDB delete error:', error);
    throw error;
  }
}

/**
 * Clears all data from a store
 */
export async function clearIndexedDBStore(storeName: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('IndexedDB clear error:', error);
    throw error;
  }
}

/**
 * Gets all keys from a store (for cleanup operations)
 */
export async function getAllKeysFromStore(
  storeName: string
): Promise<string[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAllKeys();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get keys: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('IndexedDB get keys error:', error);
    return [];
  }
}

/**
 * Gets all entries from a store (for cleanup operations)
 */
export async function getAllFromStore<T>(
  storeName: string
): Promise<Array<{ key: string; value: CacheEntry<T> }>> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result as Array<{ key: string } & CacheEntry<T>>;
        resolve(
          results.map((r) => ({
            key: r.key,
            value: { value: r.value, expiresAt: r.expiresAt, encrypted: r.encrypted },
          }))
        );
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all entries: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('IndexedDB get all error:', error);
    return [];
  }
}

// Export store names for use in other modules
export const STORES = {
  CONVERSATIONS: STORE_CONVERSATIONS,
  MESSAGES: STORE_MESSAGES,
};

