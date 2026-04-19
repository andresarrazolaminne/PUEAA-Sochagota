import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";

/** Retos jugables visibles en el tablero (ventana de fechas actual). */
export async function listChallengesForTablero(now = new Date()) {
  return prisma.challenge.findMany({
    where: {
      active: true,
      platformManaged: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: [{ startsAt: "desc" }],
  });
}

export async function listChallengesForAdmin() {
  return prisma.challenge.findMany({
    orderBy: [{ startsAt: "desc" }],
  });
}

/** Pendientes de revisión por reto (solo WASTE_EVIDENCE y PLACE_DOCUMENTATION). */
export async function getPendingReviewCountsByChallengeId(): Promise<Record<string, number>> {
  const [waste, place] = await Promise.all([
    prisma.evidenceSubmission.findMany({
      where: {
        status: EvidenceStatus.PENDING,
        participation: { challenge: { type: ChallengeType.WASTE_EVIDENCE } },
      },
      select: { participation: { select: { challengeId: true } } },
    }),
    prisma.placeDocumentationSubmission.findMany({
      where: {
        status: EvidenceStatus.PENDING,
        participation: { challenge: { type: ChallengeType.PLACE_DOCUMENTATION } },
      },
      select: { participation: { select: { challengeId: true } } },
    }),
  ]);
  const out: Record<string, number> = {};
  for (const r of waste) {
    const id = r.participation.challengeId;
    out[id] = (out[id] ?? 0) + 1;
  }
  for (const r of place) {
    const id = r.participation.challengeId;
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}

export async function getChallengeById(id: string) {
  return prisma.challenge.findUnique({ where: { id } });
}
