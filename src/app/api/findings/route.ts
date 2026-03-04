import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getFindings } from "@/backend/data/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const findings = await getFindings(session.orgId);
  return NextResponse.json({ findings });
}
