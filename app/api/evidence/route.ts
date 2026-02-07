import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getEvidence } from "@/lib/data/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const evidence = await getEvidence(session.orgId);
  return NextResponse.json({ evidence });
}
