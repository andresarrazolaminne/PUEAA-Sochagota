import { getCarnetDisplaySettings } from "@/lib/services/settings/app-settings";
import { CarnetBrandingForm } from "./CarnetBrandingForm";

const ERR: Record<string, string> = {
  datos: "Revisa los campos del formulario.",
  logo: "La ruta del logo no es válida. Usa /archivo.png en public o una URL http(s).",
  caption: "La leyenda no es válida o es demasiado larga.",
  upload: "No se pudo guardar el archivo. Inténtalo de nuevo.",
  upload_type: "Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.",
  upload_size: "El archivo supera el tamaño máximo (3 MB).",
};

export default async function AdminCarnetPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; e?: string }>;
}) {
  const settings = await getCarnetDisplaySettings();
  const sp = await searchParams;
  const errKey = typeof sp.e === "string" ? sp.e : typeof sp.error === "string" ? sp.error : undefined;
  const errorMsg = errKey ? ERR[errKey] ?? "No se pudo guardar." : null;

  return (
    <div className="space-y-6">
      {sp.ok === "1" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Carné actualizado. Los jugadores verán el cambio al recargar el tablero.
        </p>
      ) : null}
      {errorMsg ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Logo y leyenda del carné</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7aab8c]">
          Sube un logo nuevo (se guarda en el servidor) o indica una ruta en{" "}
          <span className="font-mono text-[#8fd4a8]">/public</span> o una URL pública (http/https). La vista previa
          muestra el logo guardado o el archivo que vas a subir.
        </p>

        <CarnetBrandingForm initialLogoSrc={settings.logoSrc} initialCaption={settings.caption} />
      </div>
    </div>
  );
}
