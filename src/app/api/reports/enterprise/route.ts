export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { buildEnterpriseReports } from "@/backend/reporting/enterprise";

function toCsv(report: Awaited<ReturnType<typeof buildEnterpriseReports>>) {
  const lines = [
    "metric,value",
    `iso_readiness,${report.isoReadinessReport.readiness}`,
    `iso_evidence_coverage,${report.isoReadinessReport.evidenceCoverage}`,
    `soc2_readiness,${report.soc2ReadinessReport.readiness}`,
    `soc2_risk_mitigation,${report.soc2ReadinessReport.riskMitigation}`,
    `risk_high,${report.riskHeatmap.high}`,
    `risk_medium,${report.riskHeatmap.medium}`,
    `risk_low,${report.riskHeatmap.low}`
  ];
  return `${lines.join("\n")}\n`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await buildEnterpriseReports(session.orgId);
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "json").toLowerCase();

  if (format === "csv") {
    return new NextResponse(toCsv(report), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=enterprise-report.csv"
      }
    });
  }

  if (format === "pdf") {
    // Lightweight PDF placeholder to keep route deterministic without extra rendering complexity.
    const text = `Enterprise Report\nISO readiness: ${report.isoReadinessReport.readiness}\nSOC2 readiness: ${report.soc2ReadinessReport.readiness}`;
    return new NextResponse(text, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=enterprise-report.pdf"
      }
    });
  }

  return NextResponse.json({ report });
}
