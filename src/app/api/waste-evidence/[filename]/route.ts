import { getWasteEvidenceDir } from "@/lib/uploads/waste-evidence";
import { servePrivateUpload } from "@/lib/uploads/serve-private";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  return servePrivateUpload(filename, getWasteEvidenceDir);
}
