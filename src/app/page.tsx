import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-employee";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ salida?: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (employee) {
    redirect("/tablero");
  }

  const sp = await searchParams;
  const salida = sp.salida === "1";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-[#132238]">
      <div className="game-panel-3d w-full max-w-lg rounded-2xl px-8 py-10 text-center md:px-12 md:py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3d5670]">
          Compañía Termoeléctrica de Sochagota
        </p>
        <h1 className="font-pixel mt-4 text-3xl tracking-tight text-[#2563eb] md:text-4xl">PUEAA</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#3d5670] md:text-base">
          Programa de Uso Eficiente y Ahorro de Agua. Gamificación para un consumo responsable en planta y en casa.
        </p>

        {salida ? (
          <p className="mx-auto mt-6 max-w-md rounded-lg border-2 border-[#0d9488] bg-[#ccfbf1] px-4 py-3 font-mono text-sm text-[#0f766e]">
            Sesión cerrada correctamente.
          </p>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="game-btn-primary inline-flex min-w-[200px] items-center justify-center rounded-xl px-8 py-3.5 text-sm font-bold"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/api/health"
            className="game-btn-ghost inline-flex min-w-[160px] items-center justify-center rounded-xl px-5 py-3 font-mono text-xs font-semibold transition active:translate-y-px"
          >
            Estado del sistema
          </Link>
        </div>

        <p className="mt-10 font-mono text-[10px] text-[#5b7cb8]">
          Acceso restringido a empleados registrados · Solo cédula
        </p>
      </div>
    </div>
  );
}
