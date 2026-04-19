import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";

const DUPLICATE_STATUSES: EvidenceStatus[] = [EvidenceStatus.PENDING, EvidenceStatus.APPROVED];

export async function getWasteEvidenceChallengeOrNull(challengeId: string) {
  const c = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!c || c.type !== ChallengeType.WASTE_EVIDENCE) return null;
  return c;
}

export async function getParticipation(employeeId: string, challengeId: string) {
  return prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId, challengeId } },
  });
}

export async function listEvidenceSubmissionsForEmployee(employeeId: string, challengeId: string) {
  const p = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId, challengeId } },
  });
  if (!p) return [];
  return prisma.evidenceSubmission.findMany({
    where: { participationId: p.id },
    orderBy: { createdAt: "desc" },
  });
}

/** Cuántas evidencias aprobadas tiene el empleado en este reto (el bono de puntos base es único vía ledger). */
export async function countApprovedEvidenceForEmployee(employeeId: string, challengeId: string): Promise<number> {
  const p = await getParticipation(employeeId, challengeId);
  if (!p) return 0;
  return prisma.evidenceSubmission.count({
    where: { participationId: p.id, status: EvidenceStatus.APPROVED },
  });
}

/** Ids de envíos que comparten `siteKey` con al menos otro en PENDING o APPROVED (mismo reto). */
async function duplicateOverlapIdsForChallenge(challengeId: string): Promise<Set<string>> {
  const rows = await prisma.evidenceSubmission.findMany({
    where: {
      siteKey: { not: null },
      status: { in: DUPLICATE_STATUSES },
      participation: { challengeId },
    },
    select: { id: true, siteKey: true },
  });
  const byKey = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.siteKey?.trim()) continue;
    const k = r.siteKey;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(r.id);
  }
  const dup = new Set<string>();
  for (const ids of byKey.values()) {
    if (ids.length >= 2) for (const id of ids) dup.add(id);
  }
  return dup;
}

/**
 * Otros empleados ya tienen envío con el mismo sitio (PENDING/APROBADO).
 * Para aviso al usuario antes de enviar.
 */
export async function countOtherEmployeesWithSameSiteKey(
  challengeId: string,
  siteKey: string,
  excludeEmployeeId: string,
): Promise<number> {
  if (!siteKey.trim()) return 0;
  return prisma.evidenceSubmission.count({
    where: {
      siteKey,
      status: { in: DUPLICATE_STATUSES },
      participation: {
        challengeId,
        employeeId: { not: excludeEmployeeId },
      },
    },
  });
}

export type DuplicateSiteExample = {
  fullName: string;
  createdAt: Date;
};

export async function getDuplicateSiteExamplesForChallenge(
  challengeId: string,
  siteKey: string,
  excludeEmployeeId: string,
  take = 3,
): Promise<DuplicateSiteExample[]> {
  if (!siteKey.trim()) return [];
  const rows = await prisma.evidenceSubmission.findMany({
    where: {
      siteKey,
      status: { in: DUPLICATE_STATUSES },
      participation: {
        challengeId,
        employeeId: { not: excludeEmployeeId },
      },
    },
    take,
    orderBy: { createdAt: "desc" },
    include: {
      participation: {
        include: { employee: { select: { fullName: true } } },
      },
    },
  });
  return rows.map((r) => ({
    fullName: r.participation.employee.fullName,
    createdAt: r.createdAt,
  }));
}

export type WasteEvidencePendingRow = {
  id: string;
  filePath: string;
  createdAt: Date;
  siteName: string | null;
  siteAddress: string | null;
  possibleDuplicate: boolean;
  employee: { id: string; fullName: string; cedula: string };
};

/** Cola admin: evidencias pendientes de un reto WASTE_EVIDENCE. */
export async function listPendingWasteEvidenceForChallenge(
  challengeId: string,
): Promise<WasteEvidencePendingRow[]> {
  const overlap = await duplicateOverlapIdsForChallenge(challengeId);
  const rows = await prisma.evidenceSubmission.findMany({
    where: {
      status: EvidenceStatus.PENDING,
      participation: { challengeId },
    },
    include: {
      participation: {
        include: {
          employee: { select: { id: true, fullName: true, cedula: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    filePath: r.filePath,
    createdAt: r.createdAt,
    siteName: r.siteName,
    siteAddress: r.siteAddress,
    possibleDuplicate: overlap.has(r.id),
    employee: r.participation.employee,
  }));
}

export type WasteEvidenceRecentRow = {
  id: string;
  status: EvidenceStatus;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: { fullName: string } | null;
  siteName: string | null;
  siteAddress: string | null;
  possibleDuplicate: boolean;
  rejectReason: string | null;
  participation: {
    employee: { id: string; fullName: string; cedula: string };
  };
};

export async function listRecentWasteEvidenceDecisionsForChallenge(
  challengeId: string,
  take = 30,
): Promise<WasteEvidenceRecentRow[]> {
  const overlap = await duplicateOverlapIdsForChallenge(challengeId);
  const rows = await prisma.evidenceSubmission.findMany({
    where: {
      status: { in: [EvidenceStatus.APPROVED, EvidenceStatus.REJECTED] },
      participation: { challengeId },
    },
    include: {
      participation: {
        include: {
          employee: { select: { id: true, fullName: true, cedula: true } },
        },
      },
      reviewedBy: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take,
  });

  const flagResults = await Promise.all(
    rows.map(async (r) => {
      if (overlap.has(r.id)) return true;
      if (!r.siteKey?.trim()) return false;
      const others = await prisma.evidenceSubmission.count({
        where: {
          id: { not: r.id },
          siteKey: r.siteKey,
          status: { in: DUPLICATE_STATUSES },
          participation: { challengeId },
        },
      });
      return others >= 1;
    }),
  );

  return rows.map((r, i) => ({
    id: r.id,
    status: r.status,
    updatedAt: r.updatedAt,
    reviewedAt: r.reviewedAt,
    reviewedBy: r.reviewedBy,
    siteName: r.siteName,
    siteAddress: r.siteAddress,
    possibleDuplicate: flagResults[i] ?? false,
    rejectReason: r.rejectReason,
    participation: r.participation,
  }));
}
