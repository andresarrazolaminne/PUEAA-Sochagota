import { getCurrentEmployee } from "@/lib/auth/current-employee";
import type { Employee } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";

export async function requireSessionEmployeeApi(): Promise<
  { ok: true; employee: Employee } | { ok: false; response: Response }
> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return {
      ok: false,
      response: new Response("Unauthorized", { status: 401 }),
    };
  }
  return { ok: true, employee };
}

export async function requireSessionAdminApi(): Promise<
  { ok: true; employee: Employee } | { ok: false; response: Response }
> {
  const gate = await requireSessionEmployeeApi();
  if (!gate.ok) return gate;
  if (gate.employee.role !== Role.ADMIN) {
    return {
      ok: false,
      response: new Response("Forbidden", { status: 403 }),
    };
  }
  return gate;
}
