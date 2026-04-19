import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/services/admin/employees";
import { listLedgerEntriesForEmployee } from "@/lib/services/admin/ledger";
import { getTotalPointsForEmployee } from "@/lib/services/points/ledger";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function AdminPuntajesDetallePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const employee = await getEmployeeById(employeeId);
  if (!employee) notFound();

  const [total, entries] = await Promise.all([
    getTotalPointsForEmployee(employeeId),
    listLedgerEntriesForEmployee(employeeId),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Ledger de puntos</p>
            <h1 className="mt-1 text-lg font-semibold text-[#e8f5ee]">{employee.fullName}</h1>
            <p className="mt-1 font-mono text-xs text-[#6a8c78]">Cédula {employee.cedula}</p>
          </div>
          <div className="rounded border border-[#2a4a38] bg-[#0d1512] px-4 py-3 text-right">
            <p className="font-mono text-[10px] text-[#5a8f72]">Total acumulado</p>
            <p className="font-mono text-2xl text-[#8fd4a8]">{total}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#7aab8c]">
          Movimientos individuales registrados en el sistema (más recientes primero). La columna{" "}
          <span className="font-mono text-[#8fd4a8]">Ref</span> indica el origen:{" "}
          <span className="font-mono">PARTICIPATION</span> suele ser importación Excel por reto;{" "}
          <span className="font-mono">WATER_IMPROVEMENT</span> / <span className="font-mono">WATER_MAINTENANCE</span>{" "}
          son puntos del módulo de recibo de agua por periodo;{" "}
          <span className="font-mono">WASTE_EVIDENCE_COMPLETION</span> es el bono único al aprobar la primera evidencia
          de residuos en un reto (por participación);{" "}
          <span className="font-mono">PLACE_DOCUMENTATION_APPROVAL</span> suma puntos por cada lugar documentado aprobado
          (un movimiento por envío). Conviven en el total y no se sustituyen entre sí.
        </p>
      </div>

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {entries.length === 0 ? (
          <p className="font-mono text-sm text-[#6a8c78]">Sin movimientos en el ledger.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Delta</th>
                  <th className="py-2 pr-3">Motivo</th>
                  <th className="py-2 pr-3">Ref</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                    <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                      {formatDate(e.createdAt)}
                    </td>
                    <td
                      className={`py-2.5 pr-3 font-mono text-xs ${
                        e.delta >= 0 ? "text-[#8fd4a8]" : "text-[#f0b4b4]"
                      }`}
                    >
                      {e.delta >= 0 ? "+" : ""}
                      {e.delta}
                    </td>
                    <td className="py-2.5 pr-3 text-xs">{e.reason}</td>
                    <td className="py-2.5 pr-0 font-mono text-[10px] text-[#4d7a62]">
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

      <Link
        href="/admin/puntajes"
        className="inline-block font-mono text-sm text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
      >
        Volver al ranking
      </Link>
    </div>
  );
}
