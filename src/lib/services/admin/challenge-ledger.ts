import { prisma } from "@/lib/prisma";
import { LEDGER_REF_PARTICIPATION } from "@/lib/services/points/participation-import";
import {
  LEDGER_REF_WATER_IMPROVEMENT,
  LEDGER_REF_WATER_MAINTENANCE,
} from "@/modules/challenges/water-bill/ledger";
import { LEDGER_REF_WASTE_EVIDENCE_COMPLETION } from "@/modules/challenges/waste-evidence/ledger";
import { LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL } from "@/modules/challenges/place-documentation/ledger";

/** Movimientos del ledger vinculados a un reto (importación por participación o módulo agua por periodo). */
export async function listLedgerEntriesForChallenge(challengeId: string) {
  const [participationIds, waterPeriodIds, placeDocSubmissionIds] = await Promise.all([
    prisma.challengeParticipation.findMany({
      where: { challengeId },
      select: { id: true },
    }),
    prisma.waterBillPeriod.findMany({
      where: { challengeId },
      select: { id: true },
    }),
    prisma.placeDocumentationSubmission.findMany({
      where: { participation: { challengeId } },
      select: { id: true },
    }),
  ]);

  const p = participationIds.map((x) => x.id);
  const w = waterPeriodIds.map((x) => x.id);
  const pd = placeDocSubmissionIds.map((x) => x.id);

  const or: Array<
    | { refType: string; refId: { in: string[] } }
    | { refType: { in: string[] }; refId: { in: string[] } }
  > = [];

  if (p.length > 0) {
    or.push({
      refType: LEDGER_REF_PARTICIPATION,
      refId: { in: p },
    });
    or.push({
      refType: LEDGER_REF_WASTE_EVIDENCE_COMPLETION,
      refId: { in: p },
    });
  }
  if (pd.length > 0) {
    or.push({
      refType: LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL,
      refId: { in: pd },
    });
  }
  if (w.length > 0) {
    or.push({
      refType: { in: [LEDGER_REF_WATER_IMPROVEMENT, LEDGER_REF_WATER_MAINTENANCE] },
      refId: { in: w },
    });
  }

  if (or.length === 0) {
    return [];
  }

  return prisma.pointLedger.findMany({
    where: { OR: or },
    include: {
      employee: { select: { fullName: true, cedula: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
