import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { Role } from "@/generated/prisma/enums";
import { listWaterTipsPublic } from "@/lib/services/herramientas/queries";
import { HerramientasNav } from "../HerramientasNav";

export default async function TipsAguaPage() {
  const employee = await requireEmployee("/tablero/herramientas/tips-agua");
  const tips = await listWaterTipsPublic();

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="game-panel-3d mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 rounded-2xl p-4 md:p-6">
        <HerramientasNav
          title="Tips de agua"
          subtitle="Buenas prácticas para cuidar el recurso hídrico en casa y en el trabajo."
        />

        {tips.length === 0 ? (
          <div className="space-y-3 text-sm leading-relaxed text-[#5b7cb8]">
            <p>Aún no hay consejos cargados para esta campaña.</p>
            {employee.role === Role.ADMIN ? (
              <p>
                Puedes añadirlos desde{" "}
                <Link href="/admin/herramientas-contenido" className="font-semibold text-[#2563eb] underline">
                  Administración → Herramientas (contenido)
                </Link>
                .
              </p>
            ) : (
              <p>Consulta más adelante o pregunta a tu equipo de sostenibilidad.</p>
            )}
          </div>
        ) : (
          <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-[#132238]">
            {tips.map((t) => (
              <li key={t.id} className="pl-1">
                <p className="whitespace-pre-wrap text-[#3d5670]">{t.body}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
