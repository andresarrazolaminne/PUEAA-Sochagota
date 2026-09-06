import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { getWaterBillEvidenceDir } from "@/lib/uploads/water-bill-evidence";
import { servePrivateUpload } from "@/lib/uploads/serve-private";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  return servePrivateUpload(filename, getWaterBillEvidenceDir, async (employee) => {
    if (employee.role === Role.ADMIN) return true;
    const row = await prisma.waterBillPeriod.findFirst({
      where: { evidenceFilePath: { contains: filename } },
      select: { employeeId: true },
    });
    return !!row && row.employeeId === employee.id;
  });
}
