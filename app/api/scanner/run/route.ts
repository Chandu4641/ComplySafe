export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { analyzeText, DEFAULT_RULES, Rule } from "@/lib/scanner/compliance";

async function readFileAsText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("utf-8");
}

function extractLinks(html: string, baseUrl: string) {
  const urls: string[] = [];
  const base = new URL(baseUrl);
  const regex = /href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    try {
      const url = new URL(match[1], base);
      if (url.origin === base.origin) {
        urls.push(url.toString());
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return Array.from(new Set(urls)).slice(0, 6);
}

async function fetchText(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Fetch failed with status ${res.status}`);
  }
  return res.text();
}

async function crawlUrl(url: string, depth: number, rateMs: number) {
  const html = await fetchText(url);
  if (depth <= 0) return { text: html, visited: [] as string[] };
  const links = extractLinks(html, url);
  const collected: string[] = [];
  const visited: string[] = [];
  for (const link of links) {
    try {
      await new Promise((r) => setTimeout(r, rateMs));
      const page = await fetchText(link);
      collected.push(page);
      visited.push(link);
    } catch {
      // ignore
    }
  }
  if (depth <= 1) return { text: `${html}\n${collected.join("\n")}`, visited };

  // depth 2+: crawl the first level again (limited)
  const secondWave: string[] = [];
  for (const link of links.slice(0, 2)) {
    try {
      await new Promise((r) => setTimeout(r, rateMs));
      const page = await fetchText(link);
      secondWave.push(page);
      if (!visited.includes(link)) visited.push(link);
    } catch {
      // ignore
    }
  }
  return { text: `${html}\n${collected.join("\n")}\n${secondWave.join("\n")}`, visited };
}

async function parseFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as { default: (input: Buffer) => Promise<{ text?: string }> })
      .default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    return data.text ?? "";
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value } = await mammoth.extractRawText({ buffer });
    return value ?? "";
  }
  return readFileAsText(file);
}

async function loadRules(orgId: string): Promise<Rule[]> {
  try {
    const rules = await prisma.complianceRule.findMany({
      where: { enabled: true, OR: [{ orgId }, { orgId: null }] },
      orderBy: { createdAt: "asc" }
    });
    if (rules.length === 0) return DEFAULT_RULES;
    return rules.map((r: any) => ({
      id: r.framework,
      framework: r.framework,
      title: r.requirement.slice(0, 64),
      requirement: r.requirement,
      keywords: r.keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
      severity: r.severity as Rule["severity"],
      remediation: "Add or update policy text to address this requirement and provide evidence."
    }));
  } catch {
    return DEFAULT_RULES;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await request.formData();
    const url = String(form.get("url") ?? "").trim();
    const file = form.get("file");
    const crawlDepth = Number(form.get("crawlDepth") ?? "0");

    let text = "";
    let sourceType = "";
    let sourceName = "";
    let sourceUrl: string | undefined;

    let crawledUrls: string[] = [];
    if (url) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL must start with http:// or https://." }, { status: 400 });
      }
      sourceType = "url";
      sourceUrl = url;
      sourceName = url;
      const depth = Number.isFinite(crawlDepth) ? Math.min(3, Math.max(0, crawlDepth)) : 0;
      const result = await crawlUrl(url, depth, 350);
      text = result.text;
      crawledUrls = result.visited;
    } else if (file && file instanceof File) {
      sourceType = "file";
      sourceName = file.name;
      text = await parseFile(file);
    } else {
      return NextResponse.json({ error: "Provide a URL or a file." }, { status: 400 });
    }

    const rules = await loadRules(session.orgId);
    const analysis = analyzeText(text, rules);

    const scan = await prisma.scan.create({
      data: {
        orgId: session.orgId,
        type: "document",
        status: "complete",
        sourceType,
        sourceUrl,
        sourceName,
        riskScore: analysis.score,
        riskLevel: analysis.level
      }
    });

    const controlIds = analysis.findings.map((f: any) => f.controlId).filter(Boolean);
    const controls = controlIds.length
      ? await prisma.control.findMany({
          where: { orgId: session.orgId, controlId: { in: controlIds } },
          select: { id: true, controlId: true }
        })
      : [];
    const controlMap = new Map(controls.map((c: { controlId: string; id: string }) => [c.controlId, c.id]));

    await prisma.finding.createMany({
      data: analysis.findings.map((f) => ({
        scanId: scan.id,
        controlId: controlMap.get(f.controlId) ?? null,
        severity: f.severity,
        status: "Open",
        summary: f.summary,
        remediation: f.remediation
      }))
    });

    return NextResponse.json({
      scanId: scan.id,
      riskScore: analysis.score,
      riskLevel: analysis.level,
      findings: analysis.findings.length,
      crawledUrls
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
