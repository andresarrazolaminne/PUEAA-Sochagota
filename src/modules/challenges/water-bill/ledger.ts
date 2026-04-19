import type { PrismaClient } from "@/generated/prisma/client";

export const LEDGER_REF_WATER_IMPROVEMENT = "WATER_IMPROVEMENT";
export const LEDGER_REF_WATER_MAINTENANCE = "WATER_MAINTENANCE";

type TransactionCtx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Sustituye los movimientos de ledger asociados a un periodo de agua (idempotente al reenviar).
 */
/** Elimina movimientos de ledger vinculados a un periodo (p. ej. al rechazar por admin). */
export async function removeWaterBillPeriodLedger(
  tx: TransactionCtx,
  params: { employeeId: string; waterBillPeriodId: string },
): Promise<void> {
  await tx.pointLedger.deleteMany({
    where: {
      employeeId: params.employeeId,
      refId: params.waterBillPeriodId,
      refType: { in: [LEDGER_REF_WATER_IMPROVEMENT, LEDGER_REF_WATER_MAINTENANCE] },
    },
  });
}

export async function replaceWaterBillPeriodLedger(
  tx: TransactionCtx,
  params: {
    employeeId: string;
    waterBillPeriodId: string;
    challengeTitle: string;
    periodLabel: string;
    improvementPoints: number;
    maintenancePoints: number;
  },
): Promise<void> {
  const { employeeId, waterBillPeriodId, challengeTitle, periodLabel, improvementPoints, maintenancePoints } =
    params;

  await removeWaterBillPeriodLedger(tx, { employeeId, waterBillPeriodId });

  const base = `Reto agua (${challengeTitle})`;

  if (improvementPoints !== 0) {
    await tx.pointLedger.create({
      data: {
        employeeId,
        delta: improvementPoints,
        reason: `${base} · Mejora · ${periodLabel}`,
        refType: LEDGER_REF_WATER_IMPROVEMENT,
        refId: waterBillPeriodId,
      },
    });
  }

  if (maintenancePoints !== 0) {
    await tx.pointLedger.create({
      data: {
        employeeId,
        delta: maintenancePoints,
        reason: `${base} · Consumo óptimo · ${periodLabel}`,
        refType: LEDGER_REF_WATER_MAINTENANCE,
        refId: waterBillPeriodId,
      },
    });
  }
}
