export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/backend/auth/session";
import { getDashboardStats, getFindings, getRecentScans } from "@/backend/data/queries";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.orgId; // orgId: session.orgId

  // Ensure all data fetching is scoped to the current tenant
  const [stats, findings, scans] = await Promise.all([
    getDashboardStats(orgId),
    getFindings(orgId),
    getRecentScans(orgId)
  ]);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  let y = 800;
  const headerY = 800;

  try {
    const logoUrl = new URL("/complysafe-logo.png", request.url);
    const res = await fetch(logoUrl);
    if (res.ok) {
      const img = await pdfDoc.embedPng(Buffer.from(await res.arrayBuffer()));
      const dims = img.scale(0.3);
      page.drawImage(img, { x: 40, y: headerY - dims.height, width: dims.width, height: dims.height });
    }
  } catch {
    // ignore logo errors
  }

  const brandX = 180;
  page.drawText("ComplySafe", { x: brandX, y: headerY - 10, size: 16, font: bold, color: rgb(0.06, 0.08, 0.11) });
  page.drawText("Compliance Automation", { x: brandX, y: headerY - 26, size: 9, font, color: rgb(0.36, 0.4, 0.45) });

  y -= 80;
  page.drawText("Audit Readiness Report", { x: 40, y, size: 18, font: bold, color: rgb(0.11, 0.6, 0.66) });
  y -= 20;
  page.drawText(`Organization: ${session.org.name}`, { x: 40, y, size: 11, font });
  y -= 16;
  page.drawText(`Generated: ${new Date().toLocaleDateString("en-US")}`, { x: 40, y, size: 11, font });
  y -= 24;
  page.drawText("Executive Summary", { x: 40, y, size: 13, font: bold });
  y -= 16;
  page.drawText(`Coverage: ${stats.coverage}%`, { x: 40, y, size: 11, font });
  y -= 14;
  page.drawText(`Open Risks: ${stats.openRisks}`, { x: 40, y, size: 11, font });
  y -= 14;
  page.drawText(`Evidence Items: ${stats.evidence}`, { x: 40, y, size: 11, font });

  const scansPage = pdfDoc.addPage([595, 842]);
  let sy = 800;
  scansPage.drawText("Recent Scans", { x: 40, y: sy, size: 14, font: bold });
  sy -= 18;
  scans.forEach((s: any) => {
    scansPage.drawText(`- ${s.sourceName} | ${s.level} | ${s.score}`, { x: 50, y: sy, size: 10, font });
    sy -= 14;
  });

  const findingsPage = pdfDoc.addPage([595, 842]);
  let fy = 800;
  findingsPage.drawText("Top Findings", { x: 40, y: fy, size: 14, font: bold });
  fy -= 18;
  findings.slice(0, 12).forEach((f: any) => {
    fy = drawLines(findingsPage, wrapText(`${f.id} | ${f.control} | ${f.severity} | ${f.status}`, 90), 50, fy, 10, font);
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=complysafe-audit-report.pdf"
    }
  });
}
