export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type Rule = {
  id: string;
  framework: string;
  title: string;
  requirement: string;
  keywords: string[];
  severity: RiskLevel;
  remediation: string;
};

export const DEFAULT_RULES: Rule[] = [
  {
    id: "GDPR-ART-32",
    framework: "GDPR",
    title: "Security of Processing",
    requirement: "Security of processing (confidentiality, integrity, availability)",
    keywords: ["encryption", "availability", "confidentiality", "integrity", "backup"],
    severity: "High",
    remediation: "Document encryption, backups, and access controls in policy and implement evidence."
  },
  {
    id: "DPDP-NOTICE",
    framework: "DPDP",
    title: "DPDP Notice and Consent",
    requirement: "Provide clear notice and consent for personal data processing",
    keywords: ["consent", "notice", "data fiduciary", "personal data", "withdrawal"],
    severity: "High",
    remediation: "Add DPDP-specific notices with purpose, consent, and grievance details."
  },
  {
    id: "ISO27001-A5-1",
    framework: "ISO27001",
    title: "Information Security Policies",
    requirement: "Maintain and communicate information security policies",
    keywords: ["information security policy", "policy statement", "governance"],
    severity: "Medium",
    remediation: "Publish a security policy and ensure it is reviewed and approved."
  },
  {
    id: "PCI-DSS-3-4",
    framework: "PCI_DSS",
    title: "Protect Stored Account Data",
    requirement: "Protect stored cardholder data with encryption and key management",
    keywords: ["cardholder", "pci", "payment data", "encryption", "tokenization"],
    severity: "High",
    remediation: "Encrypt or tokenize payment data and document key management controls."
  },
  {
    id: "HIPAA-ACCESS",
    framework: "HIPAA",
    title: "Access Controls",
    requirement: "Unique user identification and access control safeguards",
    keywords: ["hipaa", "access control", "user id", "audit log", "phi"],
    severity: "Medium",
    remediation: "Implement unique user IDs, access reviews, and audit logging."
  }
];

const SEVERITY_WEIGHT: Record<RiskLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
};

export function analyzeText(text: string, rules: Rule[] = DEFAULT_RULES) {
  const normalized = text.toLowerCase();
  const findings = rules.map((rule) => {
    const matched = rule.keywords.some((k) => normalized.includes(k));
    return {
      id: rule.id,
      title: rule.title,
      requirement: rule.requirement,
      severity: rule.severity,
      remediation: rule.remediation,
      matched
    };
  });

  const missing = findings.filter((f) => !f.matched);
  const weighted = missing.reduce((acc, f) => acc + SEVERITY_WEIGHT[f.severity], 0);
  const score = Math.min(100, Math.round((weighted / (rules.length * 4)) * 100));

  const level: RiskLevel =
    score >= 75 ? "Critical" :
    score >= 50 ? "High" :
    score >= 25 ? "Medium" :
    "Low";

  return {
    score,
    level,
    findings: missing.map((f) => ({
      controlId: f.id,
      title: f.title,
      severity: f.severity,
      summary: `Missing evidence for: ${f.requirement}`,
      remediation: f.remediation
    }))
  };
}
