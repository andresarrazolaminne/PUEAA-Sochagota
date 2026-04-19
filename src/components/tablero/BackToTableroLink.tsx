import Link from "next/link";

const linkStyles =
  "group relative flex min-h-[3.25rem] w-full max-w-xl flex-row items-center gap-3 overflow-hidden rounded-2xl border-4 border-[#1e3a5f] bg-gradient-to-b from-white via-[#e0f7ff] to-[#bae6fd] px-4 py-3 text-[#0c4a6e] shadow-[0_6px_0_#1e3a5f,inset_0_2px_0_rgba(255,255,255,0.95)] outline-none ring-offset-2 transition hover:brightness-[1.03] hover:ring-2 hover:ring-[#2563eb]/40 focus-visible:ring-2 focus-visible:ring-[#2563eb] active:translate-y-[3px] active:shadow-[0_3px_0_#1e3a5f] sm:min-w-[280px] sm:flex-initial";

/** Navegación muy visible para salir del reto y volver al tablero. */
export function BackToTableroLink({ className = "" }: { className?: string }) {
  return (
    <Link href="/tablero" className={`${linkStyles} ${className}`.trim()} data-no-ui-sound>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-[#1e3a5f] bg-[#f0f9ff] text-[#0369a1] shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_3px_0_#0c4a6e] transition group-hover:bg-white"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.25">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-pixel block text-[9px] uppercase tracking-[0.14em] text-[#2563eb]">Salir del reto</span>
        <span className="mt-0.5 block text-base font-bold leading-tight tracking-tight text-[#132238] sm:text-lg">
          Volver al tablero
        </span>
      </span>
      <span
        className="shrink-0 rounded-lg border-2 border-[#1e3a5f] bg-[#fef3c7] px-2.5 py-1 font-pixel text-[10px] font-normal uppercase tracking-widest text-[#92400e] shadow-[0_2px_0_#78350f]"
        aria-hidden
      >
        ←
      </span>
    </Link>
  );
}

/**
 * Barra fija bajo la cabecera del sitio: el botón de retorno sigue visible al hacer scroll.
 * `top-14` alinea con la altura de `SiteBrandBar` (h-14).
 */
export function TableroChallengeBackBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`sticky top-14 z-40 border-b-4 border-[#1e3a5f] bg-[#cffafe]/93 shadow-[0_4px_12px_rgba(30,58,95,0.12)] backdrop-blur-md ${className}`.trim()}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 md:px-6">
        <BackToTableroLink className="w-full sm:w-auto" />
      </div>
    </div>
  );
}
