import { prisma } from "@/lib/prisma";
import { getTotalPointsForEmployee } from "@/lib/services/points/ledger";

const DEFAULT_ENV_IMAGE = "/pixel-placeholder.svg";

export async function getEmployeeGamificationSummary(employeeId: string) {
  const totalPoints = await getTotalPointsForEmployee(employeeId);
  const ranks = await prisma.rank.findMany({ orderBy: { sortOrder: "asc" } });

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
  /** Nivel 1 = rango más bajo (menor `sortOrder`), N = más alto. Una estrella por nivel alcanzado. */
  const rankLevel = idx >= 0 ? idx + 1 : 0;

  const environmentImageSrc =
    rank?.environmentImageUrl?.trim() || DEFAULT_ENV_IMAGE;

  return {
    totalPoints,
    rankName: rank?.name ?? "—",
    progressPct: Number.isFinite(progressPct) ? progressPct : 0,
    rankLevel,
    totalRankLevels,
    environmentImageSrc,
  };
}
