import type { PrismaClient } from "@/generated/prisma/client";

/** Un movimiento por participación: reto residuos completado (primera evidencia aprobada). */
export const LEDGER_REF_WASTE_EVIDENCE_COMPLETION = "WASTE_EVIDENCE_COMPLETION";

type TransactionCtx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Sustituye el bonus de completitud del módulo residuos (idempotente si cambia basePoints).
 */
export async function replaceWasteEvidenceCompletionLedger(
  tx: TransactionCtx,
  params: {
    employeeId: string;
    participationId: string;
    challengeTitle: string;
    points: number;
  },
): Promise<void> {
  const { employeeId, participationId, challengeTitle, points } = params;

  await tx.pointLedger.deleteMany({
    where: {
      employeeId,
      refType: LEDGER_REF_WASTE_EVIDENCE_COMPLETION,
      refId: participationId,
    },
  });

  if (points === 0) return;

  await tx.pointLedger.create({
    data: {
      employeeId,
      delta: points,
      reason: `Reto residuos (${challengeTitle}) · Evidencia aprobada`,
      refType: LEDGER_REF_WASTE_EVIDENCE_COMPLETION,
      refId: participationId,
    },
  });
}
