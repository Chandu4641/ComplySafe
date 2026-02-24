import type { FrameworkCatalog, FrameworkClauseSeed } from "./types";

const clause = (code: string, title: string, category: string): FrameworkClauseSeed => ({
  clauseCode: code,
  title,
  category,
  description: `PCI DSS v4.0 ${code}: ${title}.`,
  defaultApplicable: true
});

export const PCI_DSS_V4: FrameworkCatalog = {
  key: "PCI_DSS",
  name: "PCI-DSS",
  version: "4.0",
  description: "Payment Card Industry Data Security Standard v4.0 requirements.",
  clauses: [
    clause("1.2", "Firewall and network security controls", "Network Security"),
    clause("2.2", "Secure configurations", "Configuration Management"),
    clause("3.3", "Sensitive authentication data protection", "Data Protection"),
    clause("3.5", "Primary account number protection", "Data Protection"),
    clause("4.2", "Strong cryptography in transit", "Data Protection"),
    clause("5.2", "Anti-malware mechanisms", "System Hardening"),
    clause("6.3", "Secure software lifecycle", "Secure Development"),
    clause("7.2", "Access control by business need", "Identity and Access"),
    clause("8.3", "MFA for access into CDE", "Identity and Access"),
    clause("10.2", "Audit logging and monitoring", "Logging"),
    clause("11.3", "Vulnerability scanning", "Testing"),
    clause("12.3", "Security awareness program", "Governance")
  ]
};
