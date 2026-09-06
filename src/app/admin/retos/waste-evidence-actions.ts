"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ChallengeType, EvidenceStatus, ParticipationStatus } from "@/generated/prisma/enums";
import {
  replaceWasteEvidenceCompletionLedger,
} from "@/modules/challenges/waste-evidence/ledger";
import { applyEarlyBirdIfEligible } from "@/lib/services/challenges/early-bird";
import { clawbackAwardsIfNoApprovalsRemain } from "@/lib/services/challenges/clawback-awards";
import {
  MIN_REJECT_REASON_LENGTH,
  parseAdminReviewRedirectTarget,
  redirectAfterReviewAction,
} from "@/lib/admin/review-action-redirect";

function revalidateWaste(challengeId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/revision");
  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${challengeId}`);
  revalidatePath(`/admin/retos/${challengeId}/revision`);
  revalidatePath("/admin/puntajes");
  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/waste`);
}

export async function approveWasteEvidenceAction(formData: FormData) {
  const submissionId = formData.get("submissionId");
  const challengeId = formData.get("challengeId");
  if (typeof submissionId !== "string" || !submissionId || typeof challengeId !== "string" || !challengeId) {
    return;
  }

  const admin = await requireAdmin(`/admin/retos/${challengeId}`);

  await prisma.$transaction(async (tx) => {
    const sub = await tx.evidenceSubmission.findUnique({
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
      sub.participation.challenge.type !== ChallengeType.WASTE_EVIDENCE
    ) {
      throw new Error("Evidencia no válida.");
    }

    if (sub.status !== EvidenceStatus.PENDING && sub.status !== EvidenceStatus.REJECTED) {
      return;
    }

    const approvedBefore = await tx.evidenceSubmission.count({
      where: {
        participationId: sub.participationId,
        status: EvidenceStatus.APPROVED,
      },
    });

    await tx.evidenceSubmission.update({
      where: { id: submissionId },
      data: {
        status: EvidenceStatus.APPROVED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: null,
      },
    });

    await tx.challengeParticipation.update({
      where: { id: sub.participationId },
      data: { status: ParticipationStatus.APPROVED },
    });

    if (approvedBefore === 0) {
      const pts = sub.participation.challenge.basePoints;
      await replaceWasteEvidenceCompletionLedger(tx, {
        employeeId: sub.participation.employeeId,
        participationId: sub.participationId,
        challengeTitle: sub.participation.challenge.title,
        points: pts,
      });
      await applyEarlyBirdIfEligible(tx, {
        employeeId: sub.participation.employeeId,
        participationId: sub.participationId,
        challenge: sub.participation.challenge,
      });
    }
  });

  revalidateWaste(challengeId);

  const redirectTo = parseAdminReviewRedirectTarget(formData.get("redirectTo"));
  if (redirectTo) redirectAfterReviewAction(redirectTo, "approved");
}

export async function rejectWasteEvidenceAction(formData: FormData) {
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

  await prisma.$transaction(async (tx) => {
    const sub = await tx.evidenceSubmission.findUnique({
      where: { id: submissionId },
      include: {
        participation: { include: { challenge: true } },
      },
    });

    if (
      !sub ||
      sub.participation.challengeId !== challengeId ||
      sub.participation.challenge.type !== ChallengeType.WASTE_EVIDENCE
    ) {
      throw new Error("Evidencia no válida.");
    }

    if (sub.status !== EvidenceStatus.PENDING && sub.status !== EvidenceStatus.APPROVED) {
      return;
    }

    const wasApproved = sub.status === EvidenceStatus.APPROVED;

    await tx.evidenceSubmission.update({
      where: { id: submissionId },
      data: {
        status: EvidenceStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    });

    if (wasApproved) {
      await clawbackAwardsIfNoApprovalsRemain(tx, {
        employeeId: sub.participation.employeeId,
        participationId: sub.participationId,
        kind: "waste",
        challengeId,
      });
    }

    const stillApproved = await tx.evidenceSubmission.count({
      where: { participationId: sub.participationId, status: EvidenceStatus.APPROVED },
    });
    if (stillApproved === 0) {
      await tx.challengeParticipation.update({
        where: { id: sub.participationId },
        data: { status: ParticipationStatus.REJECTED },
      });
    }
  });

  revalidateWaste(challengeId);

  const redirectTo = parseAdminReviewRedirectTarget(formData.get("redirectTo"));
  if (redirectTo) redirectAfterReviewAction(redirectTo, "rejected");
}
