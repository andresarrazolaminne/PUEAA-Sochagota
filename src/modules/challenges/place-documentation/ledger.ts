import type { PrismaClient } from "@/generated/prisma/client";

/** Un movimiento por cada lugar aprobado (refId = id del envío). */
export const LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL = "PLACE_DOCUMENTATION_APPROVAL";

type TransactionCtx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export async function ensurePlaceDocumentationApprovalLedger(
  tx: TransactionCtx,
  params: {
    employeeId: string;
    submissionId: string;
    challengeTitle: string;
    points: number;
  },
): Promise<void> {
  const { employeeId, submissionId, challengeTitle, points } = params;

  const existing = await tx.pointLedger.findFirst({
    where: {
      employeeId,
      refType: LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL,
      refId: submissionId,
    },
  });
  if (existing) return;

  if (points === 0) return;

  await tx.pointLedger.create({
    data: {
      employeeId,
      delta: points,
      reason: `Lugar documentado (${challengeTitle})`,
      refType: LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL,
      refId: submissionId,
    },
  });
}
