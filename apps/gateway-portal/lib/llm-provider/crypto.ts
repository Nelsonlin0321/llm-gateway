import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const API_KEY_CIPHER = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION = "v1";

function getEncryptionKey() {
  const secret = process.env.API_ENCRYPT_KEY;

  if (!secret) {
    throw new Error(
      "API_ENCRYPT_KEY is not configured. Add it to the environment before managing provider credentials.",
    );
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(API_KEY_CIPHER, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

// Reserved for the proxy layer and tests. Never send decrypted keys to the client.
export function decryptApiKeyForProxy(payload: string) {
  const [version, iv, authTag, encrypted] = payload.split(".");

  if (version !== VERSION || !iv || !authTag || !encrypted) {
    throw new Error("Encrypted API key payload is invalid.");
  }

  try {
    const decipher = createDecipheriv(
      API_KEY_CIPHER,
      getEncryptionKey(),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "Encrypted API key could not be decrypted with the current key.",
    );
  }
}
