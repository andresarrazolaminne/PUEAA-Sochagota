import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { getWasteEvidenceDir } from "@/lib/uploads/waste-evidence";
import { servePrivateUpload } from "@/lib/uploads/serve-private";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  return servePrivateUpload(filename, getWasteEvidenceDir, async (employee) => {
    if (employee.role === Role.ADMIN) return true;
    const row = await prisma.evidenceSubmission.findFirst({
      where: { filePath: { contains: filename } },
      select: { participation: { select: { employeeId: true } } },
    });
    return !!row && row.participation.employeeId === employee.id;
  });
}
