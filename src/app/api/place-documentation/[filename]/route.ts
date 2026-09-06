import { getPlaceDocumentationDir } from "@/lib/uploads/place-documentation";
import { servePrivateUpload } from "@/lib/uploads/serve-private";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  return servePrivateUpload(filename, getPlaceDocumentationDir);
}
