import type { FrameworkCatalog, FrameworkClauseSeed } from "./types";

const clause = (code: string, title: string, category: string): FrameworkClauseSeed => ({
  clauseCode: code,
  title,
  category,
  description: `SOC 2 Trust Services Criteria ${code}: ${title}.`,
  defaultApplicable: true
});

export const SOC2_TSC: FrameworkCatalog = {
  key: "SOC2",
  name: "SOC 2 Trust Services Criteria",
  version: "2017",
  description: "AICPA Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality and Privacy.",
  clauses: [
    clause("CC1.1", "Integrity and ethical values", "Common Criteria"),
    clause("CC2.1", "Board independence and oversight", "Common Criteria"),
    clause("CC3.2", "Risk identification", "Common Criteria"),
    clause("CC4.1", "Fraud risk consideration", "Common Criteria"),
    clause("CC5.2", "Technology control activities", "Common Criteria"),
    clause("CC6.1", "Logical access security", "Security"),
    clause("CC6.2", "Authentication and authorization", "Security"),
    clause("CC6.7", "Data transmission and disposal", "Security"),
    clause("CC7.2", "Monitoring for anomalies", "Security"),
    clause("A1.2", "Availability commitments", "Availability"),
    clause("PI1.1", "Processing integrity objectives", "Processing Integrity"),
    clause("P2.1", "Personal information collection and use", "Privacy")
  ]
};
