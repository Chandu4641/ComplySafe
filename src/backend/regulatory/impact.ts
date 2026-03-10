import { RegulatoryImpactLevel } from "@prisma/client";

export function computeRegulatoryImpactSignal(events: Array<{ impactLevel: RegulatoryImpactLevel }>) {
  const high = events.filter((event) => event.impactLevel === RegulatoryImpactLevel.HIGH).length;
  const medium = events.filter((event) => event.impactLevel === RegulatoryImpactLevel.MEDIUM).length;

  if (high > 0) return "elevated";
  if (medium > 1) return "watch";
  return "stable";
}
