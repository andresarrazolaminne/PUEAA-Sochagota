import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import {
  getPlaceDocumentationChallengeOrNull,
  getParticipation,
  listPlaceDocumentationSubmissionsForEmployee,
  countApprovedPlaceSubmissionsForEmployee,
} from "@/lib/services/challenges/place-documentation";
import { EvidenceStatus, ParticipationStatus, ChallengeType } from "@/generated/prisma/enums";
import { ChallengeFolioSheet } from "@/components/challenges/ChallengeFolioSheet";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import { TableroChallengeBackBar } from "@/components/tablero/BackToTableroLink";
import { ChallengeTypeIcon, challengeTypeIconShellClass } from "@/modules/challenges/challenge-type-ui";
import { enrollPlaceDocumentationChallengeAction } from "./actions";
import { PlaceDocumentationForm } from "./PlaceDocumentationForm";
import { acopioCategoryLabel } from "@/lib/herramientas/acopio-categories";

function formatRange(startsAt: Date, endsAt: Date) {
  const fmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" });
  return `${fmt.format(startsAt)} — ${fmt.format(endsAt)}`;
}

function statusLabel(s: EvidenceStatus): string {
  switch (s) {
    case EvidenceStatus.PENDING:
      return "Pendiente de revisión";
    case EvidenceStatus.APPROVED:
      return "Aprobado";
    case EvidenceStatus.REJECTED:
      return "Rechazado";
    default:
      return s;
  }
}

function PlacesHeroWavesBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-[#10b981]"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillOpacity="0.2"
        d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,69.3C672,64,768,32,864,26.7C960,21,1056,43,1152,48C1248,53,1344,43,1392,37.3L1440,32V120H0Z"
      />
      <path
        fill="currentColor"
        fillOpacity="0.11"
        d="M0,88L60,82.7C120,77,240,67,360,72C480,77,600,99,720,93.3C840,88,960,56,1080,50.7C1200,45,1320,67,1380,77.3L1440,88V120H0Z"
      />
    </svg>
  );
}

