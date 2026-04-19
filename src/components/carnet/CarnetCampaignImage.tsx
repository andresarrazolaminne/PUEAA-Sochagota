import Image from "next/image";
import { withBasePathIfNeeded } from "@/lib/base-path";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** `/public` con next/image; `/api/...` y URLs externas con img. */
export function CarnetCampaignImage({ src, alt, className, sizes, priority }: Props) {
  const local = src.startsWith("/") && !src.startsWith("/api/");
  const baseClass =
    "max-h-full max-w-full object-contain [image-rendering:pixelated]" +
    (className ? ` ${className}` : "");

  if (local) {
    return (
      <Image
        src={src}
        alt={alt}
        width={200}
        height={200}
        className={baseClass}
        sizes={sizes ?? "(max-width: 640px) 144px, 176px"}
        priority={priority}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL configurable por admin (externa)
    <img src={withBasePathIfNeeded(src)} alt={alt} className={baseClass} />
  );
}
