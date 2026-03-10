export type RegulatoryFeedItem = {
  sourceKey: string;
  jurisdiction: string;
  frameworkKey: string;
  externalId: string;
  title: string;
  normalizedControlId: string;
  versionTag: string;
  effectiveDate: string;
  changeType: "ADDED" | "MODIFIED" | "REMOVED";
  impactLevel: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
};

export function parseRegulatoryFeed(raw: RegulatoryFeedItem[]) {
  return raw.map((item) => ({
    ...item,
    frameworkKey: item.frameworkKey.toUpperCase().replace(/\s+/g, ""),
    jurisdiction: item.jurisdiction.toUpperCase(),
    normalizedControlId: item.normalizedControlId.toUpperCase()
  }));
}
