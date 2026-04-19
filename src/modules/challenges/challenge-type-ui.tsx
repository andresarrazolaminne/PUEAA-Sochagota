import type { ReactNode } from "react";
import { ChallengeType } from "@/generated/prisma/enums";

/** Etiqueta corta para chips y listas. */
export function challengeTypeShortLabel(type: ChallengeType): string {
  switch (type) {
    case ChallengeType.WATER_BILL:
      return "Recibo de agua";
    case ChallengeType.WASTE_EVIDENCE:
      return "Evidencia residuos";
    case ChallengeType.PLACE_DOCUMENTATION:
      return "Lugares de acopio";
    case ChallengeType.TRIVIA:
      return "Trivia";
    case ChallengeType.MINIGAME:
      return "Minijuego";
    case ChallengeType.OTHER:
      return "Otro reto";
  }
}

/** Contenedor del icono en tarjetas (fondo + borde acorde al tipo). */
export function challengeTypeIconShellClass(type: ChallengeType): string {
  switch (type) {
    case ChallengeType.WATER_BILL:
      return "border-[#0369a1] bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] text-[#0369a1]";
    case ChallengeType.WASTE_EVIDENCE:
      return "border-[#047857] bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] text-[#047857]";
    case ChallengeType.PLACE_DOCUMENTATION:
      return "border-[#b45309] bg-gradient-to-br from-[#ffedd5] to-[#fde68a] text-[#b45309]";
    case ChallengeType.TRIVIA:
      return "border-[#6d28d9] bg-gradient-to-br from-[#ede9fe] to-[#ddd6fe] text-[#5b21b6]";
    case ChallengeType.MINIGAME:
      return "border-[#be185d] bg-gradient-to-br from-[#fce7f3] to-[#fbcfe8] text-[#9d174d]";
    case ChallengeType.OTHER:
      return "border-[#475569] bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] text-[#334155]";
  }
}

type IconProps = { className?: string; "aria-hidden"?: boolean };

function IconWater({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...rest}>
      <path d="M12 2.69c-3.08 3.08-6 6.88-6 10.56A6 6 0 0012 22a6 6 0 006-8.75c0-3.68-2.92-7.48-6-10.56zM12 20a4 4 0 01-1.72-7.6l.34-.18A4 4 0 0112 20z" />
    </svg>
  );
}

/** Contenedor / evidencia de residuos (cubo + tapa). */
function IconWasteBin({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconMapPin({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function IconTrivia({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...rest}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function IconGamepad({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...rest}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12h4m-2-2v4m7-1h.01M18 11h.01M9 16h6a4 4 0 004-4V9a4 4 0 00-4-4H9a4 4 0 00-4 4v3a4 4 0 004 4z"
      />
    </svg>
  );
}

function IconSparkles({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...rest}>
      <path d="M11.5 2L9 9l-7 2.5L9 13l2.5 7 2.5-7 7-2.5-7-2.5L11.5 2zM19.5 3.5L18.5 6l-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5z" />
    </svg>
  );
}

/** Icono reconocible por tipo de reto (SVG, estilo menú arcade). */
export function ChallengeTypeIcon({
  type,
  className = "h-8 w-8",
}: {
  type: ChallengeType;
  className?: string;
}): ReactNode {
  const common = { className, "aria-hidden": true as const };
  switch (type) {
    case ChallengeType.WATER_BILL:
      return <IconWater {...common} />;
    case ChallengeType.WASTE_EVIDENCE:
      return <IconWasteBin {...common} />;
    case ChallengeType.PLACE_DOCUMENTATION:
      return <IconMapPin {...common} />;
    case ChallengeType.TRIVIA:
      return <IconTrivia {...common} />;
    case ChallengeType.MINIGAME:
      return <IconGamepad {...common} />;
    case ChallengeType.OTHER:
      return <IconSparkles {...common} />;
  }
}
