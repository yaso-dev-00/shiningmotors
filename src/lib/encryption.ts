// Web Crypto API encryption utilities for client-side data encryption
// Uses AES-GCM for authenticated encryption with keys derived from user ID

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derives a cryptographic key from a user ID using PBKDF2
 */
async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  // Import the user ID as a key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userId),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generates a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Encrypts data using AES-GCM
 * @param data - The data to encrypt (will be JSON stringified)
 * @param userId - User ID used for key derivation
 * @returns Encrypted data as base64 string (format: salt:iv:encryptedData)
 */
export async function encrypt<T>(data: T, userId: string): Promise<string> {
  try {
    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(userId, salt);

    // Convert data to JSON string and then to Uint8Array
    const plaintext = new TextEncoder().encode(JSON.stringify(data));

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      plaintext
    );

    // Combine salt, IV, and encrypted data
    const combined = new Uint8Array(
      SALT_LENGTH + IV_LENGTH + encrypted.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);

    // Convert to base64 for storage
    return btoa(
      String.fromCharCode.apply(null, Array.from(combined))
    );
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-GCM
 * @param encryptedData - Base64 encoded encrypted data (format: salt:iv:encryptedData)
 * @param userId - User ID used for key derivation
 * @returns Decrypted and parsed data
 */
export async function decrypt<T>(
  encryptedData: string,
  userId: string
): Promise<T> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(
      atob(encryptedData)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive the key
    const key = await deriveKey(userId, salt);

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      encrypted
    );

    // Convert back to JSON and parse
    const plaintext = new TextDecoder().decode(decrypted);
    return JSON.parse(plaintext) as T;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Checks if Web Crypto API is available
 */
export function isEncryptionSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues !== 'undefined'
  );
}

