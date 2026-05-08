import Link from "next/link";
import { notFound } from "next/navigation";
import { getChallengeById } from "@/lib/services/challenges/queries";
import { listLedgerEntriesForChallenge } from "@/lib/services/admin/challenge-ledger";
import { listWaterBillPeriodsForChallengeAdmin } from "@/lib/services/challenges/water-bill";
import {
  listPendingWasteEvidenceForChallenge,
  listRecentWasteEvidenceDecisionsForChallenge,
} from "@/lib/services/challenges/waste-evidence";
import { listAllPlaceDocumentationForChallengeAdmin } from "@/lib/services/challenges/place-documentation";
import { listTriviaQuestionsForChallengeAdmin } from "@/lib/services/challenges/trivia";
import {
  approveWaterBillPeriodAction,
  rejectWaterBillPeriodAction,
} from "../water-bill-period-actions";
import {
  challengeAdminRevisionPath,
  challengePlayerModulePath,
  challengeTypeHasAdminModuleExtension,
} from "@/modules/challenges/registry";
import { ReviewAlerts } from "./ReviewAlerts";
import { WasteReviewSection } from "./WasteReviewSection";
import { PlaceReviewSection, type PlaceSupervisionQuery } from "./PlaceReviewSection";
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
import { EvidenceZoomImage } from "@/components/EvidenceZoomImage";

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
  searchParams: Promise<{
    ok?: string;
    err?: string;
    wq?: string;
    wstatus?: string;
    wsort?: string;
    wid?: string;
    pq?: string;
    pstatus?: string;
    psort?: string;
    pid?: string;
  }>;
}) {
  const { challengeId } = await params;
  const sp = await searchParams;
  const challenge = await getChallengeById(challengeId);
  if (!challenge) notFound();
  const waterQuery = (sp.wq ?? "").trim().toLowerCase();
  const waterStatus = sp.wstatus === "approved" || sp.wstatus === "rejected" ? sp.wstatus : "all";
  const waterSort =
    sp.wsort === "created_asc" ||
    sp.wsort === "created_desc" ||
    sp.wsort === "period_asc" ||
    sp.wsort === "period_desc"
      ? sp.wsort
      : "period_desc";
  const selectedWaterId = typeof sp.wid === "string" ? sp.wid : "";

  const placePq = typeof sp.pq === "string" ? sp.pq : "";
  const placePstatus =
    sp.pstatus === "pending" ||
    sp.pstatus === "approved" ||
    sp.pstatus === "rejected" ||
    sp.pstatus === "all"
      ? sp.pstatus
      : "all";
  const placePsort =
    sp.psort === "created_asc" ||
    sp.psort === "created_desc" ||
    sp.psort === "place_asc" ||
    sp.psort === "place_desc"
      ? sp.psort
      : "created_desc";
  const placePid = typeof sp.pid === "string" ? sp.pid : "";

  const playPath = challengePlayerModulePath(challenge.type, challengeId);
  const hasExtension = challengeTypeHasAdminModuleExtension(challenge.type);

  const [ledgerRows, waterPeriods, wastePending, wasteRecent, placeDocumentationRows, triviaRows] =
    await Promise.all([
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
      ? listAllPlaceDocumentationForChallengeAdmin(challengeId)
      : Promise.resolve([]),
    challenge.type === ChallengeType.TRIVIA ? listTriviaQuestionsForChallengeAdmin(challengeId) : Promise.resolve([]),
  ]);

  const filteredWaterPeriods =
    challenge.type === ChallengeType.WATER_BILL
      ? waterPeriods
          .filter((row) => {
            if (waterStatus === "approved" && row.status !== EvidenceStatus.APPROVED) return false;
            if (waterStatus === "rejected" && row.status !== EvidenceStatus.REJECTED) return false;
            if (!waterQuery) return true;
            const haystack = `${row.employee.fullName} ${row.employee.cedula}`.toLowerCase();
            return haystack.includes(waterQuery);
          })
          .sort((a, b) => {
            if (waterSort === "created_asc") return a.createdAt.getTime() - b.createdAt.getTime();
            if (waterSort === "created_desc") return b.createdAt.getTime() - a.createdAt.getTime();
            if (waterSort === "period_asc") return a.periodStart.getTime() - b.periodStart.getTime();
            return b.periodStart.getTime() - a.periodStart.getTime();
          })
      : [];

  const waterByEmployee =
    challenge.type === ChallengeType.WATER_BILL
      ? filteredWaterPeriods.reduce(
          (acc, row) => {
            const prev = acc.get(row.employeeId);
            if (prev) {
              prev.rows.push(row);
            } else {
              acc.set(row.employeeId, {
                employeeId: row.employeeId,
                fullName: row.employee.fullName,
                cedula: row.employee.cedula,
                rows: [row],
              });
            }
            return acc;
          },
          new Map<
            string,
            {
              employeeId: string;
              fullName: string;
              cedula: string;
              rows: (typeof waterPeriods)[number][];
            }
          >(),
        )
      : new Map<
          string,
          {
            employeeId: string;
            fullName: string;
            cedula: string;
            rows: (typeof waterPeriods)[number][];
          }
        >();

  const groupedWaterRows =
    challenge.type === ChallengeType.WATER_BILL
      ? [...waterByEmployee.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "es"))
      : [];
  const selectedWaterRow =
    challenge.type === ChallengeType.WATER_BILL
      ? filteredWaterPeriods.find((row) => row.id === selectedWaterId) ?? filteredWaterPeriods[0] ?? null
      : null;

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

          <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded border border-[#243d30] bg-[#0d1512] p-3">
            <label className="flex min-w-[14rem] flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                Buscar usuario (nombre o cédula)
              </span>
              <input
                name="wq"
                defaultValue={sp.wq ?? ""}
                className="rounded border border-[#243d30] bg-[#111916] px-2.5 py-2 font-mono text-xs text-[#e8f5ee]"
                placeholder="Ej: García o 123456"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Estado</span>
              <select
                name="wstatus"
                defaultValue={waterStatus}
                className="rounded border border-[#243d30] bg-[#111916] px-2.5 py-2 font-mono text-xs text-[#e8f5ee]"
              >
                <option value="all">Todos</option>
                <option value="approved">Vigentes</option>
                <option value="rejected">Rechazados</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Orden</span>
              <select
                name="wsort"
                defaultValue={waterSort}
                className="rounded border border-[#243d30] bg-[#111916] px-2.5 py-2 font-mono text-xs text-[#e8f5ee]"
              >
                <option value="period_desc">Mes más reciente primero</option>
                <option value="period_asc">Mes más antiguo primero</option>
                <option value="created_desc">Registro más reciente primero</option>
                <option value="created_asc">Registro más antiguo primero</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded border border-[#35664a] bg-[#142018] px-3 py-2 font-mono text-xs text-[#b8f0cc] hover:border-[#4a8060]"
            >
              Aplicar filtros
            </button>
          </form>

          <div className="mt-3 grid gap-2 font-mono text-xs text-[#7aab8c] sm:grid-cols-3">
            <p>
              Usuarios en vista: <span className="text-[#8fd4a8]">{groupedWaterRows.length}</span>
            </p>
            <p>
              Registros en vista: <span className="text-[#8fd4a8]">{filteredWaterPeriods.length}</span>
            </p>
            <p>
              Total registros reto: <span className="text-[#8fd4a8]">{waterPeriods.length}</span>
            </p>
          </div>

          {waterPeriods.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-[#6a8c78]">Aún no hay declaraciones.</p>
          ) : groupedWaterRows.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-[#6a8c78]">
              No hay resultados con los filtros seleccionados.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(360px,1fr)_minmax(460px,1.2fr)]">
              <div className="rounded-lg border border-[#243d30] bg-[#0d1512] p-3">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                  Lista de registros (selecciona uno)
                </h3>
                <div className="mt-3 max-h-[70vh] space-y-4 overflow-auto pr-1">
                  {groupedWaterRows.map((group) => {
                    const pointsTotal = group.rows.reduce(
                      (sum, row) => sum + row.improvementPointsAwarded + row.maintenancePointsAwarded,
                      0,
                    );
                    return (
                      <div key={group.employeeId} className="rounded border border-[#243d30] bg-[#111916] p-2.5">
                        <p className="text-xs text-[#c8e6d4]">
                          <Link
                            href={`/admin/puntajes/${group.employeeId}`}
                            className="text-[#8fd4a8] underline-offset-2 hover:underline"
                          >
                            {group.fullName}
                          </Link>
                          <span className="ml-2 font-mono text-[10px] text-[#6a8c78]">{group.cedula}</span>
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-[#6a8c78]">
                          Registros: {group.rows.length} · Puntos agua: {pointsTotal}
                        </p>
                        <div className="mt-2 space-y-1">
                          {group.rows.map((row) => {
                            const params = new URLSearchParams();
                            if (sp.wq) params.set("wq", sp.wq);
                            if (sp.wstatus) params.set("wstatus", sp.wstatus);
                            if (sp.wsort) params.set("wsort", sp.wsort);
                            params.set("wid", row.id);
                            return (
                              <Link
                                key={row.id}
                                href={`/admin/retos/${challengeId}?${params.toString()}`}
                                scroll={false}
                                className={`block rounded border px-2 py-1.5 font-mono text-[10px] ${
                                  selectedWaterRow?.id === row.id
                                    ? "border-[#4a8060] bg-[#142018] text-[#b8f0cc]"
                                    : "border-[#243d30] bg-[#0d1512] text-[#9ed4b4] hover:border-[#35664a]"
                                }`}
                              >
                                <span className="capitalize">{formatPeriodLabelEs(row.periodStart)}</span>
                                <span className="mx-1 text-[#6a8c78]">·</span>
                                <span>{formatDateTime(row.createdAt)}</span>
                                <span className="mx-1 text-[#6a8c78]">·</span>
                                <span>{row.status === EvidenceStatus.REJECTED ? "Rechazado" : "Vigente"}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[#243d30] bg-[#0d1512] p-4">
                {selectedWaterRow ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#243d30] pb-3">
                      <div>
                        <p className="text-sm text-[#c8e6d4]">
                          {selectedWaterRow.employee.fullName}
                          <span className="ml-2 font-mono text-xs text-[#6a8c78]">
                            {selectedWaterRow.employee.cedula}
                          </span>
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#7aab8c] capitalize">
                          {formatPeriodLabelEs(selectedWaterRow.periodStart)} · Registrado{" "}
                          {formatDateTime(selectedWaterRow.createdAt)}
                        </p>
                      </div>
                      <p className="font-mono text-xs">
                        {selectedWaterRow.status === EvidenceStatus.REJECTED ? (
                          <span className="text-[#f0b4b4]">Rechazado</span>
                        ) : (
                          <span className="text-[#8fd4a8]">Vigente</span>
                        )}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                        <span className="font-mono text-[10px] text-[#6a8c78]">Consumo total m³</span>
                        <br />
                        <strong className="font-mono text-[#c8e6d4]">{selectedWaterRow.totalM3}</strong>
                      </p>
                      <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                        <span className="font-mono text-[10px] text-[#6a8c78]">Habitantes</span>
                        <br />
                        <strong className="font-mono text-[#c8e6d4]">{selectedWaterRow.householdMembers}</strong>
                      </p>
                      <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                        <span className="font-mono text-[10px] text-[#6a8c78]">m³ por persona</span>
                        <br />
                        <strong className="font-mono text-[#c8e6d4]">
                          {selectedWaterRow.computedPerCapitaM3.toFixed(2)}
                        </strong>
                      </p>
                      <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                        <span className="font-mono text-[10px] text-[#6a8c78]">Puntos del registro</span>
                        <br />
                        <strong className="font-mono text-[#c8e6d4]">
                          mejora +{selectedWaterRow.improvementPointsAwarded} · óptimo +
                          {selectedWaterRow.maintenancePointsAwarded}
                        </strong>
                      </p>
                    </div>

                    <div className="rounded border border-[#243d30] bg-[#111916] px-3 py-2 text-xs text-[#9ed4b4]">
                      {selectedWaterRow.reviewedBy ? (
                        <p>
                          Última revisión: {selectedWaterRow.reviewedBy.fullName}
                          {selectedWaterRow.reviewedAt ? ` · ${formatDateTime(selectedWaterRow.reviewedAt)}` : ""}
                        </p>
                      ) : (
                        <p>Sin revisión administrativa registrada.</p>
                      )}
                      {selectedWaterRow.rejectReason ? (
                        <p className="mt-1 text-[#f0c4c4]">
                          <span className="text-[#6a8c78]">Motivo rechazo: </span>
                          {selectedWaterRow.rejectReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Evidencia</p>
                      <div className="mt-2">
                        {selectedWaterRow.evidenceFilePath ? (
                          <div className="space-y-2">
                            <EvidenceZoomImage
                              imageSrc={selectedWaterRow.evidenceFilePath}
                              alt="Miniatura de evidencia de recibo de agua"
                            />
                            <PhotoModalTrigger
                              imageSrc={selectedWaterRow.evidenceFilePath}
                              className="font-mono text-xs text-[#8fd4a8] underline-offset-2 hover:underline"
                              imageAlt="Evidencia de recibo de agua"
                            >
                              Ver imagen (ampliar)
                            </PhotoModalTrigger>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6a8c78]">Este registro no tiene imagen adjunta.</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                        Acciones de supervisión
                      </p>
                      {selectedWaterRow.status === EvidenceStatus.APPROVED ? (
                        <form action={rejectWaterBillPeriodAction} className="mt-2 flex max-w-md flex-col gap-1.5">
                          <input type="hidden" name="periodId" value={selectedWaterRow.id} />
                          <input type="hidden" name="challengeId" value={challengeId} />
                          <textarea
                            name="rejectReason"
                            rows={3}
                            placeholder="Motivo del rechazo (obligatorio para auditoría)"
                            className="resize-y rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[11px] text-[#e8f5ee]"
                            required
                          />
                          <button
                            type="submit"
                            className="w-fit rounded border border-[#6a3030] bg-[#1a1010] px-2.5 py-1.5 font-mono text-[11px] text-[#f0b4b4] hover:border-[#8a4040]"
                          >
                            Rechazar registro
                          </button>
                        </form>
                      ) : (
                        <form action={approveWaterBillPeriodAction} className="mt-2">
                          <input type="hidden" name="periodId" value={selectedWaterRow.id} />
                          <input type="hidden" name="challengeId" value={challengeId} />
                          <button
                            type="submit"
                            className="rounded border border-[#35664a] bg-[#142018] px-2.5 py-1.5 font-mono text-[11px] text-[#b8f0cc] hover:border-[#4a8060]"
                          >
                            Aprobar nuevamente
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
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
          placeRows={placeDocumentationRows}
          placeQuery={{
            pq: placePq,
            pstatus: placePstatus as PlaceSupervisionQuery["pstatus"],
            psort: placePsort as PlaceSupervisionQuery["psort"],
            pid: placePid,
          }}
          supervisionMode="detail"
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
