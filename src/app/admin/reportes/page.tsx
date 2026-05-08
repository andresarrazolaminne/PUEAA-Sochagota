import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  PARTICIPATION_ACTIVITY_ORDER,
  buildParticipationSummaryRows,
  filterParticipationRowsByActivities,
  parseParticipationReportRange,
  parseParticipationActivities,
  participationReportDefaultRangeUtcYmd,
} from "@/lib/services/admin/participation-report";

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; actividad?: string | string[] }>;
}) {
  await requireAdmin("/admin/reportes");

  const defaults = participationReportDefaultRangeUtcYmd();
  const sp = await searchParams;
  let desde =
    typeof sp.desde === "string" && sp.desde.trim() !== ""
      ? sp.desde.trim()
      : defaults.desde;
  let hasta =
    typeof sp.hasta === "string" && sp.hasta.trim() !== ""
      ? sp.hasta.trim()
      : defaults.hasta;

  let parsed = parseParticipationReportRange(desde, hasta);
  let rangeError: string | null = null;
  if (!parsed.ok) {
    rangeError = parsed.error;
    desde = defaults.desde;
    hasta = defaults.hasta;
    parsed = parseParticipationReportRange(desde, hasta);
    if (!parsed.ok) {
      throw new Error("Rango por defecto inválido");
    }
  }

  const { start, endExclusive } = parsed;
  const rawActividad = sp.actividad;
  const selectedActivities = parseParticipationActivities(
    Array.isArray(rawActividad)
      ? rawActividad
      : typeof rawActividad === "string"
        ? [rawActividad]
        : [],
  );

  const where = { createdAt: { gte: start, lt: endExclusive } as const };

  const rows = await prisma.pointLedger.findMany({
    where,
    include: { employee: { select: { fullName: true, cedula: true } } },
    orderBy: { createdAt: "asc" },
  });

  const allSummaryRows = buildParticipationSummaryRows(rows);
  const filteredRows = filterParticipationRowsByActivities(
    allSummaryRows,
    selectedActivities,
  );
  const participantsCount = filteredRows.length;
  const movementCount = rows.length;
  const previewRows = filteredRows.slice(0, 200);
  const hasMoreRows = filteredRows.length > previewRows.length;
  const actividadesQuery = selectedActivities
    .map((activity) => `actividad=${encodeURIComponent(activity)}`)
    .join("&");

  const downloadHref = `/api/admin/reportes/participacion?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}${actividadesQuery ? `&${actividadesQuery}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">
          Reportes de participación
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7aab8c]">
          Descarga un Excel con una fila por empleado que tuvo movimientos en el ledger en el rango
          elegido. Las columnas por tipo de actividad usan{" "}
          <code className="rounded bg-[#0d1512] px-1 font-mono text-[#8fd4a8]">
            PointLedger.refType
          </code>{" "}
          y fechas según{" "}
          <code className="rounded bg-[#0d1512] px-1 font-mono text-[#8fd4a8]">
            createdAt
          </code>
          .
        </p>
      </div>

      {rangeError ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          {rangeError} Se aplicaron los últimos 30 días por defecto.
        </p>
      ) : null}

      <div className="rounded-xl border border-[#243d30] bg-[#0a100d] p-5 shadow-[0_4px_0_#050807]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#6a9c80]">
          Filtros
        </p>
        <form
          method="get"
          action="/admin/reportes/"
          className="mt-4 flex flex-wrap items-end gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
              Desde
            </span>
            <input
              name="desde"
              type="date"
              defaultValue={desde}
              className="rounded border border-[#243d30] bg-[#111916] px-3 py-2 font-mono text-sm text-[#c8e6d4]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
              Hasta
            </span>
            <input
              name="hasta"
              type="date"
              defaultValue={hasta}
              className="rounded border border-[#243d30] bg-[#111916] px-3 py-2 font-mono text-sm text-[#c8e6d4]"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border-2 border-[#1e3a5f] bg-[#e0f2fe] px-4 py-2 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
          >
            Actualizar vista
          </button>
          <div className="w-full border-t border-[#243d30] pt-3" />
          <fieldset className="w-full">
            <legend className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
              Actividades (aditivo: incluye empleados activos en cualquiera seleccionada)
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {PARTICIPATION_ACTIVITY_ORDER.map((activity) => (
                <label
                  key={activity.id}
                  className="inline-flex items-center gap-2 rounded border border-[#243d30] bg-[#111916] px-2.5 py-1.5 text-xs text-[#c8e6d4]"
                >
                  <input
                    type="checkbox"
                    name="actividad"
                    value={activity.id}
                    defaultChecked={selectedActivities.includes(activity.id)}
                    className="accent-[#8fd4a8]"
                  />
                  {activity.label}
                </label>
              ))}
            </div>
          </fieldset>
        </form>

        <div className="mt-6 grid gap-3 border-t border-[#243d30] pt-4 font-mono text-sm text-[#c8e6d4] sm:grid-cols-2">
          <p>
            <span className="text-[#6a9c80]">Empleados con actividad:</span>{" "}
            <strong className="text-[#8fd4a8]">{participantsCount}</strong>
          </p>
          <p>
            <span className="text-[#6a9c80]">Movimientos en el rango:</span>{" "}
            <strong className="text-[#8fd4a8]">{movementCount}</strong>
          </p>
        </div>

        <div className="mt-6">
          <Link
            href={downloadHref}
            className="inline-flex rounded-lg border-2 border-[#2a4a38] bg-[#0d1512] px-4 py-2 font-mono text-xs font-semibold text-[#8fd4a8] shadow-[0_3px_0_#1a2820] transition hover:brightness-110 active:translate-y-px"
          >
            Descargar Excel
          </Link>
          <p className="mt-2 text-xs text-[#5a8068]">
            Rango aplicado: {desde} → {hasta} (inclusive en &quot;hasta&quot;, UTC).
          </p>
          <p className="mt-1 text-xs text-[#5a8068]">
            Vista previa: primeros {previewRows.length} de {filteredRows.length} empleados filtrados.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#243d30] bg-[#0a100d] p-5 shadow-[0_4px_0_#050807]">
        <h2 className="text-sm font-semibold text-[#e8f5ee]">Resultados filtrados</h2>
        {previewRows.length === 0 ? (
          <p className="mt-3 text-sm text-[#7aab8c]">
            No hay empleados que cumplan los filtros seleccionados.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Cédula</th>
                  <th className="py-2 pr-3 text-right">Puntos</th>
                  <th className="py-2 pr-3 text-right">Movimientos</th>
                  {PARTICIPATION_ACTIVITY_ORDER.map((activity) => (
                    <th key={activity.id} className="py-2 pr-3">
                      {activity.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.employeeId}
                    className="border-b border-[#1a2820] text-[#c8e6d4]"
                  >
                    <td className="py-2.5 pr-3">{row.fullName}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{row.cedula}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-[#8fd4a8]">
                      {row.sumDelta}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs">{row.count}</td>
                    {PARTICIPATION_ACTIVITY_ORDER.map((activity) => {
                      const active = row.activityLast[activity.id] != null;
                      return (
                        <td
                          key={activity.id}
                          className={`py-2.5 pr-3 font-mono text-xs ${active ? "text-[#8fd4a8]" : "text-[#5a8068]"}`}
                        >
                          {active ? "Activa" : "Inactiva"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {hasMoreRows ? (
          <p className="mt-3 text-xs text-[#5a8068]">
            Se muestran 200 resultados; exporta el Excel para ver el total filtrado.
          </p>
        ) : null}
      </div>
    </div>
  );
}
