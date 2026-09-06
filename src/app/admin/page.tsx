import Link from "next/link";
import { getUnifiedPendingReviewInbox } from "@/lib/services/challenges/queries";

const KIND_LABEL: Record<string, string> = {
  waste: "Residuos",
  place: "Lugar / acopio",
  water: "Recibo de agua",
};

export default async function AdminHomePage() {
  const inbox = await getUnifiedPendingReviewInbox();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[#e8f5ee]">Cola de auditoría</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7aab8c]">
              Evidencias y declaraciones pendientes. Un clic lleva al panel de revisión del reto.
            </p>
          </div>
          <span className="rounded border border-[#35664a] bg-[#0d1512] px-3 py-1 font-mono text-sm text-[#9dffc0]">
            {inbox.total} pendiente{inbox.total === 1 ? "" : "s"}
          </span>
        </div>

        {inbox.items.length === 0 ? (
          <p className="mt-6 text-sm text-[#6a8c78]">No hay ítems pendientes de revisión.</p>
        ) : (
          <ul className="mt-6 divide-y divide-[#1f3328] rounded-md border border-[#1f3328]">
            {inbox.items.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-[#0d1512]"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">
                      {KIND_LABEL[item.kind] ?? item.kind}
                    </p>
                    <p className="truncate text-sm font-medium text-[#dff7ea]">
                      {item.employeeName} · {item.employeeCedula}
                    </p>
                    <p className="truncate text-xs text-[#6a8c78]">{item.challengeTitle}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-[#9dffc0]">Revisar →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="text-base font-semibold text-[#e8f5ee]">Módulos</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7aab8c]">
          Gestiona empleados, retos, branding y el ledger de puntos.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["/admin/carnet", "Branding", "Carné", "Logo de campaña y leyenda en el tablero."],
              ["/admin/sitio", "Branding", "Logo del sitio", "Cabecera corporativa."],
              ["/admin/branding-sync", "Branding", "Copiar marca", "Exportar/importar logos y colores."],
              ["/admin/usuarios", "Empleados", "Usuarios", "Alta, edición, rol y estado activo."],
              ["/admin/retos", "Retos", "Activos / histórico", "Activo, en plataforma o solo importación."],
              ["/admin/puntajes", "Puntuación", "Puntajes", "Totales por empleado y detalle del ledger."],
              ["/admin/rangos", "Campaña", "Rangos e imagen", "Umbrales y visor del tablero."],
              ["/admin/importaciones", "Excel", "Importar datos", "Usuarios, retos y puntajes."],
              ["/admin/reportes", "Reportes", "Participación", "Exportes y seguimiento."],
              ["/admin/herramientas-contenido", "CMS", "Herramientas", "Tips, contacto y directorio."],
            ] as const
          ).map(([href, eyebrow, title, desc]) => (
            <Link
              key={href}
              href={href}
              className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">{eyebrow}</p>
              <p className="mt-2 text-sm font-medium text-[#dff7ea]">{title}</p>
              <p className="mt-1 text-xs text-[#6a8c78]">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
