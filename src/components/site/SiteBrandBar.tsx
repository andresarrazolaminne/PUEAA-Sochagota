import Link from "next/link";
import Image from "next/image";
import { withBasePathIfNeeded } from "@/lib/base-path";
import { getSiteLogoSettings } from "@/lib/services/settings/app-settings";

export async function SiteBrandBar() {
  const { logoSrc } = await getSiteLogoSettings();
  const useNext = logoSrc.startsWith("/") && !logoSrc.startsWith("/api/");

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[#1e3a5f] bg-[#f0f6fc]/95 shadow-[0_4px_0_#1e3a5f] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-3 transition hover:brightness-105"
          aria-label="Inicio · PUEAA Sochagota"
        >
          <span className="relative flex h-9 w-auto max-w-[min(100%,220px)] shrink-0 items-center sm:h-10">
            {useNext ? (
              <Image
                src={logoSrc}
                alt="Compañía Termoeléctrica de Sochagota"
                width={220}
                height={48}
                className="h-9 w-auto max-h-9 object-contain object-left sm:h-10 sm:max-h-10"
                priority
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- rutas /api/ y URLs externas
              <img
                src={withBasePathIfNeeded(logoSrc)}
                alt="Compañía Termoeléctrica de Sochagota"
                className="h-9 w-auto max-h-9 max-w-[220px] object-contain object-left sm:h-10 sm:max-h-10"
              />
            )}
          </span>
          <span className="hidden min-w-0 flex-col border-l-4 border-[#1e3a5f] pl-3 sm:flex">
            <span className="font-pixel truncate text-[10px] uppercase tracking-[0.12em] text-[#2563eb]">PUEAA</span>
            <span className="truncate text-xs font-semibold text-[#3d5670]">Uso eficiente del agua</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
