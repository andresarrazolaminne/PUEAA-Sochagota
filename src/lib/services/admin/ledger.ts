import { prisma } from "@/lib/prisma";

export async function listLedgerEntriesForEmployee(employeeId: string) {
  return prisma.pointLedger.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
}