export default async function PlaceDocumentationChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const employee = await requireEmployee(`/tablero/retos/${challengeId}/places`);

  const challenge = await getPlaceDocumentationChallengeOrNull(challengeId);
  if (!challenge) notFound();

  const participation = await getParticipation(employee.id, challengeId);
  const enrolled = !!participation && participation.status !== ParticipationStatus.DRAFT;

  const submissions = enrolled
    ? await listPlaceDocumentationSubmissionsForEmployee(employee.id, challengeId)
    : [];
  const approvedCount = enrolled
    ? await countApprovedPlaceSubmissionsForEmployee(employee.id, challengeId)
    : 0;
  const placePointsEarned = enrolled ? approvedCount * challenge.basePoints : 0;

  const iconShell = challengeTypeIconShellClass(ChallengeType.PLACE_DOCUMENTATION);

  return (
    <>
      <TableroChallengeBackBar />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pb-16 pt-4 text-[#132238] md:gap-6 md:px-6 md:pt-5">
        <section className="game-panel-3d relative overflow-hidden rounded-[2rem]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#34d399]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 left-0 h-32 w-32 rounded-full bg-[#0ea5e9]/15 blur-3xl" />
          <PlacesHeroWavesBg />

          <div className="relative z-10 px-5 pb-8 pt-7 md:px-9 md:pb-10 md:pt-9">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border-2 border-[#059669] bg-[#ecfdf5] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#047857]">
                  <span
                    className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_0_2px_rgba(16,185,129,0.35)]"
                    aria-hidden
                  />
                  Lugares · acopio · puntos de entrega
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
                    Busca en tu comunidad el tipo de lugar que describe la campaña y envía los datos para que otros puedan
                    encontrarlo.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 justify-center lg:justify-end">
                <div
                  className={`relative flex h-[7.25rem] w-[7.25rem] items-center justify-center rounded-3xl border-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.85),0_8px_0_#047857] ${iconShell}`}
                >
                  <ChallengeTypeIcon type={ChallengeType.PLACE_DOCUMENTATION} className="h-[3.25rem] w-[3.25rem]" />
                  <span className="pointer-events-none absolute -bottom-1 right-1 rounded-md border-2 border-[#047857] bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#047857] shadow-[0_2px_0_#047857]">
                    mapa
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border-4 border-[#059669] bg-gradient-to-b from-[#ecfdf5] to-[#d1fae5] px-4 py-4 shadow-[0_4px_0_#047857]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#047857]">
                  Puntos por lugar aprobado
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065f46]">{challenge.basePoints}</p>
                <p className="mt-0.5 text-xs font-medium text-[#134e4a]/90">cada aprobación suma al ledger</p>
              </div>
              <div className="rounded-2xl border-4 border-[#0d9488] bg-[#ccfbf1] px-4 py-4 shadow-[0_4px_0_#0f766e]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0f766e]">
                  Puntos ganados
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tabular-nums leading-none text-[#115e59] md:text-4xl">
                  {enrolled ? placePointsEarned : "—"}
                </p>
                <p className="mt-2 text-xs font-medium leading-snug text-[#134e4a]/95">
                  {enrolled
                    ? approvedCount > 0
                      ? `${approvedCount} lugar${approvedCount === 1 ? "" : "es"} aprobado${approvedCount === 1 ? "" : "s"} · ${challenge.basePoints} pts c/u`
                      : "Los envíos pendientes no suman hasta que administración apruebe."
                    : "Únete al reto para registrar lugares."}
                </p>
              </div>
              <div className="rounded-2xl border-4 border-[#1e3a5f] bg-[#e0f2fe] px-4 py-4 shadow-[0_4px_0_#1e3a5f]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1e40af]">Vigencia</p>
                <p className="mt-2 text-sm font-medium leading-snug text-[#1e3a8a]">
                  {formatRange(challenge.startsAt, challenge.endsAt)}
                </p>
                <p className="mt-2 text-xs text-[#3d5670]">
                  {enrolled ? "Inscrito · puedes enviar más lugares" : "Únete para participar"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Documentación del reto" className="flex flex-col gap-2">
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#059669]">Guía rápida</p>
          <ChallengeFolioSheet
            folio="01"
            title="Qué enviar"
            subtitle="Datos mínimos"
            defaultOpen={false}
            accent="green"
          >
            <ul className="space-y-2.5 text-[13px] leading-snug text-[#44403c]">
              <li>
                <strong className="text-[#14532d]">Nombre:</strong> cómo se conoce el sitio o el programa en ese punto.
              </li>
              <li>
                <strong className="text-[#14532d]">Dirección:</strong> lo suficientemente clara para ubicar el punto y
                detectar duplicados entre envíos.
              </li>
              <li>
                <strong className="text-[#14532d]">Foto:</strong> opcional pero recomendable (fachada, contenedor,
                cartel).
              </li>
              <li>
                <strong className="text-[#14532d]">Categorías:</strong> indica qué tipos de residuo gestiona el punto
                (puedes marcar varias); así el directorio público podrá filtrarlos mejor.
              </li>
            </ul>
          </ChallengeFolioSheet>

          <ChallengeFolioSheet folio="02" title="Puntos" subtitle="Reglas" defaultOpen={false} accent="green">
            <ul className="space-y-2.5 text-[13px] leading-snug text-[#44403c]">
              <li>
                <strong className="text-[#14532d]">Por aprobación:</strong> cada lugar que apruebe administración suma{" "}
                <span className="tabular-nums font-semibold">{challenge.basePoints} pts</span> (solo tras revisión).
              </li>
              <li>
                <strong className="text-[#14532d]">Directorio:</strong> si la campaña lo permite, el lugar puede
                publicarse en el directorio de acopio para toda la comunidad.
              </li>
            </ul>
          </ChallengeFolioSheet>
        </section>

        {!enrolled ? (
          <section className="game-panel-3d relative overflow-hidden rounded-2xl p-8 text-center">
            <h2 className="font-pixel text-[11px] font-normal uppercase tracking-[0.18em] text-[#059669]">
              Participación
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#3d5670]">
              Únete al reto para registrar lugares y sumar puntos cuando se aprueben tus envíos.
            </p>
            <form action={enrollPlaceDocumentationChallengeAction.bind(null, challengeId)} className="mt-6">
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
            <PlaceDocumentationForm challengeId={challengeId} />

            <ChallengeFolioSheet
              folio="03"
              title="Mis envíos"
              subtitle={submissions.length > 0 ? "Más reciente primero" : "Aún sin envíos"}
              defaultOpen={submissions.length > 0}
              accent="green"
            >
              {submissions.length === 0 ? (
                <p className="text-[13px] text-[#57534e]">Usa el formulario de arriba para tu primer lugar.</p>
              ) : (
                <ul className="space-y-3">
                  {submissions.map((s) => {
                    const approved = s.status === EvidenceStatus.APPROVED;
                    const rejected = s.status === EvidenceStatus.REJECTED;
                    return (
                      <li
                        key={s.id}
                        className={`rounded-lg border-2 p-4 ${
                          approved
                            ? "border-[#86efac]/90 bg-[#f0fdf4]/95"
                            : rejected
                              ? "border-[#fecaca] bg-[#fef2f2]/95"
                              : "border-[#a7f3d0]/90 bg-[#ecfdf5]/95"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <span
                              className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${
                                approved
                                  ? "border-[#166534]/40 bg-white/80 text-[#14532d]"
                                  : rejected
                                    ? "border-red-200 bg-white/80 text-[#991b1b]"
                                    : "border-emerald-200 bg-white/80 text-[#047857]"
                              }`}
                            >
                              {statusLabel(s.status)}
                            </span>
                            <p className="mt-2 font-semibold text-[#1c1917]">{s.placeName}</p>
                            <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#44403c]">{s.address}</p>
                            {s.phone ? (
                              <p className="mt-1 font-mono text-[12px] text-[#57534e]">Tel. {s.phone}</p>
                            ) : null}
                            <p className="mt-2 font-mono text-[10px] text-[#78716c]">
                              {new Intl.DateTimeFormat("es-CO", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(s.createdAt)}
                            </p>
                            {rejected && s.rejectReason ? (
                              <p className="mt-2 text-[12px] text-[#991b1b]">Motivo: {s.rejectReason}</p>
                            ) : null}
                            {s.categories.length > 0 ? (
                              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Categorías de residuo">
                                {s.categories.map((cat) => (
                                  <li
                                    key={cat}
                                    className="rounded-full border border-[#86efac]/80 bg-white/90 px-2 py-0.5 text-[10px] leading-tight text-[#14532d]"
                                  >
                                    {acopioCategoryLabel(cat)}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          {s.photoFilePath ? (
                            <PhotoModalTrigger
                              imageSrc={s.photoFilePath}
                              className="shrink-0 rounded border border-[#d6d3d1] bg-white/90 px-2.5 py-1 font-mono text-[11px] text-[#14532d] underline-offset-2 hover:border-[#86efac]"
                              imageAlt="Foto del lugar enviada"
                            >
                              Ver foto
                            </PhotoModalTrigger>
                          ) : null}
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
