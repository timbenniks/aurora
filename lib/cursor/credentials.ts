import { eq } from "drizzle-orm"

import { db } from "@/db"
import { cursorCredentials, users } from "@/db/schema"
import { cursorApiRequest } from "@/lib/cursor/client"
import {
  decryptSecret,
  encryptSecret,
  secretHint,
} from "@/lib/cursor/crypto"
import { getCursorApiKeyFromEnv } from "@/lib/cursor/env"
import type { CursorApiKeyInfo } from "@/lib/cursor/types"

export type CursorConnectionStatus = {
  connected: boolean
  source?: "env" | "database"
  apiKeyHint?: string
  apiKeyName?: string
  autoLaunchAgent: boolean
  connectedAt?: string
}

async function getUserIdByGithubId(githubUserId: number) {
  return db.query.users.findFirst({
    where: eq(users.githubUserId, githubUserId),
    columns: { id: true },
  })
}

export async function getCursorConnectionStatus(
  githubUserId: number
): Promise<CursorConnectionStatus> {
  const envKey = getCursorApiKeyFromEnv()

  if (envKey) {
    return {
      connected: true,
      source: "env",
      apiKeyHint: secretHint(envKey),
      autoLaunchAgent: await shouldAutoLaunchAgent(githubUserId),
    }
  }

  const user = await getUserIdByGithubId(githubUserId)

  if (!user) {
    return { connected: false, autoLaunchAgent: true }
  }

  const row = await db.query.cursorCredentials.findFirst({
    where: eq(cursorCredentials.userId, user.id),
  })

  if (!row) {
    return { connected: false, autoLaunchAgent: true }
  }

  return {
    connected: true,
    source: "database",
    apiKeyHint: row.apiKeyHint,
    apiKeyName: row.apiKeyName ?? undefined,
    autoLaunchAgent: row.autoLaunchAgent,
    connectedAt: row.connectedAt.toISOString(),
  }
}

export async function getCursorApiKeyForUser(
  githubUserId: number
): Promise<string | null> {
  const envKey = getCursorApiKeyFromEnv()

  if (envKey) {
    return envKey
  }

  const user = await getUserIdByGithubId(githubUserId)

  if (!user) {
    return null
  }

  const row = await db.query.cursorCredentials.findFirst({
    where: eq(cursorCredentials.userId, user.id),
    columns: { apiKeyCiphertext: true },
  })

  if (!row) {
    return null
  }

  return decryptSecret(row.apiKeyCiphertext)
}

export async function verifyCursorApiKey(
  apiKey: string
): Promise<CursorApiKeyInfo> {
  return cursorApiRequest<CursorApiKeyInfo>("/v1/me", apiKey)
}

export async function saveCursorApiKey(input: {
  githubUserId: number
  apiKey: string
  autoLaunchAgent?: boolean
}): Promise<CursorConnectionStatus> {
  const trimmedKey = input.apiKey.trim()

  if (!trimmedKey) {
    throw new Error("API key is required.")
  }

  const keyInfo = await verifyCursorApiKey(trimmedKey)
  const user = await getUserIdByGithubId(input.githubUserId)

  if (!user) {
    throw new Error("User not found.")
  }

  const now = new Date()
  const values = {
    userId: user.id,
    apiKeyCiphertext: encryptSecret(trimmedKey),
    apiKeyHint: secretHint(trimmedKey),
    apiKeyName: keyInfo.apiKeyName,
    autoLaunchAgent: input.autoLaunchAgent ?? true,
    connectedAt: now,
    updatedAt: now,
  }

  const [row] = await db
    .insert(cursorCredentials)
    .values(values)
    .onConflictDoUpdate({
      target: cursorCredentials.userId,
      set: {
        apiKeyCiphertext: values.apiKeyCiphertext,
        apiKeyHint: values.apiKeyHint,
        apiKeyName: values.apiKeyName,
        autoLaunchAgent: values.autoLaunchAgent,
        updatedAt: now,
      },
    })
    .returning()

  return {
    connected: true,
    apiKeyHint: row.apiKeyHint,
    apiKeyName: row.apiKeyName ?? undefined,
    autoLaunchAgent: row.autoLaunchAgent,
    connectedAt: row.connectedAt.toISOString(),
  }
}

export async function removeCursorApiKey(
  githubUserId: number
): Promise<void> {
  const user = await getUserIdByGithubId(githubUserId)

  if (!user) {
    return
  }

  await db
    .delete(cursorCredentials)
    .where(eq(cursorCredentials.userId, user.id))
}

export async function shouldAutoLaunchAgent(
  githubUserId: number
): Promise<boolean> {
  const hasEnvKey = Boolean(getCursorApiKeyFromEnv())
  const user = await getUserIdByGithubId(githubUserId)

  if (!user) {
    return hasEnvKey
  }

  const row = await db.query.cursorCredentials.findFirst({
    where: eq(cursorCredentials.userId, user.id),
    columns: { autoLaunchAgent: true },
  })

  return row?.autoLaunchAgent ?? hasEnvKey
}
