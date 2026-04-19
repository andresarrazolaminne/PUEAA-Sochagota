type Props = {
  ok?: string;
  err?: string;
};

export function ReviewAlerts({ ok, err }: Props) {
  if (err === "acopio_categories") {
    return (
      <div className="rounded border border-[#8a4040] bg-[#1a1010] px-3 py-2 font-mono text-xs text-[#f0c4c4]">
        Si añades el lugar al directorio, marca al menos una categoría de residuo que acepte el punto.
      </div>
    );
  }
  if (err === "reject_short") {
    return (
      <div className="rounded border border-[#8a4040] bg-[#1a1010] px-3 py-2 font-mono text-xs text-[#f0c4c4]">
        El motivo de rechazo debe tener al menos 10 caracteres.
      </div>
    );
  }
  if (ok === "approved") {
    return (
      <div className="rounded border border-[#35664a] bg-[#0f1a14] px-3 py-2 font-mono text-xs text-[#8fd4a8]">
        Registro aprobado.
      </div>
    );
  }
  if (ok === "rejected") {
    return (
      <div className="rounded border border-[#5a4a30] bg-[#1a1510] px-3 py-2 font-mono text-xs text-[#fde68a]">
        Registro rechazado.
      </div>
    );
  }
  return null;
}
