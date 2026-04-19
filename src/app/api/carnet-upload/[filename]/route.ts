import { existsSync } from "fs";
import { readFile, realpath } from "fs/promises";
import path from "path";
import { getCarnetUploadDir } from "@/lib/uploads/carnet-logo";

const CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const dir = getCarnetUploadDir();
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
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}
