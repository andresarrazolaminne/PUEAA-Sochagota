import Link from "next/link";
import { notFound } from "next/navigation";
import { getChallengeById } from "@/lib/services/challenges/queries";
import { listLedgerEntriesForChallenge } from "@/lib/services/admin/challenge-ledger";
import { listWaterBillPeriodsForChallengeAdmin } from "@/lib/services/challenges/water-bill";
import {
  listPendingWasteEvidenceForChallenge,
  listRecentWasteEvidenceDecisionsForChallenge,
} from "@/lib/services/challenges/waste-evidence";
import {
  listPendingPlaceDocumentationForChallenge,
  listRecentPlaceDocumentationDecisionsForChallenge,
} from "@/lib/services/challenges/place-documentation";
import { listTriviaQuestionsForChallengeAdmin } from "@/lib/services/challenges/trivia";
import { rejectWaterBillPeriodAction } from "../water-bill-period-actions";
import {
  challengeAdminRevisionPath,
  challengePlayerModulePath,
  challengeTypeHasAdminModuleExtension,
} from "@/modules/challenges/registry";
import { ReviewAlerts } from "./ReviewAlerts";
import { WasteReviewSection } from "./WasteReviewSection";
import { PlaceReviewSection } from "./PlaceReviewSection";
import { ChallengeType } from "@/generated/prisma/enums";
import { formatPeriodLabelEs } from "@/modules/challenges/water-bill/period";
import { DEFAULT_OPTIMAL_PER_CAPITA_M3 } from "@/modules/challenges/water-bill/scoring";
import { toggleChallengeActiveAction, toggleChallengePlatformAction } from "../actions";
import { LEDGER_REF_PARTICIPATION } from "@/lib/services/points/participation-import";
import {
  LEDGER_REF_WATER_IMPROVEMENT,
  LEDGER_REF_WATER_MAINTENANCE,
} from "@/modules/challenges/water-bill/ledger";
import { LEDGER_REF_WASTE_EVIDENCE_COMPLETION } from "@/modules/challenges/waste-evidence/ledger";
import { LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL } from "@/modules/challenges/place-documentation/ledger";
import { LEDGER_REF_TRIVIA_CORRECT } from "@/modules/challenges/trivia/ledger";
import { EvidenceStatus } from "@/generated/prisma/enums";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "short" }).format(d);
}

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function refTypeLabel(refType: string | null): string {
  if (!refType) return "—";
  if (refType === LEDGER_REF_PARTICIPATION) return "Importación Excel (PARTICIPATION)";
  if (refType === LEDGER_REF_WATER_IMPROVEMENT) return "Módulo agua · mejora (WATER_IMPROVEMENT)";
  if (refType === LEDGER_REF_WATER_MAINTENANCE) return "Módulo agua · óptimo (WATER_MAINTENANCE)";
  if (refType === LEDGER_REF_WASTE_EVIDENCE_COMPLETION) return "Residuos · primera evidencia aprobada (WASTE_EVIDENCE_COMPLETION)";
  if (refType === LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL) return "Lugares · lugar aprobado (PLACE_DOCUMENTATION_APPROVAL)";
  if (refType === LEDGER_REF_TRIVIA_CORRECT) return "Trivia · respuesta correcta (TRIVIA_CORRECT)";
  return refType;
}

