import { prisma } from "../db/client";
import { runMockScan } from "../scanner";
import { generateMockPolicies } from "../policy";
import { createMockRemediationTasks } from "../remediation";
import { mockEvidence } from "../evidence";

export async function getDashboardStats(orgId: string) {
  try {
    const [findingsCount, evidenceCount, policiesCount] = await Promise.all([
      prisma.finding.count({ where: { scan: { orgId } } }),
      prisma.evidence.count({ where: { orgId } }),
      prisma.policy.count({ where: { orgId } })
    ]);
    return {
      coverage: Math.min(95, Math.max(40, 100 - findingsCount * 2)),
      openRisks: findingsCount,
      evidence: evidenceCount,
      policies: policiesCount
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
    return findings.map((f) => ({
      id: f.id,
      control: f.controlId ?? "CC6.1",
      severity: f.severity,
      status: f.status
    }));
  } catch {
    return runMockScan().map((f) => ({
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
    return policies.map((p) => ({ id: p.id, title: p.title, status: p.status }));
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
    return tasks.map((t) => ({ id: t.id, title: t.title, status: t.status }));
  } catch {
    return createMockRemediationTasks();
  }
}

export async function getEvidence(orgId: string) {
  try {
    const evidence = await prisma.evidence.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" }
    });
    return evidence.map((e) => ({
      id: e.id,
      control: e.controlId ?? "CC6.1",
      status: e.status
    }));
  } catch {
    return mockEvidence().map((e) => ({
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
    return scans.map((s) => ({
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
