import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";
import type { AcopioCategory } from "@/generated/prisma/enums";
import { computeSiteKey } from "@/lib/challenges/waste-evidence/site-key";

const DUPLICATE_STATUSES: EvidenceStatus[] = [EvidenceStatus.PENDING, EvidenceStatus.APPROVED];

function effectivePlaceKey(row: {
  placeName: string;
  address: string;
  siteKey: string | null;
}): string {
  return row.siteKey?.trim() || computeSiteKey(row.placeName, row.address);
}

export async function getPlaceDocumentationChallengeOrNull(challengeId: string) {
  const c = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!c || c.type !== ChallengeType.PLACE_DOCUMENTATION) return null;
  return c;
}

export async function getParticipation(employeeId: string, challengeId: string) {
  return prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId, challengeId } },
  });
}

export async function listPlaceDocumentationSubmissionsForEmployee(employeeId: string, challengeId: string) {
  const p = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId, challengeId } },
  });
  if (!p) return [];
  const rows = await prisma.placeDocumentationSubmission.findMany({
    where: { participationId: p.id },
    orderBy: { createdAt: "desc" },
    include: { submissionCategories: true },
  });
  return rows.map(({ submissionCategories, ...rest }) => ({
    ...rest,
    categories: submissionCategories.map((c) => c.category),
  }));
}

export async function countApprovedPlaceSubmissionsForEmployee(
  employeeId: string,
  challengeId: string,
): Promise<number> {
  const p = await getParticipation(employeeId, challengeId);
  if (!p) return 0;
  return prisma.placeDocumentationSubmission.count({
    where: { participationId: p.id, status: EvidenceStatus.APPROVED },
  });
}

async function duplicateOverlapIdsForPlaceChallenge(challengeId: string): Promise<Set<string>> {
  const rows = await prisma.placeDocumentationSubmission.findMany({
    where: {
      status: { in: DUPLICATE_STATUSES },
      participation: { challengeId },
    },
    select: { id: true, placeName: true, address: true, siteKey: true },
  });
  const byKey = new Map<string, string[]>();
  for (const r of rows) {
    const k = effectivePlaceKey(r);
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(r.id);
  }
  const dup = new Set<string>();
  for (const ids of byKey.values()) {
    if (ids.length >= 2) for (const id of ids) dup.add(id);
  }
  return dup;
}

export async function countOtherEmployeesWithSamePlaceKey(
  challengeId: string,
  placeName: string,
  address: string,
  excludeEmployeeId: string,
): Promise<number> {
  const key = computeSiteKey(placeName, address);
  if (!key.trim()) return 0;
  const rows = await prisma.placeDocumentationSubmission.findMany({
    where: {
      status: { in: DUPLICATE_STATUSES },
      participation: { challengeId },
    },
    select: {
      id: true,
      placeName: true,
      address: true,
      siteKey: true,
      participation: { select: { employeeId: true } },
    },
  });
  return rows.filter((r) => {
    if (r.participation.employeeId === excludeEmployeeId) return false;
    return effectivePlaceKey(r) === key;
  }).length;
}

export type PlaceDuplicateExample = { fullName: string; createdAt: Date };

export async function getDuplicatePlaceExamplesForChallenge(
  challengeId: string,
  placeName: string,
  address: string,
  excludeEmployeeId: string,
  take = 3,
): Promise<PlaceDuplicateExample[]> {
  const key = computeSiteKey(placeName, address);
  if (!key.trim()) return [];
  const rows = await prisma.placeDocumentationSubmission.findMany({
    where: {
      status: { in: DUPLICATE_STATUSES },
      participation: { challengeId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      participation: {
        include: { employee: { select: { fullName: true } } },
      },
    },
  });
  const matched = rows.filter(
    (r) =>
      r.participation.employeeId !== excludeEmployeeId && effectivePlaceKey(r) === key,
  );
  return matched.slice(0, take).map((r) => ({
    fullName: r.participation.employee.fullName,
    createdAt: r.createdAt,
  }));
}

export type PlaceDocumentationPendingRow = {
  id: string;
  placeName: string;
  address: string;
  phone: string | null;
  photoFilePath: string | null;
  createdAt: Date;
  possibleDuplicate: boolean;
  /** Fracciones declaradas por el jugador al enviar (pueden precargar la revisión). */
  categories: AcopioCategory[];
  employee: { id: string; fullName: string; cedula: string };
};

export async function listPendingPlaceDocumentationForChallenge(
  challengeId: string,
): Promise<PlaceDocumentationPendingRow[]> {
  const overlap = await duplicateOverlapIdsForPlaceChallenge(challengeId);
  const rows = await prisma.placeDocumentationSubmission.findMany({
    where: {
      status: EvidenceStatus.PENDING,
      participation: { challengeId },
    },
    include: {
      submissionCategories: true,
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
    placeName: r.placeName,
    address: r.address,
    phone: r.phone,
    photoFilePath: r.photoFilePath,
    createdAt: r.createdAt,
    possibleDuplicate: overlap.has(r.id),
    categories: r.submissionCategories.map((c) => c.category),
    employee: r.participation.employee,
  }));
}

export type PlaceDocumentationRecentRow = {
  id: string;
  status: EvidenceStatus;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: { fullName: string } | null;
  placeName: string;
  address: string;
  possibleDuplicate: boolean;
  rejectReason: string | null;
  participation: {
    employee: { id: string; fullName: string; cedula: string };
  };
};

export async function listRecentPlaceDocumentationDecisionsForChallenge(
  challengeId: string,
  take = 40,
): Promise<PlaceDocumentationRecentRow[]> {
  const overlap = await duplicateOverlapIdsForPlaceChallenge(challengeId);
  const rows = await prisma.placeDocumentationSubmission.findMany({
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
      const k = effectivePlaceKey({
        placeName: r.placeName,
        address: r.address,
        siteKey: r.siteKey,
      });
      if (!k) return false;
      const candidates = await prisma.placeDocumentationSubmission.findMany({
        where: {
          id: { not: r.id },
          status: { in: DUPLICATE_STATUSES },
          participation: { challengeId },
        },
        select: { placeName: true, address: true, siteKey: true },
      });
      return candidates.some((c) => effectivePlaceKey(c) === k);
    }),
  );

  return rows.map((r, i) => ({
    id: r.id,
    status: r.status,
    updatedAt: r.updatedAt,
    reviewedAt: r.reviewedAt,
    reviewedBy: r.reviewedBy,
    placeName: r.placeName,
    address: r.address,
    possibleDuplicate: flagResults[i] ?? false,
    rejectReason: r.rejectReason,
    participation: r.participation,
  }));
}
