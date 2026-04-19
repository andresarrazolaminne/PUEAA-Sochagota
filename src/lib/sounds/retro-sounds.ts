/**
 * Sonido tipo 16-bit / arcade (Web Audio API, sin archivos externos).
 * Preferencias: localStorage `pueaa_sound` = "off" | "on" (por defecto on).
 */

const STORAGE_KEY = "pueaa_sound";

export function isRetroSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setRetroSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

let ctxRef: AudioContext | null = null;
let lastMilestoneAt = 0;
let lastBlipAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (prefersReducedMotion()) return null;
  if (!isRetroSoundEnabled()) return null;
  if (!ctxRef) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctxRef = new Ctx();
  }
  if (ctxRef.state === "suspended") {
    void ctxRef.resume();
  }
  return ctxRef;
}

/** Clic / navegación: “blip” corto estilo menú. */
export function playUiBlip(): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastBlipAt < 120) return;
  lastBlipAt = now;

  const ctx = getCtx();
  if (!ctx) return;

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(920, t0);
  osc.frequency.exponentialRampToValueAtTime(420, t0 + 0.045);
  gain.gain.setValueAtTime(0.06, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.07);
}

/** Reto completado o sesión iniciada: arpegio ascendente “nivel superado”. */
export function playMilestoneChime(): void {
  const now = Date.now();
  if (now - lastMilestoneAt < 650) return;
  lastMilestoneAt = now;

  const ctx = getCtx();
  if (!ctx) return;

  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const t0 = ctx.currentTime;
  const step = 0.11;

  freqs.forEach((freq, i) => {
    const start = t0 + i * step;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.11, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.15);
  });
}
