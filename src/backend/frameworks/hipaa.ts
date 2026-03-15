import type { FrameworkCatalog, FrameworkClauseSeed } from "./types";

const clause = (code: string, title: string, category: string): FrameworkClauseSeed => ({
  clauseCode: code,
  title,
  category,
  description: `HIPAA Security Rule ${code}: ${title}.`,
  defaultApplicable: true
});

export const HIPAA_SECURITY_RULE: FrameworkCatalog = {
  key: "HIPAA_SECURITY",
  name: "HIPAA Security Rule",
  version: "45 CFR 164",
  description: "Administrative, physical and technical safeguards for electronic protected health information.",
  clauses: [
    clause("164.308(a)(1)", "Security management process", "Administrative Safeguards"),
    clause("164.308(a)(3)", "Workforce security", "Administrative Safeguards"),
    clause("164.308(a)(4)", "Information access management", "Administrative Safeguards"),
    clause("164.308(a)(5)", "Security awareness and training", "Administrative Safeguards"),
    clause("164.308(a)(6)", "Security incident procedures", "Administrative Safeguards"),
    clause("164.310(a)(1)", "Facility access controls", "Physical Safeguards"),
    clause("164.310(d)(1)", "Device and media controls", "Physical Safeguards"),
    clause("164.312(a)(1)", "Access control", "Technical Safeguards"),
    clause("164.312(b)", "Audit controls", "Technical Safeguards"),
    clause("164.312(c)(1)", "Integrity controls", "Technical Safeguards"),
    clause("164.312(d)", "Person or entity authentication", "Technical Safeguards"),
    clause("164.312(e)(1)", "Transmission security", "Technical Safeguards")
  ]
};
