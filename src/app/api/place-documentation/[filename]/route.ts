import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { getPlaceDocumentationDir } from "@/lib/uploads/place-documentation";
import { servePrivateUpload } from "@/lib/uploads/serve-private";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  return servePrivateUpload(filename, getPlaceDocumentationDir, async (employee) => {
    if (employee.role === Role.ADMIN) return true;
    const row = await prisma.placeDocumentationSubmission.findFirst({
      where: { photoFilePath: { contains: filename } },
      select: { participation: { select: { employeeId: true } } },
    });
    return !!row && row.participation.employeeId === employee.id;
  });
}
