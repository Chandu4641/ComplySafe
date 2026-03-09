import { prisma } from "@/backend/db/client";
import {
  RegulatoryChangeType,
  RegulatoryImpactLevel,
  RegulatoryRecordStatus
} from "@prisma/client";

type SeedRecord = {
  externalId: string;
  sourceKey: string;
  jurisdiction: string;
  frameworkKey: string;
  title: string;
  normalizedControlId: string;
  versionTag: string;
  effectiveDate: string;
  status: RegulatoryRecordStatus;
  change: {
    changeType: RegulatoryChangeType;
    changedAt: string;
    summary: string;
    impactLevel: RegulatoryImpactLevel;
  };
};

const PHASE4_SEED_RECORDS: SeedRecord[] = [
  {
    externalId: "reg-us-soc2-001",
    sourceKey: "US-SOC2-FEED",
    jurisdiction: "US",
    frameworkKey: "SOC2",
    title: "Vendor risk due diligence refresh cadence",
    normalizedControlId: "CC9.2",
    versionTag: "2026.1",
    effectiveDate: "2026-04-01",
    status: RegulatoryRecordStatus.UPDATED,
    change: {
      changeType: RegulatoryChangeType.MODIFIED,
      changedAt: "2026-03-01T10:00:00.000Z",
      summary: "Quarterly review requirement changed to monthly for critical vendors",
      impactLevel: RegulatoryImpactLevel.HIGH
    }
  },
  {
    externalId: "reg-eu-iso-002",
    sourceKey: "EU-ISO27001-FEED",
    jurisdiction: "EU",
    frameworkKey: "ISO27001",
    title: "Encryption key lifecycle evidence requirement",
    normalizedControlId: "A.8.24",
    versionTag: "2026.1",
    effectiveDate: "2026-05-01",
    status: RegulatoryRecordStatus.NEW,
    change: {
      changeType: RegulatoryChangeType.ADDED,
      changedAt: "2026-03-02T08:15:00.000Z",
      summary: "New key lifecycle evidence requirement for privileged key operations",
      impactLevel: RegulatoryImpactLevel.MEDIUM
    }
  }
];

function canonicalFramework(framework?: string | null) {
  return (framework || "").toUpperCase().replace(/\s+/g, "");
}

function canonicalJurisdiction(jurisdiction?: string | null) {
  return (jurisdiction || "").toUpperCase();
}

function canonicalControlId(controlId?: string | null) {
  return (controlId || "").toUpperCase();
}

export async function syncRegulatoryFeed(orgId: string) {
  for (const seed of PHASE4_SEED_RECORDS) {
    const source = await prisma.regulatorySource.upsert({
      where: {
        orgId_sourceKey: {
          orgId,
          sourceKey: seed.sourceKey
        }
      },
      update: {
        jurisdiction: canonicalJurisdiction(seed.jurisdiction),
        frameworkKey: canonicalFramework(seed.frameworkKey),
        status: "active",
        lastFetchedAt: new Date()
      },
      create: {
        orgId,
        sourceKey: seed.sourceKey,
        jurisdiction: canonicalJurisdiction(seed.jurisdiction),
        frameworkKey: canonicalFramework(seed.frameworkKey),
        status: "active",
        lastFetchedAt: new Date()
      }
    });

    const record = await prisma.regulatoryRecord.upsert({
      where: {
        orgId_sourceId_externalId: {
          orgId,
          sourceId: source.id,
          externalId: seed.externalId
        }
      },
      update: {
        jurisdiction: canonicalJurisdiction(seed.jurisdiction),
        frameworkKey: canonicalFramework(seed.frameworkKey),
        title: seed.title,
        normalizedControlId: canonicalControlId(seed.normalizedControlId),
        versionTag: seed.versionTag,
        effectiveDate: new Date(seed.effectiveDate),
        status: seed.status
      },
      create: {
        orgId,
        sourceId: source.id,
        externalId: seed.externalId,
        jurisdiction: canonicalJurisdiction(seed.jurisdiction),
        frameworkKey: canonicalFramework(seed.frameworkKey),
        title: seed.title,
        normalizedControlId: canonicalControlId(seed.normalizedControlId),
        versionTag: seed.versionTag,
        effectiveDate: new Date(seed.effectiveDate),
        status: seed.status
      }
    });

    await prisma.regulatoryChangeEvent.upsert({
      where: {
        id: `${record.id}:${seed.change.changeType}:${seed.change.changedAt}`
      },
      update: {
        summary: seed.change.summary,
        impactLevel: seed.change.impactLevel,
        payload: {
          sourceKey: seed.sourceKey,
          frameworkKey: canonicalFramework(seed.frameworkKey)
        }
      },
      create: {
        id: `${record.id}:${seed.change.changeType}:${seed.change.changedAt}`,
        orgId,
        recordId: record.id,
        changeType: seed.change.changeType,
        changedAt: new Date(seed.change.changedAt),
        summary: seed.change.summary,
        impactLevel: seed.change.impactLevel,
        payload: {
          sourceKey: seed.sourceKey,
          frameworkKey: canonicalFramework(seed.frameworkKey)
        }
      }
    });
  }

  const [records, events] = await Promise.all([
    prisma.regulatoryRecord.count({ where: { orgId } }),
    prisma.regulatoryChangeEvent.count({ where: { orgId } })
  ]);

  return {
    syncedAt: new Date().toISOString(),
    records,
    events
  };
}

export async function getRegulatoryChanges(
  orgId: string,
  params?: { framework?: string; jurisdiction?: string }
) {
  await syncRegulatoryFeed(orgId);

  const framework = canonicalFramework(params?.framework);
  const jurisdiction = canonicalJurisdiction(params?.jurisdiction);

  const where = {
    orgId,
    ...(framework ? { frameworkKey: framework } : {}),
    ...(jurisdiction ? { jurisdiction } : {})
  };

  const records = await prisma.regulatoryRecord.findMany({
    where,
    include: {
      source: true,
      events: {
        orderBy: { changedAt: "desc" }
      }
    },
    orderBy: [{ frameworkKey: "asc" }, { normalizedControlId: "asc" }]
  });

  const events = records.flatMap((record) => record.events);

  return {
    generatedAt: new Date().toISOString(),
    count: records.length,
    records,
    events
  };
}

export async function getRegulatoryImpactReport(
  orgId: string,
  params?: { framework?: string; controlId?: string }
) {
  const framework = canonicalFramework(params?.framework);
  const controlId = canonicalControlId(params?.controlId);

  const changes = await getRegulatoryChanges(orgId, { framework });

  const impacted = changes.records.filter((record) => {
    if (!controlId) return true;
    return record.normalizedControlId === controlId;
  });

  const impactedRecordIds = new Set(impacted.map((record) => record.id));
  const impactedEvents = changes.events.filter((event) => impactedRecordIds.has(event.recordId));

  const highImpactCount = impactedEvents.filter(
    (event) => event.impactLevel === RegulatoryImpactLevel.HIGH
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    framework: framework || "ALL",
    controlId: controlId || null,
    impactedControls: impacted.map((record) => record.normalizedControlId),
    impactedRecords: impacted,
    impactedEvents,
    riskSignal: highImpactCount > 0 ? "elevated" : "stable"
  };
}
