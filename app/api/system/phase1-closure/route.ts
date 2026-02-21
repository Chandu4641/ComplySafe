import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reportPath = path.join(process.cwd(), "docs", "verification", "phase1-closure-status.json");

  try {
    const report = await readFile(reportPath, "utf8");
    return NextResponse.json(JSON.parse(report));
  } catch {
    return NextResponse.json(
      {
        error: "Phase 1 closure report not found",
        hint: "Run npm run phase1:verify && npm run phase1:closure"
      },
      { status: 404 }
    );
  }
}
