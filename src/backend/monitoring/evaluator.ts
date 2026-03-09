import type { IntegrationCollectionResult } from "@/backend/integrations/types";
import { MONITORING_CONTROL_RULES } from "@/backend/monitoring/rules";

export type ControlEvaluation = {
  provider: string;
  checkId: string;
  controlCode: string;
  framework: string;
  title: string;
  passed: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
};

export function evaluateCollectionsAgainstControlRules(collections: IntegrationCollectionResult[]) {
  const evaluations: ControlEvaluation[] = [];

  for (const collection of collections) {
    for (const check of collection.checks) {
      const matchingRules = MONITORING_CONTROL_RULES.filter(
        (rule) => rule.provider === collection.provider && rule.checkId === check.checkId
      );

      for (const rule of matchingRules) {
        evaluations.push({
          provider: collection.provider,
          checkId: check.checkId,
          controlCode: rule.controlCode,
          framework: rule.framework,
          title: rule.title,
          passed: check.status === "PASS",
          severity: rule.severity,
          message: check.message
        });
      }
    }
  }

  return {
    total: evaluations.length,
    passed: evaluations.filter((item) => item.passed).length,
    failed: evaluations.filter((item) => !item.passed).length,
    evaluations
  };
}
