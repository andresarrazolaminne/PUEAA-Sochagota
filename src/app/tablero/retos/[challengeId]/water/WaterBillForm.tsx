"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SubmissionSuccessBanner } from "@/components/tablero/SubmissionSuccessBanner";
import { submitWaterBillPeriodAction } from "./actions";

type PeriodOption = { year: number; month: number; label: string };

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1e3a5f] bg-[#dbeafe] font-mono text-sm font-bold text-[#1e40af] shadow-[0_3px_0_#1e3a5f]">
        {n}
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">{label}</span>
    </div>
  );
}

const fieldBox = "rounded-2xl border-4 border-[#1e3a5f] bg-white p-4 shadow-[0_4px_0_#1e3a5f]";
const inputClass =
  "rounded-xl border-2 border-[#6b8cb8] bg-white px-3 py-3 font-mono text-sm text-[#132238] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25";

export function WaterBillForm({
  challengeId,
  challengeRequiresEvidence,
  periodOptions,
  optimalPerCapitaM3,
  defaultHouseholdMembers = 1,
}: {
  challengeId: string;
  challengeRequiresEvidence: boolean;
  periodOptions: PeriodOption[];
  optimalPerCapitaM3: number;
  defaultHouseholdMembers?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const defaultYm = useMemo(() => {
    if (periodOptions.length === 0) return "";
    const last = periodOptions[periodOptions.length - 1];
    return `${last.year}-${last.month}`;
  }, [periodOptions]);

  const [yearMonth, setYearMonth] = useState(defaultYm);
  const [totalM3Input, setTotalM3Input] = useState("");
  const [householdInput, setHouseholdInput] = useState(() => String(defaultHouseholdMembers));

  useEffect(() => {
    setYearMonth(defaultYm);
  }, [defaultYm]);

  useEffect(() => {
    setHouseholdInput(String(defaultHouseholdMembers));
  }, [defaultHouseholdMembers]);

  const preview = useMemo(() => {
    const m3 = Number(totalM3Input.replace(",", "."));
    const hh = Number(householdInput);
    if (!Number.isFinite(m3) || m3 <= 0 || !Number.isFinite(hh) || hh < 1) return null;
    const perCapita = m3 / hh;
    const underMeta = perCapita <= optimalPerCapitaM3;
    const ratio = Math.min(1.2, perCapita / Math.max(0.01, optimalPerCapitaM3));
    const barPct = Math.min(100, (ratio / 1.2) * 100);
    return { perCapita, underMeta, barPct };
  }, [totalM3Input, householdInput, optimalPerCapitaM3]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const householdSubmitted = Number(fd.get("householdMembers"));
    const ym = yearMonth || defaultYm;
    if (!ym) {
      setError("Elige un mes de facturación.");
      return;
    }
    const parts = ym.split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(y) || !Number.isFinite(m)) {
      setError("Periodo no válido.");
      return;
    }
    fd.set("year", String(y));
    fd.set("month", String(m));

    startTransition(async () => {
      try {
        await submitWaterBillPeriodAction(challengeId, fd);
        form.reset();
        setYearMonth(defaultYm);
        setTotalM3Input("");
        setHouseholdInput(
          Number.isFinite(householdSubmitted) && householdSubmitted >= 1
            ? String(householdSubmitted)
            : String(defaultHouseholdMembers),
        );
        setOk(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  };

  if (periodOptions.length === 0) {
    return (
      <section className="game-panel-3d relative overflow-hidden rounded-2xl p-6">
        <p className="text-sm leading-relaxed text-[#3d5670]">
          No hay periodos abiertos para declarar en este momento (fechas de campaña o límite de mes futuro).
        </p>
      </section>
    );
  }

  return (
    <section className="game-panel-3d relative overflow-hidden rounded-[2rem] p-6 md:p-8">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-[#38bdf8]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-[#22d3ee]/15 blur-3xl" />

      <div className="relative border-b-2 border-[#94a3b8]/40 pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
          Formulario de declaración
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#132238] md:text-2xl">Registrar un mes de facturación</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3d5670]">
          Los m³ y habitantes quedan en el sistema para que coordinación los compare con tu foto, sin transcribir de
          nuevo.
        </p>
      </div>

      {ok ? <SubmissionSuccessBanner variant="points_saved" /> : null}
      {error ? (
        <p className="relative mt-5 rounded-lg border-2 border-[#b91c1c] bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="relative mt-6 flex flex-col gap-8">
        <div>
          <StepBadge n={1} label="Periodo" />
          <div className={fieldBox}>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#3d5670]">Mes de facturación del recibo</span>
              <select
                value={yearMonth || defaultYm}
                onChange={(e) => setYearMonth(e.target.value)}
                required
                className={inputClass}
              >
                {periodOptions.map((o) => (
                  <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div>
          <StepBadge n={2} label="Datos del recibo" />
          <div className={fieldBox}>
            <p className="text-xs leading-relaxed text-[#3d5670]">
              Copia el <strong className="text-[#0f766e]">consumo total del periodo en m³</strong> tal como aparece en
              la factura.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#3d5670]">Total m³ en el recibo</span>
                <input
                  name="totalM3"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max="500"
                  required
                  value={totalM3Input}
                  onChange={(e) => setTotalM3Input(e.target.value)}
                  placeholder="Ej. 18.5"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#3d5670]">Personas en el hogar (este mes)</span>
                <input
                  name="householdMembers"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={15}
                  required
                  value={householdInput}
                  onChange={(e) => setHouseholdInput(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            {preview ? (
              <div className="mt-4 space-y-2">
                <div className="h-2.5 overflow-hidden rounded-full border-2 border-[#1e3a5f] bg-[#e2e8f0]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      preview.underMeta
                        ? "bg-gradient-to-r from-[#0d9488] to-[#34d399]"
                        : "bg-gradient-to-r from-[#d97706] to-[#fbbf24]"
                    }`}
                    style={{ width: `${preview.barPct}%` }}
                  />
                </div>
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 font-mono text-xs ${
                    preview.underMeta
                      ? "border-[#0d9488] bg-[#ccfbf1] text-[#134e4a]"
                      : "border-[#d97706] bg-[#fffbeb] text-[#92400e]"
                  }`}
                >
                  <span>
                    ≈ <strong className="tabular-nums text-[#132238]">{preview.perCapita.toFixed(2)}</strong> m³/persona
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-95">
                    Meta ≤ {optimalPerCapitaM3} · {preview.underMeta ? "dentro de meta" : "por encima (orientativo)"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-[#5b7cb8]">
                Al ingresar m³ e integrantes verás la estimación y la barra comparada con la meta.
              </p>
            )}
          </div>
        </div>

        <div>
          <StepBadge n={3} label="Evidencia" />
          <label
            className={`flex flex-col gap-2 rounded-2xl border-4 border-dashed border-[#0ea5e9] bg-[#f0f9ff] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`}
          >
            <span className="text-xs font-semibold text-[#0369a1]">
              Foto del recibo {challengeRequiresEvidence ? "(obligatoria)" : "(opcional)"}
            </span>
            <span className="text-[11px] leading-relaxed text-[#3d5670]">
              Ideal: zona con <strong className="text-[#0f766e]">fecha de facturación</strong> o periodo. Alternativa:{" "}
              <strong className="text-[#0f766e]">tabla de consumo de meses anteriores</strong>.
            </span>
            <input
              name="evidence"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required={challengeRequiresEvidence}
              className="mt-1 text-sm text-[#132238] file:mr-3 file:rounded-xl file:border-2 file:border-[#1e3a5f] file:bg-[#dbeafe] file:px-4 file:py-2.5 file:font-mono file:text-sm file:font-semibold file:text-[#1e40af] file:shadow-[0_3px_0_#1e3a5f] hover:file:brightness-105"
            />
          </label>
        </div>

        <div className="mt-8 border-t-2 border-[#94a3b8]/40 pt-6">
          <button
            type="submit"
            disabled={pending}
            className="group flex w-full flex-col items-center gap-3 rounded-2xl border-4 border-[#0f766e] bg-gradient-to-b from-[#5eead4] via-[#2dd4bf] to-[#0d9488] px-5 py-5 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_6px_0_#115e59,0_12px_28px_rgba(13,148,136,0.35)] transition hover:brightness-[1.04] active:translate-y-[3px] active:shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_3px_0_#115e59] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 sm:flex-row sm:justify-center sm:gap-4 sm:py-4"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#0f766e]/55 bg-[#ccfbf1]/95 text-[#047857] shadow-[inset_0_2px_0_rgba(255,255,255,0.9)] group-disabled:opacity-70"
              aria-hidden
            >
              {pending ? (
                <span className="font-mono text-sm font-bold tracking-widest">···</span>
              ) : (
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>
            <span className="min-w-0 max-w-md text-center">
              <span className="font-pixel block text-[9px] uppercase tracking-[0.14em] text-[#ecfdf5]/95">
                {pending ? "Procesando" : "Confirmar en tablero"}
              </span>
              <span className="mt-1 block text-balance text-xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-2xl">
                {pending ? "Guardando datos del periodo…" : "Guardar este periodo"}
              </span>
              {!pending ? (
                <span className="mt-2 block font-mono text-[11px] leading-snug text-[#d1fae5]/95">
                  Los puntos se actualizan al guardar · recibo y m³ quedan registrados
                </span>
              ) : null}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
}
