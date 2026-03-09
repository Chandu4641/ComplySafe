export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getRegulatoryChanges, syncRegulatoryFeed } from "@/backend/regulatory/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const framework = url.searchParams.get("framework") ?? undefined;
  const jurisdiction = url.searchParams.get("jurisdiction") ?? undefined;

  const report = await getRegulatoryChanges(session.orgId, { framework, jurisdiction });
  return NextResponse.json({ report });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncRegulatoryFeed(session.orgId);
  return NextResponse.json({ result });
}
