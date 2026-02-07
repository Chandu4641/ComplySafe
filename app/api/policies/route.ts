import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPolicies } from "@/lib/data/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const policies = await getPolicies(session.orgId);
  return NextResponse.json({ policies });
}
