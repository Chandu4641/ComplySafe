import { prisma } from "@/lib/db/client";
import { calculateComplianceScore } from "@/lib/compliance/score";

const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

function nextReviewCutoff(date: Date, frequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL") {
  const d = new Date(date);
  const months = frequency === "MONTHLY" ? 1 : frequency === "QUARTERLY" ? 3 : frequency === "SEMI_ANNUAL" ? 6 : 12;
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function runDailyMonitoring(orgId: string) {
  const runDate = startOfUtcDay();

  const existing = await prisma.monitoringRun.findUnique({
    where: { orgId_runDate: { orgId, runDate } }
  });

  if (existing?.status === "completed") {
    return { skipped: true, runId: existing.id };
  }

  const run =
    existing ??
    (await prisma.monitoringRun.create({
      data: {
        orgId,
        runDate,
        status: "running"
      }
    }));

  const frameworks = await prisma.organizationFramework.findMany({
    where: { organizationId: orgId, enabled: true },
    select: { frameworkId: true }
  });

  for (const fw of frameworks) {
    await calculateComplianceScore(orgId, fw.frameworkId);
  }

  const now = new Date();
  const evidence = await prisma.evidence.findMany({ where: { orgId } });
  for (const e of evidence) {
    let status: "VALID" | "EXPIRED" | "MISSING" = "VALID";
    if (e.expiresAt && e.expiresAt < now) {
      status = "EXPIRED";
    }
    if (!e.fileRef && !e.source) {
      status = "MISSING";
    }

    const reviewBase = e.lastReviewedAt ?? e.uploadedAt;
    const overdueReview = reviewBase ? nextReviewCutoff(reviewBase, e.reviewFrequency) < now : false;

    if (status !== e.status || overdueReview) {
      await prisma.evidence.update({
        where: { id: e.id },
        data: {
          status,
          lastReviewedAt: overdueReview ? e.lastReviewedAt : e.lastReviewedAt
        }
      });

      await prisma.monitoringIssue.upsert({
        where: {
          orgId_issueType_targetId: {
            orgId,
            issueType: overdueReview ? "EVIDENCE_REVIEW_OVERDUE" : `EVIDENCE_${status}`,
            targetId: e.id
          }
        },
        update: {
          isResolved: false,
          resolvedAt: null
        },
        create: {
          orgId,
          issueType: overdueReview ? "EVIDENCE_REVIEW_OVERDUE" : `EVIDENCE_${status}`,
          title: overdueReview ? "Evidence review overdue" : `Evidence status: ${status}`,
          severity: status === "EXPIRED" || status === "MISSING" ? "HIGH" : "MEDIUM",
          targetType: "Evidence",
          targetId: e.id
        }
      });
    }
  }

  const controls = await prisma.control.findMany({
    where: { orgId },
    include: { evidence: true }
  });

  for (const control of controls) {
    const hasEvidence = control.evidence.length > 0;
    const overdue = !!(control.reviewDate && control.reviewDate < now);
    if (!hasEvidence || overdue) {
      await prisma.monitoringIssue.upsert({
        where: {
          orgId_issueType_targetId: {
            orgId,
            issueType: !hasEvidence ? "CONTROL_NO_EVIDENCE" : "CONTROL_REVIEW_OVERDUE",
            targetId: control.id
          }
        },
        update: {
          isResolved: false,
          resolvedAt: null
        },
        create: {
          orgId,
          issueType: !hasEvidence ? "CONTROL_NO_EVIDENCE" : "CONTROL_REVIEW_OVERDUE",
          title: !hasEvidence ? "Control missing evidence" : "Control review overdue",
          severity: "HIGH",
          targetType: "Control",
          targetId: control.id
        }
      });
    }
  }

  await prisma.monitoringRun.update({
    where: { id: run.id },
    data: {
      status: "completed",
      finishedAt: new Date(),
      details: {
        frameworksScored: frameworks.length,
        evidenceChecked: evidence.length,
        controlsChecked: controls.length
      }
    }
  });

  return { skipped: false, runId: run.id };
}
