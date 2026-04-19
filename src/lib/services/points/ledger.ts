import { prisma } from "@/lib/prisma";

/** Suma de puntos desde el ledger (fuente de verdad). */
export async function getTotalPointsForEmployee(employeeId: string): Promise<number> {
  const agg = await prisma.pointLedger.aggregate({
    where: { employeeId },
    _sum: { delta: true },
  });
  return agg._sum.delta ?? 0;
}
