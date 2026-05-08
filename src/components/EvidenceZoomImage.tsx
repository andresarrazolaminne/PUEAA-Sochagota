"use client";

import { useMemo, useState } from "react";
import { withBasePathIfNeeded } from "@/lib/base-path";

type Props = {
  imageSrc: string;
  alt: string;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const STEP = 0.25;

export function EvidenceZoomImage({ imageSrc, alt }: Props) {
  const [zoom, setZoom] = useState(1);
  const resolvedSrc = useMemo(() => withBasePathIfNeeded(imageSrc), [imageSrc]);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, Number((z + STEP).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, Number((z - STEP).toFixed(2))));
  const reset = () => setZoom(1);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#9ed4b4] hover:border-[#35664a]"
        >
          Zoom -
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#9ed4b4] hover:border-[#35664a]"
        >
          Zoom +
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#9ed4b4] hover:border-[#35664a]"
        >
          Reset
        </button>
        <span className="font-mono text-[10px] text-[#6a8c78]">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="max-h-[420px] overflow-auto rounded border border-[#243d30] bg-[#0b1210] p-2">
        <img
          src={resolvedSrc}
          alt={alt}
          className="origin-top-left object-contain"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        />
      </div>
    </div>
  );
}
