import { notFound, redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import { getChallengeById } from "@/lib/services/challenges/queries";
import { ChallengeType } from "@/generated/prisma/enums";
import { TableroChallengeBackBar } from "@/components/tablero/BackToTableroLink";
import {
  ChallengeTypeIcon,
  challengeTypeIconShellClass,
  challengeTypeShortLabel,
} from "@/modules/challenges/challenge-type-ui";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d);
}

export default async function TableroChallengeLandingPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  await requireEmployee(`/tablero/retos/${challengeId}`);

  const challenge = await getChallengeById(challengeId);
  if (!challenge) notFound();

  if (challenge.type === ChallengeType.WATER_BILL) {
    redirect(`/tablero/retos/${challengeId}/water`);
  }
  if (challenge.type === ChallengeType.WASTE_EVIDENCE) {
    redirect(`/tablero/retos/${challengeId}/waste`);
  }
  if (challenge.type === ChallengeType.PLACE_DOCUMENTATION) {
    redirect(`/tablero/retos/${challengeId}/places`);
  }
  if (challenge.type === ChallengeType.TRIVIA) {
    redirect(`/tablero/retos/${challengeId}/trivia`);
  }

  const shell = challengeTypeIconShellClass(challenge.type);
  const kind = challengeTypeShortLabel(challenge.type);

  return (
    <>
      <TableroChallengeBackBar />
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-4 pb-16 text-[#132238] md:p-6">
      <div>
        <div className="mt-4 flex flex-row items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] ${shell}`}
            aria-hidden
          >
            <ChallengeTypeIcon type={challenge.type} className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#2563eb]">{kind}</p>
            <h1 className="mt-1 text-balance text-xl font-bold leading-snug text-[#132238] md:text-2xl">
              {challenge.title}
            </h1>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#5b7cb8]">
              <span className="font-semibold text-[#3d5670]">{challenge.type}</span>
              <span className="text-[#94a3b8]"> · </span>
              {formatDate(challenge.startsAt)} — {formatDate(challenge.endsAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="game-panel-3d rounded-2xl p-5 md:p-6">
        <p className="text-sm leading-relaxed text-[#3d5670]">
          {challenge.description?.trim() || "Reto de campaña PUEAA."}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#5b7cb8]">
          Este tipo de reto aún no tiene un minijuego o formulario en la app; los puntos pueden sumarse por
          importación o según defina administración.
        </p>
        <p className="mt-4 border-t-2 border-[#94a3b8]/35 pt-4 font-mono text-xs font-medium text-[#3d5670]">
          Puntos base (referencia): <span className="tabular-nums font-bold text-[#0d9488]">{challenge.basePoints}</span>
        </p>
      </div>
      </div>
    </>
  );
}
