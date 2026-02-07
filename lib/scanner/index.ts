import { Finding } from "../types";

export function runMockScan(): Finding[] {
  return [
    {
      id: "F-102",
      controlId: "CC6.1",
      severity: "High",
      status: "Open",
      summary: "MFA not enforced for all admins."
    },
    {
      id: "F-110",
      controlId: "CC7.2",
      severity: "Medium",
      status: "Open",
      summary: "No automated backups for production DB."
    }
  ];
}
