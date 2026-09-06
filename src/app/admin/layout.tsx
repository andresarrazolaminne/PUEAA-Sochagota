import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getUnifiedPendingReviewInbox } from "@/lib/services/challenges/queries";

const primaryNav = [
  { href: "/admin/revision", label: "Cola", accent: true },
  { href: "/admin/retos", label: "Retos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/puntajes", label: "Puntajes" },
] as const;

const secondaryNav = [
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/rangos", label: "Rangos" },
  { href: "/admin/importaciones", label: "Importar" },
  { href: "/admin/carnet", label: "Carné" },
  { href: "/admin/sitio", label: "Logo" },
  { href: "/admin/branding-sync", label: "Marca" },
  { href: "/admin/herramientas-contenido", label: "CMS" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  const inbox = await getUnifiedPendingReviewInbox();

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
        <header className="game-panel-3d flex flex-col gap-3 rounded-xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-pixel text-[10px] uppercase tracking-[0.12em] text-[#2563eb]">
                PUEAA · Administración
              </p>
              <p className="text-sm font-bold text-[#132238]">Panel de control</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/revision"
                className="device-lcd rounded-md px-3 py-1.5 text-xs font-bold tracking-wide"
              >
                COLA {inbox.total}
              </Link>
              <Link
                href="/tablero"
                className="game-btn-ghost rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition active:translate-y-px"
              >
                Tablero
              </Link>
              <Link
                href="/logout"
                prefetch={false}
                className="rounded-lg border-2 border-[#7f1d1d] bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-semibold text-[#991b1b] shadow-[0_3px_0_#7f1d1d] transition hover:brightness-105 active:translate-y-px"
              >
                Salir
              </Link>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 border-t-2 border-[#1a2228]/25 pt-3" aria-label="Principal">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "accent" in item && item.accent
                    ? "rounded-lg border-2 border-[#0e7490] bg-gradient-to-b from-[#5eead4] to-[#0e7490] px-3 py-1.5 font-mono text-xs font-bold text-white shadow-[0_3px_0_#164e63]"
                    : "rounded-lg border-2 border-[#1e3a5f] bg-[#e0f2fe] px-3 py-1.5 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
                }
              >
                {item.label}
              </Link>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-[#1a2228]/30 sm:inline-block" aria-hidden />
            {secondaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-[#94a3b8] bg-white/70 px-2.5 py-1 font-mono text-[11px] font-medium text-[#334155] transition hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-md border border-[#94a3b8] bg-white/70 px-2.5 py-1 font-mono text-[11px] font-medium text-[#334155] transition hover:bg-white"
            >
              Inicio
            </Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
