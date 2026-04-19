import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/services/admin/employees";
import { Role } from "@/generated/prisma/enums";
import { updateEmployeeAction } from "../actions";

export default async function AdminUsuarioDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { employeeId } = await params;
  const employee = await getEmployeeById(employeeId);
  if (!employee) notFound();

  const sp = await searchParams;

  const updateWithId = updateEmployeeAction.bind(null, employeeId);

  return (
    <div className="space-y-6">
      {sp.ok === "1" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Cambios guardados.
        </p>
      ) : null}
      {sp.error === "datos" ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          Revisa el nombre completo.
        </p>
      ) : null}

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">Empleado</p>
        <p className="mt-1 font-mono text-xs text-[#6a8c78]">Cédula · {employee.cedula} (no editable)</p>

        <form action={updateWithId} className="mt-6 flex max-w-xl flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">Nombre completo</span>
            <input
              name="fullName"
              required
              defaultValue={employee.fullName}
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">Rol</span>
            <select
              name="role"
              defaultValue={employee.role}
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">Estado</span>
            <select
              name="active"
              defaultValue={employee.active ? "true" : "false"}
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-[#6a9c80]">URL foto (opcional)</span>
            <input
              name="photoUrl"
              type="url"
              defaultValue={employee.photoUrl ?? ""}
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
              placeholder="https://…"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2.5 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
            >
              Guardar
            </button>
            <Link
              href="/admin/usuarios"
              className="rounded-md border border-[#243d30] px-4 py-2.5 font-mono text-sm text-[#7aab8c] hover:border-[#35664a] hover:text-[#c8e6d4]"
            >
              Volver al listado
            </Link>
            <Link
              href={`/admin/puntajes/${employee.id}`}
              className="rounded-md border border-[#243d30] px-4 py-2.5 font-mono text-sm text-[#8fd4a8] hover:border-[#35664a]"
            >
              Ver puntajes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
