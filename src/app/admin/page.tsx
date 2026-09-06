import Link from "next/link";
import { getUnifiedPendingReviewInbox } from "@/lib/services/challenges/queries";

export default async function AdminHomePage() {
  const inbox = await getUnifiedPendingReviewInbox();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border-4 border-[#1a2228] bg-[#111916] shadow-[0_10px_0_#0a0f0c]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f3328] bg-[#0d1512] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a8f72]">Operaciones</p>
            <h1 className="mt-1 text-xl font-bold text-[#e8f5ee]">Centro de administración</h1>
          </div>
          <div className="device-lcd rounded-md px-4 py-2 text-center">
            <p className="text-[9px] uppercase tracking-widest opacity-70">Cola</p>
            <p className="text-2xl font-bold tabular-nums">{inbox.total}</p>
          </div>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          <Link
            href="/admin/revision"
            className="group flex flex-col gap-2 border-b border-[#1f3328] p-6 transition hover:bg-[#0d1512] md:border-b-0 md:border-r"
          >
            <span className="inline-flex w-fit rounded border-2 border-[#0e7490] bg-gradient-to-b from-[#5eead4] to-[#0e7490] px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
              Primario
            </span>
            <p className="text-lg font-semibold text-[#dff7ea] group-hover:text-white">Cola de revisión</p>
            <p className="text-sm leading-relaxed text-[#7aab8c]">
              Aprueba o rechaza residuos, acopio y recibos. Los rechazos no acreditan puntos; deshacer una
              aprobación recupera el ledger.
            </p>
            <span className="mt-auto font-mono text-[11px] text-[#9dffc0]">Abrir estación →</span>
          </Link>
          <div className="grid grid-cols-2 gap-0">
            {(
              [
                ["/admin/usuarios", "Usuarios", "Roles y flujo por persona"],
                ["/admin/retos", "Retos", "Configuración y pendientes"],
                ["/admin/puntajes", "Puntajes", "Totales y ledger"],
                ["/admin/reportes", "Reportes", "Participación Excel"],
              ] as const
            ).map(([href, title, desc]) => (
              <Link
                key={href}
                href={href}
                className="border-b border-r border-[#1f3328] p-4 transition hover:bg-[#0d1512] last:border-b-0 odd:border-r"
              >
                <p className="text-sm font-semibold text-[#dff7ea]">{title}</p>
                <p className="mt-1 text-xs text-[#6a8c78]">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {inbox.items.length > 0 ? (
        <section className="rounded-xl border border-[#1f3328] bg-[#111916] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#6a9c80]">Próximos en cola</h2>
            <Link href="/admin/revision" className="font-mono text-[10px] text-[#8fd4a8] underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-[#1f3328] rounded-lg border border-[#1f3328]">
            {inbox.items.slice(0, 5).map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-[#0d1512]"
                >
                  <span className="truncate text-[#dff7ea]">
                    {item.employeeName}
                    <span className="ml-2 font-mono text-[10px] text-[#6a8c78]">{item.challengeTitle}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-[#9dffc0]">Revisar</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-lg border border-[#1f3328] bg-[#111916] px-4 py-6 text-center text-sm text-[#6a8c78]">
          No hay pendientes. La cola está limpia.
        </p>
      )}

      <section className="rounded-xl border border-[#1f3328] bg-[#111916] p-5">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#6a9c80]">Configuración</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["/admin/rangos", "Rangos"],
              ["/admin/importaciones", "Importar"],
              ["/admin/carnet", "Carné"],
              ["/admin/sitio", "Logo sitio"],
              ["/admin/branding-sync", "Marca"],
              ["/admin/herramientas-contenido", "CMS herramientas"],
            ] as const
          ).map(([href, title]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-[#243d30] bg-[#0d1512] px-4 py-3 text-sm text-[#c8e6d4] transition hover:border-[#35664a]"
            >
              {title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
