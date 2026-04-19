import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <h1 className="text-lg font-semibold text-[#e8f5ee]">Bienvenido al panel</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7aab8c]">
        Gestiona empleados pre-registrados y consulta los puntajes acumulados en el ledger (fuente de verdad de puntos).
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/carnet"
          className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Branding</p>
          <p className="mt-2 text-sm font-medium text-[#dff7ea]">Carné</p>
          <p className="mt-1 text-xs text-[#6a8c78]">Logo de campaña y leyenda en el tablero.</p>
        </Link>
        <Link
          href="/admin/sitio"
          className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Branding</p>
          <p className="mt-2 text-sm font-medium text-[#dff7ea]">Logo del sitio (corporativo)</p>
          <p className="mt-1 text-xs text-[#6a8c78]">Cabecera de la app: Compañía Termoeléctrica de Sochagota.</p>
        </Link>
        <Link
          href="/admin/usuarios"
          className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Empleados</p>
          <p className="mt-2 text-sm font-medium text-[#dff7ea]">Usuarios</p>
          <p className="mt-1 text-xs text-[#6a8c78]">Alta, edición, rol y estado activo.</p>
        </Link>
        <Link
          href="/admin/retos"
          className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Retos</p>
          <p className="mt-2 text-sm font-medium text-[#dff7ea]">Activos / histórico</p>
          <p className="mt-1 text-xs text-[#6a8c78]">Activo, en plataforma o solo importación.</p>
        </Link>
        <Link
          href="/admin/puntajes"
          className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Puntuación</p>
          <p className="mt-2 text-sm font-medium text-[#dff7ea]">Puntajes</p>
          <p className="mt-1 text-xs text-[#6a8c78]">Totales por empleado y detalle del ledger.</p>
        </Link>
        <Link
          href="/admin/importaciones"
          className="rounded-md border border-[#243d30] bg-[#0d1512] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] transition hover:border-[#35664a]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Excel</p>
          <p className="mt-2 text-sm font-medium text-[#dff7ea]">Importar datos</p>
          <p className="mt-1 text-xs text-[#6a8c78]">Usuarios, retos y puntajes por reto.</p>
        </Link>
      </div>
    </div>
  );
}
