import { prisma } from "@/backend/db/client";

type ControlHealthResult = {
  controlId: string;
  healthScore: number;
  status: "HEALTHY" | "DEGRADED" | "FAILED";
  driftDetected: boolean;
  reasons: string[];
};

const HEALTHY_THRESHOLD = 80;
const DEGRADED_THRESHOLD = 50;
const DRIFT_DROP_THRESHOLD = 15;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function resolveStatus(score: number): "HEALTHY" | "DEGRADED" | "FAILED" {
  if (score >= HEALTHY_THRESHOLD) return "HEALTHY";
  if (score >= DEGRADED_THRESHOLD) return "DEGRADED";
  return "FAILED";
}

function computeScore(input: {
  hasExpiredEvidence: boolean;
  missingEvidence: boolean;
  overdueReview: boolean;
  openFindings: number;
  validEvidenceCount: number;
}) {
  const reasons: string[] = [];
  let score = 72;

  if (input.missingEvidence) {
    score -= 35;
    reasons.push("control has no evidence attached");
  }

  if (input.hasExpiredEvidence) {
    score -= 25;
    reasons.push("control has expired evidence");
  }

  if (input.overdueReview) {
    score -= 15;
    reasons.push("control review date is overdue");
  }

  if (input.openFindings >= 3) {
    score -= 20;
    reasons.push("repeated open findings detected");
  } else if (input.openFindings > 0) {
    score -= 10;
    reasons.push("open findings present");
  }

  if (!input.missingEvidence && !input.hasExpiredEvidence && !input.overdueReview && input.openFindings === 0) {
    const bonus = input.validEvidenceCount > 2 ? 20 : 12;
    score += bonus;
    reasons.push("healthy evidence and no open findings");
  }

  return {
    healthScore: clampScore(score),
    reasons
  };
}

export async function runControlHealthMonitoring(orgId: string) {
  const now = new Date();
  const controls = await prisma.control.findMany({
    where: { orgId },
    include: {
      evidence: true,
      findings: {
        orderBy: { createdAt: "desc" },
        take: 8
      }
    }
  });

  const results: ControlHealthResult[] = [];

  for (const control of controls) {
    const hasEvidence = control.evidence.length > 0;
    const hasExpiredEvidence = control.evidence.some((e) => !!e.expiresAt && e.expiresAt < now);
    const validEvidenceCount = control.evidence.filter((e) => {
      const hasPayload = Boolean(e.fileRef || e.source);
      const notExpired = !e.expiresAt || e.expiresAt >= now;
      return hasPayload && notExpired && e.status === "VALID";
    }).length;
    const openFindings = control.findings.filter((f) => f.status !== "Closed").length;
    const overdueReview = Boolean(control.reviewDate && control.reviewDate < now);

    const scoring = computeScore({
      hasExpiredEvidence,
      missingEvidence: !hasEvidence,
      overdueReview,
      openFindings,
      validEvidenceCount
    });

    const previous = await prisma.controlHealthSnapshot.findFirst({
      where: { orgId, controlId: control.id },
      orderBy: { calculatedAt: "desc" }
    });

    const driftDetected = previous ? previous.healthScore - scoring.healthScore >= DRIFT_DROP_THRESHOLD : false;
    const status = resolveStatus(scoring.healthScore);

    const snapshot = await prisma.controlHealthSnapshot.create({
      data: {
        orgId,
        controlId: control.id,
        healthScore: scoring.healthScore,
        status,
        driftDetected
      }
    });

    await prisma.controlEffectiveness.upsert({
      where: {
        orgId_controlId: {
          orgId,
          controlId: control.id
        }
      },
      update: {
        score: Math.max(0, Math.min(1, snapshot.healthScore / 100))
      },
      create: {
        orgId,
        controlId: control.id,
        score: Math.max(0, Math.min(1, snapshot.healthScore / 100))
      }
    });

    if (status === "HEALTHY") {
      await prisma.monitoringIssue.updateMany({
        where: {
          orgId,
          targetId: control.id,
          issueType: {
            in: ["CONTROL_HEALTH_DEGRADED", "CONTROL_HEALTH_FAILED"]
          },
          isResolved: false
        },
        data: {
          isResolved: true,
          resolvedAt: now
        }
      });
    } else {
      const issueType = status === "FAILED" ? "CONTROL_HEALTH_FAILED" : "CONTROL_HEALTH_DEGRADED";
      await prisma.monitoringIssue.upsert({
        where: {
          orgId_issueType_targetId: {
            orgId,
            issueType,
            targetId: control.id
          }
        },
        update: {
          isResolved: false,
          resolvedAt: null
        },
        create: {
          orgId,
          issueType,
          title: `Control health ${status.toLowerCase()}`,
          severity: status === "FAILED" ? "HIGH" : "MEDIUM",
          targetType: "Control",
          targetId: control.id
        }
      });
    }

    results.push({
      controlId: control.id,
      healthScore: scoring.healthScore,
      status,
      driftDetected,
      reasons: scoring.reasons
    });
  }

  return {
    generatedAt: now.toISOString(),
    controlsEvaluated: controls.length,
    healthy: results.filter((r) => r.status === "HEALTHY").length,
    degraded: results.filter((r) => r.status === "DEGRADED").length,
    failed: results.filter((r) => r.status === "FAILED").length,
    results
  };
}

export async function getLatestControlHealth(orgId: string, limit = 100) {
  const snapshots = await prisma.controlHealthSnapshot.findMany({
    where: { orgId },
    orderBy: { calculatedAt: "desc" },
    take: limit,
    include: {
      control: {
        select: {
          controlId: true,
          title: true,
          frameworkId: true
        }
      }
    }
  });

  return snapshots.map((snapshot) => ({
    snapshotId: snapshot.id,
    controlId: snapshot.controlId,
    controlCode: snapshot.control.controlId,
    controlTitle: snapshot.control.title,
    frameworkId: snapshot.control.frameworkId,
    healthScore: snapshot.healthScore,
    status: snapshot.status,
    driftDetected: snapshot.driftDetected,
    calculatedAt: snapshot.calculatedAt
  }));
}
