import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get the master encryption key from environment
 * Throws error in production if not configured
 */
function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_MASTER_KEY;
  
  if (envKey) {
    return Buffer.from(envKey, "hex");
  }
  
  // In production, require the master key to be set
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_MASTER_KEY environment variable must be set in production");
  }
  
  // Fallback for development only - use a derived key from a secret
  // SECURITY WARNING: This fallback must NEVER be used in production!
  // Ensure ENCRYPTION_MASTER_KEY is set in production environment variables.
  const fallbackSecret = process.env.ENCRYPTION_FALLBACK_SECRET || "complysafe-dev-secret-change-in-production";
  return crypto.pbkdf2Sync(fallbackSecret, "complysafe-salt", ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypts plaintext using AES-256-GCM
 * Returns IV + salt + authTag + ciphertext as hex
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive key from master + salt for this specific encryption
  const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Combine: IV (16) + salt (32) + authTag (16) + ciphertext
  return iv.toString("hex") + salt.toString("hex") + authTag.toString("hex") + encrypted;
}

/**
 * Decrypts ciphertext encrypted with encrypt()
 */
export function decrypt(ciphertext: string): string {
  const key = getMasterKey();
  
  // Extract components
  const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), "hex");
  const salt = Buffer.from(ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + SALT_LENGTH) * 2), "hex");
  const authTag = Buffer.from(ciphertext.slice((IV_LENGTH + SALT_LENGTH) * 2, (IV_LENGTH + SALT_LENGTH + AUTH_TAG_LENGTH) * 2), "hex");
  const encrypted = ciphertext.slice((IV_LENGTH + SALT_LENGTH + AUTH_TAG_LENGTH) * 2);
  
  // Derive key from master + salt
  const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Hash a value (one-way, for comparisons)
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Encrypt an object, returning an object with encrypted fields
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0) {
      (result[field] as unknown) = encrypt(value);
    }
  }
  
  return result;
}

/**
 * Decrypt fields in an object
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0) {
      try {
        (result[field] as unknown) = decrypt(value);
      } catch {
        // Field might not be encrypted, leave as-is
      }
    }
  }
  
  return result;
}

/**
 * Check if a string appears to be encrypted (hex, minimum length)
 */
export function isEncrypted(value: string): boolean {
  if (!/^[0-9a-f]+$/i.test(value)) return false;
  // Encrypted string minimum length: IV(32) + salt(64) + authTag(32) = 128
  return value.length >= 128;
}
