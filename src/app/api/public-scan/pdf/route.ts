import { NextResponse } from "next/server";
import { runPublicScan } from "@/backend/public-scan/analyze";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

function wrapText(text: string, maxChars = 90) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = `${line}${word} `;
    if (next.length > maxChars) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function drawLines(page: any, lines: string[], x: number, y: number, size: number, font: any) {
  let cursor = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font });
    cursor -= size + 4;
    if (cursor < 60) break;
  }
  return cursor;
}

async function buildPublicScanPdf(result: any, logoBuffer?: Buffer) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  let y = 800;
  const headerY = 800;
  let hasLogo = false;

  if (logoBuffer) {
    try {
      const img = await pdfDoc.embedPng(logoBuffer);
      const scale = Math.min(170 / img.width, 52 / img.height);
      const dims = img.scale(scale);
      page.drawImage(img, { x: 40, y: headerY - dims.height, width: dims.width, height: dims.height });
      hasLogo = true;
    } catch {
      // ignore logo errors
    }
  }

  if (!hasLogo) {
    page.drawText("ComplySafe", { x: 40, y: headerY - 10, size: 16, font: bold, color: rgb(0.06, 0.08, 0.11) });
    page.drawText("Compliance Automation", { x: 40, y: headerY - 26, size: 9, font, color: rgb(0.36, 0.4, 0.45) });
  }

  y -= 80;
  page.drawText("Public Website Compliance Assessment", { x: 40, y, size: 18, font: bold, color: rgb(0.11, 0.6, 0.66) });
  y -= 24;
  page.drawText(`Company: ${result.company_name}`, { x: 40, y, size: 11, font });
  y -= 16;
  page.drawText(`Website: ${result.website}`, { x: 40, y, size: 11, font });
  y -= 16;
  page.drawText(`Scan date: ${result.scan_date}`, { x: 40, y, size: 11, font });
  y -= 16;
  const applied = (result.frameworks_applied && result.frameworks_applied.length > 0)
    ? result.frameworks_applied.join(", ")
    : (result.framework ?? "N/A");
  page.drawText(`Frameworks: ${applied}`, { x: 40, y, size: 11, font });
  y -= 20;
  y = drawLines(page, wrapText(result.disclaimer ?? ""), 40, y, 9, font);

  const sections = [
    { title: "GDPR", data: result.gdpr },
    { title: "DPDP India", data: result.dpdp_india },
    { title: "HIPAA", data: result.hipaa }
  ];

  sections.forEach((section) => {
    const p = pdfDoc.addPage([595, 842]);
    let py = 800;
    p.drawText(section.title, { x: 40, y: py, size: 16, font: bold });
    py -= 20;
    p.drawText(`Applicable: ${section.data.applicable ? "Yes" : "No"}`, { x: 40, y: py, size: 11, font });
    py -= 16;
    p.drawText(`Score: ${section.data.score}`, { x: 40, y: py, size: 11, font });
    py -= 16;
    p.drawText(`Risk level: ${section.data.risk_level}`, { x: 40, y: py, size: 11, font });
    py -= 16;
    p.drawText(`Confidence: ${section.data.confidence}`, { x: 40, y: py, size: 11, font });
    py -= 20;

    p.drawText("Positive signals", { x: 40, y: py, size: 12, font: bold });
    py -= 16;
    (section.data.positive_signals ?? []).forEach((item: string) => {
      p.drawText(`- ${item}`, { x: 50, y: py, size: 10, font });
      py -= 14;
    });

    p.drawText("Missing or weak signals", { x: 40, y: py, size: 12, font: bold });
    py -= 16;
    (section.data.missing_or_weak_signals ?? []).forEach((item: string) => {
      p.drawText(`- ${item}`, { x: 50, y: py, size: 10, font });
      py -= 14;
    });

    p.drawText("Key findings", { x: 40, y: py, size: 12, font: bold });
    py -= 16;
    (section.data.key_findings ?? []).forEach((item: string) => {
      p.drawText(`- ${item}`, { x: 50, y: py, size: 10, font });
      py -= 14;
    });

    if (section.data.rationale) {
      p.drawText("Rationale", { x: 40, y: py, size: 12, font: bold });
      py -= 16;
      py = drawLines(p, wrapText(section.data.rationale), 50, py, 10, font);
    }

    if (section.data.remediation && section.data.remediation.length > 0) {
      p.drawText("Remediation", { x: 40, y: py, size: 12, font: bold });
      py -= 16;
      section.data.remediation.forEach((item: string) => {
        p.drawText(`- ${item}`, { x: 50, y: py, size: 10, font });
        py -= 14;
      });
    }
  });

  const frameworkReports = result.framework_reports ?? [];
  frameworkReports.forEach((report: any) => {
    const checklistPage = pdfDoc.addPage([595, 842]);
    let cy = 800;
    checklistPage.drawText(`Framework Checklist (${report.framework})`, { x: 40, y: cy, size: 14, font: bold });
    cy -= 18;
    checklistPage.drawText(`Score: ${report.score} (${report.risk_level})`, { x: 40, y: cy, size: 11, font });
    cy -= 16;
    (report.checklist ?? []).forEach((item: any) => {
      checklistPage.drawText(`- ${item.title} (${item.status})`, { x: 50, y: cy, size: 10, font });
      cy -= 14;
      if (item.remediation) {
        cy = drawLines(checklistPage, wrapText(`Fix: ${item.remediation}`, 80), 60, cy, 9, font);
      }
    });
  });

  const summary = pdfDoc.addPage([595, 842]);
  let sy = 800;
  summary.drawText("Overall Observations", { x: 40, y: sy, size: 14, font: bold });
  sy -= 18;
  (result.overall_observations ?? []).forEach((item: string) => {
    summary.drawText(`- ${item}`, { x: 50, y: sy, size: 10, font });
    sy -= 14;
  });
  sy -= 10;
  summary.drawText("Recommended Next Steps", { x: 40, y: sy, size: 14, font: bold });
  sy -= 18;
  (result.recommended_next_steps ?? []).forEach((item: string) => {
    summary.drawText(`- ${item}`, { x: 50, y: sy, size: 10, font });
    sy -= 14;
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const providedResult = body.result;
    let result = providedResult;

    if (!result) {
      const companyName = String(body.company_name ?? "");
      const website = String(body.website ?? "");
      const targetCustomers = String(body.target_customers ?? "Global");

      if (!companyName || !website) {
        return NextResponse.json({ error: "company_name and website are required" }, { status: 400 });
      }

      result = await runPublicScan({
        companyName,
        website,
        country: body.country ? String(body.country) : undefined,
        industry: body.industry ? String(body.industry) : undefined,
        targetCustomers: targetCustomers as "India" | "EU" | "US" | "Global",
        framework: body.framework,
        frameworks: body.frameworks,
        applyAll: Boolean(body.apply_all)
      });
    }

    result.checklist = result.checklist ?? [];

    let logoBuffer: Buffer | null = null;
    try {
      const logoUrl = new URL("/complysafe-logo.png", request.url);
      const res = await fetch(logoUrl);
      if (res.ok) {
        logoBuffer = Buffer.from(await res.arrayBuffer());
      }
    } catch {
      // ignore
    }

    const buffer = await buildPublicScanPdf(result, logoBuffer ?? undefined);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=public-compliance-report.pdf"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
