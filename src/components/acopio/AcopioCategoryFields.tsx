"use client";

import type { AcopioCategory } from "@/generated/prisma/enums";
import { ACOPIO_CATEGORY_ORDER, acopioCategoryLabel } from "@/lib/herramientas/acopio-categories";

type Variant = "admin" | "tablero";

const fieldsetClass: Record<Variant, string> = {
  admin: "max-h-52 overflow-y-auto rounded border border-[#243d30] bg-[#0d1512] p-2",
  tablero:
    "max-h-56 overflow-y-auto rounded-2xl border-2 border-[#94a3b8]/50 bg-[#f8fafc] p-3 shadow-inner",
};

const legendClass: Record<Variant, string> = {
  admin: "px-1 font-mono text-[9px] uppercase tracking-wider text-[#5a8f72]",
  tablero: "px-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#047857]",
};

const labelClass: Record<Variant, string> = {
  admin: "flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[#c8e6d4]",
  tablero: "flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-[#1c1917]",
};

const hintClass: Record<Variant, string> = {
  admin: "mt-2 border-t border-[#243d30] pt-2 font-mono text-[9px] text-[#6a8c78]",
  tablero: "mt-2 border-t border-[#94a3b8]/40 pt-2 text-[11px] text-[#57534e]",
};

type Props = {
  variant: Variant;
  /** Valores con marca por defecto (p. ej. categorías ya enviadas por el jugador). */
  defaultSelected?: AcopioCategory[];
  legend?: string;
  hint?: string;
};

export function AcopioCategoryFields({
  variant,
  defaultSelected = [],
  legend,
  hint,
}: Props) {
  const selected = new Set(defaultSelected);
  const leg =
    legend ??
    (variant === "admin" ? "Categorías en el directorio" : "¿Qué residuos gestiona este punto?");
  const hi =
    hint ??
    (variant === "admin"
      ? 'Obligatorio si marcas "Añadir al directorio de acopio".'
      : "Marca todas las que apliquen; ayuda a filtrar el directorio público.");

  return (
    <fieldset className={fieldsetClass[variant]}>
      <legend className={legendClass[variant]}>{leg}</legend>
      <ul className="mt-2 space-y-1.5">
        {ACOPIO_CATEGORY_ORDER.map((value) => (
          <li key={value}>
            <label className={labelClass[variant]}>
              <input
                type="checkbox"
                name="categories"
                value={value}
                defaultChecked={selected.has(value)}
                className={
                  variant === "admin"
                    ? "mt-0.5 shrink-0 rounded border-[#243d30]"
                    : "mt-0.5 shrink-0 rounded border-[#94a3b8] text-[#059669] focus:ring-[#059669]"
                }
              />
              <span>{acopioCategoryLabel(value)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className={hintClass[variant]}>{hi}</p>
    </fieldset>
  );
}
