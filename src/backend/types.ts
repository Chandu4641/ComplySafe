export type Framework = "GDPR" | "DPDP" | "ISO27001" | "PCI_DSS" | "HIPAA";

export type Severity = "Low" | "Medium" | "High";

export type FindingStatus = "Open" | "In Progress" | "Closed";

export interface Finding {
  id: string;
  controlId: string;
  severity: Severity;
  status: FindingStatus;
  summary: string;
}

export interface Policy {
  id: string;
  title: string;
  status: "draft" | "approved";
}

export interface Task {
  id: string;
  title: string;
  status: "open" | "in_progress" | "done";
}
