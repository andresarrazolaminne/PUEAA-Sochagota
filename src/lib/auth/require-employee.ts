import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

export async function requireEmployee(nextPath = "/tablero") {
  const employee = await getCurrentEmployee();
  if (!employee) {
    const q = new URLSearchParams({ next: safeInternalPath(nextPath) });
    redirect(`/login?${q.toString()}`);
  }
  return employee;
}
