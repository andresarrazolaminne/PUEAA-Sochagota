import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ChallengeFormWizard } from "../ChallengeFormWizard";

export default async function AdminNuevoRetoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin("/admin/retos/nuevo");
  const sp = await searchParams;
  const rawError = typeof sp.error === "string" ? sp.error : undefined;
  const errorMessage = rawError ? decodeURIComponent(rawError.replace(/\+/g, " ")) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Link
          href="/admin/retos"
          className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
        >
          Volver a retos
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-[#e8f5ee]">Crear reto (asistente)</h1>
        <p className="mt-2 max-w-xl text-sm text-[#7aab8c]">
          Completa los pasos. Sigue disponible la{" "}
          <Link href="/admin/importaciones" className="text-[#8fd4a8] underline-offset-2 hover:underline">
            importación Excel
          </Link>{" "}
          si prefieres cargar muchos retos a la vez.
        </p>
        {errorMessage ? (
          <p
            className="mt-4 rounded border border-[#6a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <ChallengeFormWizard mode="create" />
      </div>
    </div>
  );
}
