import { NextResponse } from "next/server";
import { runPublicScan } from "@/lib/public-scan/analyze";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const companyName = String(body.company_name ?? "");
  const website = String(body.website ?? "");
  const targetCustomers = String(body.target_customers ?? "Global");

  if (!companyName || !website) {
    return NextResponse.json({ error: "company_name and website are required" }, { status: 400 });
  }

  try {
    const result = await runPublicScan({
      companyName,
      website,
      country: body.country ? String(body.country) : undefined,
      industry: body.industry ? String(body.industry) : undefined,
      targetCustomers: targetCustomers as "India" | "EU" | "US" | "Global",
      framework: body.framework,
      frameworks: body.frameworks,
      applyAll: Boolean(body.apply_all)
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
