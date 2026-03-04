export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { ensureCrossFrameworkMappings, getFrameworkMappings } from "@/backend/mappings/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCrossFrameworkMappings();

  const url = new URL(request.url);
  const frameworkKey = String(url.searchParams.get("frameworkKey") || "").trim().toUpperCase();

  if (!frameworkKey) {
    return NextResponse.json({ error: "frameworkKey is required" }, { status: 400 });
  }

  const mappings = await getFrameworkMappings(frameworkKey);
  return NextResponse.json({ frameworkKey, count: mappings.length, mappings });
}
