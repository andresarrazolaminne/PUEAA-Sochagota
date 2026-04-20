"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath, withBasePathIfNeeded } from "@/lib/base-path";
import { saveSiteLogoBrandingAction } from "./actions";

type Props = {
  initialLogoSrc: string;
};

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const useNext = src.startsWith("/") && !src.startsWith("/api/");
  const className =
    "max-h-24 w-auto max-w-full rounded border border-[#243d30] bg-[#0d1512] object-contain p-3 sm:max-h-28";

  if (useNext) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- mismo criterio que SiteBrandBar
      <img src={withBasePath(src)} alt={alt} className={className} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- rutas /api/ y http(s)
    <img src={withBasePathIfNeeded(src)} alt={alt} className={className} />
  );
}

export function SiteLogoForm({ initialLogoSrc }: Props) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (f) {
      setFilePreview(URL.createObjectURL(f));
    }
  }

  function clearFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  }

  const displaySrc = filePreview ?? initialLogoSrc;

  return (
    <form action={saveSiteLogoBrandingAction} className="mt-6 flex max-w-xl flex-col gap-4">
      <div className="rounded-md border border-[#243d30] bg-[#0a100d] p-4">
        <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Vista previa</p>
        <div className="mt-3 flex min-h-[100px] items-center justify-center bg-[#0b1210]/80">
          <PreviewImage src={displaySrc} alt="Logo del sitio (corporativo)" />
        </div>
        {filePreview ? (
          <p className="mt-2 text-xs text-[#7aab8c]">
            Vista previa del archivo seleccionado. Quita el archivo para volver al logo guardado.
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#7aab8c]">
            Se muestra en la cabecera de todas las páginas (junto al acceso PUEAA).
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] text-[#6a9c80]">Subir nuevo logo</span>
        <input
          ref={fileInputRef}
          type="file"
          name="logoFile"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={onFileChange}
          className="text-sm text-[#e8f5ee] file:mr-3 file:rounded file:border-0 file:bg-[#1e4d35] file:px-3 file:py-1.5 file:font-mono file:text-sm file:text-[#e8f5ee]"
        />
        <span className="text-xs text-[#5a8068]">PNG, JPEG, WebP, GIF o SVG. Máx. 3 MB.</span>
      </label>

      {filePreview ? (
        <button
          type="button"
          onClick={clearFile}
          className="w-fit rounded border border-[#4a3535] bg-[#1a1212] px-3 py-1.5 font-mono text-xs text-[#e8c4c4] hover:bg-[#251818]"
        >
          Quitar archivo seleccionado
        </button>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] text-[#6a9c80]">Ruta, URL o logo actual (si no subes archivo)</span>
        <input
          name="logoPath"
          required={!filePreview}
          defaultValue={initialLogoSrc}
          disabled={!!filePreview}
          className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a] disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="/logo-ces.png"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2.5 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
      >
        Guardar logo del sitio
      </button>
    </form>
  );
}
