import Link from "next/link";
import { Suspense } from "react";
import { Special_Elite } from "next/font/google";
import { TableroWelcomeChime } from "@/components/sounds/TableroWelcomeChime";
import { CarnetCampaignImage } from "@/components/carnet/CarnetCampaignImage";
import { requireEmployee } from "@/lib/auth/require-employee";
import { getEmployeeGamificationSummary } from "@/lib/services/employee/summary";
import { getCarnetDisplaySettings } from "@/lib/services/settings/app-settings";
import { listChallengesForTableroWithMyStatus } from "@/lib/services/challenges/queries";
import { Role } from "@/generated/prisma/enums";
import { withBasePath, withBasePathIfNeeded } from "@/lib/base-path";
import { challengePlayerModulePath } from "@/modules/challenges/registry";
import {
  ChallengeTypeIcon,
  challengeTypeIconShellClass,
  challengeTypeShortLabel,
} from "@/modules/challenges/challenge-type-ui";

const carnetTypewriter = Special_Elite({
  weight: "400",
  subsets: ["latin"],
});

function resolvePublicSrc(src: string) {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/api/")) return withBasePathIfNeeded(src);
  return withBasePath(src);
}

function participationStatusLabel(status: string | null): { label: string; className: string } {
  switch (status) {
    case "PENDING_REVIEW":
      return { label: "En revisión", className: "border-[#b45309] bg-[#ffedd5] text-[#9a3412]" };
    case "APPROVED":
      return { label: "Aprobado", className: "border-[#047857] bg-[#d1fae5] text-[#065f46]" };
    case "REJECTED":
      return { label: "Rechazado", className: "border-[#b91c1c] bg-[#fee2e2] text-[#991b1b]" };
    case "SUBMITTED":
      return { label: "Inscrito", className: "border-[#0369a1] bg-[#e0f2fe] text-[#0c4a6e]" };
    case "DRAFT":
      return { label: "Borrador", className: "border-[#64748b] bg-[#f1f5f9] text-[#334155]" };
    default:
      return { label: "Sin iniciar", className: "border-[#94a3b8] bg-white/90 text-[#475569]" };
  }
}

