import Link from "next/link";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { loginWithCedula } from "./actions";

const ERRORS: Record<string, string> = {
  invalido: "Ingresa un número de cédula válido.",
  no_registrado: "Cédula no registrada o cuenta inactiva. Contacta a administración.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; salida?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeInternalPath(
    typeof sp.next === "string" ? sp.next : undefined,
    "/tablero",
  );

  const existing = await getCurrentEmployee();
  if (existing) {
    redirect(next);
  }

  const errKey = typeof sp.error === "string" ? sp.error : undefined;
  const errorMsg = errKey ? ERRORS[errKey] ?? "No se pudo iniciar sesión." : null;
  const salida = sp.salida === "1";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 text-[#132238]">
      <div className="game-panel-3d w-full max-w-md rounded-2xl p-6 md:p-8">
        <p className="font-pixel text-[10px] uppercase tracking-[0.15em] text-[#2563eb]">Acceso empleados</p>
        <h1 className="mt-2 font-pixel text-xl text-[#132238]">Iniciar sesión</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#3d5670]">
          Solo tu número de cédula. Debes estar pre-registrado en el sistema.
        </p>

        {salida ? (
          <p className="mt-4 rounded-lg border-2 border-[#0d9488] bg-[#ccfbf1] px-3 py-2 font-mono text-xs text-[#0f766e]">
            Sesión cerrada correctamente.
          </p>
        ) : null}

        {errorMsg ? (
          <p
            className="mt-4 rounded-lg border-2 border-[#b91c1c] bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]"
            role="alert"
          >
            {errorMsg}
          </p>
        ) : null}

        <form action={loginWithCedula} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#3d5670]">Cédula</span>
            <input
              name="cedula"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              required
              placeholder="Ej. 1234567890"
              className="rounded-lg border-2 border-[#1e3a5f] bg-white px-3 py-2.5 font-mono text-[#132238] shadow-[inset_0_2px_4px_rgba(30,58,95,0.08)] outline-none placeholder:text-[#6b8cb8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30"
            />
          </label>
          <button type="submit" className="game-btn-primary rounded-xl px-4 py-3 text-sm font-bold">
            Entrar al tablero
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="font-mono text-xs font-medium text-[#2563eb] underline-offset-4 hover:underline"
          >
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
