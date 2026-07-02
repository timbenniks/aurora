import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

import { getAuthSecret } from "@/lib/github/env"

function getEncryptionKey(): Buffer {
  return createHash("sha256").update(getAuthSecret()).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".")
}

export function decryptSecret(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split(".")

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret format.")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivB64, "base64")
  )

  decipher.setAuthTag(Buffer.from(tagB64, "base64"))

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

export function secretHint(secret: string): string {
  if (secret.length <= 4) {
    return "••••"
  }

  return `••••${secret.slice(-4)}`
}
