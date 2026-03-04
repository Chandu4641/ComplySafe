import { Policy } from "../types";

export function generateMockPolicies(): Policy[] {
  return [
    { id: "pol_001", title: "Access Control Policy", status: "approved" },
    { id: "pol_002", title: "Change Management Policy", status: "draft" }
  ];
}
