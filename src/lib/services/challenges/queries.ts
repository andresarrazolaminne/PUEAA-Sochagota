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
      /** Minijuegos / OTHER sin módulo: no saturar el tablero. */
      type: {
        in: [
          ChallengeType.WATER_BILL,
          ChallengeType.WASTE_EVIDENCE,
          ChallengeType.PLACE_DOCUMENTATION,
          ChallengeType.TRIVIA,
        ],
      },
    },
    orderBy: [{ startsAt: "desc" }],
  });
}

export async function listChallengesForAdmin() {
  return prisma.challenge.findMany({
    orderBy: [{ startsAt: "desc" }],
  });
}

/** Pendientes de revisión por reto (residuos, lugares y recibos de agua). */
export async function getPendingReviewCountsByChallengeId(): Promise<Record<string, number>> {
  const [waste, place, water] = await Promise.all([
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
    prisma.waterBillPeriod.findMany({
      where: {
        status: EvidenceStatus.PENDING,
        challenge: { type: ChallengeType.WATER_BILL },
      },
      select: { challengeId: true },
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
  for (const r of water) {
    out[r.challengeId] = (out[r.challengeId] ?? 0) + 1;
  }
  return out;
}

/** Cola unificada para el inbox admin. */
export async function getUnifiedPendingReviewInbox() {
  const [waste, place, water] = await Promise.all([
    prisma.evidenceSubmission.findMany({
      where: { status: EvidenceStatus.PENDING },
      include: {
        participation: {
          include: {
            challenge: { select: { id: true, title: true, type: true } },
            employee: { select: { id: true, fullName: true, cedula: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.placeDocumentationSubmission.findMany({
      where: { status: EvidenceStatus.PENDING },
      include: {
        participation: {
          include: {
            challenge: { select: { id: true, title: true, type: true } },
            employee: { select: { id: true, fullName: true, cedula: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.waterBillPeriod.findMany({
      where: { status: EvidenceStatus.PENDING },
      include: {
        challenge: { select: { id: true, title: true, type: true } },
        employee: { select: { id: true, fullName: true, cedula: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
  ]);

  type Item = {
    kind: "waste" | "place" | "water";
    id: string;
    challengeId: string;
    challengeTitle: string;
    employeeName: string;
    employeeCedula: string;
    createdAt: Date;
    href: string;
  };

  const items: Item[] = [];
  for (const r of waste) {
    items.push({
      kind: "waste",
      id: r.id,
      challengeId: r.participation.challenge.id,
      challengeTitle: r.participation.challenge.title,
      employeeName: r.participation.employee.fullName,
      employeeCedula: r.participation.employee.cedula,
      createdAt: r.createdAt,
      href: `/admin/retos/${r.participation.challenge.id}/revision`,
    });
  }
  for (const r of place) {
    items.push({
      kind: "place",
      id: r.id,
      challengeId: r.participation.challenge.id,
      challengeTitle: r.participation.challenge.title,
      employeeName: r.participation.employee.fullName,
      employeeCedula: r.participation.employee.cedula,
      createdAt: r.createdAt,
      href: `/admin/retos/${r.participation.challenge.id}/revision`,
    });
  }
  for (const r of water) {
    items.push({
      kind: "water",
      id: r.id,
      challengeId: r.challenge.id,
      challengeTitle: r.challenge.title,
      employeeName: r.employee.fullName,
      employeeCedula: r.employee.cedula,
      createdAt: r.createdAt,
      href: `/admin/retos/${r.challenge.id}?waterPeriod=${r.id}`,
    });
  }

  items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return {
    total: items.length,
    items: items.slice(0, 50),
  };
}

export async function getChallengeById(id: string) {
  return prisma.challenge.findUnique({ where: { id } });
}
