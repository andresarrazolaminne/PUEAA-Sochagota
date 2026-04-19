import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import {
  getWasteEvidenceChallengeOrNull,
  getParticipation,
  listEvidenceSubmissionsForEmployee,
  countApprovedEvidenceForEmployee,
} from "@/lib/services/challenges/waste-evidence";
import { EvidenceStatus, ParticipationStatus, ChallengeType } from "@/generated/prisma/enums";
import { ChallengeFolioSheet } from "@/components/challenges/ChallengeFolioSheet";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import { TableroChallengeBackBar } from "@/components/tablero/BackToTableroLink";
import { ChallengeTypeIcon, challengeTypeIconShellClass } from "@/modules/challenges/challenge-type-ui";
import { enrollWasteEvidenceChallengeAction } from "./actions";
import { WasteEvidenceForm } from "./WasteEvidenceForm";

function formatRange(startsAt: Date, endsAt: Date) {
  const fmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" });
  return `${fmt.format(startsAt)} — ${fmt.format(endsAt)}`;
}

function statusLabel(s: EvidenceStatus): string {
  switch (s) {
    case EvidenceStatus.PENDING:
      return "Pendiente de revisión";
    case EvidenceStatus.APPROVED:
      return "Aprobada";
    case EvidenceStatus.REJECTED:
      return "Rechazada";
    default:
      return s;
  }
}

function WasteAmberWavesBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-[#ea580c]"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillOpacity="0.18"
        d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,69.3C672,64,768,32,864,26.7C960,21,1056,43,1152,48C1248,53,1344,43,1392,37.3L1440,32V120H0Z"
      />
      <path
        fill="currentColor"
        fillOpacity="0.1"
        d="M0,88L60,82.7C120,77,240,67,360,72C480,77,600,99,720,93.3C840,88,960,56,1080,50.7C1200,45,1320,67,1380,77.3L1440,88V120H0Z"
      />
    </svg>
  );
}

