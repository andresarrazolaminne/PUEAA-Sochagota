"use client";

import { useState, type ReactNode } from "react";

type Accent = "green" | "amber";

const accentStyles: Record<
  Accent,
  { border: string; from: string; to: string; inner: string; label: string; line: string }
> = {
  green: {
    border: "border-[#8fa894]/40",
    from: "from-[#eef4ef]",
    to: "to-[#dfe9e2]",
    inner: "bg-[#f4faf6]/95",
    label: "text-[#3f5247]",
    line: "border-[#b8c9bc]/70",
  },
  amber: {
    border: "border-[#c9a06a]/45",
    from: "from-[#faf4eb]",
    to: "to-[#efe4d4]",
    inner: "bg-[#fcf8f2]/95",
    label: "text-[#6b4f2a]",
    line: "border-[#dcc29a]/80",
  },
};

/**
 * Sección colapsable con aspecto de folio / hoja de expediente sobre el fondo oscuro.
 */
export function ChallengeFolioSheet({
  folio,
  title,
  subtitle,
  defaultOpen = false,
  accent = "green",
  children,
}: {
  folio: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  accent?: Accent;
  children: ReactNode;
}) {
  const a = accentStyles[accent];
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={`group relative overflow-hidden rounded-sm border ${a.border} bg-gradient-to-b ${a.from} ${a.to} text-[#1c1917] shadow-[5px_6px_0_0_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.65)]`}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 pr-10 text-left marker:content-none [&::-webkit-details-marker]:hidden">
        <span
          className={`mt-0.5 shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] ${a.label}`}
        >
          Folio {folio}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[15px] font-semibold leading-snug text-[#0f0e0c]">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-[11px] leading-relaxed text-[#57534e]">{subtitle}</span>
          ) : null}
        </span>
        <span
          className="mt-1 shrink-0 text-[#78716c] transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          ▼
        </span>
      </summary>
      <div
        className={`border-t ${a.line} px-4 py-3 text-[13px] leading-relaxed text-[#292524] shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] ${a.inner}`}
      >
        {children}
      </div>
    </details>
  );
}