export default async function AdminChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { challengeId } = await params;
  const sp = await searchParams;
  const challenge = await getChallengeById(challengeId);
  if (!challenge) notFound();

  const playPath = challengePlayerModulePath(challenge.type, challengeId);
  const hasExtension = challengeTypeHasAdminModuleExtension(challenge.type);

  const [
    ledgerRows,
    waterPeriods,
    wastePending,
    wasteRecent,
    placePending,
    placeRecent,
    triviaRows,
  ] = await Promise.all([
    listLedgerEntriesForChallenge(challengeId),
    challenge.type === ChallengeType.WATER_BILL
      ? listWaterBillPeriodsForChallengeAdmin(challengeId)
      : Promise.resolve([]),
    challenge.type === ChallengeType.WASTE_EVIDENCE
      ? listPendingWasteEvidenceForChallenge(challengeId)
      : Promise.resolve([]),
    challenge.type === ChallengeType.WASTE_EVIDENCE
      ? listRecentWasteEvidenceDecisionsForChallenge(challengeId, 40)
      : Promise.resolve([]),
    challenge.type === ChallengeType.PLACE_DOCUMENTATION
      ? listPendingPlaceDocumentationForChallenge(challengeId)
      : Promise.resolve([]),
    challenge.type === ChallengeType.PLACE_DOCUMENTATION
      ? listRecentPlaceDocumentationDecisionsForChallenge(challengeId, 40)
      : Promise.resolve([]),
    challenge.type === ChallengeType.TRIVIA ? listTriviaQuestionsForChallengeAdmin(challengeId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/retos"
          className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
        >
          Volver a retos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mt-2 text-lg font-semibold text-[#e8f5ee]">{challenge.title}</h1>
            <p className="mt-1 font-mono text-xs text-[#6a8c78]">
              Código {challenge.code ?? "—"} · tipo <span className="text-[#8fd4a8]">{challenge.type}</span>
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(challenge.type === ChallengeType.WASTE_EVIDENCE ||
              challenge.type === ChallengeType.PLACE_DOCUMENTATION) && (
              <Link
                href={challengeAdminRevisionPath(challengeId)}
                className="shrink-0 rounded border border-[#2a4a50] bg-[#101a22] px-3 py-1.5 font-mono text-xs text-[#a8d4e8] shadow-[0_2px_0_#050807] hover:border-[#3a6a80]"
              >
                Cola de revisión
              </Link>
            )}
            <Link
              href={`/admin/retos/${challengeId}/edit`}
              className="shrink-0 rounded border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#b8f0cc] shadow-[0_2px_0_#050807] hover:border-[#4a8060]"
            >
              Editar reto
            </Link>
          </div>
        </div>
      </div>

      {(challenge.type === ChallengeType.WASTE_EVIDENCE || challenge.type === ChallengeType.PLACE_DOCUMENTATION) &&
      (sp.ok || sp.err) ? (
        <ReviewAlerts ok={sp.ok} err={sp.err} />
      ) : null}

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Datos del reto
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] text-[#5a8f72]">Inicio</dt>
            <dd className="font-mono text-[#c8e6d4]">{formatDate(challenge.startsAt)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-[#5a8f72]">Fin</dt>
            <dd className="font-mono text-[#c8e6d4]">{formatDate(challenge.endsAt)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-[#5a8f72]">Puntos base</dt>
            <dd className="font-mono text-[#c8e6d4]">{challenge.basePoints}</dd>
          </div>
          {challenge.type === ChallengeType.WATER_BILL ? (
            <div>
              <dt className="font-mono text-[10px] text-[#5a8f72]">Meta m³/persona/mes (consumo óptimo)</dt>
              <dd className="font-mono text-[#c8e6d4]">
                {challenge.optimalPerCapitaM3 != null
                  ? challenge.optimalPerCapitaM3
                  : `${DEFAULT_OPTIMAL_PER_CAPITA_M3} (por defecto en app)`}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={toggleChallengeActiveAction} className="inline">
            <input type="hidden" name="id" value={challenge.id} />
            <input type="hidden" name="next" value={challenge.active ? "false" : "true"} />
            <button
              type="submit"
              className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-1.5 font-mono text-xs text-[#8fd4a8] hover:border-[#35664a]"
            >
              {challenge.active ? "Desactivar reto" : "Activar reto"}
            </button>
          </form>
          <form action={toggleChallengePlatformAction} className="inline">
            <input type="hidden" name="id" value={challenge.id} />
            <input type="hidden" name="next" value={challenge.platformManaged ? "false" : "true"} />
            <button
              type="submit"
              className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-1.5 font-mono text-xs text-[#b8c4e8] hover:border-[#35664a]"
            >
              {challenge.platformManaged ? "Marcar solo importación" : "En plataforma (tablero)"}
            </button>
          </form>
          <Link
            href={playPath}
            className="inline-flex items-center rounded border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#b8f0cc] hover:border-[#4a8060]"
          >
            Ver como jugador
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Enlaces rápidos
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#7aab8c]">
          <li>
            <Link href="/admin/importaciones" className="text-[#8fd4a8] underline-offset-2 hover:underline">
              Importar puntajes (Excel)
            </Link>
            {challenge.code ? (
              <span className="ml-1 font-mono text-xs text-[#6a8c78]">
                — usa columna <span className="text-[#8fd4a8]">codigo_reto</span>:{" "}
                <strong className="text-[#c8e6d4]">{challenge.code}</strong>
              </span>
            ) : null}
          </li>
          <li>
            <Link href="/admin/puntajes" className="text-[#8fd4a8] underline-offset-2 hover:underline">
              Ranking y puntajes (ledger global)
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Origen de los puntos en el ledger
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7aab8c]">
          <span className="font-mono text-[#8fd4a8]">PARTICIPATION</span>: importación manual por Excel (un
          movimiento neto por empleado y reto, reemplaza la importación anterior).{" "}
          <span className="font-mono text-[#8fd4a8]">WATER_IMPROVEMENT</span> /{" "}
          <span className="font-mono text-[#8fd4a8]">WATER_MAINTENANCE</span>: puntos generados en la app por
          cada mes declarado.{" "}
          <span className="font-mono text-[#8fd4a8]">WASTE_EVIDENCE_COMPLETION</span>: bonus al aprobar la
          primera foto de residuos/acopio de un empleado en ese reto.{" "}
          <span className="font-mono text-[#8fd4a8]">PLACE_DOCUMENTATION_APPROVAL</span>: puntos por cada lugar
          documentado que se apruebe (un movimiento por envío).{" "}
          <span className="font-mono text-[#8fd4a8]">TRIVIA_CORRECT</span>: un movimiento por cada pregunta acertada
          en la trivia del tablero.
        </p>
        {hasExtension ? (
          <p className="mt-2 text-sm text-[#6a8c78]">
            Este tipo de reto incluye datos adicionales en la base (tablas del módulo) además del ledger
            común.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Movimientos de ledger (este reto)
        </h2>
        {ledgerRows.length === 0 ? (
          <p className="mt-4 font-mono text-sm text-[#6a8c78]">
            Sin movimientos para este reto (aún no hay importaciones ni puntos del módulo).
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Empleado</th>
                  <th className="py-2 pr-3">Delta</th>
                  <th className="py-2 pr-3">Origen</th>
                  <th className="py-2 pr-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((e) => (
                  <tr key={e.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                    <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/admin/puntajes/${e.employeeId}`}
                        className="text-[#8fd4a8] underline-offset-2 hover:underline"
                      >
                        {e.employee.fullName}
                      </Link>
                      <span className="ml-1 font-mono text-[10px] text-[#4d7a62]">{e.employee.cedula}</span>
                    </td>
                    <td
                      className={`py-2.5 pr-3 font-mono text-xs ${
                        e.delta >= 0 ? "text-[#8fd4a8]" : "text-[#f0b4b4]"
                      }`}
                    >
                      {e.delta >= 0 ? "+" : ""}
                      {e.delta}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-[#9ed4b4]">{refTypeLabel(e.refType)}</td>
                    <td className="py-2.5 pr-0 text-xs">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {challenge.type === ChallengeType.WATER_BILL ? (
        <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
            Módulo recibo de agua — periodos declarados
          </h2>
          <p className="mt-2 text-sm text-[#7aab8c]">
            Un reto anual; cada fila es un mes de facturación. Los puntos del mes están en el ledger con
            referencias WATER_*.
          </p>
          {waterPeriods.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-[#6a8c78]">Aún no hay declaraciones.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                    <th className="py-2 pr-3">Periodo</th>
                    <th className="py-2 pr-3">Empleado</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3 text-right">m³</th>
                    <th className="py-2 pr-3 text-right">Hab.</th>
                    <th className="py-2 pr-3 text-right">m³/p</th>
                    <th className="py-2 pr-3 text-right">Pts mej.</th>
                    <th className="py-2 pr-3 text-right">Pts ópt.</th>
                    <th className="py-2 pr-3">Evidencia</th>
                    <th className="py-2 pr-0">Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {waterPeriods.map((row) => (
                    <tr key={row.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                      <td className="py-2.5 pr-3 font-mono text-xs capitalize">
                        {formatPeriodLabelEs(row.periodStart)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/puntajes/${row.employeeId}`}
                          className="text-[#8fd4a8] underline-offset-2 hover:underline"
                        >
                          {row.employee.fullName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[10px]">
                        {row.status === EvidenceStatus.REJECTED ? (
                          <span className="text-[#f0b4b4]">Rechazado</span>
                        ) : (
                          <span className="text-[#8fd4a8]">Vigente</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs">{row.totalM3}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs">{row.householdMembers}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs">
                        {row.computedPerCapitaM3.toFixed(2)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs">{row.improvementPointsAwarded}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs">
                        {row.maintenancePointsAwarded}
                      </td>
                      <td className="py-2.5 pr-3">
                        {row.evidenceFilePath ? (
                          <PhotoModalTrigger
                            imageSrc={row.evidenceFilePath}
                            className="font-mono text-xs text-[#8fd4a8] underline-offset-2 hover:underline"
                            imageAlt="Evidencia de recibo de agua"
                          >
                            Ver imagen
                          </PhotoModalTrigger>
                        ) : (
                          <span className="text-[#6a8c78]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-0 align-top">
                        {row.status === EvidenceStatus.REJECTED ? (
                          <div className="max-w-xs space-y-1 font-mono text-[10px] text-[#9ed4b4]">
                            {row.rejectReason ? (
                              <p className="text-[#f0c4c4]">
                                <span className="text-[#6a8c78]">Motivo: </span>
                                {row.rejectReason}
                              </p>
                            ) : null}
                            {row.reviewedBy ? (
                              <p className="text-[#6a8c78]">
                                Por {row.reviewedBy.fullName}
                                {row.reviewedAt ? ` · ${formatDateTime(row.reviewedAt)}` : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : row.status === EvidenceStatus.APPROVED ? (
                          <form action={rejectWaterBillPeriodAction} className="flex max-w-xs flex-col gap-1">
                            <input type="hidden" name="periodId" value={row.id} />
                            <input type="hidden" name="challengeId" value={challengeId} />
                            <textarea
                              name="rejectReason"
                              rows={2}
                              placeholder="Motivo del rechazo (obligatorio para auditoría)"
                              className="resize-y rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#e8f5ee]"
                              required
                            />
                            <button
                              type="submit"
                              className="w-fit rounded border border-[#6a3030] bg-[#1a1010] px-2 py-1 font-mono text-[10px] text-[#f0b4b4] hover:border-[#8a4040]"
                            >
                              Rechazar mes
                            </button>
                          </form>
                        ) : (
                          <span className="text-[#6a8c78]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {challenge.type === ChallengeType.WASTE_EVIDENCE ? (
        <WasteReviewSection
          challengeId={challengeId}
          basePoints={challenge.basePoints}
          wastePending={wastePending}
          wasteRecent={wasteRecent}
          redirectTo={`/admin/retos/${challengeId}`}
          navLink={{ href: challengeAdminRevisionPath(challengeId), label: "Ir a cola de revisión" }}
        />
      ) : null}

      {challenge.type === ChallengeType.PLACE_DOCUMENTATION ? (
        <PlaceReviewSection
          challengeId={challengeId}
          basePoints={challenge.basePoints}
          placePending={placePending}
          placeRecent={placeRecent}
          redirectTo={`/admin/retos/${challengeId}`}
          navLink={{ href: challengeAdminRevisionPath(challengeId), label: "Ir a cola de revisión" }}
        />
      ) : null}

      {challenge.type === ChallengeType.TRIVIA ? (
        <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
            Trivia — preguntas cargadas
          </h2>
          <p className="mt-2 text-sm text-[#7aab8c]">
            <span className="font-mono text-[#8fd4a8]">{challenge.basePoints} pts</span> por cada respuesta correcta
            (definido en el reto). Los empleados responden en el tablero en{" "}
            <span className="font-mono text-[#a78bfa]">/tablero/retos/…/trivia</span>.
          </p>
          {triviaRows.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-[#6a8c78]">Aún no hay preguntas. Edita el reto para añadirlas.</p>
          ) : (
            <ol className="mt-4 list-decimal space-y-6 pl-5 text-sm text-[#c8e6d4]">
              {triviaRows.map((q) => (
                <li key={q.id} className="pl-1">
                  <p className="font-medium text-[#e8f5ee]">{q.prompt}</p>
                  <ul className="mt-2 list-none space-y-1 pl-0 text-[#7aab8c]">
                    {q.options.map((o) => (
                      <li key={o.id} className="flex gap-2">
                        <span className="font-mono text-[10px] text-[#5a8f72]">
                          {o.isCorrect ? "✓" : "·"}
                        </span>
                        <span className={o.isCorrect ? "text-[#8fd4a8]" : ""}>{o.label}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    </div>
  );
}
