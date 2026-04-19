import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import type { AcopioCategory } from "@/generated/prisma/enums";
import { listDirectoryPlacesPublic } from "@/lib/services/herramientas/queries";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import {
  ACOPIO_CATEGORY_ORDER,
  acopioCategoryLabel,
  isAcopioCategory,
} from "@/lib/herramientas/acopio-categories";
import { HerramientasNav } from "../HerramientasNav";

function parseCategoryParams(raw: string | string[] | undefined): AcopioCategory[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((x): x is AcopioCategory => typeof x === "string" && isAcopioCategory(x));
}

export default async function DirectorioAcopioPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string | string[] }>;
}) {
  await requireEmployee("/tablero/herramientas/directorio");
  const sp = await searchParams;
  const filterCats = parseCategoryParams(sp.c);
  const hasActiveFilter = filterCats.length > 0;

  const places = await listDirectoryPlacesPublic(
    hasActiveFilter ? { categoriesOr: filterCats } : undefined,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="game-panel-3d mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 rounded-2xl p-4 md:p-6">
        <HerramientasNav
          title="Directorio de acopio"
          subtitle="Puntos de entrega y lugares de acopio publicados por la campaña. Filtra por tipo de residuo."
        />

        <section className="rounded-xl border-4 border-[#1e3a5f] bg-gradient-to-b from-[#f8fafc] to-[#e2ecf6] p-4 shadow-[0_4px_0_#1e3a5f]">
          <h2 className="font-pixel text-[10px] font-normal uppercase tracking-widest text-[#2563eb]">
            Filtrar por categoría
          </h2>
          <p className="mt-1 text-xs text-[#5b7cb8]">
            Se muestran puntos que aceptan <strong className="text-[#132238]">al menos una</strong> de las
            categorías seleccionadas.
          </p>
          <form method="get" className="mt-3 space-y-3">
            <div className="max-h-40 overflow-y-auto rounded-lg border-2 border-[#94a3b8]/40 bg-white/90 p-2">
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {ACOPIO_CATEGORY_ORDER.map((value) => {
                  const checked = filterCats.includes(value);
                  return (
                    <li key={value}>
                      <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[#132238]">
                        <input
                          type="checkbox"
                          name="c"
                          value={value}
                          defaultChecked={checked}
                          className="mt-0.5 shrink-0 rounded border-[#1e3a5f]"
                        />
                        <span>{acopioCategoryLabel(value)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg border-2 border-[#1e3a5f] bg-[#dbeafe] px-4 py-2 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
              >
                Aplicar filtro
              </button>
              {hasActiveFilter ? (
                <Link
                  href="/tablero/herramientas/directorio"
                  className="inline-flex items-center rounded-lg border-2 border-[#64748b] bg-[#f1f5f9] px-4 py-2 font-mono text-xs font-semibold text-[#334155] shadow-[0_3px_0_#64748b] transition hover:brightness-105 active:translate-y-px"
                >
                  Ver todos
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        {places.length === 0 && !hasActiveFilter ? (
          <p className="text-sm leading-relaxed text-[#5b7cb8]">
            Aún no hay lugares en el directorio. Cuando la campaña apruebe lugares documentados, aparecerán aquí.
          </p>
        ) : places.length === 0 && hasActiveFilter ? (
          <p className="text-sm leading-relaxed text-[#5b7cb8]">
            Ningún punto coincide con el filtro. Prueba con otras categorías o usa &quot;Ver todos&quot;.
          </p>
        ) : (
          <ul className="grid list-none gap-4 sm:grid-cols-2">
            {places.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-xl border-4 border-[#1e3a5f] bg-gradient-to-b from-white to-[#e8f2fa] p-4 shadow-[0_4px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.85)]"
              >
                <h2 className="text-base font-bold text-[#132238]">{p.name}</h2>
                {p.categories.length > 0 ? (
                  <ul className="flex flex-wrap gap-1">
                    {p.categories.map((row) => (
                      <li
                        key={row.id}
                        className="rounded border border-[#0d9488]/40 bg-[#ccfbf1]/90 px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#0f766e]"
                      >
                        {acopioCategoryLabel(row.category)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[9px] text-[#94a3b8]">Categorías no indicadas</p>
                )}
                {p.address?.trim() ? (
                  <p className="whitespace-pre-wrap text-sm text-[#3d5670]">{p.address.trim()}</p>
                ) : null}
                {p.phone?.trim() ? (
                  <p className="font-mono text-sm text-[#3d5670]">
                    Tel.{" "}
                    {p.phone.replace(/\D/g, "").length > 0 ? (
                      <a href={`tel:${p.phone.replace(/\D/g, "")}`} className="text-[#2563eb] underline">
                        {p.phone.trim()}
                      </a>
                    ) : (
                      <span>{p.phone.trim()}</span>
                    )}
                  </p>
                ) : null}
                {p.photoUrl?.trim() ? (
                  <div className="mt-1">
                    <PhotoModalTrigger
                      imageSrc={p.photoUrl.trim()}
                      imageAlt={`Foto: ${p.name}`}
                      className="font-mono text-xs font-semibold text-[#2563eb] underline-offset-2 hover:underline"
                    >
                      Ver foto
                    </PhotoModalTrigger>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
