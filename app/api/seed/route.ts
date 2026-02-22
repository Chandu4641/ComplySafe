import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { ensureIsoFrameworkCatalog, activateFrameworkForOrganization } from "@/lib/frameworks/service";
import { calculateComplianceScore } from "@/lib/compliance/score";

export async function POST() {
  const org = await prisma.organization.create({ data: { name: "Demo Org" } });
  const user = await prisma.user.create({
    data: { email: "demo@complysafe.io", role: "owner", orgId: org.id }
  });
  const framework = await ensureIsoFrameworkCatalog();
  await activateFrameworkForOrganization(org.id, framework.key);

  const controls = await prisma.control.findMany({
    where: { orgId: org.id, frameworkId: framework.id },
    take: 2,
    orderBy: { controlId: "asc" }
  });

  const scan = await prisma.scan.create({
    data: { orgId: org.id, type: "baseline", status: "complete" }
  });
  await prisma.finding.createMany({
    data: [
      {
        scanId: scan.id,
        controlId: controls[0]?.id,
        severity: "High",
        status: "Open",
        summary: "MFA not enforced for all admins."
      },
      {
        scanId: scan.id,
        controlId: controls[1]?.id ?? controls[0]?.id,
        severity: "Medium",
        status: "Open",
        summary: "No automated backups for production DB."
      }
    ]
  });
  await prisma.policy.createMany({
    data: [
      { orgId: org.id, title: "Access Control Policy", status: "approved", version: 1 },
      { orgId: org.id, title: "Change Management Policy", status: "draft", version: 1 }
    ]
  });
  await prisma.task.createMany({
    data: [
      { orgId: org.id, title: "Enable MFA for all users", status: "open" },
      { orgId: org.id, title: "Rotate admin credentials", status: "in_progress" }
    ]
  });
  await prisma.evidence.createMany({
    data: [
      {
        orgId: org.id,
        controlId: controls[0]?.id,
        source: "Okta",
        status: "VALID",
        uploadedBy: user.id
      },
      {
        orgId: org.id,
        controlId: controls[1]?.id ?? controls[0]?.id,
        source: "AWS",
        status: "VALID",
        uploadedBy: user.id
      }
    ]
  });

  await calculateComplianceScore(org.id, framework.id);

  return NextResponse.json({ org, user, scan });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET", note: "Route is available" });
}
