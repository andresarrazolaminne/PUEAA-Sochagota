"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { TriviaPlayerQuestion } from "@/lib/services/challenges/trivia-player";
import { playMilestoneChime } from "@/lib/sounds/retro-sounds";
import { BackToTableroLink } from "@/components/tablero/BackToTableroLink";
import { submitTriviaAnswerAction } from "./actions";

type Attempt = {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
};

type Outcome = {
  questionId: string;
  correct: boolean;
  points: number;
};

function firstUnansweredIndex(questions: TriviaPlayerQuestion[], rows: Attempt[]): number {
  return questions.findIndex((q) => !rows.some((a) => a.questionId === q.id));
}

export function TriviaChallengeClient({
  challengeId,
  pointsPerCorrect,
  questions,
  initialAttempts,
}: {
  challengeId: string;
  pointsPerCorrect: number;
  questions: TriviaPlayerQuestion[];
  initialAttempts: Attempt[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const summarySoundPlayed = useRef(false);

  useEffect(() => {
    setAttempts(initialAttempts);
  }, [initialAttempts]);

  useEffect(() => {
    summarySoundPlayed.current = false;
  }, [challengeId]);

  const attemptByQuestion = useMemo(() => new Map(attempts.map((a) => [a.questionId, a])), [attempts]);

  const total = questions.length;
  const answeredCount = attempts.length;
  const allAnswered = total > 0 && answeredCount === total;
  /** Pantalla de puntaje: todas respondidas y sin panel intermedio de “siguiente”. */
  const showSummaryScreen = allAnswered && outcome === null;

  useEffect(() => {
    if (!showSummaryScreen || summarySoundPlayed.current) return;
    summarySoundPlayed.current = true;
    playMilestoneChime();
  }, [showSummaryScreen]);

  const activeIdx = useMemo(() => firstUnansweredIndex(questions, attempts), [questions, attempts]);

  const correctCount = useMemo(() => attempts.filter((a) => a.isCorrect).length, [attempts]);
  const pointsEarned = correctCount * pointsPerCorrect;

  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const displayIndex = outcome
    ? questions.findIndex((x) => x.id === outcome.questionId) + 1
    : activeIdx >= 0
      ? activeIdx + 1
      : total;

  const onChoose = useCallback(
    (questionId: string, optionId: string) => {
      setError(null);
      startTransition(async () => {
        try {
          const result = await submitTriviaAnswerAction(challengeId, questionId, optionId);
          setAttempts((prev) => [
            ...prev.filter((a) => a.questionId !== questionId),
            {
              questionId,
              selectedOptionId: optionId,
              isCorrect: result.correct,
            },
          ]);
          setOutcome({
            questionId,
            correct: result.correct,
            points: result.pointsAwarded,
          });
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "No se pudo enviar la respuesta.");
        }
      });
    },
    [challengeId, router],
  );

  const handleContinueAfterAnswer = useCallback(() => {
    setOutcome(null);
  }, []);

  if (showSummaryScreen) {
    return (
      <div className="space-y-8">
        <div className="game-panel-3d relative overflow-hidden rounded-[2rem] px-6 py-10 md:px-10 md:py-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#a78bfa]/35 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#38bdf8]/30 blur-3xl"
            aria-hidden
          />

          <p className="relative text-center font-pixel text-[10px] uppercase tracking-[0.2em] text-[#7c3aed]">
            Resultado
          </p>
          <h2 className="relative mt-3 text-center font-pixel text-2xl text-[#132238] md:text-3xl">¡Trivia completada!</h2>
          <p className="relative mx-auto mt-2 max-w-md text-center text-sm text-[#3d5670]">
            Así quedó tu desempeño en este reto. Los puntos ganados ya figuran en tu historial del tablero.
          </p>

          <div className="relative mx-auto mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-4 border-[#7c3aed] bg-[#ede9fe] p-6 text-center shadow-[0_4px_0_#5b21b6]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#5b21b6]">Aciertos</p>
              <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-[#4c1d95] md:text-5xl">
                {correctCount}
                <span className="text-lg font-normal text-[#7c3aed] md:text-xl">/{total}</span>
              </p>
              <p className="mt-2 text-xs text-[#6b21a8]">respuestas correctas</p>
            </div>
            <div className="rounded-2xl border-4 border-[#0d9488] bg-[#ccfbf1] p-6 text-center shadow-[0_4px_0_#0f766e]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#0f766e]">Puntos ganados</p>
              <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-[#0f766e] md:text-5xl">+{pointsEarned}</p>
              <p className="mt-2 text-xs text-[#115e59]">
                {pointsPerCorrect > 0 ? `${pointsPerCorrect} pts por acierto` : "Sin puntos por acierto en la config."}
              </p>
            </div>
          </div>

          <div className="relative mt-10 flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 sm:mx-auto sm:flex-row sm:items-start">
            <Link
              href="/"
              className="game-btn-primary inline-flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-bold sm:min-w-[200px]"
            >
              Terminar · ir al inicio
            </Link>
            <BackToTableroLink className="min-h-[3.25rem] w-full flex-1 sm:max-w-[min(100%,320px)]" />
          </div>
        </div>
      </div>
    );
  }

  const q = outcome ? questions.find((x) => x.id === outcome.questionId) : activeIdx >= 0 ? questions[activeIdx] : null;
  if (!q) {
    return null;
  }

  const att = attemptByQuestion.get(q.id);

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border-2 border-[#b91c1c] bg-[#fee2e2] px-4 py-3 text-sm text-[#991b1b]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="game-panel-3d rounded-2xl p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-pixel text-[10px] uppercase tracking-[0.12em] text-[#7c3aed]">Progreso</p>
            <p className="mt-1 text-lg font-bold text-[#132238] md:text-xl">
              Pregunta <span className="tabular-nums text-[#2563eb]">{displayIndex}</span>
              <span className="font-normal text-[#5b7cb8]"> de </span>
              <span className="tabular-nums text-[#132238]">{total}</span>
            </p>
          </div>
          <p className="font-mono text-xs font-medium text-[#3d5670]">
            <span className="text-[#0d9488]">{correctCount}</span> aciertos · respondidas {answeredCount}/{total}
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full border-2 border-[#1e3a5f] bg-white">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#a78bfa] to-[#38bdf8] transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-[#5b7cb8]">
          Una pregunta por pantalla · al cerrar la última verás el puntaje final
        </p>
      </div>

      <article
        className="game-panel-3d rounded-[2rem] p-6 md:p-8"
        aria-current={!outcome ? "step" : undefined}
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#2563eb]">
          {outcome ? "Resultado de tu respuesta" : "Tu pregunta"}
        </p>
        <h2 className="mt-3 text-balance text-lg font-bold leading-snug text-[#132238] md:text-xl">{q.prompt}</h2>

        <ul className="mt-6 flex flex-col gap-2.5">
          {q.options.map((opt) => {
            const locked = !!att;
            const isSelected = att?.selectedOptionId === opt.id;
            const showCorrect = att?.isCorrect === true && isSelected;
            const showWrong = att?.isCorrect === false && isSelected;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  disabled={pending || locked}
                  onClick={() => onChoose(q.id, opt.id)}
                  className={`w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition ${
                    locked
                      ? showCorrect
                        ? "border-[#0d9488] bg-[#ccfbf1] text-[#134e4a]"
                        : showWrong
                          ? "border-[#b91c1c] bg-[#fee2e2] text-[#991b1b]"
                          : "border-[#6b8cb8] bg-[#f1f5f9] text-[#64748b]"
                      : "border-[#1e3a5f] bg-white text-[#132238] shadow-[0_3px_0_#1e3a5f] hover:brightness-[1.02] active:translate-y-px active:shadow-[0_2px_0_#1e3a5f]"
                  } ${pending && !locked ? "opacity-60" : ""}`}
                >
                  <span className="font-mono text-[12px] leading-relaxed">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {outcome && outcome.questionId === q.id ? (
          <div className="mt-6 space-y-4 rounded-2xl border-4 border-[#7c3aed] bg-[#ede9fe] p-4 md:p-5 shadow-[0_4px_0_#5b21b6]">
            {outcome.correct ? (
              <p className="text-center text-base font-bold text-[#047857]">
                ¡Correcto!{outcome.points > 0 ? ` +${outcome.points} pts al tablero.` : ""}
              </p>
            ) : (
              <p className="text-center text-base font-bold text-[#b91c1c]">
                No acertaste esta vez; no sumas puntos en esta pregunta.
              </p>
            )}
            <button
              type="button"
              onClick={handleContinueAfterAnswer}
              className="game-btn-primary w-full rounded-xl py-3.5 text-sm font-bold"
            >
              {answeredCount >= total ? "Ver puntaje final" : "Siguiente pregunta"}
            </button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