export default async function TableroPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const employee = await requireEmployee("/tablero");
  const sp = await searchParams;
  const welcomeChime = sp.bienvenida === "1";
  const [summary, carnet, challenges] = await Promise.all([
    getEmployeeGamificationSummary(employee.id),
    getCarnetDisplaySettings(),
    listChallengesForTableroWithMyStatus(employee.id),
  ]);

  const environmentImgUrl = resolvePublicSrc(summary.environmentImageSrc);
  const shieldImgUrl = resolvePublicSrc(summary.shieldImageSrc);
  const photoUrl = summary.photoUrl ? resolvePublicSrc(summary.photoUrl) : null;

  return (
    <>
      {welcomeChime ? (
        <Suspense fallback={null}>
          <TableroWelcomeChime enabled />
        </Suspense>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col p-3 text-[#12181e] md:p-5">
        <div className="game-panel-3d mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 rounded-md p-3 md:gap-5 md:p-5">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#1a2228] pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0e7490]">
                Consola PUEAA · Sochagota
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#12181e] md:text-2xl">
                Tablero de operación
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="device-lcd hidden rounded px-2 py-1 text-[10px] font-semibold tracking-wider sm:inline">
                SYS·OK
              </span>
              <span className="max-w-[14rem] truncate rounded border-2 border-[#1a2228] bg-[#e8edf1] px-2 py-1 font-mono text-[10px] font-medium">
                {employee.fullName}
                {employee.role === Role.ADMIN ? " · ADMIN" : ""}
              </span>
              {employee.role === Role.ADMIN ? (
                <Link
                  href="/admin"
                  className="rounded border-2 border-[#1a2228] bg-[#e0f2fe] px-3 py-1.5 font-mono text-xs font-semibold text-[#155e75] shadow-[0_3px_0_#1a2228] transition active:translate-y-px"
                >
                  Administración
                </Link>
              ) : null}
              <Link href="/" className="game-btn-ghost rounded px-3 py-1.5 font-mono text-xs font-semibold">
                Inicio
              </Link>
              <Link
                href="/logout"
                prefetch={false}
                className="rounded border-2 border-[#7f1d1d] bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-semibold text-[#991b1b] shadow-[0_3px_0_#7f1d1d]"
              >
                Salir
              </Link>
            </div>
          </header>

          <section
            aria-labelledby="perfil-heading"
            className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch"
          >
            <h2 id="perfil-heading" className="sr-only">
              Perfil y entorno
            </h2>

            <div
              className={`min-w-0 flex flex-col overflow-hidden rounded border-4 border-[#1a2228] bg-gradient-to-b from-[#f4f6f8] to-[#cfd6dd] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_0_#1a2228] ${carnetTypewriter.className}`}
            >
              <div className="border-b-2 border-[#1a2228] bg-[#2c353c] px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-[#a8b4be]">
                Identificación · empleado
              </div>
              <div className="p-4 sm:p-5">
                <div className="mt-1 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                  <figure className="flex shrink-0 flex-col items-center gap-3 sm:items-start">
                    <div className="flex h-[11rem] w-[9rem] items-center justify-center overflow-hidden border-4 border-[#1a2228] bg-[#0b1f18] p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={`Foto de ${employee.fullName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CarnetCampaignImage
                          src={carnet.logoSrc}
                          alt={carnet.caption || "Logo de campaña"}
                          priority
                        />
                      )}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shieldImgUrl}
                      alt={`Escudo · ${summary.rankName}`}
                      width={64}
                      height={72}
                      className="h-[72px] w-16 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
                    />
                    <figcaption className="max-w-[10rem] text-center text-[10px] leading-snug text-[#3a4650] sm:text-left">
                      {carnet.caption}
                    </figcaption>
                  </figure>
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                      {employee.fullName}
                    </p>
                    <p className="text-base text-[#3a4650]">
                      <span className="font-medium">Cédula</span>{" "}
                      <span className="tabular-nums text-[#12181e]">{employee.cedula}</span>
                    </p>
                    <div className="border-t-2 border-[#5a6a76] pt-3">
                      <p className="text-base text-[#3a4650]">
                        <span className="font-medium">Rango</span> —{" "}
                        <span className="font-semibold text-[#0e7490]">{summary.rankName}</span>
                      </p>
                      {summary.rankLevel > 0 && summary.totalRankLevels > 0 ? (
                        <p className="mt-1 font-mono text-[11px] text-[#5a6a76]">
                          Nivel {summary.rankLevel} / {summary.totalRankLevels}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t-4 border-[#1a2228] bg-[#d7dde3] px-4 py-4 sm:px-5">
                <h3 className="border-b-2 border-[#5a6a76] pb-2 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-[#155e75]">
                  Progreso de campaña
                </h3>
                <div className="mt-4 space-y-3 text-sm text-[#3a4650]">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-medium">
                      <span>Avance al siguiente nivel</span>
                      <span className="tabular-nums text-[#0e7490]">{summary.progressPct}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-sm border-2 border-[#1a2228] bg-[#f8fafc] shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#14b8a6] to-[#047857] transition-[width]"
                        style={{ width: `${summary.progressPct}%` }}
                      />
                    </div>
                  </div>
                  <p className="device-lcd inline-block rounded px-2 py-1 text-[12px]">
                    PTS {summary.totalPoints}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded border-4 border-[#1a2228] bg-[#2c353c] shadow-[0_5px_0_#0f1418]">
              <div className="flex items-center justify-between border-b-2 border-[#0f1418] bg-[#1a2228] px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#a8b4be]">
                  Visor de entorno · Paipa
                </span>
                <span className="device-lcd rounded px-1.5 py-0.5 text-[9px]">LCD</span>
              </div>
              <div className="relative flex flex-1 items-center justify-center p-3">
                <div className="device-lcd relative flex w-full max-w-md items-center justify-center rounded p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={environmentImgUrl}
                    alt={`Entorno de campaña · ${summary.rankName}`}
                    width={320}
                    height={180}
                    className="relative z-[1] max-h-[min(42vh,240px)] w-auto image-rendering-pixelated"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="retos-heading" className="flex flex-col gap-3">
            <h2
              id="retos-heading"
              className="font-mono text-[11px] font-normal uppercase tracking-widest text-[#0e7490]"
            >
              Retos del mes
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {challenges.length === 0 ? (
                <p className="col-span-full text-sm text-[#3a4650]">
                  No hay retos activos en este periodo.
                </p>
              ) : (
                challenges.map((c) => {
                  const playHref = challengePlayerModulePath(c.type, c.id);
                  const kind = challengeTypeShortLabel(c.type);
                  const shell = challengeTypeIconShellClass(c.type);
                  const desc = c.description?.trim() || "Reto de campaña PUEAA.";
                  const status = participationStatusLabel(c.myStatus);
                  return (
                    <Link
                      key={c.id}
                      href={playHref}
                      className="tile-physical group relative flex min-h-[10.5rem] flex-row gap-4 overflow-hidden rounded p-4 text-left transition hover:brightness-[1.02] sm:p-5"
                    >
                      <div
                        className={`relative flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded border-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] ${shell}`}
                        aria-hidden
                      >
                        <ChallengeTypeIcon type={c.type} className="h-9 w-9" />
                      </div>
                      <div className="relative flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex w-fit rounded border-2 border-[#1a2228]/30 bg-white/90 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#155e75]">
                            {kind}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded border-2 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-balance text-base font-bold leading-snug text-[#12181e] sm:text-lg">
                          {c.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-[#3a4650]">{desc}</p>
                        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t-2 border-[#5a6a76]/40 pt-3">
                          <span className="font-mono text-[11px] text-[#5a6a76]">
                            Base <span className="font-bold text-[#047857]">{c.basePoints}</span> pts
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#0e7490]">
                            Abrir →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section aria-labelledby="herramientas-heading" className="flex flex-col gap-3">
            <h2
              id="herramientas-heading"
              className="font-mono text-[11px] font-normal uppercase tracking-widest text-[#0e7490]"
            >
              Herramientas
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {(
                [
                  { href: "/tablero/herramientas/cronometro-ducha", label: "Cronómetro de ducha" },
                  { href: "/tablero/herramientas/directorio", label: "Directorio de acopio" },
                  { href: "/tablero/herramientas/tips-agua", label: "Tips de agua" },
                  { href: "/tablero/herramientas/contacto", label: "Contacto" },
                  { href: "/tablero/herramientas/origen-puntos", label: "Origen de mis puntos" },
                ] as const
              ).map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="tile-physical flex min-h-[88px] flex-col items-center justify-center gap-1 rounded px-2 py-3 text-center text-xs font-bold text-[#12181e]"
                >
                  <span className="device-lcd rounded px-1.5 py-0.5 text-[9px]">TILE</span>
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
