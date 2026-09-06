import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { buildBrandingBundleExport } from "@/lib/services/settings/campaign-branding-bundle";

export async function GET() {
  await requireAdmin("/admin/branding-sync");

  const bundle = await buildBrandingBundleExport();
  const body = JSON.stringify(bundle, null, 2);
  const filename = `pueaa-branding-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
