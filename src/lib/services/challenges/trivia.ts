import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { TriviaQuestionParsed } from "@/lib/challenges/parse-trivia-payload";

type TransactionCtx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export type TriviaQuestionDraft = {
  prompt: string;
  answers: string[];
  correctIndex: number;
};

/** Vista admin: preguntas con opciones ordenadas. */
export async function listTriviaQuestionsForChallengeAdmin(challengeId: string) {
  return prisma.triviaQuestion.findMany({
    where: { challengeId },
    orderBy: { sortOrder: "asc" },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function loadTriviaDraftsForChallenge(challengeId: string): Promise<TriviaQuestionDraft[]> {
  const rows = await prisma.triviaQuestion.findMany({
    where: { challengeId },
    orderBy: { sortOrder: "asc" },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
    },
  });

  return rows.map((q) => {
    const answers = q.options.map((o) => o.label);
    const correctIndex = Math.max(
      0,
      q.options.findIndex((o) => o.isCorrect),
    );
    return {
      prompt: q.prompt,
      answers: answers.length >= 2 ? answers : ["", ""],
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
    };
  });
}

export async function replaceTriviaQuestionsForChallenge(
  tx: TransactionCtx,
  challengeId: string,
  questions: TriviaQuestionParsed[],
): Promise<void> {
  await tx.triviaQuestion.deleteMany({ where: { challengeId } });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await tx.triviaQuestion.create({
      data: {
        challengeId,
        prompt: q.prompt,
        sortOrder: i,
        options: {
          create: q.answers.map((label, j) => ({
            label,
            sortOrder: j,
            isCorrect: j === q.correctIndex,
          })),
        },
      },
    });
  }
}
