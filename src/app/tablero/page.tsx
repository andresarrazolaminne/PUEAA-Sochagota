import Link from "next/link";
import { Suspense } from "react";
import { Special_Elite } from "next/font/google";
import { TableroWelcomeChime } from "@/components/sounds/TableroWelcomeChime";
import { CarnetCampaignImage } from "@/components/carnet/CarnetCampaignImage";
import { requireEmployee } from "@/lib/auth/require-employee";
import { getEmployeeGamificationSummary } from "@/lib/services/employee/summary";
import { getCarnetDisplaySettings } from "@/lib/services/settings/app-settings";
import { listChallengesForTablero } from "@/lib/services/challenges/queries";
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
    listChallengesForTablero(),
  ]);

  const envSrc = summary.environmentImageSrc;
  const environmentImgUrl =
    envSrc.startsWith("http://") || envSrc.startsWith("https://")
      ? envSrc
      : envSrc.startsWith("/api/")
        ? withBasePathIfNeeded(envSrc)
        : withBasePath(envSrc);

  return (
    <>
      {welcomeChime ? (
        <Suspense fallback={null}>
          <TableroWelcomeChime enabled />
        </Suspense>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
        <div className="game-panel-3d mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 rounded-2xl p-4 md:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#1e3a5f] pb-4">
          <div>
            <p className="font-pixel text-[10px] uppercase tracking-[0.12em] text-[#2563eb]">
              Tu tablero · PUEAA
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[#132238] md:text-2xl">
              Perfil y progreso
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden rounded-lg border-2 border-[#0d9488] bg-[#ccfbf1] px-2 py-1 font-mono text-[10px] font-semibold text-[#0f766e] sm:inline">
              SISTEMA OK
            </span>
            <span className="max-w-[14rem] truncate rounded-lg border-2 border-[#6b8cb8] bg-white px-2 py-1 font-mono text-[10px] font-medium text-[#3d5670]">
              {employee.fullName}
              {employee.role === Role.ADMIN ? " · ADMIN" : ""}
            </span>
            {employee.role === Role.ADMIN ? (
              <Link
                href="/admin"
                className="rounded-lg border-2 border-[#1e3a5f] bg-[#e0f2fe] px-3 py-1.5 font-mono text-xs font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
              >
                Administración
              </Link>
            ) : null}
            <Link
              href="/"
              className="game-btn-ghost rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition active:translate-y-px"
            >
              Inicio
            </Link>
            <Link
              href="/logout"
              prefetch={false}
              className="rounded-lg border-2 border-[#7f1d1d] bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-semibold text-[#991b1b] shadow-[0_3px_0_#7f1d1d] transition hover:brightness-105 active:translate-y-px"
            >
              Salir
            </Link>
          </div>
        </header>

        {/* Perfil + visor */}
        <section
          aria-labelledby="perfil-heading"
          className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch"
        >
          <h2 id="perfil-heading" className="sr-only">
            Perfil y entorno
          </h2>
          <div
            className={`min-w-0 flex flex-col overflow-hidden rounded-xl border-4 border-[#1e3a5f] bg-gradient-to-b from-white via-[#f0f6fc] to-[#e2ecf6] text-[#132238] shadow-[0_6px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.9)] ${carnetTypewriter.className}`}
          >
            <div className="border-b-2 border-[#1e3a5f] bg-[#dbeafe] px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-[#1e40af]">
              PUEAA · identificación
            </div>
            <div className="p-4 sm:p-5">
              <p className="border-b-2 border-[#6b8cb8] pb-2 text-center text-[11px] uppercase tracking-[0.35em] text-[#3d5670]">
                Carné de empleado
              </p>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <figure className="flex shrink-0 flex-col items-center sm:items-start">
                  <div className="flex h-[11rem] w-[9rem] items-center justify-center border-4 border-[#1e3a5f] bg-[#f8fafc] p-2 shadow-[inset_0_2px_8px_rgba(30,58,95,0.12)]">
                    <CarnetCampaignImage
                      src={carnet.logoSrc}
                      alt={carnet.caption || "Logo de campaña"}
                      priority
                    />
                  </div>
                  <figcaption className="mt-2 max-w-[10rem] text-center text-[10px] leading-snug text-[#5b7cb8] sm:text-left">
                    {carnet.caption}
                  </figcaption>
                </figure>
                <div className="min-w-0 flex-1 space-y-4">
                  <p className="text-balance text-2xl font-semibold leading-tight tracking-tight text-[#132238] sm:text-3xl">
                    {employee.fullName}
                  </p>
                  <p className="text-base leading-relaxed text-[#3d5670] sm:text-lg">
                    <span className="font-medium">Cédula</span>{" "}
                    <span className="tabular-nums text-[#132238]">{employee.cedula}</span>
                  </p>
                  <div className="border-t-2 border-[#6b8cb8] pt-3">
                    <p className="text-base leading-relaxed text-[#3d5670] sm:text-lg">
                      <span className="font-medium">Rango</span> —{" "}
                      <span className="font-semibold text-[#2563eb]">{summary.rankName}</span>
                    </p>
                    {summary.rankLevel > 0 && summary.totalRankLevels > 0 ? (
                      <div className="mt-2 flex flex-col gap-1.5 sm:items-start">
                        <div
                          className="flex flex-wrap gap-0.5"
                          role="img"
                          aria-label={`Nivel ${summary.rankLevel} de ${summary.totalRankLevels} en la escala de rangos`}
                        >
                          {Array.from({ length: summary.rankLevel }, (_, i) => (
                            <span
                              key={i}
                              className="select-none text-[1.35rem] leading-none text-amber-500 drop-shadow-[0_1px_0_rgba(180,83,9,0.35)]"
                              aria-hidden
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] leading-tight text-[#5b7cb8]">
                          Nivel {summary.rankLevel} de {summary.totalRankLevels}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="border-t-4 border-[#1e3a5f] bg-[#e8f2fa] px-4 py-4 sm:px-5"
              aria-labelledby="progreso-carnet-heading"
            >
              <h3
                id="progreso-carnet-heading"
                className="border-b-2 border-[#6b8cb8] pb-2 text-center text-[11px] uppercase tracking-[0.25em] text-[#1e40af]"
              >
                Progreso en campaña
              </h3>
              <div className="mt-4 space-y-3 text-sm text-[#3d5670]">
                <div>
                  <div className="mb-1 flex justify-between text-[11px] font-medium">
                    <span>Avance al siguiente nivel</span>
                    <span className="tabular-nums text-[#2563eb]">{summary.progressPct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border-2 border-[#1e3a5f] bg-white shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#22c55e] transition-[width]"
                      style={{ width: `${summary.progressPct}%` }}
                    />
                  </div>
                </div>
                <p className="text-[13px]">
                  <span className="font-medium">Puntos acumulados</span>{" "}
                  <span className="tabular-nums font-bold text-[#0d9488]">{summary.totalPoints}</span>
                </p>
              </div>
              <p className="mt-4 border-t-2 border-[#6b8cb8] pt-3 text-[11px] leading-relaxed text-[#5b7cb8]">
                El progreso se actualiza con el ledger de puntos al completar retos.
              </p>
            </div>
          </div>

          <div className="relative flex min-h-[200px] min-w-0 flex-col overflow-hidden rounded-xl border-4 border-[#1e3a5f] bg-[#f8fafc] shadow-[0_5px_0_#1e3a5f]">
            <div className="flex items-center justify-between border-b-2 border-[#1e3a5f] bg-[#dbeafe] px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#1e40af]">
                Visor de entorno
              </span>
              <span className="font-mono text-[9px] text-[#5b7cb8]">Paipa · pixel</span>
            </div>
            <div className="relative flex flex-1 items-center justify-center p-4">
              <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(30,58,95,0.06)_2px,rgba(30,58,95,0.06)_4px)]" />
              {/* eslint-disable-next-line @next/next/no-img-element -- rutas /public y /api con basePath */}
              <img
                src={environmentImgUrl}
                alt={`Entorno de campaña · ${summary.rankName}`}
                width={320}
                height={180}
                className="relative z-[1] max-h-[min(40vh,220px)] w-auto opacity-90"
              />
            </div>
          </div>
        </section>

        {/* Retos */}
        <section aria-labelledby="retos-heading" className="flex flex-col gap-3">
          <h2
            id="retos-heading"
            className="font-pixel text-[11px] font-normal uppercase tracking-widest text-[#2563eb]"
          >
            Retos del mes
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {challenges.length === 0 ? (
              <p className="col-span-full text-sm text-[#5b7cb8]">
                No hay retos activos en este periodo. Cuando administración publique retos en plataforma,
                aparecerán aquí.
              </p>
            ) : (
              challenges.map((c) => {
                const playHref = challengePlayerModulePath(c.type, c.id);
                const kind = challengeTypeShortLabel(c.type);
                const shell = challengeTypeIconShellClass(c.type);
                const desc = c.description?.trim() || "Reto de campaña PUEAA.";
                return (
                  <Link
                    key={c.id}
                    href={playHref}
                    className="group relative flex min-h-[11.5rem] flex-row gap-4 overflow-hidden rounded-2xl border-4 border-[#1e3a5f] bg-gradient-to-b from-white to-[#e8f2fa] p-4 text-left shadow-[0_6px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:brightness-[1.02] active:translate-y-px active:shadow-[0_4px_0_#1e3a5f] sm:p-5 md:min-h-[10rem]"
                  >
                    <span
                      className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#38bdf8]/20 blur-2xl transition group-hover:bg-[#a78bfa]/25"
                      aria-hidden
                    />
                    <div
                      className={`relative flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-2xl border-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] sm:h-[4.5rem] sm:w-[4.5rem] ${shell}`}
                      aria-hidden
                    >
                      <ChallengeTypeIcon type={c.type} className="h-9 w-9 sm:h-10 sm:w-10" />
                    </div>
                    <div className="relative flex min-w-0 flex-1 flex-col gap-2.5">
                      <span className="inline-flex w-fit max-w-full rounded-lg border-2 border-[#1e3a5f]/25 bg-white/90 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase leading-tight tracking-wide text-[#1e40af]">
                        {kind}
                      </span>
                      <h3 className="text-balance text-base font-bold leading-snug text-[#132238] group-hover:text-[#2563eb] sm:text-lg">
                        {c.title}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-relaxed text-[#3d5670]">{desc}</p>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t-2 border-[#94a3b8]/35 pt-3">
                        <span className="font-mono text-[11px] font-medium leading-snug text-[#5b7cb8]">
                          Base <span className="tabular-nums font-bold text-[#0d9488]">{c.basePoints}</span> pts
                        </span>
                        <span className="shrink-0 font-pixel text-[9px] uppercase tracking-widest text-[#2563eb]">
                          Jugar →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Herramientas */}
        <section aria-labelledby="herramientas-heading" className="flex flex-col gap-3">
          <h2
            id="herramientas-heading"
            className="font-pixel text-[11px] font-normal uppercase tracking-widest text-[#2563eb]"
          >
            Herramientas
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(
              [
                { href: "/tablero/herramientas/cronometro-ducha", label: "Cronómetro de ducha" },
                { href: "/tablero/herramientas/directorio", label: "Directorio de acopio" },
                { href: "/tablero/herramientas/tips-agua", label: "Tips de agua" },
                { href: "/tablero/herramientas/contacto", label: "Contacto" },
              ] as const
            ).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-xl border-4 border-[#1e3a5f] bg-gradient-to-b from-[#f8fafc] to-[#e2ecf6] px-2 py-3 text-center text-xs font-bold text-[#132238] shadow-[0_4px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_#1e3a5f]"
              >
                <span className="font-mono text-[9px] text-[#2563eb]">▣</span>
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
