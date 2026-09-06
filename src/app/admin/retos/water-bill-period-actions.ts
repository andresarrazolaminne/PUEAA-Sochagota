"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";
import {
  removeWaterBillPeriodLedger,
  replaceWaterBillPeriodLedger,
} from "@/modules/challenges/water-bill/ledger";
import { formatPeriodLabelEs } from "@/modules/challenges/water-bill/period";
import { applyEarlyBirdIfEligible } from "@/lib/services/challenges/early-bird";
import { ParticipationStatus } from "@/generated/prisma/enums";

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

    if (row.status !== EvidenceStatus.APPROVED && row.status !== EvidenceStatus.PENDING) {
      throw new Error("Estado no rechazable.");
    }

    await removeWaterBillPeriodLedger(tx, { employeeId: row.employeeId, waterBillPeriodId: row.id });

    await tx.waterBillPeriod.update({
      where: { id: periodId },
      data: {
        status: EvidenceStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: reason.length > 0 ? reason : "Sin motivo indicado.",
      },
    });
  });

  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${challengeId}`);
  revalidatePath("/admin/puntajes");
  revalidatePath("/admin");
  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/water`);
}

export async function approveWaterBillPeriodAction(formData: FormData) {
  const periodId = formData.get("periodId");
  const challengeId = formData.get("challengeId");

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

    if (row.status === EvidenceStatus.APPROVED) {
      return;
    }

    if (row.status !== EvidenceStatus.REJECTED && row.status !== EvidenceStatus.PENDING) {
      throw new Error("Solo se pueden aprobar declaraciones pendientes o rechazadas.");
    }

    await tx.waterBillPeriod.update({
      where: { id: periodId },
      data: {
        status: EvidenceStatus.APPROVED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: null,
      },
    });

    await replaceWaterBillPeriodLedger(tx, {
      employeeId: row.employeeId,
      waterBillPeriodId: row.id,
      challengeTitle: row.challenge.title,
      periodLabel: formatPeriodLabelEs(row.periodStart),
      improvementPoints: row.improvementPointsAwarded,
      maintenancePoints: row.maintenancePointsAwarded,
    });

    const participation = await tx.challengeParticipation.findUnique({
      where: {
        employeeId_challengeId: {
          employeeId: row.employeeId,
          challengeId: row.challengeId,
        },
      },
    });
    if (participation) {
      await tx.challengeParticipation.update({
        where: { id: participation.id },
        data: { status: ParticipationStatus.APPROVED },
      });
      await applyEarlyBirdIfEligible(tx, {
        employeeId: row.employeeId,
        participationId: participation.id,
        challenge: row.challenge,
      });
    }
  });

  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${challengeId}`);
  revalidatePath("/admin/puntajes");
  revalidatePath("/admin");
  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/water`);
}
