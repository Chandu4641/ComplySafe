import { Finding } from "../types";

export function runMockScan(): Finding[] {
  return [
    {
      id: "F-102",
      controlId: "A.5.17",
      severity: "High",
      status: "Open",
      summary: "MFA not enforced for all admins."
    },
    {
      id: "F-110",
      controlId: "A.8.13",
      severity: "Medium",
      status: "Open",
      summary: "No automated backups for production DB."
    }
  ];
}
