import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { SETTING_UI_THEME_JSON } from "@/lib/services/settings/campaign-branding-bundle";
import { clearLocalUiThemeAction, importBrandingBundleAction, saveLocalUiThemeAction } from "./actions";

function formatThemeInitial(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default async function AdminBrandingSyncPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  await requireAdmin("/admin/branding-sync");
  const sp = await searchParams;
  const themeRow = await prisma.appSetting.findUnique({ where: { key: SETTING_UI_THEME_JSON } });
  const themeInitial = formatThemeInitial(themeRow?.value);

  return (
    <div className="space-y-6">
      {sp.ok === "1" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Paquete de marca importado. Recarga el tablero para ver logos y colores.
        </p>
      ) : null}
      {sp.ok === "theme" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Paleta guardada en esta campaña. Aparecerá en las exportaciones y en el tablero.
        </p>
      ) : null}
      {sp.ok === "theme_reset" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Paleta personalizada eliminada; se usan los colores por defecto del código.
        </p>
      ) : null}
      {typeof sp.e === "string" && sp.e ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          {sp.e === "json"
            ? "No se recibió texto JSON."
            : sp.e === "vacio"
              ? "Pega el contenido del archivo exportado."
              : sp.e === "tjson"
                ? "Falta el JSON de la paleta."
                : sp.e === "tparse"
                  ? "El JSON de la paleta no es válido."
                  : decodeURIComponent(sp.e)}
        </p>
      ) : null}

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Copiar marca entre campañas</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7aab8c]">
          Descarga un paquete JSON desde la instancia de origen (otra campaña o entorno) e impórtalo aquí. Se copian{" "}
          <strong className="text-[#c8e6d4]">logos</strong> (carné y sitio), la{" "}
          <strong className="text-[#c8e6d4]">leyenda del carné</strong> y, si la campaña origen guardó una paleta
          personalizada, las <strong className="text-[#c8e6d4]">variables de color</strong> del tablero.{" "}
          <strong className="text-[#c8e6d4]">No</strong> se incluyen rangos ni imágenes de entorno por segmento (
          <Link href="/admin/rangos" className="text-[#8fd4a8] underline hover:no-underline">
            Rangos
          </Link>
          ).
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[#5a8068]">
          Si los logos apuntan a rutas como <span className="font-mono text-[#8fd4a8]">/api/carnet-upload/…</span>, en
          destino debes tener el mismo archivo subido o ajustar la ruta tras importar. Las rutas en{" "}
          <span className="font-mono">/public</span> deben existir en el servidor destino.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/api/admin/branding/bundle"
            className="inline-flex rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
          >
            Descargar paquete de esta campaña
          </a>
          <Link
            href="/admin/carnet"
            className="inline-flex rounded-md border-2 border-[#1e3a5f] bg-[#e0f2fe] px-4 py-2 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] hover:brightness-105"
          >
            Editar carné
          </Link>
          <Link
            href="/admin/sitio"
            className="inline-flex rounded-md border-2 border-[#1e3a5f] bg-[#e0f2fe] px-4 py-2 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] hover:brightness-105"
          >
            Logo del sitio
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="text-base font-semibold text-[#e8f5ee]">Importar paquete</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#7aab8c]">
          Pega el contenido del archivo <span className="font-mono text-[#8fd4a8]">.json</span> exportado en la otra
          instancia.
        </p>
        <form action={importBrandingBundleAction} className="mt-4 flex max-w-3xl flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">JSON del paquete</span>
            <textarea
              name="bundleJson"
              required
              rows={14}
              spellCheck={false}
              className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-xs text-[#e8f5ee] outline-none focus:border-[#35664a]"
              placeholder='{"pueaaBrandingBundle":1,...}'
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
          >
            Aplicar a esta campaña
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="text-base font-semibold text-[#e8f5ee]">Paleta de esta campaña (opcional)</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7aab8c]">
          Si personalizas colores aquí, se guardan en la base de datos y se incluyen al{" "}
          <strong className="text-[#c8e6d4]">descargar el paquete</strong>. Puedes pegar solo las variables que cambien
          (p. ej. <span className="font-mono text-[#8fd4a8]">--game-accent</span>,{" "}
          <span className="font-mono text-[#8fd4a8]">--game-border</span>). Deja vacío y guarda para volver a los valores
          del código.
        </p>
        <div className="mt-4 flex max-w-3xl flex-col gap-3">
          <form action={saveLocalUiThemeAction} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                Objeto JSON (variables CSS del tablero)
              </span>
              <textarea
                name="themeJson"
                rows={10}
                spellCheck={false}
                defaultValue={themeInitial}
                placeholder={'{\n  "--game-accent": "#2563eb",\n  "--game-border": "#1e3a5f"\n}'}
                className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-xs text-[#e8f5ee] outline-none focus:border-[#35664a]"
              />
            </label>
            <button
              type="submit"
              className="w-fit rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
            >
              Guardar paleta
            </button>
          </form>
          <form action={clearLocalUiThemeAction}>
            <button
              type="submit"
              className="rounded-md border-2 border-[#7f1d1d] bg-[#fee2e2] px-4 py-2 font-mono text-xs font-semibold text-[#991b1b] shadow-[0_3px_0_#7f1d1d] hover:brightness-105"
            >
              Quitar paleta personalizada
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
