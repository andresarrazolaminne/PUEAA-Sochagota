-- CreateTable
CREATE TABLE "TriviaQuestionAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TriviaQuestionAttempt_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TriviaQuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TriviaQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TriviaQuestionAttempt_employeeId_idx" ON "TriviaQuestionAttempt"("employeeId");

-- CreateIndex
CREATE INDEX "TriviaQuestionAttempt_questionId_idx" ON "TriviaQuestionAttempt"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TriviaQuestionAttempt_employeeId_questionId_key" ON "TriviaQuestionAttempt"("employeeId", "questionId");
