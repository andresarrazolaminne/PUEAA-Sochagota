import { requireEmployee } from "@/lib/auth/require-employee";
import { HerramientasNav } from "../HerramientasNav";
import { CronometroDuchaClient } from "./CronometroDuchaClient";

export default async function CronometroDuchaPage() {
  await requireEmployee("/tablero/herramientas/cronometro-ducha");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="game-panel-3d mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 rounded-2xl p-4 md:p-6">
        <HerramientasNav
          title="Cronómetro de ducha"
          subtitle="Controla la duración de tu ducha para ahorrar agua y energía."
        />
        <CronometroDuchaClient />
      </div>
    </div>
  );
}
