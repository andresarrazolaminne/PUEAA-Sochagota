import { getWaterBillEvidenceDir } from "@/lib/uploads/water-bill-evidence";
import { servePrivateUpload } from "@/lib/uploads/serve-private";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  return servePrivateUpload(filename, getWaterBillEvidenceDir);
}
