import Link from "next/link";
import { ChallengeType } from "@/generated/prisma/enums";
import { getPendingReviewCountsByChallengeId, listChallengesForAdmin } from "@/lib/services/challenges/queries";
import { challengeAdminBasePath, challengeAdminRevisionPath } from "@/modules/challenges/registry";
import { toggleChallengeActiveAction, toggleChallengePlatformAction } from "./actions";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "short" }).format(d);
}

export default async function AdminRetosPage() {
  const [challenges, pendingReviewByChallenge] = await Promise.all([
    listChallengesForAdmin(),
    getPendingReviewCountsByChallengeId(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Retos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7aab8c]">
          <span className="font-mono text-[#8fd4a8]">Activo</span> controla si el reto cuenta en el tablero (y
          fechas vigentes). <span className="font-mono text-[#8fd4a8]">En plataforma</span> indica si es un reto
          jugable en la app; si está desactivado, sirve solo para registrar puntajes históricos o fuera de
          flujo (importación Excel).
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6a8c78]">
          Reto tipo <span className="font-mono text-[#8fd4a8]">WATER_BILL</span>: conviene un{" "}
          <strong className="text-[#7aab8c]">solo reto anual</strong> por campaña; el seguimiento mensual son
          filas <span className="font-mono">WaterBillPeriod</span> en la app, no un reto nuevo cada mes. Puntos:
          mejora vs mes anterior y reconocimiento por consumo óptimo (per cápita), vía ledger. Al crear o editar el
          reto defines la <strong className="text-[#7aab8c]">meta m³ por persona y mes</strong> (referencia local:
          p. ej. ~11 en Bogotá; no tiene que ser 12).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/admin/retos/nuevo"
            className="inline-flex rounded border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#b8f0cc] shadow-[0_2px_0_#050807] hover:border-[#4a8060]"
          >
            Crear reto (asistente)
          </Link>
          <span className="text-[#4d7a62]">·</span>
          <Link
            href="/admin/importaciones"
            className="font-mono text-[#8fd4a8] underline-offset-2 hover:underline"
          >
            Importar retos y puntajes desde Excel
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Listado
        </h2>
        {challenges.length === 0 ? (
          <p className="mt-4 font-mono text-sm text-[#6a8c78]">
            No hay retos. Importa desde{" "}
            <Link href="/admin/importaciones" className="text-[#8fd4a8] underline">
              Importación Excel
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                  <th className="py-2 pr-3">Código</th>
                  <th className="py-2 pr-3">Título</th>
                  <th className="py-2 pr-3">Inicio</th>
                  <th className="py-2 pr-3">Fin</th>
                  <th className="py-2 pr-3 text-right">Pts base</th>
                  <th className="py-2 pr-3">Activo</th>
                  <th className="py-2 pr-3">En plataforma</th>
                  <th className="py-2 pr-0">Gestión</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                    <td className="py-2.5 pr-3 font-mono text-xs">{c.code ?? "—"}</td>
                    <td className="py-2.5 pr-3">{c.title}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                      {formatDate(c.startsAt)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                      {formatDate(c.endsAt)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs">{c.basePoints}</td>
                    <td className="py-2.5 pr-3">
                      <form action={toggleChallengeActiveAction} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="next" value={c.active ? "false" : "true"} />
                        <button
                          type="submit"
                          className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#8fd4a8] hover:border-[#35664a]"
                        >
                          {c.active ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </td>
                    <td className="py-2.5 pr-3">
                      <form action={toggleChallengePlatformAction} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="next" value={c.platformManaged ? "false" : "true"} />
                        <button
                          type="submit"
                          className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#b8c4e8] hover:border-[#35664a]"
                        >
                          {c.platformManaged ? "Solo importación" : "En plataforma"}
                        </button>
                      </form>
                    </td>
                    <td className="py-2.5 pr-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={challengeAdminBasePath(c.id)}
                          className="font-mono text-[10px] text-[#8fd4a8] underline-offset-2 hover:underline"
                        >
                          Detalle
                        </Link>
                        {(c.type === ChallengeType.WASTE_EVIDENCE ||
                          c.type === ChallengeType.PLACE_DOCUMENTATION) &&
                        (pendingReviewByChallenge[c.id] ?? 0) > 0 ? (
                          <Link
                            href={challengeAdminRevisionPath(c.id)}
                            className="rounded border border-[#b45309] bg-[#1a1208] px-1.5 py-0.5 font-mono text-[10px] text-[#fde68a] hover:border-[#d97706]"
                          >
                            {pendingReviewByChallenge[c.id]} pendiente
                            {pendingReviewByChallenge[c.id] === 1 ? "" : "s"}
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
