import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
import {
  getWaterBillChallengeOrNull,
  getParticipation,
  listPeriodsForEmployee,
  getPeriodOptionsForChallenge,
  getMissingPeriodLabels,
} from "@/lib/services/challenges/water-bill";
import { EvidenceStatus, ParticipationStatus, ChallengeType } from "@/generated/prisma/enums";
import { ChallengeFolioSheet } from "@/components/challenges/ChallengeFolioSheet";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import { TableroChallengeBackBar } from "@/components/tablero/BackToTableroLink";
import {
  FIRST_PERIOD_BONUS,
  IMPROVEMENT_CAP,
  IMPROVEMENT_MULTIPLIER,
  MAINTENANCE_POINTS,
} from "@/modules/challenges/water-bill/scoring";
import { ChallengeTypeIcon, challengeTypeIconShellClass } from "@/modules/challenges/challenge-type-ui";
import { enrollWaterBillChallengeAction } from "./actions";
import { WaterBillForm } from "./WaterBillForm";
import { WaterHouseholdSetupForm } from "./WaterHouseholdSetupForm";
import { WaterChallengeHelpModal } from "./WaterChallengeHelpModal";

function WaterWavesBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-[#38bdf8]"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillOpacity="0.22"
        d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,69.3C672,64,768,32,864,26.7C960,21,1056,43,1152,48C1248,53,1344,43,1392,37.3L1440,32V120H0Z"
      />
      <path
        fill="currentColor"
        fillOpacity="0.12"
        d="M0,88L60,82.7C120,77,240,67,360,72C480,77,600,99,720,93.3C840,88,960,56,1080,50.7C1200,45,1320,67,1380,77.3L1440,88V120H0Z"
      />
    </svg>
  );
}

