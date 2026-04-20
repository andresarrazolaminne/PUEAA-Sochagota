import { requireEmployee } from "@/lib/auth/require-employee";
import { listLedgerEntriesForEmployee } from "@/lib/services/admin/ledger";
import { getTotalPointsForEmployee } from "@/lib/services/points/ledger";
import { HerramientasNav } from "../HerramientasNav";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function OrigenPuntosPage() {
  const employee = await requireEmployee("/tablero/herramientas/origen-puntos");

  const [total, entries] = await Promise.all([
    getTotalPointsForEmployee(employee.id),
    listLedgerEntriesForEmployee(employee.id),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="game-panel-3d mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 rounded-2xl p-4 md:p-6">
        <HerramientasNav
          title="Origen de mis puntos"
          subtitle="Cada fila es un movimiento oficial en la campaña: ves cuántos puntos sumaron o restaron, el detalle y el tipo de actividad que los generó."
        />

        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border-2 border-[#1e3a5f] bg-gradient-to-br from-[#f0f9ff] to-[#e8f2fa] px-4 py-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#2563eb]">
              Tu total en campaña
            </p>
            <p className="mt-1 text-sm text-[#3d5670]">
              Suma de todos los movimientos del programa (mismo criterio que el tablero).
            </p>
          </div>
          <div className="rounded-lg border-2 border-[#0d9488] bg-[#ccfbf1] px-4 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[#0f766e]">Puntos</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-[#0d9488]">{total}</p>
          </div>
        </div>

        <details className="rounded-xl border-2 border-[#94a3b8]/50 bg-white/90 px-4 py-3 text-sm text-[#3d5670] shadow-sm">
          <summary className="cursor-pointer font-semibold text-[#1e40af] outline-none marker:text-[#2563eb]">
            ¿Qué significa cada tipo de origen?
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <span className="font-mono text-xs text-[#1e3a5f]">PARTICIPATION</span>: suele ser puntos cargados por
              administración desde Excel vinculados a un reto (importación por participación).
            </li>
            <li>
              <span className="font-mono text-xs text-[#1e3a5f]">WATER_IMPROVEMENT</span> /{" "}
              <span className="font-mono text-xs text-[#1e3a5f]">WATER_MAINTENANCE</span>: puntos del reto de recibos
              de agua (mejora mes a mes o mantenerte dentro de la meta).
            </li>
            <li>
              <span className="font-mono text-xs text-[#1e3a5f]">WASTE_EVIDENCE_COMPLETION</span>: bono al aprobar la
              primera evidencia de residuos en un reto.
            </li>
            <li>
              <span className="font-mono text-xs text-[#1e3a5f]">PLACE_DOCUMENTATION_APPROVAL</span>: puntos por lugares
              de acopio documentados y aprobados.
            </li>
            <li>
              <span className="font-mono text-xs text-[#1e3a5f]">TRIVIA_CORRECT</span>: aciertos en trivia de un reto.
            </li>
            <li>
              La columna <strong>Origen</strong> muestra el código técnico y un identificador interno abreviado; el
              texto de <strong>Detalle</strong> describe el movimiento en lenguaje humano.
            </li>
          </ul>
        </details>

        <div className="rounded-xl border-2 border-[#1e3a5f] bg-white/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <h2 className="font-pixel text-[11px] font-normal uppercase tracking-widest text-[#2563eb]">
            Movimientos (más recientes primero)
          </h2>
          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-[#5b7cb8]">Aún no tienes movimientos registrados en la campaña.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1e3a5f]/30 font-mono text-[10px] uppercase tracking-wider text-[#5b7cb8]">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Puntos</th>
                    <th className="py-2 pr-3">Detalle</th>
                    <th className="py-2 pr-0">Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-[#cbd5e1] text-[#132238]">
                      <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap text-[#3d5670]">
                        {formatDate(e.createdAt)}
                      </td>
                      <td
                        className={`py-2.5 pr-3 font-mono text-xs font-semibold tabular-nums ${
                          e.delta >= 0 ? "text-[#0d9488]" : "text-[#b91c1c]"
                        }`}
                      >
                        {e.delta >= 0 ? "+" : ""}
                        {e.delta}
                      </td>
                      <td className="py-2.5 pr-3 text-xs leading-relaxed text-[#3d5670]">{e.reason}</td>
                      <td className="py-2.5 pr-0 font-mono text-[10px] text-[#64748b]">
                        {e.refType ?? "—"}
                        {e.refId ? ` · ${e.refId.slice(0, 8)}…` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
