import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM envelope for broker secrets (Tradovate password, access token).
 *
 * The key comes from BROKER_ENCRYPTION_KEY (32 random bytes, base64) and only
 * exists in the server environment, so the ciphertext in Supabase is useless
 * on its own. Each envelope is bound to its owner and row through the GCM
 * additional data: copied to another user or row, it no longer decrypts.
 *
 * Format: v1.<iv>.<tag>.<ciphertext>, all base64url. The version prefix
 * leaves room for key rotation.
 */

const VERSION = "v1";

export class BrokerKeyMissingError extends Error {
  constructor() {
    super("BROKER_ENCRYPTION_KEY is not set or is not 32 bytes of base64");
  }
}

function key(): Buffer {
  const raw = process.env.BROKER_ENCRYPTION_KEY;
  if (!raw) throw new BrokerKeyMissingError();
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new BrokerKeyMissingError();
  return buf;
}

export function hasEncryptionKey(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function seal(plaintext: string, context: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function open(envelope: string, context: string): string {
  const [version, iv, tag, ct] = envelope.split(".");
  if (version !== VERSION || !iv || !tag || !ct) throw new Error("Unrecognised secret envelope");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}
