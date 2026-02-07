import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST() {
  const org = await prisma.organization.create({ data: { name: "Demo Org" } });
  const user = await prisma.user.create({
    data: { email: "demo@complysafe.io", role: "owner", orgId: org.id }
  });
  const scan = await prisma.scan.create({
    data: { orgId: org.id, type: "baseline", status: "complete" }
  });
  await prisma.finding.createMany({
    data: [
      {
        scanId: scan.id,
        controlId: "CC6.1",
        severity: "High",
        status: "Open",
        summary: "MFA not enforced for all admins."
      },
      {
        scanId: scan.id,
        controlId: "CC7.2",
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
      { orgId: org.id, controlId: "CC6.1", source: "Okta", status: "collected" },
      { orgId: org.id, controlId: "CC7.2", source: "AWS", status: "pending" }
    ]
  });

  return NextResponse.json({ org, user, scan });
}
