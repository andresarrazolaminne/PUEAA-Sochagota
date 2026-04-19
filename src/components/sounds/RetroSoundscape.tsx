"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isRetroSoundEnabled, playUiBlip, setRetroSoundEnabled } from "@/lib/sounds/retro-sounds";

const THROTTLE_MS = 420;

/**
 * Sonido UI global (clics en controles) + control de silencio.
 * Excluye elementos con `data-no-ui-sound` o el propio botón de mute.
 */
export function RetroSoundscape() {
  const [muted, setMuted] = useState(false);
  const lastPlay = useRef(0);

  useEffect(() => {
    setMuted(!isRetroSoundEnabled());
  }, []);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (muted) return;
    const el = e.target as HTMLElement | null;
    if (!el) return;
    if (el.closest("[data-no-ui-sound]")) return;
    const interactive = el.closest(
      "button, a[href], [role='button'], input[type='submit'], input[type='button'], label",
    ) as HTMLElement | null;
    if (!interactive) return;
    if (interactive.querySelector?.('input[type="file"]')) return;
    const now = performance.now();
    if (now - lastPlay.current < THROTTLE_MS) return;
    lastPlay.current = now;
    playUiBlip();
  }, [muted]);

  useEffect(() => {
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [onPointerDown]);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setRetroSoundEnabled(!next);
    if (!next) playUiBlip();
  };

  return (
    <button
      type="button"
      data-no-ui-sound
      onClick={toggle}
      className="fixed bottom-4 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#1e3a5f] bg-[#f0f6fc] font-mono text-lg text-[#142542] shadow-[0_4px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px active:shadow-[0_2px_0_#1e3a5f]"
      title={muted ? "Activar sonidos UI" : "Silenciar sonidos UI"}
      aria-pressed={muted}
    >
      <span className="sr-only">{muted ? "Activar sonidos" : "Silenciar sonidos"}</span>
      <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}
