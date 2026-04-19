import { prisma } from "@/lib/prisma";

export type EmployeeWithPoints = {
  id: string;
  cedula: string;
  fullName: string;
  photoUrl: string | null;
  role: string;
  active: boolean;
  totalPoints: number;
  createdAt: Date;
};

export async function listEmployeesWithPoints(): Promise<EmployeeWithPoints[]> {
  const [employees, sums] = await Promise.all([
    prisma.employee.findMany({ orderBy: { fullName: "asc" } }),
    prisma.pointLedger.groupBy({
      by: ["employeeId"],
      _sum: { delta: true },
    }),
  ]);

  const sumMap = new Map<string, number>();
  for (const row of sums) {
    sumMap.set(row.employeeId, row._sum.delta ?? 0);
  }

  return employees.map((e) => ({
    id: e.id,
    cedula: e.cedula,
    fullName: e.fullName,
    photoUrl: e.photoUrl,
    role: e.role,
    active: e.active,
    totalPoints: sumMap.get(e.id) ?? 0,
    createdAt: e.createdAt,
  }));
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({ where: { id } });
}
