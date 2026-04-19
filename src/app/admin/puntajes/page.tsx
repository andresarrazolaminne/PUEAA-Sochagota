import Link from "next/link";
import { listEmployeesWithPoints } from "@/lib/services/admin/employees";

export default async function AdminPuntajesPage() {
  const rows = await listEmployeesWithPoints();
  const sorted = [...rows].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
        Puntajes totales (ledger)
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[#7aab8c]">
        Suma de movimientos en <span className="font-mono text-[#8fd4a8]">PointLedger</span> por empleado.
        Orden descendente por puntos. Puedes cargar puntos por reto desde{" "}
        <Link href="/admin/importaciones" className="text-[#8fd4a8] underline-offset-2 hover:underline">
          Importar Excel
        </Link>
        .
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Empleado</th>
              <th className="py-2 pr-3">Cédula</th>
              <th className="py-2 pr-3 text-right">Puntos</th>
              <th className="py-2 pr-0" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                <td className="py-2.5 pr-3 font-mono text-xs text-[#4d7a62]">{i + 1}</td>
                <td className="py-2.5 pr-3">{r.fullName}</td>
                <td className="py-2.5 pr-3 font-mono text-xs">{r.cedula}</td>
                <td className="py-2.5 pr-3 text-right font-mono text-[#8fd4a8]">{r.totalPoints}</td>
                <td className="py-2.5 text-right">
                  <Link
                    href={`/admin/puntajes/${r.id}`}
                    className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
                  >
                    Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
