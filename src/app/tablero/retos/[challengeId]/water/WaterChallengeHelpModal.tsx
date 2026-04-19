"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";

export function WaterChallengeHelpModal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-[#1e3a5f] bg-[#fef9c3] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-[#854d0e] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px active:shadow-[0_2px_0_#1e3a5f] sm:text-xs"
      >
        <span className="text-base leading-none" aria-hidden>
          ?
        </span>
        Ayuda · guía y puntos
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex min-h-0 items-center justify-center p-3 sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Cerrar ayuda"
            className="absolute inset-0 bg-[#132238]/55 backdrop-blur-[2px]"
            onClick={close}
          />
          {/* Contenedor: limita altura al viewport real para que cabezal + Cerrar queden siempre accesibles */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative grid w-full max-w-lg max-h-[min(92dvh,40rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border-4 border-[#1e3a5f] bg-[#f8fafc] shadow-[0_8px_0_#1e3a5f,0_20px_40px_rgba(30,58,95,0.2)]"
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#94a3b8]/50 bg-[#e0f2fe] px-4 py-3 sm:rounded-t-xl">
              <div className="min-w-0">
                <p id={titleId} className="font-pixel text-[10px] uppercase tracking-[0.12em] text-[#2563eb]">
                  Centro de ayuda
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#132238]">Guía de participación y reglas de puntos</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-lg border-2 border-[#1e3a5f] bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-[#1e40af] shadow-[0_2px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
              >
                Cerrar
              </button>
            </div>
            <div className="min-h-0 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-5">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
