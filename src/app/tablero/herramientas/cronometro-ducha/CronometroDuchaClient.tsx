"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const PRESETS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "8 min", seconds: 480 },
] as const;

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function CronometroDuchaClient() {
  const defaultPreset = PRESETS[1]!;
  const [targetSeconds, setTargetSeconds] = useState<number>(defaultPreset.seconds);
  const [remaining, setRemaining] = useState<number>(defaultPreset.seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusId = useId();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearTimer();
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearTimer();
  }, [running, clearTimer]);

  const pickPreset = (seconds: number) => {
    clearTimer();
    setRunning(false);
    setFinished(false);
    setTargetSeconds(seconds);
    setRemaining(seconds);
  };

  const start = () => {
    if (remaining <= 0) {
      setRemaining(targetSeconds);
    }
    setFinished(false);
    setRunning(true);
  };

  const pause = () => {
    clearTimer();
    setRunning(false);
  };

  const reset = () => {
    clearTimer();
    setRunning(false);
    setFinished(false);
    setRemaining(targetSeconds);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <span className="w-full font-mono text-[10px] uppercase tracking-wider text-[#5b7cb8]">
          Duración objetivo
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            type="button"
            disabled={running}
            onClick={() => pickPreset(p.seconds)}
            className={`rounded-lg border-2 px-3 py-2 font-mono text-xs font-semibold shadow-[0_3px_0_#1e3a5f] transition active:translate-y-px disabled:opacity-40 ${
              targetSeconds === p.seconds
                ? "border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]"
                : "border-[#1e3a5f] bg-white text-[#132238] hover:brightness-105"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl border-4 border-[#1e3a5f] bg-gradient-to-b from-white to-[#e8f2fa] px-6 py-10 text-center shadow-[0_6px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.9)]"
        aria-labelledby={statusId}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#2563eb]">Tiempo restante</p>
        <p
          className="mt-2 font-mono text-5xl font-bold tabular-nums text-[#132238] sm:text-6xl"
          aria-live={running ? "polite" : "off"}
        >
          {formatMmSs(remaining)}
        </p>
        <div id={statusId} role="status" aria-live="polite" className="mt-4 min-h-[1.5rem] text-sm font-medium">
          {finished ? (
            <span className="text-[#0d9488]">Tiempo cumplido. ¡Buen hábito de ahorro de agua!</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-lg border-2 border-[#1e3a5f] bg-[#dbeafe] px-4 py-2 font-mono text-sm font-semibold text-[#1e40af] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
          >
            {remaining === 0 ? "Reiniciar y comenzar" : "Comenzar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="rounded-lg border-2 border-[#1e3a5f] bg-[#fef3c7] px-4 py-2 font-mono text-sm font-semibold text-[#92400e] shadow-[0_3px_0_#1e3a5f] transition hover:brightness-105 active:translate-y-px"
          >
            Pausar
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border-2 border-[#64748b] bg-[#f1f5f9] px-4 py-2 font-mono text-sm font-semibold text-[#334155] shadow-[0_3px_0_#64748b] transition hover:brightness-105 active:translate-y-px"
        >
          Reiniciar
        </button>
      </div>

      <p className="text-sm leading-relaxed text-[#3d5670]">
        El temporizador solo cuenta en esta página. Úsalo como guía para reducir el tiempo de ducha y cuidar el agua.
      </p>
    </div>
  );
}
