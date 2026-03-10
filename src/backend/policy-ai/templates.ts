export type PolicyTemplate = {
  key: string;
  title: string;
  frameworkRefs: string[];
  sections: string[];
};

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    key: "access_control",
    title: "Access Control Policy",
    frameworkRefs: ["ISO27001:A.9", "SOC2:CC6"],
    sections: ["Purpose", "Scope", "Access Provisioning", "MFA Enforcement", "Review Cadence"]
  },
  {
    key: "incident_response",
    title: "Incident Response Policy",
    frameworkRefs: ["ISO27001:A.5.24", "SOC2:CC7"],
    sections: ["Purpose", "Incident Classification", "Response Workflow", "Escalation", "Postmortem"]
  },
  {
    key: "data_retention",
    title: "Data Retention Policy",
    frameworkRefs: ["ISO27001:A.5.33", "GDPR:Art5"],
    sections: ["Purpose", "Retention Rules", "Deletion Workflow", "Legal Hold", "Auditability"]
  },
  {
    key: "acceptable_use",
    title: "Acceptable Use Policy",
    frameworkRefs: ["ISO27001:A.6.2", "SOC2:CC2"],
    sections: ["Purpose", "Approved Usage", "Restricted Usage", "Monitoring", "Enforcement"]
  }
];

export function getPolicyTemplate(key: string) {
  return POLICY_TEMPLATES.find((item) => item.key === key) || POLICY_TEMPLATES[0];
}