export default async function WasteEvidenceChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const employee = await requireEmployee(`/tablero/retos/${challengeId}/waste`);

  const challenge = await getWasteEvidenceChallengeOrNull(challengeId);
  if (!challenge) notFound();

  const participation = await getParticipation(employee.id, challengeId);
  const enrolled = !!participation && participation.status !== ParticipationStatus.DRAFT;

  const submissions = enrolled ? await listEvidenceSubmissionsForEmployee(employee.id, challengeId) : [];
  const approvedCount = enrolled
    ? await countApprovedEvidenceForEmployee(employee.id, challengeId)
    : 0;
  const wastePointsEarned = enrolled && approvedCount > 0 ? challenge.basePoints : 0;

  const iconShell = challengeTypeIconShellClass(ChallengeType.WASTE_EVIDENCE);

  return (
    <>
      <TableroChallengeBackBar />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pb-16 pt-4 text-[#132238] md:gap-6 md:px-6 md:pt-5">
        <section className="game-panel-3d relative overflow-hidden rounded-[2rem]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#fb923c]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 left-0 h-32 w-32 rounded-full bg-[#f59e0b]/15 blur-3xl" />
          <WasteAmberWavesBg />

          <div className="relative z-10 px-5 pb-8 pt-7 md:px-9 md:pb-10 md:pt-9">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border-2 border-[#ea580c] bg-[#fff7ed] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c2410c]">
                  <span
                    className="h-2 w-2 rounded-full bg-[#ea580c] shadow-[0_0_0_2px_rgba(234,88,12,0.35)]"
                    aria-hidden
                  />
                  Residuos · acopio · evidencia
                </p>
                <h1 className="text-balance text-3xl font-bold leading-[1.12] tracking-tight text-[#132238] md:text-4xl lg:text-[2.5rem]">
                  {challenge.title}
                </h1>
                {challenge.description?.trim() ? (
                  <p className="max-w-xl text-base leading-relaxed text-[#3d5670] md:text-[1.05rem]">
                    {challenge.description.trim()}
                  </p>
                ) : (
                  <p className="max-w-xl text-base leading-relaxed text-[#3d5670] md:text-[1.05rem]">
                    Documenta con una foto tu participación en la campaña de residuos o acopio. Un administrador revisará
                    cada envío antes de otorgar puntos.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 justify-center lg:justify-end">
                <div
                  className={`relative flex h-[7.25rem] w-[7.25rem] items-center justify-center rounded-3xl border-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.85),0_8px_0_#9a3412] ${iconShell}`}
                >
                  <ChallengeTypeIcon type={ChallengeType.WASTE_EVIDENCE} className="h-[3.25rem] w-[3.25rem]" />
                  <span className="pointer-events-none absolute -bottom-1 right-1 rounded-md border-2 border-[#9a3412] bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#c2410c] shadow-[0_2px_0_#9a3412]">
                    foto
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border-4 border-[#ea580c] bg-gradient-to-b from-[#fffbeb] to-[#ffedd5] px-4 py-4 shadow-[0_4px_0_#c2410c]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#c2410c]">
                  Puntos base (reto)
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#9a3412]">{challenge.basePoints}</p>
                <p className="mt-0.5 text-xs font-medium text-[#78350f]/95">al aprobar tu primera evidencia</p>
              </div>
              <div className="rounded-2xl border-4 border-[#0d9488] bg-[#ccfbf1] px-4 py-4 shadow-[0_4px_0_#0f766e]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0f766e]">
                  Puntos ganados
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tabular-nums leading-none text-[#115e59] md:text-4xl">
                  {enrolled ? wastePointsEarned : "—"}
                </p>
                <p className="mt-2 text-xs font-medium leading-snug text-[#134e4a]/95">
                  {enrolled
                    ? approvedCount > 0
                      ? "Bono por primera evidencia aprobada (ledger)."
                      : "Los envíos pendientes no suman hasta que administración apruebe."
                    : "Únete al reto para enviar evidencias."}
                </p>
              </div>
              <div className="rounded-2xl border-4 border-[#1e3a5f] bg-[#e0f2fe] px-4 py-4 shadow-[0_4px_0_#1e3a5f]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1e40af]">Vigencia</p>
                <p className="mt-2 text-sm font-medium leading-snug text-[#1e3a8a]">
                  {formatRange(challenge.startsAt, challenge.endsAt)}
                </p>
                <p className="mt-2 text-xs text-[#3d5670]">
                  {enrolled ? "Inscrito · puedes enviar fotos" : "Únete para participar"}
                </p>
              </div>
            </div>

            {challenge.requiresEvidence ? (
              <p className="mt-6 rounded-xl border-2 border-[#ea580c] bg-[#fff7ed] px-4 py-3 text-sm leading-relaxed text-[#9a3412]">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ea580c] align-middle" aria-hidden />
                Este reto exige <strong>foto</strong> y <strong>identificación del sitio</strong> (centro o punto) en cada
                envío.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-label="Documentación del reto" className="flex flex-col gap-2">
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#c2410c]">Expediente del reto</p>
          <ChallengeFolioSheet
            folio="01"
            title="Antes de enviar"
            subtitle="Foto, sitio y revisión"
            defaultOpen={false}
            accent="amber"
          >
            <ul className="space-y-2.5 text-[13px] leading-snug text-[#44403c]">
              <li>
                <strong className="text-[#9a3412]">Sitio:</strong> indica el nombre del centro o punto de acopio y, si
                puedes, una dirección o referencia; sirve para detectar envíos duplicados entre compañeros.
              </li>
              <li>
                <strong className="text-[#9a3412]">Qué subir:</strong> foto clara de separación en origen, acopio o lo
                que indiquen las bases.
              </li>
              <li>
                <strong className="text-[#9a3412]">Revisión:</strong> cada envío queda pendiente hasta que administración
                apruebe o rechace; <strong>no hay puntos al subir</strong>.
              </li>
              <li>
                <strong className="text-[#9a3412]">Privacidad:</strong> imágenes para la campaña; el ranking es visible.
              </li>
            </ul>
          </ChallengeFolioSheet>

          <ChallengeFolioSheet
            folio="02"
            title="Cálculo de puntos del reto"
            subtitle="Reglas de este módulo"
            defaultOpen={false}
            accent="amber"
          >
            <ul className="space-y-2.5 text-[13px] leading-snug text-[#44403c]">
              <li>
                <strong className="text-[#9a3412]">Solo aprobadas:</strong> pendiente o rechazada no suma puntos.
              </li>
              <li>
                <strong className="text-[#9a3412]">Primera evidencia aprobada:</strong>{" "}
                <span className="tabular-nums font-semibold">{challenge.basePoints} pts</span> (base del reto).
              </li>
              <li>
                <strong className="text-[#9a3412]">Más fotos aprobadas:</strong> no suman extra en esta versión; el bono es
                único por persona y reto.
              </li>
              <li>
                <strong className="text-[#9a3412]">Ranking:</strong> total = suma oficial en el ledger del programa.
              </li>
            </ul>
          </ChallengeFolioSheet>
        </section>

        {!enrolled ? (
          <section className="game-panel-3d relative overflow-hidden rounded-2xl p-8 text-center">
            <h2 className="font-pixel text-[11px] font-normal uppercase tracking-[0.18em] text-[#ea580c]">
              Participación
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#3d5670]">
              Únete al reto para subir fotos y sumar puntos cuando se apruebe tu primera evidencia.
            </p>
            <form action={enrollWasteEvidenceChallengeAction.bind(null, challengeId)} className="mt-6">
              <button
                type="submit"
                className="game-btn-primary inline-flex min-w-[220px] items-center justify-center rounded-2xl px-8 py-3.5 font-mono text-sm font-bold"
              >
                Unirme al reto
              </button>
            </form>
          </section>
        ) : (
          <>
            <WasteEvidenceForm challengeId={challengeId} />

            <ChallengeFolioSheet
              folio="03"
              title="Mis envíos"
              subtitle={submissions.length > 0 ? "Más reciente primero" : "Aún sin envíos"}
              defaultOpen={submissions.length > 0}
              accent="amber"
            >
              {submissions.length === 0 ? (
                <p className="text-[13px] text-[#57534e]">Usa el formulario de arriba para tu primera evidencia.</p>
              ) : (
                <ul className="space-y-2.5">
                  {submissions.map((s) => {
                    const approved = s.status === EvidenceStatus.APPROVED;
                    const rejected = s.status === EvidenceStatus.REJECTED;
                    return (
                      <li
                        key={s.id}
                        className={`rounded-md border-2 p-3 ${
                          approved
                            ? "border-[#86efac]/90 bg-[#f0fdf4]/95"
                            : rejected
                              ? "border-[#fecaca] bg-[#fef2f2]/95"
                              : "border-[#fde68a] bg-[#fffbeb]/95"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <span
                              className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${
                                approved
                                  ? "border-[#166534]/40 bg-white/80 text-[#14532d]"
                                  : rejected
                                    ? "border-red-200 bg-white/80 text-[#991b1b]"
                                    : "border-amber-200 bg-white/80 text-[#92400e]"
                              }`}
                            >
                              {statusLabel(s.status)}
                            </span>
                            {(s.siteName?.trim() || s.siteAddress?.trim()) ? (
                              <p className="mt-1.5 text-[13px] font-medium text-[#1c1917]">
                                {s.siteName?.trim()}
                                {s.siteAddress?.trim() ? (
                                  <span className="font-normal text-[#57534e]"> · {s.siteAddress.trim()}</span>
                                ) : null}
                              </p>
                            ) : null}
                            <p className="mt-1 font-mono text-[10px] text-[#78716c]">
                              {new Intl.DateTimeFormat("es-CO", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(s.createdAt)}
                            </p>
                            {rejected && s.rejectReason ? (
                              <p className="mt-1.5 text-[12px] text-[#991b1b]">Motivo: {s.rejectReason}</p>
                            ) : null}
                          </div>
                          <PhotoModalTrigger
                            imageSrc={s.filePath}
                            className="shrink-0 rounded border border-[#d6d3d1] bg-white/90 px-2.5 py-1 font-mono text-[11px] text-[#14532d] underline-offset-2 hover:border-[#86efac]"
                            imageAlt="Tu evidencia enviada"
                          >
                            Ver imagen
                          </PhotoModalTrigger>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ChallengeFolioSheet>
          </>
        )}
      </div>
    </>
  );
}
