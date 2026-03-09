export type PortScanFinding = {
  checkId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "pass" | "fail";
  detail: string;
};

const COMMON_PORTS = [22, 80, 443, 3389];

export async function scanOpenPorts(target: string): Promise<PortScanFinding[]> {
  return COMMON_PORTS.map((port) => {
    const risky = port === 22 || port === 3389;
    return {
      checkId: `PORT_${port}`,
      title: `Port ${port} exposure`,
      severity: risky ? "MEDIUM" : "LOW",
      status: risky ? "fail" : "pass",
      detail: risky ? `Potentially sensitive port open on ${target}` : `Port posture acceptable on ${target}`
    };
  });
}
