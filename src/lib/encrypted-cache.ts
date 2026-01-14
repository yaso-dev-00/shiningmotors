// Encrypted cache manager that combines encryption and IndexedDB
// Provides a high-level interface for storing and retrieving encrypted conversation and message data

import { encrypt, decrypt, isEncryptionSupported } from './encryption';
import {
  getFromIndexedDB,
  setInIndexedDB,
  deleteFromIndexedDB,
  clearIndexedDBStore,
  getAllFromStore,
  STORES,
} from './indexeddb-cache';

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  encrypted: string;
}

/**
 * Checks if the cache entry is expired
 */
function isExpired(entry: CacheEntry<unknown>): boolean {
  return entry.expiresAt <= Date.now();
}

/**
 * Gets the store name based on the cache key prefix
 */
function getStoreName(key: string): string {
  if (key.startsWith('conversations:')) {
    return STORES.CONVERSATIONS;
  }
  if (key.startsWith('messages:')) {
    return STORES.MESSAGES;
  }
  // Default to conversations store
  return STORES.CONVERSATIONS;
}

/**
 * Gets cached data from encrypted IndexedDB storage
 * @param key - Cache key (e.g., 'conversations:userId' or 'messages:userId:conversationId')
 * @param userId - User ID for decryption
 * @returns Decrypted data or null if not found/expired
 */
export async function getEncryptedCache<T>(
  key: string,
  userId: string
): Promise<T | null> {
  // Check if encryption is supported
  if (!isEncryptionSupported()) {
    console.warn('Encryption not supported, skipping cache');
    return null;
  }

  try {
    const storeName = getStoreName(key);
    const entry = await getFromIndexedDB<CacheEntry<T>>(storeName, key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (isExpired(entry)) {
      // Delete expired entry
      await deleteFromIndexedDB(storeName, key);
      return null;
    }

    // Decrypt the data
    const decrypted = await decrypt<T>(entry.encrypted, userId);
    return decrypted;
  } catch (error) {
    console.error('Failed to get encrypted cache:', error);
    return null;
  }
}

/**
 * Sets data in encrypted IndexedDB storage
 * @param key - Cache key
 * @param value - Data to cache
 * @param userId - User ID for encryption
 * @param ttlMs - Time to live in milliseconds (default: 7 days)
 */
export async function setEncryptedCache<T>(
  key: string,
  value: T,
  userId: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  // Check if encryption is supported
  if (!isEncryptionSupported()) {
    console.warn('Encryption not supported, skipping cache');
    return;
  }

  try {
    // Encrypt the data
    const encrypted = await encrypt(value, userId);

    // Create cache entry
    const entry: CacheEntry<T> = {
      value, // Keep unencrypted value for quick access (will be removed in production if needed)
      expiresAt: Date.now() + ttlMs,
      encrypted,
    };

    const storeName = getStoreName(key);
    await setInIndexedDB(storeName, key, entry);
  } catch (error) {
    console.error('Failed to set encrypted cache:', error);
    throw error;
  }
}

/**
 * Deletes cached data from encrypted storage
 * @param key - Cache key to delete
 */
export async function deleteEncryptedCache(key: string): Promise<void> {
  try {
    const storeName = getStoreName(key);
    await deleteFromIndexedDB(storeName, key);
  } catch (error) {
    console.error('Failed to delete encrypted cache:', error);
    throw error;
  }
}

/**
 * Clears all cached conversations for a user
 * @param userId - User ID
 */
export async function clearConversationsCache(userId: string): Promise<void> {
  try {
    const storeName = STORES.CONVERSATIONS;
    const allEntries = await getAllFromStore<unknown>(storeName);
    
    // Delete all entries that match the user's conversations
    const prefix = `conversations:${userId}`;
    for (const entry of allEntries) {
      if (entry.key.startsWith(prefix)) {
        await deleteFromIndexedDB(storeName, entry.key);
      }
    }
  } catch (error) {
    console.error('Failed to clear conversations cache:', error);
    throw error;
  }
}

/**
 * Clears all cached messages for a user
 * @param userId - User ID
 */
export async function clearMessagesCache(userId: string): Promise<void> {
  try {
    const storeName = STORES.MESSAGES;
    const allEntries = await getAllFromStore<unknown>(storeName);
    
    // Delete all entries that match the user's messages
    const prefix = `messages:${userId}`;
    for (const entry of allEntries) {
      if (entry.key.startsWith(prefix)) {
        await deleteFromIndexedDB(storeName, entry.key);
      }
    }
  } catch (error) {
    console.error('Failed to clear messages cache:', error);
    throw error;
  }
}

/**
 * Clears all cached messages for a specific conversation
 * @param userId - User ID
 * @param conversationId - Conversation ID
 */
export async function clearConversationMessagesCache(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    const key = `messages:${userId}:${conversationId}`;
    await deleteEncryptedCache(key);
  } catch (error) {
    console.error('Failed to clear conversation messages cache:', error);
    throw error;
  }
}

/**
 * Clears all expired entries from the cache
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    for (const storeName of [STORES.CONVERSATIONS, STORES.MESSAGES]) {
      const allEntries = await getAllFromStore<unknown>(storeName);
      
      for (const entry of allEntries) {
        if (isExpired(entry.value)) {
          await deleteFromIndexedDB(storeName, entry.key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired cache:', error);
  }
}

/**
 * Generates a cache key for conversations
 */
export function getConversationsCacheKey(userId: string): string {
  return `conversations:${userId}`;
}

/**
 * Generates a cache key for messages
 */
export function getMessagesCacheKey(userId: string, conversationId: string): string {
  return `messages:${userId}:${conversationId}`;
}

