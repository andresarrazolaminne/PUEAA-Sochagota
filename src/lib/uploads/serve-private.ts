import { existsSync } from "fs";
import { readFile, realpath } from "fs/promises";
import path from "path";
import { requireSessionEmployeeApi } from "@/lib/auth/require-session-api";

const CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Sirve un archivo de uploads solo si hay sesión de empleado activa. */
export async function servePrivateUpload(
  filename: string,
  getDir: () => string,
): Promise<Response> {
  const gate = await requireSessionEmployeeApi();
  if (!gate.ok) return gate.response;

  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const dir = getDir();
  const fullPath = path.join(dir, filename);

  if (!existsSync(fullPath)) {
    return new Response("Not found", { status: 404 });
  }

  let dirReal: string;
  let fileReal: string;
  try {
    dirReal = await realpath(dir);
    fileReal = await realpath(fullPath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!fileReal.startsWith(dirReal + path.sep) && fileReal !== dirReal) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPE[ext] ?? "application/octet-stream";
  const body = await readFile(fileReal);
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
