import { scanOpenPorts } from "@/backend/scanner/portScanner";
import { scanTlsConfiguration } from "@/backend/scanner/tlsScanner";
import { scanDnsAndEmailSecurity } from "@/backend/scanner/dnsScanner";

export type AttackSurfaceFinding = {
  checkId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "pass" | "fail";
  detail: string;
};

export async function runAttackSurfaceScan(target: string) {
  const [ports, tls, dns] = await Promise.all([
    scanOpenPorts(target),
    scanTlsConfiguration(target),
    scanDnsAndEmailSecurity(target)
  ]);

  const findings: AttackSurfaceFinding[] = [...ports, ...tls, ...dns];
  const failing = findings.filter((item) => item.status === "fail");

  return {
    target,
    generatedAt: new Date().toISOString(),
    checks: findings.length,
    findings,
    riskLevel: failing.some((item) => item.severity === "HIGH")
      ? "HIGH"
      : failing.length > 0
      ? "MEDIUM"
      : "LOW"
  };
}
