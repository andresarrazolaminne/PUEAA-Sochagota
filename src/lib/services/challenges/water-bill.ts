import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";
import { listOpenPeriodOptions } from "@/modules/challenges/water-bill/period";

export async function getWaterBillChallengeOrNull(challengeId: string) {
  const c = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!c || c.type !== ChallengeType.WATER_BILL) return null;
  return c;
}

export async function getParticipation(employeeId: string, challengeId: string) {
  return prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId, challengeId } },
  });
}

export async function countPriorPeriods(employeeId: string, challengeId: string, beforePeriodStart: Date) {
  return prisma.waterBillPeriod.count({
    where: {
      employeeId,
      challengeId,
      periodStart: { lt: beforePeriodStart },
      status: EvidenceStatus.APPROVED,
    },
  });
}

export async function findPreviousPeriod(
  employeeId: string,
  challengeId: string,
  beforePeriodStart: Date,
) {
  return prisma.waterBillPeriod.findFirst({
    where: {
      employeeId,
      challengeId,
      periodStart: { lt: beforePeriodStart },
      status: EvidenceStatus.APPROVED,
    },
    orderBy: { periodStart: "desc" },
  });
}

export async function listPeriodsForEmployee(employeeId: string, challengeId: string) {
  return prisma.waterBillPeriod.findMany({
    where: { employeeId, challengeId },
    orderBy: { periodStart: "desc" },
  });
}

/** Admin: periodos de un reto agua con empleado. */
export async function listWaterBillPeriodsForChallengeAdmin(challengeId: string) {
  return prisma.waterBillPeriod.findMany({
    where: { challengeId },
    orderBy: { periodStart: "desc" },
    include: {
      employee: { select: { id: true, fullName: true, cedula: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  });
}

export function getPeriodOptionsForChallenge(
  startsAt: Date,
  endsAt: Date,
  now = new Date(),
) {
  return listOpenPeriodOptions(startsAt, endsAt, now);
}

/** Periodos de la campaña aún sin declarar (inscritos). */
export async function getMissingPeriodLabels(
  employeeId: string,
  challengeId: string,
  startsAt: Date,
  endsAt: Date,
  now = new Date(),
): Promise<string[]> {
  const options = listOpenPeriodOptions(startsAt, endsAt, now);
  const existing = await prisma.waterBillPeriod.findMany({
    where: { employeeId, challengeId, status: EvidenceStatus.APPROVED },
    select: { periodStart: true },
  });
  const have = new Set(existing.map((e) => e.periodStart.getTime()));
  const missing: string[] = [];
  for (const o of options) {
    if (!have.has(o.periodStart.getTime())) {
      missing.push(o.label);
    }
  }
  return missing;
}
