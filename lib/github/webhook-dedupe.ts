import { eq } from "drizzle-orm"

import { db } from "@/db"
import { webhookDeliveries } from "@/db/schema"
import { hashPayload } from "@/lib/github/webhook-signature"

export async function recordWebhookDelivery(input: {
  deliveryId: string
  eventName: string
  payload: string
  workspaceId?: string
}): Promise<"new" | "duplicate"> {
  const existing = await db.query.webhookDeliveries.findFirst({
    where: eq(webhookDeliveries.githubDeliveryId, input.deliveryId),
    columns: { id: true },
  })

  if (existing) {
    return "duplicate"
  }

  await db.insert(webhookDeliveries).values({
    githubDeliveryId: input.deliveryId,
    eventName: input.eventName,
    workspaceId: input.workspaceId ?? null,
    payloadHash: hashPayload(input.payload),
  })

  return "new"
}
