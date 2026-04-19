"use client";

import { useEffect, useRef } from "react";
import { CAMPAIGN_REVIEW_TEAM_NAME } from "@/lib/campaign-messages";
import { playMilestoneChime } from "@/lib/sounds/retro-sounds";

type Props = {
  variant: "pending_review" | "points_saved";
};

export function SubmissionSuccessBanner({ variant }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    playMilestoneChime();
  }, []);

  if (variant === "points_saved") {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className="relative mt-5 rounded-xl border-4 border-[#0d9488] bg-[#ccfbf1] px-4 py-4 shadow-[0_4px_0_#0f766e,inset_0_1px_0_rgba(255,255,255,0.5)]"
      >
        <p className="font-pixel text-[11px] uppercase tracking-[0.12em] text-[#0f766e]">Confirmación</p>
        <p className="mt-1 text-base font-bold text-[#134e4a]">Listo: quedó guardado</p>
        <p className="mt-2 text-sm leading-relaxed text-[#115e59]">
          Los puntos de este periodo de consumo ya se reflejan en tu tablero. Puedes declarar otro mes cuando
          corresponda.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="relative mt-5 rounded-xl border-4 border-[#2563eb] bg-[#dbeafe] px-4 py-4 shadow-[0_4px_0_#1e40af,inset_0_1px_0_rgba(255,255,255,0.55)]"
    >
      <p className="font-pixel text-[11px] uppercase tracking-[0.12em] text-[#1d4ed8]">Confirmación</p>
      <p className="mt-1 text-base font-bold text-[#1e3a8a]">Envío recibido correctamente</p>
      <p className="mt-2 text-sm leading-relaxed text-[#1e40af]">
        Tu aporte ya está registrado en el sistema. La <strong className="text-[#172554]">{CAMPAIGN_REVIEW_TEAM_NAME}</strong>{" "}
        revisará el contenido y, si todo está en orden, validará los puntos en tu tablero.
      </p>
      <p className="mt-3 border-t-2 border-[#93c5fd] pt-3 text-[11px] leading-relaxed text-[#1e40af]">
        No necesitas volver a enviar el mismo archivo: si ves este mensaje, el envío llegó bien.
      </p>
    </div>
  );
}
