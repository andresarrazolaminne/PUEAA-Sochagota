import { prisma } from "@/lib/prisma";
import {
  resolveEnvironmentImageUrl,
  resolveShieldImageUrl,
} from "@/lib/environment/rank-assets";
import { getTotalPointsForEmployee } from "@/lib/services/points/ledger";

export async function getEmployeeGamificationSummary(employeeId: string) {
  const [totalPoints, employee, ranks] = await Promise.all([
    getTotalPointsForEmployee(employeeId),
    prisma.employee.findUnique({ where: { id: employeeId }, select: { photoUrl: true } }),
    prisma.rank.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  let rank = ranks[0];
  for (const r of ranks) {
    if (totalPoints >= r.minPoints) rank = r;
  }

  const idx = rank ? ranks.findIndex((r) => r.id === rank.id) : -1;
  const next = idx >= 0 ? ranks[idx + 1] : undefined;
  const rangeStart = rank?.minPoints ?? 0;
  const rangeEnd = next?.minPoints ?? rangeStart + 200;
  const span = Math.max(1, rangeEnd - rangeStart);
  const progressPct = Math.min(100, Math.round(((totalPoints - rangeStart) / span) * 100));

  const totalRankLevels = ranks.length;
  /** Nivel 1 = rango más bajo (menor `sortOrder`), N = más alto. */
  const rankLevel = idx >= 0 ? idx + 1 : 0;
  const sortOrder = rank?.sortOrder ?? 0;

  return {
    totalPoints,
    rankName: rank?.name ?? "—",
    progressPct: Number.isFinite(progressPct) ? progressPct : 0,
    rankLevel,
    totalRankLevels,
    environmentImageSrc: resolveEnvironmentImageUrl(rank?.environmentImageUrl, sortOrder),
    shieldImageSrc: resolveShieldImageUrl(rank?.shieldAssetUrl, sortOrder),
    photoUrl: employee?.photoUrl?.trim() || null,
  };
}
