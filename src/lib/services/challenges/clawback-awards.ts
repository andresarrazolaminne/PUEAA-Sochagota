import type { PrismaClient } from "@/generated/prisma/client";
import { EvidenceStatus } from "@/generated/prisma/enums";
import { removeEarlyBirdLedger } from "@/lib/services/challenges/early-bird";
import { removeWasteEvidenceCompletionLedger } from "@/modules/challenges/waste-evidence/ledger";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Tras rechazar: cuenta solo ítems que SIGUEN APPROVED.
 * Debe llamarse DESPUÉS de marcar el ítem actual como REJECTED.
 */
export async function clawbackAwardsIfNoApprovalsRemain(
  tx: Tx,
  params: {
    employeeId: string;
    participationId: string;
    kind: "waste" | "place" | "water";
    challengeId: string;
  },
): Promise<void> {
  const { employeeId, participationId, kind, challengeId } = params;

  let remainingApproved = 0;
  if (kind === "waste") {
    remainingApproved = await tx.evidenceSubmission.count({
      where: { participationId, status: EvidenceStatus.APPROVED },
    });
    if (remainingApproved === 0) {
      await removeWasteEvidenceCompletionLedger(tx, { employeeId, participationId });
    }
  } else if (kind === "place") {
    remainingApproved = await tx.placeDocumentationSubmission.count({
      where: { participationId, status: EvidenceStatus.APPROVED },
    });
  } else {
    remainingApproved = await tx.waterBillPeriod.count({
      where: {
        employeeId,
        challengeId,
        status: EvidenceStatus.APPROVED,
      },
    });
  }

  if (remainingApproved === 0) {
    await removeEarlyBirdLedger(tx, { employeeId, participationId });
  }
}
