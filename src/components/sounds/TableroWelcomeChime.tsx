"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { playMilestoneChime } from "@/lib/sounds/retro-sounds";

/** Tras login correcto: un arpegio y limpieza de `?bienvenida=1` de la URL. */
export function TableroWelcomeChime({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!enabled || done.current) return;
    done.current = true;
    playMilestoneChime();
    router.replace("/tablero", { scroll: false });
  }, [enabled, router]);

  return null;
}
