import { prisma } from "../db/client";
import { runMockScan } from "../scanner";
import { generateMockPolicies } from "../policy";
import { createMockRemediationTasks } from "../remediation";
import { mockEvidence } from "../evidence";
import { getEnabledFrameworkForOrg } from "../frameworks/service";
import { calculateComplianceScore } from "../compliance/score";

export async function getDashboardStats(orgId: string) {
  try {
    const [findingsCount, evidenceCount, policiesCount, highRiskCount] = await Promise.all([
      prisma.finding.count({ where: { scan: { orgId } } }),
      prisma.evidence.count({ where: { orgId } }),
      prisma.policy.count({ where: { orgId } }),
      prisma.risk.count({ where: { orgId, inherentRiskScore: { gte: 15 }, status: { not: "MITIGATED" } } })
    ]);

    const enabledFramework = await getEnabledFrameworkForOrg(orgId);
    const score = enabledFramework ? await calculateComplianceScore(orgId, enabledFramework.id) : null;

    return {
      coverage: score?.overallScore ?? Math.min(95, Math.max(40, 100 - findingsCount * 2)),
      openRisks: highRiskCount || findingsCount,
      evidence: evidenceCount,
      policies: policiesCount,
      controlCompletion: score?.controlCompletion ?? 0,
      riskMitigation: score?.riskMitigation ?? 0,
      evidenceCoverage: score?.evidenceCoverage ?? 0
    };
  } catch {
    return {
      coverage: 78,
      openRisks: 12,
      evidence: 142,
      policies: 6
    };
  }
}

export async function getFindings(orgId: string) {
  try {
    const findings = await prisma.finding.findMany({
      where: { scan: { orgId } },
      take: 10,
      orderBy: { createdAt: "desc" }
    });
    return findings.map((f: any) => ({
      id: f.id,
      control: f.controlId ?? "A.5.1",
      severity: f.severity,
      status: f.status
    }));
  } catch {
    return runMockScan().map((f: any) => ({
      id: f.id,
      control: f.controlId,
      severity: f.severity,
      status: f.status
    }));
  }
}

export async function getPolicies(orgId: string) {
  try {
    const policies = await prisma.policy.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" }
    });
    return policies.map((p: any) => ({ id: p.id, title: p.title, status: p.status }));
  } catch {
    return generateMockPolicies();
  }
}

export async function getTasks(orgId: string) {
  try {
    const tasks = await prisma.task.findMany({
      where: { orgId },
      orderBy: { id: "desc" }
    });
    return tasks.map((t: any) => ({ id: t.id, title: t.title, status: t.status }));
  } catch {
    return createMockRemediationTasks();
  }
}

export async function getEvidence(orgId: string) {
  try {
    const evidence = await prisma.evidence.findMany({
      where: { orgId },
      include: { control: { select: { controlId: true } } },
      orderBy: { createdAt: "desc" }
    });
    return evidence.map((e: any) => ({
      id: e.id,
      control: e.control?.controlId ?? e.controlId ?? "A.5.1",
      status: e.status
    }));
  } catch {
    return mockEvidence().map((e: any) => ({
      id: e.id,
      control: e.controlId,
      status: e.status
    }));
  }
}

export async function getRecentScans(orgId: string) {
  try {
    const scans = await prisma.scan.findMany({
      where: { orgId },
      orderBy: { startedAt: "desc" },
      take: 6
    });
    return scans.map((s: any) => ({
      id: s.id,
      type: s.type,
      score: s.riskScore ?? 0,
      level: s.riskLevel ?? "Medium",
      sourceName: s.sourceName ?? "document",
      startedAt: s.startedAt
    }));
  } catch {
    return [];
  }
}
