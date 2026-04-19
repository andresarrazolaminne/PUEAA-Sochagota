"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/prisma";
import { ParticipationStatus } from "@/generated/prisma/enums";
import { savePlaceDocumentationUpload } from "@/lib/uploads/place-documentation";
import {
  countOtherEmployeesWithSamePlaceKey,
  getDuplicatePlaceExamplesForChallenge,
  getPlaceDocumentationChallengeOrNull,
} from "@/lib/services/challenges/place-documentation";
import { computeSiteKey } from "@/lib/challenges/waste-evidence/site-key";
import { parseAcopioCategoriesFromFormData } from "@/lib/herramientas/acopio-categories";

export async function enrollPlaceDocumentationChallengeAction(challengeId: string) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/places`);
  const c = await getPlaceDocumentationChallengeOrNull(challengeId);
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
  revalidatePath(`/tablero/retos/${challengeId}/places`);
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitPlaceDocumentationAction(challengeId: string, formData: FormData) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/places`);
  const c = await getPlaceDocumentationChallengeOrNull(challengeId);
  if (!c) throw new Error("Reto no encontrado.");

  const participation = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId: emp.id, challengeId } },
  });
  if (!participation) {
    throw new Error("Debes unirte al reto primero.");
  }

  const placeName = str(formData, "placeName");
  const address = str(formData, "address");
  const phoneRaw = str(formData, "phone");
  const phone = phoneRaw.length > 0 ? phoneRaw : null;

  if (!placeName) throw new Error("Indica el nombre del lugar.");
  if (!address) throw new Error("Indica la dirección o referencia del lugar.");

  const categories = parseAcopioCategoriesFromFormData(formData);
  if (categories.length === 0) {
    throw new Error("Marca al menos una categoría de residuo que gestione este punto.");
  }

  const siteKey = computeSiteKey(placeName, address);
  if (!siteKey) throw new Error("Nombre y dirección no generan una clave de sitio válida.");

  let photoFilePath: string | null = null;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const up = await savePlaceDocumentationUpload(file);
    if (!up.ok) {
      throw new Error(
        up.reason === "size" ? "La imagen supera el tamaño máximo (4 MB)." : "No se pudo guardar la imagen.",
      );
    }
    photoFilePath = up.publicPath;
  }

  await prisma.placeDocumentationSubmission.create({
    data: {
      participationId: participation.id,
      placeName,
      address,
      siteKey,
      phone,
      photoFilePath,
      submissionCategories: {
        create: categories.map((category) => ({ category })),
      },
    },
  });

  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/places`);
  revalidatePath(`/admin/retos/${challengeId}`);
}

export type CheckPlaceDuplicateResult =
  | { ok: true; count: number; examples: { fullName: string; createdAt: string }[] }
  | { ok: false };

export async function checkPlaceDocumentationDuplicateAction(
  challengeId: string,
  placeName: string,
  address: string,
): Promise<CheckPlaceDuplicateResult> {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/places`);
  const c = await getPlaceDocumentationChallengeOrNull(challengeId);
  if (!c) return { ok: false };

  if (!computeSiteKey(placeName.trim(), address.trim())) return { ok: true, count: 0, examples: [] };

  const count = await countOtherEmployeesWithSamePlaceKey(challengeId, placeName.trim(), address.trim(), emp.id);
  const examples = await getDuplicatePlaceExamplesForChallenge(
    challengeId,
    placeName.trim(),
    address.trim(),
    emp.id,
    3,
  );
  return {
    ok: true,
    count,
    examples: examples.map((e) => ({
      fullName: e.fullName,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
