export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getPolicies } from "@/backend/data/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const policies = await getPolicies(session.orgId);
  return NextResponse.json({ policies });
}
