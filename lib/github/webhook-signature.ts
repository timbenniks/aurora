import { createHash, timingSafeEqual } from "node:crypto"

export function hashPayload(payload: string): string {
  return createHash("sha256").update(payload).digest("hex")
}

export function verifyGitHubWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false
  }

  const expected = createHash("sha256")
    .update(payload, "utf8")
    .update(secret)
    .digest("hex")

  const received = signatureHeader.slice("sha256=".length)

  if (expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}
