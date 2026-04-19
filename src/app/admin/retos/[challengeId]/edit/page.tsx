import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ChallengeType } from "@/generated/prisma/enums";
import { getChallengeById } from "@/lib/services/challenges/queries";
import { loadTriviaDraftsForChallenge } from "@/lib/services/challenges/trivia";
import { dateToUtcInputDate } from "../../parse-challenge-form";
import { ChallengeFormWizard, type ChallengeFormInitial } from "../../ChallengeFormWizard";

export default async function AdminEditChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { challengeId } = await params;
  await requireAdmin(`/admin/retos/${challengeId}/edit`);

  const challenge = await getChallengeById(challengeId);
  if (!challenge) notFound();

  const triviaQuestions =
    challenge.type === ChallengeType.TRIVIA ? await loadTriviaDraftsForChallenge(challengeId) : undefined;

  const sp = await searchParams;
  const rawError = typeof sp.error === "string" ? sp.error : undefined;
  const errorMessage = rawError ? decodeURIComponent(rawError.replace(/\+/g, " ")) : null;

  const initial: ChallengeFormInitial = {
    code: challenge.code ?? "",
    title: challenge.title,
    description: challenge.description ?? "",
    type: challenge.type,
    startsAt: dateToUtcInputDate(challenge.startsAt),
    endsAt: dateToUtcInputDate(challenge.endsAt),
    basePoints: String(challenge.basePoints),
    active: challenge.active,
    platformManaged: challenge.platformManaged,
    optimalPerCapitaM3:
      challenge.optimalPerCapitaM3 != null ? String(challenge.optimalPerCapitaM3) : "12",
    requiresEvidence: challenge.requiresEvidence,
    earlyBirdEndsAt: challenge.earlyBirdEndsAt ? dateToUtcInputDate(challenge.earlyBirdEndsAt) : "",
    earlyBirdSlots: challenge.earlyBirdSlots != null ? String(challenge.earlyBirdSlots) : "",
    triviaQuestions,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Link
          href={`/admin/retos/${challengeId}`}
          className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
        >
          Volver al detalle del reto
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-[#e8f5ee]">Editar reto</h1>
        <p className="mt-1 font-mono text-xs text-[#6a8c78]">{challenge.title}</p>
        {errorMessage ? (
          <p
            className="mt-4 rounded border border-[#6a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <ChallengeFormWizard mode="edit" challengeId={challengeId} initial={initial} />
      </div>
    </div>
  );
}
