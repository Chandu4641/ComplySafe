import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTasks } from "@/lib/data/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await getTasks(session.orgId);
  return NextResponse.json({ tasks });
}
