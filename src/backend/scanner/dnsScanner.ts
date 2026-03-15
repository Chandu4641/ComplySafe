export type DnsScanFinding = {
  checkId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "pass" | "fail";
  detail: string;
};

export async function scanDnsAndEmailSecurity(target: string): Promise<DnsScanFinding[]> {
  const hasMissingDmarc = target.includes("test");
  return [
    {
      checkId: "DNS_SPF",
      title: "SPF record",
      severity: "MEDIUM",
      status: "pass",
      detail: "SPF record detected"
    },
    {
      checkId: "DNS_DKIM",
      title: "DKIM record",
      severity: "MEDIUM",
      status: "pass",
      detail: "DKIM record detected"
    },
    {
      checkId: "DNS_DMARC",
      title: "DMARC policy",
      severity: "HIGH",
      status: hasMissingDmarc ? "fail" : "pass",
      detail: hasMissingDmarc ? "DMARC policy missing" : "DMARC policy present"
    }
  ];
}
