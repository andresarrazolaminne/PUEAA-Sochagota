import { prisma } from "@/lib/prisma";

export type TriviaPlayerQuestion = {
  id: string;
  prompt: string;
  sortOrder: number;
  options: { id: string; label: string }[];
};

export async function listTriviaQuestionsForPlayer(challengeId: string): Promise<TriviaPlayerQuestion[]> {
  const rows = await prisma.triviaQuestion.findMany({
    where: { challengeId },
    orderBy: { sortOrder: "asc" },
    include: {
      options: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true } },
    },
  });
  return rows.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    sortOrder: q.sortOrder,
    options: q.options,
  }));
}

export async function listTriviaAttemptsForEmployeeInChallenge(employeeId: string, challengeId: string) {
  return prisma.triviaQuestionAttempt.findMany({
    where: {
      employeeId,
      question: { challengeId },
    },
    select: {
      questionId: true,
      selectedOptionId: true,
      isCorrect: true,
    },
  });
}
