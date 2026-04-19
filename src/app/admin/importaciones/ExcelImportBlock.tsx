"use client";

import { useState } from "react";
import type { ImportResult } from "./actions";

type Props = {
  title: string;
  description: string;
  templateHref: string;
  templateLabel: string;
  importAction: (formData: FormData) => Promise<ImportResult>;
};

export function ExcelImportBlock({
  title,
  description,
  templateHref,
  templateLabel,
  importAction,
}: Props) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7aab8c]">{description}</p>
      <p className="mt-2">
        <a
          href={templateHref}
          className="font-mono text-xs text-[#8fd4a8] underline-offset-2 hover:underline"
          download
        >
          {templateLabel}
        </a>
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        action={async (fd) => {
          setPending(true);
          setResult(null);
          try {
            const r = await importAction(fd);
            setResult(r);
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-mono text-[10px] text-[#6a9c80]">Archivo .xlsx (primera hoja)</span>
          <input
            name="file"
            type="file"
            accept=".xlsx,.xls"
            required
            disabled={pending}
            className="text-sm text-[#e8f5ee] file:mr-3 file:rounded file:border-0 file:bg-[#1e4d35] file:px-3 file:py-1.5 file:font-mono file:text-sm file:text-[#e8f5ee]"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-2.5 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>
      {result ? (
        <div className="mt-4 rounded border border-[#243d30] bg-[#0d1512] p-3 font-mono text-xs text-[#c8e6d4]">
          <p className="text-[#8fd4a8]">
            Filas aplicadas correctamente: <span className="tabular-nums">{result.ok}</span>
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-[#f0b4b4]">
              {result.errors.map((e, i) => (
                <li key={i}>
                  {e.row > 0 ? `Fila ${e.row}: ` : ""}
                  {e.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[#6a8c78]">Sin errores por fila.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
