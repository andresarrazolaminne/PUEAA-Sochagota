import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getUnifiedPendingReviewInbox } from "@/lib/services/challenges/queries";

const KIND_LABEL: Record<string, { label: string; tone: string }> = {
  waste: { label: "Residuos", tone: "border-[#b45309] bg-[#1a1208] text-[#fde68a]" },
  place: { label: "Acopio", tone: "border-[#0d9488] bg-[#042f2e] text-[#5eead4]" },
  water: { label: "Agua", tone: "border-[#0369a1] bg-[#0c1a28] text-[#7dd3fc]" },
};

export default async function AdminRevisionStationPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; ok?: string }>;
}) {
  await requireAdmin("/admin/revision");
  const sp = await searchParams;
  const kindFilter =
    sp.kind === "waste" || sp.kind === "place" || sp.kind === "water" ? sp.kind : "all";

  const inbox = await getUnifiedPendingReviewInbox();
  const items =
    kindFilter === "all" ? inbox.items : inbox.items.filter((i) => i.kind === kindFilter);

  const counts = {
    all: inbox.items.length,
    waste: inbox.items.filter((i) => i.kind === "waste").length,
    place: inbox.items.filter((i) => i.kind === "place").length,
    water: inbox.items.filter((i) => i.kind === "water").length,
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a8f72]">
            Estación de auditoría
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#e8f5ee]">Cola de revisión</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7aab8c]">
            Un solo lugar para aprobar o rechazar. Los rechazos no suman puntos; si deshaces una
            aprobación, se retiran puntos e early bird cuando ya no quede nada aprobado.
          </p>
        </div>
        <div className="device-lcd rounded-lg px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-widest opacity-80">Pendientes</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{counts.all}</p>
        </div>
      </header>

      {sp.ok === "approved" ? (
        <p className="rounded-lg border-2 border-[#047857] bg-[#052e1c] px-3 py-2 font-mono text-xs text-[#6ee7b7]">
          Aprobado · puntos acreditados solo si correspondía.
        </p>
      ) : null}
      {sp.ok === "rejected" ? (
        <p className="rounded-lg border-2 border-[#b91c1c] bg-[#2a0f0f] px-3 py-2 font-mono text-xs text-[#fecaca]">
          Rechazado · sin puntos nuevos; clawback aplicado si había aprobación previa.
        </p>
      ) : null}

      <nav className="flex flex-wrap gap-2" aria-label="Filtro por tipo">
        {(
          [
            ["all", "Todos", counts.all],
            ["waste", "Residuos", counts.waste],
            ["place", "Acopio", counts.place],
            ["water", "Agua", counts.water],
          ] as const
        ).map(([key, label, n]) => {
          const active = kindFilter === key;
          const href = key === "all" ? "/admin/revision" : `/admin/revision?kind=${key}`;
          return (
            <Link
              key={key}
              href={href}
              className={`rounded-lg border-2 px-3 py-1.5 font-mono text-xs font-semibold shadow-[0_3px_0_#0a0f0c] transition ${
                active
                  ? "border-[#9dffc0] bg-[#142018] text-[#9dffc0]"
                  : "border-[#243d30] bg-[#0d1512] text-[#7aab8c] hover:border-[#35664a]"
              }`}
            >
              {label}
              <span className="ml-2 tabular-nums opacity-80">{n}</span>
            </Link>
          );
        })}
      </nav>

      <section className="rounded-xl border-4 border-[#1a2228] bg-[#111916] shadow-[0_10px_0_#0a0f0c]">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6a8c78]">
            No hay ítems pendientes en este filtro. ¡Cola limpia!
          </p>
        ) : (
          <ul className="divide-y divide-[#1f3328]">
            {items.map((item, idx) => {
              const meta = KIND_LABEL[item.kind] ?? {
                label: item.kind,
                tone: "border-[#35664a] text-[#8fd4a8]",
              };
              return (
                <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
                  <span className="device-lcd hidden h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold sm:flex">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                      <time className="font-mono text-[10px] text-[#5a8f72]">
                        {item.createdAt.toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-[#dff7ea]">
                      {item.employeeName}
                      <span className="ml-2 font-mono text-xs font-normal text-[#6a8c78]">
                        {item.employeeCedula}
                      </span>
                    </p>
                    <p className="truncate text-xs text-[#7aab8c]">{item.challengeTitle}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/usuarios/${item.employeeId}/actividad`}
                      className="rounded-lg border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-[10px] text-[#b8f0cc] hover:border-[#4a8060]"
                    >
                      Flujo
                    </Link>
                    <Link
                      href={item.href}
                      className="rounded-lg border-2 border-[#047857] bg-gradient-to-b from-[#5eead4] to-[#0e7490] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_3px_0_#164e63] hover:brightness-110"
                    >
                      Revisar
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center font-mono text-[10px] text-[#5a8f72]">
        Tip: desde cada revisión puedes abrir el flujo del empleado para ver su historial de puntos.
      </p>
    </div>
  );
}
