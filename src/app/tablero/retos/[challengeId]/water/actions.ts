"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/prisma";
import { EvidenceStatus, ParticipationStatus } from "@/generated/prisma/enums";
import { periodStartFromParts, formatPeriodLabelEs } from "@/modules/challenges/water-bill/period";
import { scoreWaterBillPeriod, DEFAULT_OPTIMAL_PER_CAPITA_M3 } from "@/modules/challenges/water-bill/scoring";
import { replaceWaterBillPeriodLedger } from "@/modules/challenges/water-bill/ledger";
import { saveWaterBillEvidenceUpload } from "@/lib/uploads/water-bill-evidence";
import {
  getWaterBillChallengeOrNull,
  findPreviousPeriod,
} from "@/lib/services/challenges/water-bill";

export async function enrollWaterBillChallengeAction(challengeId: string) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/water`);
  const c = await getWaterBillChallengeOrNull(challengeId);
  if (!c) throw new Error("Reto no encontrado.");

  await prisma.challengeParticipation.upsert({
    where: { employeeId_challengeId: { employeeId: emp.id, challengeId } },
    create: {
      employeeId: emp.id,
      challengeId,
      status: ParticipationStatus.SUBMITTED,
      submittedAt: new Date(),
    },
    update: {
      status: ParticipationStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/water`);
}

/** Guarda integrantes del hogar en la participación antes del primer declarado (o para prellenar el formulario). */
export async function setWaterHouseholdDefaultAction(challengeId: string, householdMembers: number) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/water`);
  const c = await getWaterBillChallengeOrNull(challengeId);
  if (!c) throw new Error("Reto no encontrado.");

  const participation = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId: emp.id, challengeId } },
  });
  if (!participation || participation.status === ParticipationStatus.DRAFT) {
    throw new Error("Debes unirte al reto primero.");
  }
  if (!Number.isFinite(householdMembers) || householdMembers < 1 || householdMembers > 15) {
    throw new Error("Indica entre 1 y 15 personas en el hogar.");
  }

  const count = await prisma.waterBillPeriod.count({
    where: { employeeId: emp.id, challengeId },
  });
  if (count > 0) {
    throw new Error("Ya tienes declaraciones; actualiza integrantes en cada mes si cambian.");
  }

  await prisma.challengeParticipation.update({
    where: { id: participation.id },
    data: { householdMembers },
  });

  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/water`);
}

export async function submitWaterBillPeriodAction(challengeId: string, formData: FormData) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/water`);
  const c = await getWaterBillChallengeOrNull(challengeId);
  if (!c) throw new Error("Reto no encontrado.");

  const participation = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId: emp.id, challengeId } },
  });
  if (!participation) {
    throw new Error("Debes unirte al reto primero.");
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const totalM3Raw = String(formData.get("totalM3") ?? "").trim().replace(",", ".");
  const totalM3 = Number(totalM3Raw);
  const householdMembers = Number(formData.get("householdMembers"));
  const file = formData.get("evidence");

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error("Periodo no válido.");
  }
  if (!Number.isFinite(totalM3) || totalM3 <= 0 || totalM3 > 500) {
    throw new Error("Consumo (m³) no válido.");
  }
  if (!Number.isFinite(householdMembers) || householdMembers < 1 || householdMembers > 15) {
    throw new Error("Número de habitantes no válido (1–15).");
  }

  const periodStart = periodStartFromParts(year, month);
  if (periodStart.getTime() < c.startsAt.getTime() || periodStart.getTime() > c.endsAt.getTime()) {
    throw new Error("El periodo está fuera de la campaña.");
  }

  const now = new Date();
  const cap = c.endsAt.getTime() < now.getTime() ? c.endsAt : now;
  if (periodStart.getTime() > cap.getTime()) {
    throw new Error("No puedes declarar un periodo futuro.");
  }

  let evidencePath: string | null = null;
  if (c.requiresEvidence) {
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Sube una foto del recibo.");
    }
    const up = await saveWaterBillEvidenceUpload(file);
    if (!up.ok) {
      throw new Error(
        up.reason === "size" ? "La imagen supera el tamaño máximo." : "No se pudo guardar la imagen.",
      );
    }
    evidencePath = up.publicPath;
  } else if (file instanceof File && file.size > 0) {
    const up = await saveWaterBillEvidenceUpload(file);
    if (up.ok) evidencePath = up.publicPath;
  }

  const perCapita = totalM3 / Math.max(1, householdMembers);
  const optimal = c.optimalPerCapitaM3 ?? DEFAULT_OPTIMAL_PER_CAPITA_M3;

  const existingRow = await prisma.waterBillPeriod.findUnique({
    where: {
      employeeId_challengeId_periodStart: {
        employeeId: emp.id,
        challengeId,
        periodStart,
      },
    },
  });

  const approvedOtherCount = await prisma.waterBillPeriod.count({
    where: {
      employeeId: emp.id,
      challengeId,
      status: EvidenceStatus.APPROVED,
      ...(existingRow ? { id: { not: existingRow.id } } : {}),
    },
  });

  const isFirstEver =
    approvedOtherCount === 0 && (!existingRow || existingRow.status !== EvidenceStatus.APPROVED);

  const previous = await findPreviousPeriod(emp.id, challengeId, periodStart);

  const scored = scoreWaterBillPeriod({
    currentPerCapitaM3: perCapita,
    previousPerCapitaM3: previous?.computedPerCapitaM3 ?? null,
    optimalPerCapitaM3: optimal,
    isFirstEverPeriod: isFirstEver,
  });

  const periodLabel = formatPeriodLabelEs(periodStart);

  await prisma.$transaction(async (tx) => {
    const row = await tx.waterBillPeriod.upsert({
      where: {
        employeeId_challengeId_periodStart: {
          employeeId: emp.id,
          challengeId,
          periodStart,
        },
      },
      create: {
        employeeId: emp.id,
        challengeId,
        periodStart,
        totalM3,
        householdMembers,
        computedPerCapitaM3: perCapita,
        evidenceFilePath: evidencePath,
        improvementPointsAwarded: scored.improvementPoints,
        maintenancePointsAwarded: scored.maintenancePoints,
        status: EvidenceStatus.APPROVED,
        reviewedById: null,
        reviewedAt: null,
        rejectReason: null,
      },
      update: {
        totalM3,
        householdMembers,
        computedPerCapitaM3: perCapita,
        ...(evidencePath !== null ? { evidenceFilePath: evidencePath } : {}),
        improvementPointsAwarded: scored.improvementPoints,
        maintenancePointsAwarded: scored.maintenancePoints,
        status: EvidenceStatus.APPROVED,
        reviewedById: null,
        reviewedAt: null,
        rejectReason: null,
      },
    });

    await replaceWaterBillPeriodLedger(tx, {
      employeeId: emp.id,
      waterBillPeriodId: row.id,
      challengeTitle: c.title,
      periodLabel,
      improvementPoints: scored.improvementPoints,
      maintenancePoints: scored.maintenancePoints,
    });

    await tx.challengeParticipation.update({
      where: { id: participation.id },
      data: {
        waterTotalM3: totalM3,
        householdMembers,
        computedPerCapita: perCapita,
      },
    });
  });

  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/water`);
  revalidatePath("/admin/puntajes");
}