export default async function WaterBillChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const employee = await requireEmployee(`/tablero/retos/${challengeId}/water`);

  const challenge = await getWaterBillChallengeOrNull(challengeId);
  if (!challenge) notFound();

  const participation = await getParticipation(employee.id, challengeId);
  const enrolled = !!participation && participation.status !== ParticipationStatus.DRAFT;

  const periods = enrolled ? await listPeriodsForEmployee(employee.id, challengeId) : [];
  const periodOptions = getPeriodOptionsForChallenge(challenge.startsAt, challenge.endsAt);
  const missing = enrolled
    ? await getMissingPeriodLabels(employee.id, challengeId, challenge.startsAt, challenge.endsAt)
    : [];

  const optimal = challenge.optimalPerCapitaM3 ?? 12;

  const rawHousehold =
    participation?.householdMembers ?? (periods.length > 0 ? periods[0].householdMembers : null);
  const suggestedHousehold = Math.min(15, Math.max(1, Math.round(rawHousehold ?? 1)));

  const needsHouseholdSetup =
    enrolled &&
    !!participation &&
    participation.householdMembers == null &&
    periods.length === 0;

  const waterPointsEarned = periods
    .filter((p) => p.status === EvidenceStatus.APPROVED)
    .reduce((sum, p) => sum + p.improvementPointsAwarded + p.maintenancePointsAwarded, 0);

  const iconShell = challengeTypeIconShellClass(ChallengeType.WATER_BILL);

  return (
    <>
      <TableroChallengeBackBar />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pb-16 pt-4 text-[#132238] md:gap-6 md:px-6 md:pt-5">
        {/* Hero */}
        <section className="game-panel-3d relative overflow-hidden rounded-[2rem]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#38bdf8]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 left-0 h-32 w-32 rounded-full bg-[#22d3ee]/20 blur-3xl" />
          <WaterWavesBg />

          <div className="relative z-10 px-5 pb-8 pt-7 md:px-9 md:pb-10 md:pt-9">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border-2 border-[#0ea5e9] bg-[#e0f2fe] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0369a1]">
                  <span className="h-2 w-2 rounded-full bg-[#0ea5e9] shadow-[0_0_0_2px_rgba(14,165,233,0.35)]" aria-hidden />
                  Ahorro de agua · recibo mensual
                </p>
                <h1 className="text-balance text-3xl font-bold leading-[1.12] tracking-tight text-[#132238] md:text-4xl lg:text-[2.5rem]">
                  {challenge.title}
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-[#3d5670] md:text-[1.05rem]">
                  Cada mes registras el <strong className="text-[#0f766e]">consumo en m³</strong> y las{" "}
                  <strong className="text-[#0f766e]">personas del hogar</strong> para calcular el uso por persona frente
                  a la meta orientativa de campaña.
                </p>
                <p className="font-mono text-[11px] leading-relaxed text-[#5b7cb8]">
                  Vigencia de campaña:{" "}
                  {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" }).format(challenge.startsAt)}{" "}
                  —{" "}
                  {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" }).format(challenge.endsAt)}
                </p>
              </div>

              <div className="flex shrink-0 justify-center lg:justify-end">
                <div
                  className={`relative flex h-[7.25rem] w-[7.25rem] items-center justify-center rounded-3xl border-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.85),0_8px_0_#0c4a6e] ${iconShell}`}
                >
                  <ChallengeTypeIcon type={ChallengeType.WATER_BILL} className="h-[3.25rem] w-[3.25rem]" />
                  <span className="pointer-events-none absolute -bottom-1 right-1 rounded-md border-2 border-[#1e3a5f] bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#0369a1] shadow-[0_2px_0_#1e3a5f]">
                    m³
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border-4 border-[#0d9488] bg-[#ccfbf1] px-4 py-4 shadow-[0_4px_0_#0f766e]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0f766e]">
                  Meta orientativa
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#115e59]">≤ {optimal}</p>
                <p className="mt-0.5 text-xs font-medium text-[#134e4a]/90">m³ por persona / mes</p>
              </div>
              <div className="rounded-2xl border-4 border-[#d97706] bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] px-4 py-4 shadow-[0_4px_0_#b45309]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#b45309]">
                  Puntos ganados
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tabular-nums leading-none text-[#92400e] md:text-4xl">
                  {enrolled ? waterPointsEarned : "—"}
                </p>
                <p className="mt-2 text-xs font-medium leading-snug text-[#78350f]/95">
                  {enrolled
                    ? periods.length > 0
                      ? `Mejora + óptimo · ${periods.length} ${periods.length === 1 ? "declaración" : "declaraciones"}`
                      : "Al guardar un mes, aquí verás el total acumulado en este reto."
                    : "Únete al reto para registrar recibos y sumar puntos."}
                </p>
              </div>
              <div className="rounded-2xl border-4 border-[#7c3aed] bg-[#ede9fe] px-4 py-4 shadow-[0_4px_0_#5b21b6]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#5b21b6]">
                  Cómo sumas puntos
                </p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-[#5b21a8]">
                  <span className="font-semibold text-[#047857]">Mejora</span> vs tu mes anterior ·{" "}
                  <span className="font-semibold text-[#6d28d9]">Óptimo</span> si bajas de la meta.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-lg border-2 border-[#1e3a5f] bg-[#f8fafc] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3d5670] shadow-[0_2px_0_#1e3a5f]">
                  Base reto: <span className="tabular-nums text-[#0d9488]">{challenge.basePoints} pts</span>
                </span>
              </div>
              <WaterChallengeHelpModal>
                <ChallengeFolioSheet
                  folio="01"
                  title="Guía de participación"
                  subtitle="Seguimiento, privacidad y foto del recibo"
                  defaultOpen
                  accent="green"
                >
                  <ul className="space-y-2.5 text-[13px] leading-snug text-[#44403c]">
                    <li>
                      <strong className="text-[#14532d]">Mes a mes:</strong> declara un periodo de facturación a la vez,
                      con los datos de ese recibo.
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Meta por hogar:</strong> la comparación es por persona (m³ ÷
                      integrantes).
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Integrantes:</strong> si no los indicaste, te los pedimos antes
                      de la primera declaración; luego puedes ajustar cada mes.
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Privacidad:</strong> datos de recibo y hogar confidenciales;
                      puntajes y ranking visibles en la campaña.
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Foto:</strong> ideal ver fecha o periodo; si no, tabla de consumo
                      de meses anteriores.
                    </li>
                  </ul>
                </ChallengeFolioSheet>

                <ChallengeFolioSheet
                  folio="02"
                  title="Cálculo de puntos del reto"
                  subtitle="Reglas aplicadas por cada mes declarado"
                  defaultOpen
                  accent="green"
                >
                  <p className="mb-3 text-[12px] text-[#57534e]">
                    Por cada mes, el sistema usa tu consumo <strong className="text-[#1c1917]">por persona</strong> (m³
                    totales ÷ integrantes del mes).
                  </p>
                  <ul className="space-y-2.5 text-[13px] leading-snug text-[#44403c]">
                    <li>
                      <strong className="text-[#14532d]">Meta:</strong> ≤{" "}
                      <span className="tabular-nums font-medium">{optimal}</span> m³/persona/mes
                      {challenge.optimalPerCapitaM3 == null ? " (por defecto si admin no define otra)" : ""}.
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Consumo óptimo:</strong> si cumples la meta,{" "}
                      <span className="tabular-nums font-medium">{MAINTENANCE_POINTS} pts</span> ese mes.
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Mejora:</strong> si ya había mes anterior en este reto y bajaste
                      m³/p, hasta <span className="tabular-nums font-medium">{IMPROVEMENT_CAP}</span> pts (reducción ×{" "}
                      {IMPROVEMENT_MULTIPLIER}, redondeado).
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Primer mes:</strong> sin mes previo comparable,{" "}
                      <span className="tabular-nums font-medium">{FIRST_PERIOD_BONUS} pts</span> de participación.
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Corrección:</strong> al reenviar un mes, los puntos de ese mes se
                      recalculan (sin duplicar).
                    </li>
                    <li>
                      <strong className="text-[#14532d]">Revisión admin:</strong> si la evidencia o los datos no son
                      válidos, el administrador puede rechazar el mes; se pierden los puntos de ese mes en el ranking hasta
                      que corrijas y vuelvas a enviar.
                    </li>
                  </ul>
                  <p className="mt-3 border-t border-[#d6d3d1] pt-2 text-[11px] text-[#78716c]">
                    El ranking usa el ledger oficial. “Dentro de meta” en el formulario es ayuda visual (meta {optimal}{" "}
                    m³/p).
                  </p>
                </ChallengeFolioSheet>
              </WaterChallengeHelpModal>
            </div>

            {challenge.requiresEvidence ? (
              <p className="mt-5 rounded-xl border-2 border-[#0d9488] bg-[#ecfdf5] px-4 py-3 text-sm leading-relaxed text-[#134e4a]">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#22c55e] align-middle" aria-hidden />
                Este reto exige <strong>foto del recibo</strong>. Solo personal autorizado accede a imágenes y datos
                declarados.
              </p>
            ) : null}
          </div>
        </section>

        {!enrolled ? (
          <section className="game-panel-3d relative overflow-hidden rounded-2xl p-8 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a5f' fill-opacity='0.09'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <h2 className="relative font-pixel text-[11px] font-normal uppercase tracking-[0.18em] text-[#2563eb]">
              Únete al reto
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#3d5670]">
              Al participar podrás declarar mes a mes y acumular puntos por mejora y consumo óptimo.
            </p>
            <form action={enrollWaterBillChallengeAction.bind(null, challengeId)} className="relative mt-6">
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
            {missing.length > 0 ? (
              <div
                className="rounded-xl border-4 border-[#c2410c] bg-[#ffedd5] px-4 py-3 text-sm font-medium text-[#7c2d12] shadow-[0_4px_0_#9a3412]"
                role="status"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#c2410c]">
                  Pendiente de registrar
                </span>
                <p className="mt-1 leading-relaxed">
                  Aún no cargas: {missing.slice(0, 3).join(", ")}
                  {missing.length > 3 ? ` (+${missing.length - 3} más)` : ""}.
                </p>
              </div>
            ) : null}

            {needsHouseholdSetup ? (
              <section className="game-panel-3d rounded-2xl p-6 md:p-7">
                <div className="flex flex-col gap-4 border-b-2 border-[#94a3b8]/40 pb-5 sm:flex-row sm:items-start">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#1e3a5f] bg-[#dbeafe] font-mono text-sm font-bold text-[#1e40af] shadow-[0_3px_0_#1e3a5f]">
                    ①
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                      Integrantes del hogar
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#3d5670]">
                      Antes del primer mes, indica cuántas personas viven o comparten el servicio en tu vivienda.
                    </p>
                  </div>
                </div>
                <WaterHouseholdSetupForm challengeId={challengeId} />
              </section>
            ) : (
              <WaterBillForm
                challengeId={challengeId}
                challengeRequiresEvidence={challenge.requiresEvidence}
                optimalPerCapitaM3={optimal}
                defaultHouseholdMembers={suggestedHousehold}
                periodOptions={periodOptions.map((o) => ({
                  year: o.year,
                  month: o.month,
                  label: o.label,
                }))}
              />
            )}

            <ChallengeFolioSheet
              folio="03"
              title="Historial de declaraciones"
              subtitle={periods.length > 0 ? "Más reciente primero" : "Aún sin registros"}
              defaultOpen={false}
              accent="green"
            >
              {periods.length === 0 ? (
                <p className="text-[13px] text-[#57534e]">Completa el formulario de arriba para tu primer mes.</p>
              ) : (
                <ul className="space-y-2.5">
                  {periods.map((p) => {
                    const rejected = p.status === EvidenceStatus.REJECTED;
                    const under = p.computedPerCapitaM3 <= optimal;
                    return (
                      <li
                        key={p.id}
                        className={`rounded-md border-2 p-3 pl-3.5 ${
                          rejected
                            ? "border-[#b91c1c] bg-[#fef2f2]"
                            : under
                              ? "border-[#0d9488] bg-[#ecfdf5]"
                              : "border-[#d97706] bg-[#fffbeb]"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold capitalize text-[#1c1917]">
                              {new Intl.DateTimeFormat("es-CO", {
                                month: "long",
                                year: "numeric",
                                timeZone: "UTC",
                              }).format(p.periodStart)}
                              {rejected ? (
                                <span className="ml-2 inline-block rounded border border-[#b91c1c] bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#991b1b]">
                                  Rechazado
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-[#57534e]">
                              {p.totalM3} m³ · {p.householdMembers} pers. · {p.computedPerCapitaM3.toFixed(2)} m³/p
                            </p>
                            {rejected && p.rejectReason ? (
                              <p className="mt-2 text-[12px] leading-snug text-[#7f1d1d]">
                                <span className="font-semibold">Motivo: </span>
                                {p.rejectReason}
                              </p>
                            ) : null}
                            {rejected ? (
                              <p className="mt-2 text-[11px] text-[#991b1b]">
                                Este mes no suma puntos. Corrige los datos o la foto del recibo y vuelve a enviar el mismo
                                mes.
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2 sm:items-end">
                            <div className="flex flex-wrap justify-end gap-1.5 font-mono text-[10px]">
                              {rejected ? (
                                <span className="rounded border border-[#fecaca] bg-white/90 px-2 py-0.5 text-[#991b1b]">
                                  sin puntos (rechazado)
                                </span>
                              ) : (
                                <>
                                  <span className="rounded border border-[#6ee7b7] bg-white/90 px-2 py-0.5 text-[#047857]">
                                    mejora +{p.improvementPointsAwarded}
                                  </span>
                                  <span className="rounded border border-[#7dd3fc] bg-white/90 px-2 py-0.5 text-[#0369a1]">
                                    óptimo +{p.maintenancePointsAwarded}
                                  </span>
                                </>
                              )}
                            </div>
                            {p.evidenceFilePath ? (
                              <PhotoModalTrigger
                                imageSrc={p.evidenceFilePath}
                                className="rounded border-2 border-[#0d9488] bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[#047857] shadow-[0_2px_0_#0f766e] hover:brightness-105"
                                imageAlt="Foto del recibo enviada"
                              >
                                Ver foto del recibo
                              </PhotoModalTrigger>
                            ) : null}
                          </div>
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
