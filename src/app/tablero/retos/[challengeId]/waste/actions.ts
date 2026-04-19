"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/prisma";
import { ParticipationStatus } from "@/generated/prisma/enums";
import { saveWasteEvidenceUpload } from "@/lib/uploads/waste-evidence";
import {
  countOtherEmployeesWithSameSiteKey,
  getDuplicateSiteExamplesForChallenge,
  getWasteEvidenceChallengeOrNull,
} from "@/lib/services/challenges/waste-evidence";
import { computeSiteKey } from "@/lib/challenges/waste-evidence/site-key";

export async function enrollWasteEvidenceChallengeAction(challengeId: string) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/waste`);
  const c = await getWasteEvidenceChallengeOrNull(challengeId);
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
  revalidatePath(`/tablero/retos/${challengeId}/waste`);
}

export async function submitWasteEvidenceAction(challengeId: string, formData: FormData) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/waste`);
  const c = await getWasteEvidenceChallengeOrNull(challengeId);
  if (!c) throw new Error("Reto no encontrado.");

  const participation = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId: emp.id, challengeId } },
  });
  if (!participation) {
    throw new Error("Debes unirte al reto primero.");
  }

  const siteNameRaw = String(formData.get("siteName") ?? "").trim();
  const siteAddressRaw = String(formData.get("siteAddress") ?? "").trim();
  if (!siteNameRaw) {
    throw new Error("Indica el nombre del centro o punto de acopio.");
  }
  const siteKey = computeSiteKey(siteNameRaw, siteAddressRaw || undefined);
  if (!siteKey) {
    throw new Error("El nombre del sitio no es válido.");
  }

  const file = formData.get("evidence");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Sube una foto de la evidencia.");
  }

  const up = await saveWasteEvidenceUpload(file);
  if (!up.ok) {
    throw new Error(
      up.reason === "size" ? "La imagen supera el tamaño máximo (4 MB)." : "No se pudo guardar la imagen.",
    );
  }

  await prisma.evidenceSubmission.create({
    data: {
      participationId: participation.id,
      filePath: up.publicPath,
      siteName: siteNameRaw,
      siteAddress: siteAddressRaw || null,
      siteKey,
    },
  });

  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/waste`);
  revalidatePath(`/admin/retos/${challengeId}`);
}

export type CheckWasteDuplicateResult =
  | { ok: true; count: number; examples: { fullName: string; createdAt: string }[] }
  | { ok: false };

/** Comprueba si otro empleado ya registró el mismo sitio (avisos no bloqueantes). */
export async function checkWasteEvidenceDuplicateAction(
  challengeId: string,
  siteName: string,
  siteAddress: string,
): Promise<CheckWasteDuplicateResult> {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/waste`);
  const c = await getWasteEvidenceChallengeOrNull(challengeId);
  if (!c) return { ok: false };

  const key = computeSiteKey(siteName.trim(), siteAddress.trim() || undefined);
  if (!key) return { ok: true, count: 0, examples: [] };

  const count = await countOtherEmployeesWithSameSiteKey(challengeId, key, emp.id);
  const examples = await getDuplicateSiteExamplesForChallenge(challengeId, key, emp.id, 3);
  return {
    ok: true,
    count,
    examples: examples.map((e) => ({
      fullName: e.fullName,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
