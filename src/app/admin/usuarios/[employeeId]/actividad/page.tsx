import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getEmployeeActivityTimeline,
  getEmployeeHeader,
} from "@/lib/services/admin/employee-activity";
import { getTotalPointsForEmployee } from "@/lib/services/points/ledger";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";

const KIND: Record<string, string> = {
  waste: "Residuos",
  place: "Acopio",
  water: "Agua",
  ledger: "Puntos",
  trivia: "Trivia",
};

export default async function AdminEmployeeActivityPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  await requireAdmin(`/admin/usuarios/${employeeId}/actividad`);

  const employee = await getEmployeeHeader(employeeId);
  if (!employee) notFound();

  const [timeline, points] = await Promise.all([
    getEmployeeActivityTimeline(employeeId),
    getTotalPointsForEmployee(employeeId),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/usuarios"
            className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:underline"
          >
            ← Usuarios
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-[#e8f5ee]">{employee.fullName}</h1>
          <p className="mt-1 font-mono text-xs text-[#6a8c78]">
            Cédula {employee.cedula} · {employee.role}
            {employee.active ? "" : " · inactivo"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="device-lcd rounded-md px-3 py-2 text-sm font-semibold tracking-wide">
            {points} PTS
          </span>
          <Link
            href={`/admin/usuarios/${employeeId}`}
            className="rounded-lg border-2 border-[#1e3a5f] bg-[#e0f2fe] px-3 py-2 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f]"
          >
            Editar ficha
          </Link>
          <Link
            href={`/admin/puntajes/${employeeId}`}
            className="game-btn-ghost rounded-lg px-3 py-2 font-mono text-xs font-semibold"
          >
            Ledger
          </Link>
        </div>
      </div>

      <section className="rounded-xl border-4 border-[#1a2228] bg-[#111916] p-5 shadow-[0_8px_0_#0a0f0c]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a9c80]">
            Flujo del participante
          </h2>
          <span className="font-mono text-[10px] text-[#5a8f72]">{timeline.length} eventos</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-[#7aab8c]">
          Cronología de envíos, revisiones y movimientos de puntos. Úsala para entender por qué un
          empleado tiene (o no) puntos tras un rechazo.
        </p>

        {timeline.length === 0 ? (
          <p className="mt-6 text-sm text-[#6a8c78]">Sin actividad registrada.</p>
        ) : (
          <ol className="relative mt-6 space-y-0 border-l-2 border-[#243d30] pl-5">
            {timeline.map((item) => (
              <li key={item.id} className="relative pb-5">
                <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#9dffc0] bg-[#0d1512]" />
                <div className="rounded-lg border border-[#1f3328] bg-[#0d1512] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded border border-[#35664a] bg-[#142018] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#9dffc0]">
                      {KIND[item.kind] ?? item.kind}
                    </span>
                    {item.status ? (
                      <span className="font-mono text-[10px] uppercase text-[#8fd4a8]">{item.status}</span>
                    ) : null}
                    {typeof item.pointsDelta === "number" ? (
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          item.pointsDelta >= 0 ? "text-[#9dffc0]" : "text-[#f0b4b4]"
                        }`}
                      >
                        {item.pointsDelta >= 0 ? "+" : ""}
                        {item.pointsDelta} pts
                      </span>
                    ) : null}
                    <time className="ml-auto font-mono text-[10px] text-[#5a8f72]">
                      {item.at.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </time>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#dff7ea]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#7aab8c]">{item.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {item.href ? (
                      <Link href={item.href} className="font-mono text-[10px] text-[#8fd4a8] underline">
                        Abrir revisión
                      </Link>
                    ) : null}
                    {item.evidenceSrc ? (
                      <PhotoModalTrigger
                        imageSrc={item.evidenceSrc}
                        className="font-mono text-[10px] text-[#8fd4a8] underline"
                        imageAlt="Evidencia"
                      >
                        Ver foto
                      </PhotoModalTrigger>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
