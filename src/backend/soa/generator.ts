import { prisma } from "@/backend/db/client";

export type SoARow = {
  controlId: string;
  controlTitle: string;
  applicability: "Yes" | "No";
  justification: string;
  implementationStatus: string;
  linkedRisks: string[];
  linkedEvidence: string[];
};

export type SoAPackage = {
  organizationName: string;
  frameworkName: string;
  frameworkVersion: string | null;
  rows: SoARow[];
};

export async function generateSoA(orgId: string, frameworkId: string) {
  const pack = await generateSoAPackage(orgId, frameworkId);
  return pack.rows;
}

export async function generateSoAPackage(orgId: string, frameworkId: string): Promise<SoAPackage> {
  const [org, framework] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
    prisma.framework.findUnique({ where: { id: frameworkId }, select: { name: true, version: true } })
  ]);

  if (!org) {
    throw new Error("Organization not found.");
  }
  if (!framework) {
    throw new Error("Framework not found.");
  }

  const clauses = await prisma.frameworkClause.findMany({
    where: { frameworkId },
    orderBy: { clauseCode: "asc" }
  });

  const controls = await prisma.control.findMany({
    where: { orgId, frameworkId },
    include: {
      applicability: true,
      evidence: true,
      riskLinks: { include: { risk: true } },
      mappings: true
    }
  });

  const byControlCode = new Map(controls.map((c: any) => [c.controlId, c]));

  const rows: SoARow[] = clauses.map((clause: any) => {
    const control: any = byControlCode.get(clause.clauseCode);
    const applicability = control?.applicability?.[0];
    return {
      controlId: clause.clauseCode,
      controlTitle: clause.title,
      applicability: applicability ? (applicability.applicable ? "Yes" : "No") : clause.defaultApplicable ? "Yes" : "No",
      justification: applicability?.justification ?? (clause.defaultApplicable ? "Applicable by default" : "Excluded by default"),
      implementationStatus: control?.status ?? "NOT_IMPLEMENTED",
      linkedRisks: control?.riskLinks?.map((x: any) => x.risk.id) ?? [],
      linkedEvidence: control?.evidence?.map((e: any) => e.id) ?? []
    };
  });

  return {
    organizationName: org.name,
    frameworkName: framework.name,
    frameworkVersion: framework.version ?? null,
    rows
  };
}

export function toCsv(rows: SoARow[]) {
  const header = [
    "Control ID",
    "Control Title",
    "Applicability",
    "Justification",
    "Implementation Status",
    "Linked Risks",
    "Linked Evidence"
  ];

  const lines = rows.map((row) => [
    row.controlId,
    row.controlTitle,
    row.applicability,
    row.justification,
    row.implementationStatus,
    row.linkedRisks.join("|"),
    row.linkedEvidence.join("|")
  ]);

  return [header, ...lines]
    .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
