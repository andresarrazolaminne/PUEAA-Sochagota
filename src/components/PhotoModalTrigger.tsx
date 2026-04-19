"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { withBasePathIfNeeded } from "@/lib/base-path";

type Props = {
  imageSrc: string;
  children?: React.ReactNode;
  className?: string;
  /** Texto alternativo de la imagen ampliada */
  imageAlt?: string;
};

export function PhotoModalTrigger({
  imageSrc,
  children = "Ver imagen",
  className,
  imageAlt = "Imagen ampliada",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  const resolvedSrc = useMemo(() => withBasePathIfNeeded(imageSrc), [imageSrc]);

  const overlay = (
    <div className="fixed inset-0 z-[9999]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/82 backdrop-blur-[1px]"
        aria-label="Cerrar vista de imagen"
        onClick={close}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto flex max-h-[min(92vh,920px)] w-full max-w-[min(96vw,1200px)] flex-col overflow-hidden rounded-xl border border-[#2a4034] bg-[#0b1210] shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1f3328] px-3 py-2.5 sm:px-4">
            <p id={titleId} className="font-mono text-[11px] uppercase tracking-wider text-[#7aab8c]">
              Vista de imagen
            </p>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#e8f5ee] shadow-[0_2px_0_#050807] hover:brightness-110"
            >
              Cerrar
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
            {/* URLs dinámicas servidas por /api/... de evidencias */}
            <img
              src={resolvedSrc}
              alt={imageAlt}
              className="mx-auto max-h-[min(78vh,840px)] w-auto max-w-full object-contain"
            />
          </div>
          <div className="shrink-0 border-t border-[#1f3328] px-3 py-2.5 sm:px-4">
            <a
              href={resolvedSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-[#8fd4a8] underline-offset-2 hover:underline"
            >
              Abrir en pestaña nueva
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {mounted && open ? createPortal(overlay, document.body) : null}
    </>
  );
}
