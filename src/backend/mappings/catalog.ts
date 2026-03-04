export type CanonicalControlMapping = {
  canonicalControlId: string;
  title: string;
  sources: {
    frameworkKey: string;
    clauseCode: string;
  }[];
};

export const PHASE2_CANONICAL_MAPPINGS: CanonicalControlMapping[] = [
  {
    canonicalControlId: "IDENTITY_ACCESS_CONTROL",
    title: "Identity and Access Control",
    sources: [
      { frameworkKey: "ISO27001", clauseCode: "A.5.15" },
      { frameworkKey: "SOC2", clauseCode: "CC6.1" },
      { frameworkKey: "PCI_DSS", clauseCode: "7.2" },
      { frameworkKey: "HIPAA_SECURITY", clauseCode: "164.312(a)(1)" }
    ]
  },
  {
    canonicalControlId: "AUTHN_MFA",
    title: "Authentication and MFA",
    sources: [
      { frameworkKey: "ISO27001", clauseCode: "A.5.17" },
      { frameworkKey: "SOC2", clauseCode: "CC6.2" },
      { frameworkKey: "PCI_DSS", clauseCode: "8.3" },
      { frameworkKey: "HIPAA_SECURITY", clauseCode: "164.312(d)" }
    ]
  },
  {
    canonicalControlId: "LOGGING_MONITORING",
    title: "Logging and Monitoring",
    sources: [
      { frameworkKey: "ISO27001", clauseCode: "A.8.15" },
      { frameworkKey: "SOC2", clauseCode: "CC7.2" },
      { frameworkKey: "PCI_DSS", clauseCode: "10.2" },
      { frameworkKey: "HIPAA_SECURITY", clauseCode: "164.312(b)" }
    ]
  },
  {
    canonicalControlId: "SECURE_CONFIGURATION",
    title: "Secure Configuration and Hardening",
    sources: [
      { frameworkKey: "ISO27001", clauseCode: "A.8.9" },
      { frameworkKey: "SOC2", clauseCode: "CC5.2" },
      { frameworkKey: "PCI_DSS", clauseCode: "2.2" },
      { frameworkKey: "HIPAA_SECURITY", clauseCode: "164.308(a)(1)" }
    ]
  },
  {
    canonicalControlId: "INCIDENT_RESPONSE",
    title: "Incident Response",
    sources: [
      { frameworkKey: "ISO27001", clauseCode: "A.5.24" },
      { frameworkKey: "SOC2", clauseCode: "CC7.2" },
      { frameworkKey: "PCI_DSS", clauseCode: "12.3" },
      { frameworkKey: "HIPAA_SECURITY", clauseCode: "164.308(a)(6)" }
    ]
  },
  {
    canonicalControlId: "TRANSMISSION_PROTECTION",
    title: "Data Transmission Protection",
    sources: [
      { frameworkKey: "ISO27001", clauseCode: "A.5.14" },
      { frameworkKey: "SOC2", clauseCode: "CC6.7" },
      { frameworkKey: "PCI_DSS", clauseCode: "4.2" },
      { frameworkKey: "HIPAA_SECURITY", clauseCode: "164.312(e)(1)" }
    ]
  }
];
