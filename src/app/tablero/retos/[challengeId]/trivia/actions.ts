"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/prisma";
import { ChallengeType, ParticipationStatus } from "@/generated/prisma/enums";
import { LEDGER_REF_TRIVIA_CORRECT } from "@/modules/challenges/trivia/ledger";

export async function submitTriviaAnswerAction(challengeId: string, questionId: string, optionId: string) {
  const emp = await requireEmployee(`/tablero/retos/${challengeId}/trivia`);

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.type !== ChallengeType.TRIVIA) {
    throw new Error("Reto de trivia no encontrado.");
  }

  const now = new Date();
  if (challenge.startsAt.getTime() > now.getTime() || challenge.endsAt.getTime() < now.getTime()) {
    throw new Error("Este reto no está vigente.");
  }
  if (!challenge.active || !challenge.platformManaged) {
    throw new Error("Este reto no está disponible en el tablero.");
  }

  const option = await prisma.triviaAnswerOption.findFirst({
    where: { id: optionId, questionId },
    include: {
      question: { select: { challengeId: true } },
    },
  });
  if (!option || option.question.challengeId !== challengeId) {
    throw new Error("Opción no válida para esta pregunta.");
  }

  const existing = await prisma.triviaQuestionAttempt.findUnique({
    where: {
      employeeId_questionId: { employeeId: emp.id, questionId },
    },
  });
  if (existing) {
    throw new Error("Ya respondiste esta pregunta.");
  }

  const points = challenge.basePoints;

  await prisma.$transaction(async (tx) => {
    await tx.triviaQuestionAttempt.create({
      data: {
        employeeId: emp.id,
        questionId,
        selectedOptionId: optionId,
        isCorrect: option.isCorrect,
      },
    });

    await tx.challengeParticipation.upsert({
      where: {
        employeeId_challengeId: { employeeId: emp.id, challengeId },
      },
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

    if (option.isCorrect && points > 0) {
      const dup = await tx.pointLedger.findFirst({
        where: {
          employeeId: emp.id,
          refType: LEDGER_REF_TRIVIA_CORRECT,
          refId: questionId,
        },
      });
      if (!dup) {
        await tx.pointLedger.create({
          data: {
            employeeId: emp.id,
            delta: points,
            reason: `Trivia: ${challenge.title} — respuesta correcta`,
            refType: LEDGER_REF_TRIVIA_CORRECT,
            refId: questionId,
          },
        });
      }
    }
  });

  revalidatePath("/tablero");
  revalidatePath(`/tablero/retos/${challengeId}/trivia`);
  revalidatePath("/admin/puntajes");

  return { correct: option.isCorrect, pointsAwarded: option.isCorrect ? points : 0 };
}
