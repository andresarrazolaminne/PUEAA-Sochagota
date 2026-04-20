import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { withBasePath, withBasePathIfNeeded } from "@/lib/base-path";
import { updateRankAction } from "./actions";

function previewEnvironmentSrc(img: string): string {
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/api/")) return withBasePathIfNeeded(img);
  return withBasePath(img);
}

const ERR: Record<string, string> = {
  datos: "Revisa los campos (nombre y puntos mínimos).",
  puntos: "Los puntos mínimos deben ser un entero entre 0 y 1.000.000.",
  imagen: "La ruta o URL de la imagen no es válida. Usa /archivo.png, /api/... o https://…",
  upload: "No se pudo guardar el archivo. Inténtalo de nuevo.",
  upload_type: "Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.",
  upload_size: "El archivo supera el tamaño máximo (3 MB).",
};

export default async function AdminRangosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  await requireAdmin("/admin/rangos");
  const ranks = await prisma.rank.findMany({ orderBy: { sortOrder: "asc" } });
  const sp = await searchParams;
  const errKey = typeof sp.e === "string" ? sp.e : undefined;
  const errorMsg = errKey ? ERR[errKey] ?? "No se pudo guardar." : null;

  return (
    <div className="space-y-6">
      {sp.ok === "1" ? (
        <p className="rounded border border-[#2a4a38] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#8fd4a8]">
          Rango actualizado. El visor del tablero reflejará el cambio al recargar.
        </p>
      ) : null}
      {errorMsg ? (
        <p className="rounded border border-[#5a3030] bg-[#1a1010] px-3 py-2 text-sm text-[#f0b4b4]" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Rangos e imagen de entorno</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7aab8c]">
          Cada rango tiene un nombre, un umbral de <strong className="text-[#c8e6d4]">puntos mínimos</strong> en el ledger
          y una <strong className="text-[#c8e6d4]">imagen para el visor</strong> del tablero. Los empleados ven la imagen
          del rango que les corresponde según sus puntos totales (el mayor rango cuyo mínimo alcancen). Los rangos están
          ordenados de menor a mayor dificultad; los umbrales deben ser crecientes para un reparto coherente.
        </p>
      </div>

      <div className="space-y-8">
        {ranks.map((rank) => {
          const img = rank.environmentImageUrl?.trim() || "/pixel-placeholder.svg";
          const previewUrl = previewEnvironmentSrc(img);
          return (
            <div
              key={rank.id}
              className="rounded-xl border border-[#243d30] bg-[#0a100d] p-5 shadow-[0_4px_0_#050807]"
            >
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#243d30] pb-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6a9c80]">
                  Orden {rank.sortOrder + 1} · sortOrder {rank.sortOrder}
                </p>
                <p className="font-mono text-xs text-[#5a8068]">id · {rank.id}</p>
              </div>

              <form action={updateRankAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px] md:items-start">
                <input type="hidden" name="rankId" value={rank.id} />

                <div className="space-y-3">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Nombre del rango</span>
                    <input
                      name="name"
                      type="text"
                      required
                      defaultValue={rank.name}
                      className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                      Puntos mínimos (ledger)
                    </span>
                    <input
                      name="minPoints"
                      type="number"
                      required
                      min={0}
                      max={1000000}
                      step={1}
                      defaultValue={rank.minPoints}
                      className="max-w-xs rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                      Imagen (ruta /public, /api/… o URL https)
                    </span>
                    <input
                      name="imageUrl"
                      type="text"
                      defaultValue={img}
                      placeholder="/pixel-placeholder.svg"
                      className="rounded-md border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee] outline-none focus:border-[#35664a]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                      O subir archivo (PNG, JPEG, WebP, GIF, SVG · máx. 3 MB)
                    </span>
                    <input
                      name="imageFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      className="text-sm text-[#e8f5ee] file:mr-3 file:rounded file:border-0 file:bg-[#1e4d35] file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-[#e8f5ee]"
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-fit rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110"
                  >
                    Guardar rango
                  </button>
                </div>

                <div className="rounded-lg border border-[#243d30] bg-[#0b1210]/80 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-wide text-[#5a8068]">Vista previa</p>
                  <div className="mt-2 flex max-h-40 items-center justify-center overflow-hidden rounded border border-[#1e3a5f]/40 bg-[#f8fafc] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="" className="max-h-36 w-auto max-w-full object-contain opacity-95" />
                  </div>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
