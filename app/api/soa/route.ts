export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateSoAPackage, toCsv } from "@/lib/soa/generator";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function wrapText(text: string, maxChars = 95) {
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

async function buildSoaPdf(pack: Awaited<ReturnType<typeof generateSoAPackage>>) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;

  page.drawText("Statement of Applicability", {
    x: 40,
    y,
    size: 18,
    font: bold,
    color: rgb(0.06, 0.08, 0.11)
  });
  y -= 22;
  page.drawText(`Organization: ${pack.organizationName}`, { x: 40, y, size: 10, font });
  y -= 12;
  const versionPart = pack.frameworkVersion ? ` ${pack.frameworkVersion}` : "";
  page.drawText(`Framework: ${pack.frameworkName}${versionPart}`, { x: 40, y, size: 10, font });
  y -= 12;
  page.drawText(`Generated: ${new Date().toISOString()}`, { x: 40, y, size: 10, font });
  y -= 24;

  const ensureSpace = (needed = 80) => {
    if (y > needed) return;
    page = doc.addPage([595, 842]);
    y = 800;
  };

  pack.rows.forEach((row, idx) => {
    ensureSpace(120);
    page.drawText(`${idx + 1}. ${row.controlId} - ${row.controlTitle}`, {
      x: 40,
      y,
      size: 11,
      font: bold
    });
    y -= 14;
    page.drawText(`Applicability: ${row.applicability}`, { x: 40, y, size: 10, font });
    y -= 12;
    page.drawText(`Status: ${row.implementationStatus}`, { x: 40, y, size: 10, font });
    y -= 12;

    const justificationLines = wrapText(`Justification: ${row.justification}`);
    justificationLines.forEach((line) => {
      ensureSpace(80);
      page.drawText(line, { x: 40, y, size: 9, font });
      y -= 11;
    });

    page.drawText(`Linked Risks: ${row.linkedRisks.join(", ") || "None"}`, { x: 40, y, size: 9, font });
    y -= 11;
    page.drawText(`Linked Evidence: ${row.linkedEvidence.join(", ") || "None"}`, { x: 40, y, size: 9, font });
    y -= 16;
  });

  return Buffer.from(await doc.save());
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const frameworkId = String(url.searchParams.get("frameworkId") || "").trim();
  const format = String(url.searchParams.get("format") || "json").toLowerCase();

  if (!frameworkId) {
    return NextResponse.json({ error: "frameworkId is required" }, { status: 400 });
  }

  const pack = await generateSoAPackage(session.orgId, frameworkId);

  if (format === "csv") {
    return new NextResponse(toCsv(pack.rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="soa-${frameworkId}.csv"`
      }
    });
  }

  if (format === "pdf") {
    const pdf = await buildSoaPdf(pack);
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="soa-${frameworkId}.pdf"`
      }
    });
  }

  return NextResponse.json(pack);
}
