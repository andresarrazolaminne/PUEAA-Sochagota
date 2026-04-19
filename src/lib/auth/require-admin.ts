import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { Role } from "@/generated/prisma/enums";

/**
 * Solo empleados con rol ADMIN. Sin sesión → login; no admin → tablero.
 */
export async function requireAdmin(nextPath = "/admin") {
  const employee = await getCurrentEmployee();
  if (!employee) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (employee.role !== Role.ADMIN) {
    redirect("/tablero");
  }
  return employee;
}
