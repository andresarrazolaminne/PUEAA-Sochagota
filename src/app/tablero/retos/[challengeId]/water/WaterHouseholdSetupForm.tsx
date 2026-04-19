"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWaterHouseholdDefaultAction } from "./actions";

const inputClass =
  "rounded-xl border-2 border-[#6b8cb8] bg-white px-3 py-3 font-mono text-sm text-[#132238] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25";

export function WaterHouseholdSetupForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const n = Number(fd.get("householdMembers"));
        startTransition(async () => {
          try {
            await setWaterHouseholdDefaultAction(challengeId, n);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar.");
          }
        });
      }}
      className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex min-w-[220px] flex-1 flex-col gap-2">
        <span className="text-xs font-semibold text-[#3d5670]">¿Cuántas personas viven en tu hogar?</span>
        <input
          name="householdMembers"
          type="number"
          inputMode="numeric"
          min={1}
          max={15}
          required
          defaultValue={3}
          className={inputClass}
        />
        <span className="text-[11px] leading-relaxed text-[#5b7cb8]">
          Incluye a quienes consumen agua en la vivienda (adultos y niños). Podrás ajustar mes a mes si cambia.
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="game-btn-primary rounded-2xl px-8 py-3 font-mono text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar y continuar"}
      </button>
      {error ? (
        <p className="w-full rounded-lg border-2 border-[#b91c1c] bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
