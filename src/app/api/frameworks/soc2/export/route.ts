export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { ensurePhase2FrameworkCatalogs } from "@/backend/frameworks/service";
import { buildSoc2CoverageReport } from "@/backend/reporting/soc2Coverage";

function toCsv(report: Awaited<ReturnType<typeof buildSoc2CoverageReport>>) {
  const header = [
    "criteria",
    "controls_total",
    "controls_applicable",
    "controls_implemented",
    "readiness_percent",
    "evidence_coverage",
    "weight"
  ];

  const rows = report.readiness.criteriaReadiness.map((row) => [
    row.criteria,
    String(row.controlsTotal),
    String(row.controlsApplicable),
    String(row.controlsImplemented),
    String(row.readinessPercent),
    String(row.evidenceCoverage),
    String(row.weight)
  ]);

  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensurePhase2FrameworkCatalogs();

  const report = await buildSoc2CoverageReport(session.orgId);
  const url = new URL(request.url);
  const format = String(url.searchParams.get("format") || "json").toLowerCase();

  if (format === "csv") {
    return new NextResponse(toCsv(report), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=soc2-coverage.csv"
      }
    });
  }

  return NextResponse.json({ report, readinessPercent: report.readiness.overallReadinessPercent });
}
