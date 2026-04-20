import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

const nav = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/retos", label: "Retos" },
  { href: "/admin/puntajes", label: "Puntajes" },
  { href: "/admin/rangos", label: "Rangos" },
  { href: "/admin/importaciones", label: "Importar" },
  { href: "/admin/carnet", label: "Carné" },
  { href: "/admin/sitio", label: "Logo sitio" },
  { href: "/admin/herramientas-contenido", label: "Herramientas" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
        <header className="game-panel-3d flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
          <div>
            <p className="font-pixel text-[10px] uppercase tracking-[0.12em] text-[#2563eb]">
              PUEAA · Administración
            </p>
            <p className="text-sm font-bold text-[#132238]">Panel de control</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border-2 border-[#1e3a5f] bg-[#e0f2fe] px-3 py-1.5 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
              >
                {item.label}
              </Link>
            ))}
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
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
