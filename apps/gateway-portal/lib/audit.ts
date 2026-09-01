import { randomUUID } from "node:crypto";

import { auditLog, db } from "@/lib/db";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "rotate"
  | "reveal"
  | "toggle";

export type AuditEntity =
  | "organization"
  | "llmProvider"
  | "model"
  | "childKey"
  | "member";

export async function writeAuditLog(input: {
  organizationId: string;
  actorUserId: string;
  actorEmail: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
