import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 4 * 1024 * 1024;

function resolveUploadDir(): string {
  const raw = process.env.UPLOAD_DIR?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  }
  return path.join(process.cwd(), "data", "uploads");
}

const ALLOWED: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export function getWaterBillEvidenceDir(): string {
  return path.join(resolveUploadDir(), "water-bills");
}

export function publicWaterBillEvidenceUrl(filename: string): string {
  return `/api/water-bill-evidence/${filename}`;
}

export async function saveWaterBillEvidenceUpload(
  file: File,
): Promise<{ ok: true; publicPath: string } | { ok: false; reason: "type" | "size" | "write" }> {
  if (file.size > MAX_BYTES) return { ok: false, reason: "size" };
  const ext = ALLOWED[file.type];
  if (!ext) return { ok: false, reason: "type" };

  const dir = getWaterBillEvidenceDir();
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const fullPath = path.join(dir, filename);

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buf);
  } catch {
    return { ok: false, reason: "write" };
  }

  return { ok: true, publicPath: publicWaterBillEvidenceUrl(filename) };
}
