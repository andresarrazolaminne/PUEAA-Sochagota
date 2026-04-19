"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";
import { removeWaterBillPeriodLedger } from "@/modules/challenges/water-bill/ledger";

export async function rejectWaterBillPeriodAction(formData: FormData) {
  const periodId = formData.get("periodId");
  const challengeId = formData.get("challengeId");
  const reasonRaw = formData.get("rejectReason");
  const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";

  if (typeof periodId !== "string" || !periodId || typeof challengeId !== "string" || !challengeId) {
    throw new Error("Datos incompletos.");
  }

  const admin = await requireAdmin(`/admin/retos/${challengeId}`);

  await prisma.$transaction(async (tx) => {
    const row = await tx.waterBillPeriod.findUnique({
      where: { id: periodId },
      include: { challenge: true },
    });

    if (!row || row.challengeId !== challengeId || row.challenge.type !== ChallengeType.WATER_BILL) {
      throw new Error("Periodo no válido.");
    }

    if (row.status === EvidenceStatus.REJECTED) {
      return;
    }

    if (row.status !== EvidenceStatus.APPROVED) {
      throw new Error("Solo se pueden rechazar declaraciones aprobadas.");
    }

    await removeWaterBillPeriodLedger(tx, { employeeId: row.employeeId, waterBillPeriodId: row.id });

    await tx.waterBillPeriod.update({
      where: { id: periodId },
      data: {
        status: EvidenceStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: reason.length > 0 ? reason : "Sin motivo indicado.",
        improvementPointsAwarded: 0,
        maintenancePointsAwarded: 0,
      },
    });
  });

  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${challengeId}`);
  revalidatePath("/admin/puntajes");
  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/water`);
}
