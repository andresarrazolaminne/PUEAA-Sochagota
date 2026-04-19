"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus } from "@/generated/prisma/enums";
import { ensurePlaceDocumentationApprovalLedger } from "@/modules/challenges/place-documentation/ledger";
import {
  MIN_REJECT_REASON_LENGTH,
  parseAdminReviewRedirectTarget,
  redirectAfterReviewAction,
} from "@/lib/admin/review-action-redirect";
import { parseAcopioCategoriesFromFormData } from "@/lib/herramientas/acopio-categories";

export async function approvePlaceDocumentationAction(formData: FormData) {
  const submissionId = formData.get("submissionId");
  const challengeId = formData.get("challengeId");
  const addToDirectoryRaw = formData.get("addToDirectory");
  const addToDirectory = addToDirectoryRaw === "true" || addToDirectoryRaw === "on";
  const categoriesFromForm = parseAcopioCategoriesFromFormData(formData);

  if (typeof submissionId !== "string" || !submissionId || typeof challengeId !== "string" || !challengeId) {
    return;
  }

  const admin = await requireAdmin(`/admin/retos/${challengeId}`);

  const subPreview = await prisma.placeDocumentationSubmission.findUnique({
    where: { id: submissionId },
    include: {
      participation: { include: { challenge: true } },
      submissionCategories: true,
    },
  });

  if (
    !subPreview ||
    subPreview.participation.challengeId !== challengeId ||
    subPreview.participation.challenge.type !== ChallengeType.PLACE_DOCUMENTATION
  ) {
    throw new Error("Envío no válido.");
  }

  if (subPreview.status !== EvidenceStatus.PENDING) {
    return;
  }

  const categoriesFromSubmission = subPreview.submissionCategories.map((c) => c.category);
  const directoryCategories =
    categoriesFromForm.length > 0 ? categoriesFromForm : categoriesFromSubmission;

  if (addToDirectory && directoryCategories.length === 0) {
    const to =
      parseAdminReviewRedirectTarget(formData.get("redirectTo")) ?? `/admin/retos/${challengeId}`;
    const url = new URL(to, "http://local.invalid");
    url.searchParams.set("err", "acopio_categories");
    redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  await prisma.$transaction(async (tx) => {
    const sub = await tx.placeDocumentationSubmission.findUnique({
      where: { id: submissionId },
      include: {
        participation: {
          include: { challenge: true },
        },
      },
    });

    if (
      !sub ||
      sub.participation.challengeId !== challengeId ||
      sub.participation.challenge.type !== ChallengeType.PLACE_DOCUMENTATION
    ) {
      throw new Error("Envío no válido.");
    }

    if (sub.status !== EvidenceStatus.PENDING) {
      return;
    }

    let directoryPlaceId: string | null = null;
    if (addToDirectory) {
      const agg = await tx.directoryPlace.aggregate({ _max: { sortOrder: true } });
      const nextOrder = (agg._max.sortOrder ?? 0) + 1;
      const place = await tx.directoryPlace.create({
        data: {
          name: sub.placeName.trim(),
          address: sub.address.trim(),
          phone: sub.phone?.trim() || null,
          photoUrl: sub.photoFilePath ?? null,
          sortOrder: nextOrder,
          categories: {
            create: directoryCategories.map((category) => ({ category })),
          },
        },
      });
      directoryPlaceId = place.id;
    }

    await tx.placeDocumentationSubmission.update({
      where: { id: submissionId },
      data: {
        status: EvidenceStatus.APPROVED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: null,
        directoryPlaceId,
      },
    });

    const pts = sub.participation.challenge.basePoints;
    await ensurePlaceDocumentationApprovalLedger(tx, {
      employeeId: sub.participation.employeeId,
      submissionId: sub.id,
      challengeTitle: sub.participation.challenge.title,
      points: pts,
    });
  });

  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${challengeId}`);
  revalidatePath(`/admin/retos/${challengeId}/revision`);
  revalidatePath("/admin/puntajes");
  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/places`);
  revalidatePath("/tablero/herramientas/directorio");

  const redirectTo = parseAdminReviewRedirectTarget(formData.get("redirectTo"));
  if (redirectTo) redirectAfterReviewAction(redirectTo, "approved");
}

export async function rejectPlaceDocumentationAction(formData: FormData) {
  const submissionId = formData.get("submissionId");
  const challengeId = formData.get("challengeId");
  const reasonRaw = formData.get("rejectReason");
  const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";

  if (typeof submissionId !== "string" || !submissionId || typeof challengeId !== "string" || !challengeId) {
    return;
  }

  const admin = await requireAdmin(`/admin/retos/${challengeId}`);

  if (reason.length < MIN_REJECT_REASON_LENGTH) {
    const to =
      parseAdminReviewRedirectTarget(formData.get("redirectTo")) ?? `/admin/retos/${challengeId}`;
    const url = new URL(to, "http://local.invalid");
    url.searchParams.set("err", "reject_short");
    redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const sub = await prisma.placeDocumentationSubmission.findUnique({
    where: { id: submissionId },
    include: {
      participation: { include: { challenge: true } },
    },
  });

  if (
    !sub ||
    sub.participation.challengeId !== challengeId ||
    sub.participation.challenge.type !== ChallengeType.PLACE_DOCUMENTATION
  ) {
    throw new Error("Envío no válido.");
  }

  if (sub.status !== EvidenceStatus.PENDING) {
    return;
  }

  await prisma.placeDocumentationSubmission.update({
    where: { id: submissionId },
    data: {
      status: EvidenceStatus.REJECTED,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectReason: reason,
    },
  });

  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${challengeId}`);
  revalidatePath(`/admin/retos/${challengeId}/revision`);
  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/places`);

  const redirectTo = parseAdminReviewRedirectTarget(formData.get("redirectTo"));
  if (redirectTo) redirectAfterReviewAction(redirectTo, "rejected");
}
