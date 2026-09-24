import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Envelope encryption for broker secrets (Tradovate password, access token).
 *
 * Two layers, because these credentials may belong to someone other than the
 * operator:
 *
 *   master key  — BROKER_ENCRYPTION_KEY, server environment only. Wraps data
 *                 keys and nothing else, so it never touches a credential.
 *   data key    — 32 random bytes per connection, stored only in wrapped form.
 *                 Encrypts that one connection's secrets.
 *
 * One leaked data key exposes one connection. Rotating the master key means
 * rewrapping data keys, without decrypting a single password. Moving the
 * wrapping to a hardware key service later changes `wrapDataKey` /
 * `unwrapDataKey` and nothing else.
 *
 * Every envelope is bound to its owner and row through the GCM additional
 * data, so ciphertext copied to another user or row will not open.
 *
 * Format: v1.<iv>.<tag>.<ciphertext>, base64url. v1 envelopes opened with the
 * master key are pre-envelope rows and are re-wrapped on the next write.
 */

const VERSION = "v1";
const KEY_BYTES = 32;

export class BrokerKeyMissingError extends Error {
  constructor() {
    super("BROKER_ENCRYPTION_KEY is not set or is not 32 bytes of base64");
  }
}

function masterKey(): Buffer {
  const raw = process.env.BROKER_ENCRYPTION_KEY;
  if (!raw) throw new BrokerKeyMissingError();
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== KEY_BYTES) throw new BrokerKeyMissingError();
  return buf;
}

export function hasEncryptionKey(): boolean {
  try {
    masterKey();
    return true;
  } catch {
    return false;
  }
}

function encrypt(plaintext: Buffer, key: Buffer, context: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

function decrypt(envelope: string, key: Buffer, context: string): Buffer {
  const [version, iv, tag, ct] = envelope.split(".");
  if (version !== VERSION || !iv || !tag || !ct) throw new Error("Unrecognised secret envelope");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]);
}

/** A fresh data key plus its wrapped form, which is what gets stored. */
export function createDataKey(context: string): { key: Buffer; wrapped: string } {
  const key = randomBytes(KEY_BYTES);
  return { key, wrapped: encrypt(key, masterKey(), context) };
}

export function unwrapDataKey(wrapped: string, context: string): Buffer {
  const key = decrypt(wrapped, masterKey(), context);
  if (key.length !== KEY_BYTES) throw new Error("Unwrapped data key has the wrong length");
  return key;
}

/**
 * The key for a connection's secrets: its own data key, or the master key for
 * rows written before envelope encryption existed.
 */
export function secretKey(wrapped: string | null, context: string): Buffer {
  return wrapped ? unwrapDataKey(wrapped, context) : masterKey();
}

export function seal(plaintext: string, key: Buffer, context: string): string {
  return encrypt(Buffer.from(plaintext, "utf8"), key, context);
}

export function open(envelope: string, key: Buffer, context: string): string {
  return decrypt(envelope, key, context).toString("utf8");
}
