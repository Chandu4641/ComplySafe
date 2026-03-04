export type FrameworkKey = "GDPR" | "DPDP" | "PCI_DSS" | "ISO_27001" | "HIPAA";

export type Rule = {
  id: string;
  title: string;
  requirement: string;
  keywords?: string[];
  pageHints?: string[];
  severity: "Low" | "Medium" | "High";
  remediation: string;
  sources: { title: string; url: string }[];
};

export const FRAMEWORKS: { key: FrameworkKey; label: string; description: string }[] = [
  { key: "GDPR", label: "GDPR", description: "EU data protection regulation" },
  { key: "DPDP", label: "DPDP Act (India)", description: "India Digital Personal Data Protection Act" },
  { key: "PCI_DSS", label: "PCI DSS", description: "Payment card data security standard" },
  { key: "ISO_27001", label: "ISO/IEC 27001", description: "Information security management system" },
  { key: "HIPAA", label: "HIPAA", description: "US health data privacy and security" }
];

export const RULESETS: Record<FrameworkKey, Rule[]> = {
  GDPR: [
    {
      id: "gdpr-privacy-policy",
      title: "Privacy policy accessible",
      requirement: "Provide transparent information about processing on a public privacy notice.",
      pageHints: ["privacy"],
      severity: "High",
      remediation: "Publish a clear privacy policy linked in the footer.",
      sources: [
        { title: "GDPR Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" }
      ]
    },
    {
      id: "gdpr-data-categories",
      title: "Data categories disclosed",
      requirement: "Describe categories of personal data collected.",
      keywords: ["personal data", "personal information", "email", "phone", "address", "ip address"],
      severity: "High",
      remediation: "List categories of personal data collected and processed.",
      sources: [
        { title: "GDPR Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" }
      ]
    },
    {
      id: "gdpr-purpose",
      title: "Purpose of processing",
      requirement: "Explain purposes for which personal data is processed.",
      keywords: ["purpose", "processing", "use of data", "use your information"],
      severity: "High",
      remediation: "Explain each purpose for processing data.",
      sources: [
        { title: "GDPR Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" }
      ]
    },
    {
      id: "gdpr-rights",
      title: "Data subject rights",
      requirement: "Inform users of access, deletion, correction rights.",
      keywords: ["access", "delete", "erasure", "rectification", "correction", "withdraw consent"],
      severity: "High",
      remediation: "Add a rights section describing access, deletion, correction, and objection.",
      sources: [
        { title: "GDPR Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" }
      ]
    },
    {
      id: "gdpr-contact",
      title: "Privacy contact",
      requirement: "Provide a privacy contact or DPO contact details.",
      keywords: ["data protection officer", "dpo", "privacy officer", "privacy contact"],
      severity: "Medium",
      remediation: "Provide a privacy contact email and address.",
      sources: [
        { title: "GDPR Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" }
      ]
    },
    {
      id: "gdpr-retention",
      title: "Retention information",
      requirement: "State retention periods or criteria.",
      keywords: ["retention", "retain", "storage period", "kept for"],
      severity: "Medium",
      remediation: "Specify retention periods or criteria per data category.",
      sources: [
        { title: "GDPR Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" }
      ]
    }
  ],
  DPDP: [
    {
      id: "dpdp-notice",
      title: "DPDP notice references",
      requirement: "Provide notice with clear purpose and data details.",
      keywords: ["dpdp", "data fiduciary", "data principal"],
      severity: "High",
      remediation: "Add DPDP-specific notice language and terminology.",
      sources: [
        { title: "Digital Personal Data Protection Act, 2023 (India Code)", url: "https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf" }
      ]
    },
    {
      id: "dpdp-purpose",
      title: "Purpose limitation",
      requirement: "Specify purposes for which data is processed.",
      keywords: ["purpose", "processing", "use of data"],
      severity: "High",
      remediation: "List processing purposes in the notice.",
      sources: [
        { title: "Digital Personal Data Protection Act, 2023 (India Code)", url: "https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf" }
      ]
    },
    {
      id: "dpdp-rights",
      title: "Data principal rights",
      requirement: "Explain rights and how to exercise them.",
      keywords: ["access", "correction", "erasure", "withdraw consent"],
      severity: "High",
      remediation: "Add a section on rights and request process.",
      sources: [
        { title: "Digital Personal Data Protection Act, 2023 (India Code)", url: "https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf" }
      ]
    },
    {
      id: "dpdp-grievance",
      title: "Grievance redressal contact",
      requirement: "Provide a grievance contact mechanism.",
      keywords: ["grievance", "contact", "complaint"],
      severity: "Medium",
      remediation: "Add grievance officer contact and process.",
      sources: [
        { title: "Digital Personal Data Protection Act, 2023 (India Code)", url: "https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf" }
      ]
    }
  ],
  PCI_DSS: [
    {
      id: "pci-mention",
      title: "PCI DSS mention",
      requirement: "Publicly acknowledge PCI DSS alignment for payment handling.",
      keywords: ["pci dss", "pci compliance", "payment card"],
      severity: "Medium",
      remediation: "Add a PCI DSS compliance statement if applicable.",
      sources: [
        { title: "PCI DSS v4.0.1 Document Library", url: "https://www.pcisecuritystandards.org/document_library" },
        { title: "PCI DSS v4.0 press release", url: "https://www.pcisecuritystandards.org/about_us/press_releases/securing-the-future-of-payments-pci-ssc-publishes-pci-dss-v4-0/" }
      ]
    },
    {
      id: "pci-secure-payment",
      title: "Secure payment language",
      requirement: "Indicate secure handling of payment data on public pages.",
      keywords: ["secure payment", "cardholder data", "payment security"],
      severity: "Medium",
      remediation: "Add a security statement for payment processing.",
      sources: [
        { title: "PCI DSS v4.0.1 Document Library", url: "https://www.pcisecuritystandards.org/document_library" }
      ]
    }
  ],
  ISO_27001: [
    {
      id: "iso-isms",
      title: "ISMS or ISO 27001 mention",
      requirement: "Publicly state ISMS or ISO/IEC 27001 commitment if applicable.",
      keywords: ["iso 27001", "isms", "information security management"],
      severity: "Medium",
      remediation: "Add a public security/ISMS statement if appropriate.",
      sources: [
        { title: "ISO/IEC 27001:2022 overview", url: "https://www.iso.org/standard/54534.html" },
        { title: "ISO/IEC 27002:2022 overview", url: "https://www.iso.org/standard/75652.html" }
      ]
    },
    {
      id: "iso-security-policy",
      title: "Security policy statement",
      requirement: "Provide a public security policy or summary.",
      keywords: ["security policy", "information security"],
      severity: "Low",
      remediation: "Publish a brief security policy or security overview.",
      sources: [
        { title: "ISO/IEC 27001:2022 overview", url: "https://www.iso.org/standard/54534.html" }
      ]
    }
  ],
  HIPAA: [
    {
      id: "hipaa-notice",
      title: "HIPAA notice",
      requirement: "Provide Notice of Privacy Practices when PHI is handled.",
      keywords: ["notice of privacy practices", "hipaa", "protected health information"],
      severity: "High",
      remediation: "Publish a HIPAA Notice of Privacy Practices if you handle PHI.",
      sources: [
        { title: "HIPAA Privacy Rule (HHS)", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" },
        { title: "HIPAA Security Rule (HHS)", url: "https://www.hhs.gov/ocr/privacy/hipaa/administrative/securityrule/index.html" }
      ]
    },
    {
      id: "hipaa-rights",
      title: "Patient rights",
      requirement: "Explain individual rights to access and correction.",
      keywords: ["access", "amendment", "copy", "medical records"],
      severity: "High",
      remediation: "Add a section on patient rights and request process.",
      sources: [
        { title: "HIPAA Privacy Rule (HHS)", url: "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" }
      ]
    }
  ]
};
