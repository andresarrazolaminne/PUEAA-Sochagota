import { getSiteLogoSettings } from "@/lib/services/settings/app-settings";
import { SiteLogoForm } from "./SiteLogoForm";

const ERR: Record<string, string> = {
  datos: "Revisa los campos del formulario.",
  logo: "La ruta del logo no es válida. Usa /archivo.png en public o una URL http(s).",
  upload: "No se pudo guardar el archivo. Inténtalo de nuevo.",
  upload_type: "Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.",
  upload_size: "El archivo supera el tamaño máximo (3 MB).",
};

export default async function AdminSitioPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const settings = await getSiteLogoSettings();
  const sp = await searchParams;
  const errKey = typeof sp.e === "string" ? sp.e : undefined;
  const errorMsg = errKey ? ERR[errKey] ?? "No se pudo guardar." : null;

  return (
    <div className="space-y-6">
      {sp.ok === "1" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Logo del sitio actualizado. La cabecera se actualizará al recargar las páginas.
        </p>
      ) : null}
      {errorMsg ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Logo del sitio web (corporativo)</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7aab8c]">
          Imagen de <strong className="text-[#c8e6d4]">Compañía Termoeléctrica de Sochagota</strong> que aparece en la barra
          superior de la aplicación. Es independiente del logo del carné PUEAA. Puedes subir un archivo (se guarda en
          el servidor) o usar una ruta en <span className="font-mono text-[#8fd4a8]">/public</span> o una URL pública.
        </p>

        <SiteLogoForm initialLogoSrc={settings.logoSrc} />
      </div>
    </div>
  );
}
