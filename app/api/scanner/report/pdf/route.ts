import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
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

async function buildScannerPdf(scan: any, findings: any[], logoBuffer?: Buffer) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  let y = 800;
  const headerY = 800;

  if (logoBuffer) {
    try {
      const img = await pdfDoc.embedPng(logoBuffer);
      const dims = img.scale(0.3);
      page.drawImage(img, { x: 40, y: headerY - dims.height, width: dims.width, height: dims.height });
    } catch {
      // ignore logo errors
    }
  }

  const brandX = logoBuffer ? 180 : 40;
  page.drawText("ComplySafe", { x: brandX, y: headerY - 10, size: 16, font: bold, color: rgb(0.06, 0.08, 0.11) });
  page.drawText("Compliance Automation", { x: brandX, y: headerY - 26, size: 9, font, color: rgb(0.36, 0.4, 0.45) });

  y -= 80;
  page.drawText("Compliance Risk Scanner Report", { x: 40, y, size: 18, font: bold, color: rgb(0.11, 0.6, 0.66) });
  y -= 24;
  page.drawText(`Source: ${scan.sourceName ?? "document"}`, { x: 40, y, size: 11, font });
  y -= 16;
  page.drawText(`Risk Score: ${scan.riskScore ?? 0}`, { x: 40, y, size: 11, font });
  y -= 16;
  page.drawText(`Risk Level: ${scan.riskLevel ?? "Medium"}`, { x: 40, y, size: 11, font });
  y -= 16;
  page.drawText(`Date: ${new Date(scan.startedAt).toLocaleDateString("en-US")}`, { x: 40, y, size: 11, font });

  const findingsPage = pdfDoc.addPage([595, 842]);
  let fy = 800;
  findingsPage.drawText("Findings & Remediation", { x: 40, y: fy, size: 14, font: bold });
  fy -= 18;
  findings.forEach((f) => {
    const lines = wrapText(`- ${f.summary}`, 90);
    fy = drawLines(findingsPage, lines, 50, fy, 10, font);
    if (f.remediation) {
      fy = drawLines(findingsPage, wrapText(`Fix: ${f.remediation}`, 80), 60, fy, 9, font);
    }
    if (f.control?.controlId) {
      fy = drawLines(findingsPage, wrapText(`Control: ${f.control.controlId}`, 80), 60, fy, 9, font);
    }
    fy -= 6;
    if (fy < 80) {
      fy = 800;
      const newPage = pdfDoc.addPage([595, 842]);
      findingsPage.setSize(595, 842);
      findingsPage.drawText("", { x: 0, y: 0 });
    }
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get("scanId");
    if (!scanId) return NextResponse.json({ error: "scanId required" }, { status: 400 });

    const scan = await prisma.scan.findFirst({
      where: { id: scanId, orgId: session.orgId },
      include: { findings: { include: { control: true } } }
    });
    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

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

    const buffer = await buildScannerPdf(scan, scan.findings, logoBuffer ?? undefined);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=compliance-scan-report.pdf"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
