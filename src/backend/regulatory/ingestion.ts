import { RegulatoryChangeType, RegulatoryImpactLevel, RegulatoryRecordStatus } from "@prisma/client";
import { prisma } from "@/backend/db/client";
import { parseRegulatoryFeed, type RegulatoryFeedItem } from "@/backend/regulatory/parser";

export const DEFAULT_REGULATORY_FEED: RegulatoryFeedItem[] = [
  {
    sourceKey: "ISO-UPDATE-FEED",
    jurisdiction: "global",
    frameworkKey: "ISO27001",
    externalId: "iso-2026-001",
    title: "Identity lifecycle evidence refresh",
    normalizedControlId: "A.5.17",
    versionTag: "2026.2",
    effectiveDate: "2026-04-15",
    changeType: "MODIFIED",
    impactLevel: "HIGH",
    summary: "Identity lifecycle evidence must include quarterly access recertification."
  },
  {
    sourceKey: "GDPR-UPDATE-FEED",
    jurisdiction: "eu",
    frameworkKey: "GDPR",
    externalId: "gdpr-2026-004",
    title: "Controller transparency record update",
    normalizedControlId: "ART-30",
    versionTag: "2026.1",
    effectiveDate: "2026-05-01",
    changeType: "ADDED",
    impactLevel: "MEDIUM",
    summary: "Additional record of processing disclosure requirements."
  }
];

export async function ingestRegulatoryUpdates(orgId: string, rawFeed = DEFAULT_REGULATORY_FEED) {
  const feed = parseRegulatoryFeed(rawFeed);

  for (const item of feed) {
    const source = await prisma.regulatorySource.upsert({
      where: { orgId_sourceKey: { orgId, sourceKey: item.sourceKey } },
      update: {
        jurisdiction: item.jurisdiction,
        frameworkKey: item.frameworkKey,
        status: "active",
        lastFetchedAt: new Date()
      },
      create: {
        orgId,
        sourceKey: item.sourceKey,
        jurisdiction: item.jurisdiction,
        frameworkKey: item.frameworkKey,
        status: "active",
        lastFetchedAt: new Date()
      }
    });

    const record = await prisma.regulatoryRecord.upsert({
      where: {
        orgId_sourceId_externalId: {
          orgId,
          sourceId: source.id,
          externalId: item.externalId
        }
      },
      update: {
        title: item.title,
        normalizedControlId: item.normalizedControlId,
        versionTag: item.versionTag,
        effectiveDate: new Date(item.effectiveDate),
        status: item.changeType === "ADDED" ? RegulatoryRecordStatus.NEW : RegulatoryRecordStatus.UPDATED
      },
      create: {
        orgId,
        sourceId: source.id,
        externalId: item.externalId,
        jurisdiction: item.jurisdiction,
        frameworkKey: item.frameworkKey,
        title: item.title,
        normalizedControlId: item.normalizedControlId,
        versionTag: item.versionTag,
        effectiveDate: new Date(item.effectiveDate),
        status: item.changeType === "ADDED" ? RegulatoryRecordStatus.NEW : RegulatoryRecordStatus.UPDATED
      }
    });

    await prisma.regulatoryChangeEvent.upsert({
      where: { id: `${record.id}:${item.changeType}:${item.versionTag}` },
      update: {
        summary: item.summary,
        impactLevel: item.impactLevel as RegulatoryImpactLevel
      },
      create: {
        id: `${record.id}:${item.changeType}:${item.versionTag}`,
        orgId,
        recordId: record.id,
        changeType: item.changeType as RegulatoryChangeType,
        changedAt: new Date(),
        summary: item.summary,
        impactLevel: item.impactLevel as RegulatoryImpactLevel,
        payload: {
          sourceKey: item.sourceKey,
          versionTag: item.versionTag
        }
      }
    });
  }

  return {
    ingestedAt: new Date().toISOString(),
    records: feed.length
  };
}
