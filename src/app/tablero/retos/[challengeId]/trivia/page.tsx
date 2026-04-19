import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { getChallengeById } from "@/lib/services/challenges/queries";
import {
  listTriviaAttemptsForEmployeeInChallenge,
  listTriviaQuestionsForPlayer,
} from "@/lib/services/challenges/trivia-player";
import { ChallengeType } from "@/generated/prisma/enums";
import { TableroChallengeBackBar } from "@/components/tablero/BackToTableroLink";
import { TriviaChallengeClient } from "./TriviaChallengeClient";

function formatRange(startsAt: Date, endsAt: Date) {
  const fmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" });
  return `${fmt.format(startsAt)} — ${fmt.format(endsAt)}`;
}

export default async function TriviaChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const employee = await requireEmployee(`/tablero/retos/${challengeId}/trivia`);

  const challenge = await getChallengeById(challengeId);
  if (!challenge || challenge.type !== ChallengeType.TRIVIA) {
    notFound();
  }

  const now = new Date();
  const inWindow =
    challenge.startsAt.getTime() <= now.getTime() &&
    challenge.endsAt.getTime() >= now.getTime() &&
    challenge.active &&
    challenge.platformManaged;

  const [questions, attempts] = await Promise.all([
    listTriviaQuestionsForPlayer(challengeId),
    listTriviaAttemptsForEmployeeInChallenge(employee.id, challengeId),
  ]);

  return (
    <>
      <TableroChallengeBackBar />
      <div className="relative min-h-screen overflow-hidden bg-[#030806] text-[#c8e6d4]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.15), transparent 50%),
            radial-gradient(ellipse 50% 50% at 100% 10%, rgba(139, 92, 246, 0.1), transparent 45%)
          `,
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-16 md:px-6">
        <header className="rounded-[2rem] border border-[#3730a3]/45 bg-gradient-to-b from-[#120a1f] via-[#0a0f14] to-[#050a08] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.45)] md:p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#5b21b6]/50 bg-[#0d1512]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#8b5cf6]" aria-hidden />
            Trivia PUEAA
          </p>
          <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-[#f5f3ff] md:text-3xl">
            {challenge.title}
          </h1>
          {challenge.description?.trim() ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c4b5fd]/90">{challenge.description.trim()}</p>
          ) : null}
          <p className="mt-4 font-mono text-[11px] text-[#818cf8]">
            Vigencia · {formatRange(challenge.startsAt, challenge.endsAt)}
          </p>
        </header>

        {!inWindow ? (
          <section className="rounded-2xl border border-[#78350f]/40 bg-[#1a1208]/80 px-5 py-4 text-sm text-[#fde68a]">
            {challenge.active && challenge.platformManaged ? (
              <p>
                Este reto no está en la ventana de fechas actual. Consulta las fechas arriba o vuelve más tarde.
              </p>
            ) : (
              <p>Este reto no está disponible como juego en tablero en este momento.</p>
            )}
          </section>
        ) : questions.length === 0 ? (
          <section className="rounded-2xl border border-[#1f3328] bg-[#111916] px-5 py-6 text-sm text-[#7aab8c]">
            Aún no hay preguntas cargadas para este reto. Cuando administración publique las preguntas, podrás
            responderlas aquí.
          </section>
        ) : (
          <TriviaChallengeClient
            challengeId={challengeId}
            pointsPerCorrect={challenge.basePoints}
            questions={questions}
            initialAttempts={attempts}
          />
        )}
      </div>
    </div>
    </>
  );
}
