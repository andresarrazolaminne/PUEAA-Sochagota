import type { NextConfig } from "next";

/** Sincronizado con `normalizedPublicBasePath` en `src/lib/base-path.ts` (misma env). */
function basePathFromEnv(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  if (!raw) return undefined;
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  const trimmed = withLeading.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

const nextConfig: NextConfig = {
  basePath: basePathFromEnv(),
};

export default nextConfig;
