"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ChallengeType } from "@/generated/prisma/enums";
import type { TriviaQuestionParsed } from "@/lib/challenges/parse-trivia-payload";
import { parseTriviaPayload } from "@/lib/challenges/parse-trivia-payload";
import { replaceTriviaQuestionsForChallenge } from "@/lib/services/challenges/trivia";
import { parseChallengeForm } from "./parse-challenge-form";

export async function createChallengeAction(formData: FormData) {
  await requireAdmin("/admin/retos/nuevo");

  const err = (msg: string) => redirect(`/admin/retos/nuevo?error=${encodeURIComponent(msg)}`);

  const parsed = parseChallengeForm(formData);
  if (!parsed.ok) return err(parsed.message);

  const d = parsed.data;

  let triviaQuestions: TriviaQuestionParsed[] | null = null;
  if (d.type === ChallengeType.TRIVIA) {
    const raw = formData.get("triviaPayload");
    const tv = parseTriviaPayload(typeof raw === "string" ? raw : null);
    if (!tv.ok) return err(tv.message);
    triviaQuestions = tv.questions;
  }

  let challenge;
  try {
    challenge = await prisma.$transaction(async (tx) => {
      const c = await tx.challenge.create({
        data: {
          code: d.code,
          title: d.title,
          description: d.description,
          type: d.type,
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          basePoints: d.basePoints,
          active: d.active,
          platformManaged: d.platformManaged,
          optimalPerCapitaM3: d.optimalPerCapitaM3,
          requiresEvidence: d.requiresEvidence,
          earlyBirdEndsAt: d.earlyBirdEndsAt,
          earlyBirdSlots: d.earlyBirdSlots,
        },
      });
      if (d.type === ChallengeType.TRIVIA && triviaQuestions) {
        await replaceTriviaQuestionsForChallenge(tx, c.id, triviaQuestions);
      }
      return c;
    });
  } catch (e: unknown) {
    const prismaCode =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
    if (prismaCode === "P2002") {
      return err("Ya existe un reto con ese código. Elige otro o déjalo vacío.");
    }
    const msg = e instanceof Error ? e.message : "No se pudo crear el reto.";
    return err(msg);
  }

  revalidatePath("/admin/retos");
  revalidatePath("/tablero");
  redirect(`/admin/retos/${challenge.id}`);
}

export async function updateChallengeAction(formData: FormData) {
  const idRaw = formData.get("challengeId");
  const id = typeof idRaw === "string" ? idRaw.trim() : "";
  if (!id) {
    redirect(`/admin/retos?error=${encodeURIComponent("Reto no válido.")}`);
  }

  await requireAdmin(`/admin/retos/${id}/edit`);

  const err = (msg: string) => redirect(`/admin/retos/${id}/edit?error=${encodeURIComponent(msg)}`);

  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) return err("El reto no existe o fue eliminado.");

  const parsed = parseChallengeForm(formData);
  if (!parsed.ok) return err(parsed.message);

  const d = parsed.data;

  let triviaQuestions: TriviaQuestionParsed[] | null = null;
  if (d.type === ChallengeType.TRIVIA) {
    const raw = formData.get("triviaPayload");
    const tv = parseTriviaPayload(typeof raw === "string" ? raw : null);
    if (!tv.ok) return err(tv.message);
    triviaQuestions = tv.questions;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.challenge.update({
        where: { id },
        data: {
          code: d.code,
          title: d.title,
          description: d.description,
          type: d.type,
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          basePoints: d.basePoints,
          active: d.active,
          platformManaged: d.platformManaged,
          optimalPerCapitaM3: d.optimalPerCapitaM3,
          requiresEvidence: d.requiresEvidence,
          earlyBirdEndsAt: d.earlyBirdEndsAt,
          earlyBirdSlots: d.earlyBirdSlots,
        },
      });
      if (d.type === ChallengeType.TRIVIA && triviaQuestions) {
        await replaceTriviaQuestionsForChallenge(tx, id, triviaQuestions);
      } else {
        await tx.triviaQuestion.deleteMany({ where: { challengeId: id } });
      }
    });
  } catch (e: unknown) {
    const prismaCode =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
    if (prismaCode === "P2002") {
      return err("Ya existe otro reto con ese código. Elige otro o déjalo vacío.");
    }
    const msg = e instanceof Error ? e.message : "No se pudo guardar el reto.";
    return err(msg);
  }

  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${id}`);
  revalidatePath(`/admin/retos/${id}/edit`);
  revalidatePath("/tablero");
  redirect(`/admin/retos/${id}`);
}

export async function toggleChallengeActiveAction(formData: FormData) {
  await requireAdmin("/admin/retos");
  const id = formData.get("id");
  const nextRaw = formData.get("next");
  if (typeof id !== "string" || !id || typeof nextRaw !== "string") return;
  const next = nextRaw === "true";
  await prisma.challenge.update({
    where: { id },
    data: { active: next },
  });
  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${id}`);
  revalidatePath(`/admin/retos/${id}/edit`);
  revalidatePath("/tablero");
}

export async function toggleChallengePlatformAction(formData: FormData) {
  await requireAdmin("/admin/retos");
  const id = formData.get("id");
  const nextRaw = formData.get("next");
  if (typeof id !== "string" || !id || typeof nextRaw !== "string") return;
  const next = nextRaw === "true";
  await prisma.challenge.update({
    where: { id },
    data: { platformManaged: next },
  });
  revalidatePath("/admin/retos");
  revalidatePath(`/admin/retos/${id}`);
  revalidatePath(`/admin/retos/${id}/edit`);
  revalidatePath("/tablero");
}
