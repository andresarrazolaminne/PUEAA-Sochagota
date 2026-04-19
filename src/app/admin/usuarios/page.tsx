import Link from "next/link";
import { listEmployeesWithPoints } from "@/lib/services/admin/employees";
import { Role } from "@/generated/prisma/enums";
import { createEmployeeAction } from "./actions";

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const rows = await listEmployeesWithPoints();
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      {sp.ok === "1" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Empleado creado correctamente.
        </p>
      ) : null}
      {sp.error === "datos" ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          Revisa cédula y nombre completo.
        </p>
      ) : null}
      {sp.error === "duplicado" ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          Ya existe un empleado con esa cédula.
        </p>
      ) : null}

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Empleados registrados
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                <th className="py-2 pr-3">Cédula</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 text-right">Puntos</th>
                <th className="py-2 pr-0" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                  <td className="py-2.5 pr-3 font-mono text-xs">{r.cedula}</td>
                  <td className="py-2.5 pr-3">{r.fullName}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">
                    {r.role === Role.ADMIN ? "ADMIN" : "USER"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{r.active ? "Activo" : "Inactivo"}</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-xs text-[#8fd4a8]">
                    {r.totalPoints}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/admin/usuarios/${r.id}`}
                      className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Crear empleado
        </h2>
        <form action={createEmployeeAction} className="mt-4 flex max-w-xl flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">Cédula</span>
            <input
              name="cedula"
              required
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
              placeholder="Solo números"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">Nombre completo</span>
            <input
              name="fullName"
              required
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">Rol</span>
            <select
              name="role"
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <button
            type="submit"
            className="w-fit rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2.5 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
          >
            Registrar
          </button>
        </form>
      </section>
    </div>
  );
}
