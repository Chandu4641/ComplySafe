import { prisma } from "@/lib/db/client";
import { ISO_27001_2022 } from "./iso27001";

export async function ensureIsoFrameworkCatalog() {
  const framework = await prisma.framework.upsert({
    where: { key: ISO_27001_2022.key },
    update: {
      name: ISO_27001_2022.name,
      version: ISO_27001_2022.version,
      description: ISO_27001_2022.description
    },
    create: {
      key: ISO_27001_2022.key,
      name: ISO_27001_2022.name,
      version: ISO_27001_2022.version,
      description: ISO_27001_2022.description
    }
  });

  for (const clause of ISO_27001_2022.clauses) {
    await prisma.frameworkClause.upsert({
      where: {
        frameworkId_clauseCode: {
          frameworkId: framework.id,
          clauseCode: clause.clauseCode
        }
      },
      update: {
        title: clause.title,
        description: clause.description,
        category: clause.category,
        defaultApplicable: clause.defaultApplicable
      },
      create: {
        frameworkId: framework.id,
        clauseCode: clause.clauseCode,
        title: clause.title,
        description: clause.description,
        category: clause.category,
        defaultApplicable: clause.defaultApplicable
      }
    });
  }

  return framework;
}

export async function activateFrameworkForOrganization(orgId: string, frameworkKey: string) {
  const framework = await prisma.framework.findUnique({ where: { key: frameworkKey } });
  if (!framework) {
    throw new Error(`Framework not found: ${frameworkKey}`);
  }

  const clauses = await prisma.frameworkClause.findMany({
    where: { frameworkId: framework.id },
    orderBy: { clauseCode: "asc" }
  });

  if (!clauses.length) {
    throw new Error(`Framework ${framework.key} is incomplete. No clauses found.`);
  }

  await prisma.organizationFramework.upsert({
    where: {
      organizationId_frameworkId: {
        organizationId: orgId,
        frameworkId: framework.id
      }
    },
    update: { enabled: true, activatedAt: new Date() },
    create: {
      organizationId: orgId,
      frameworkId: framework.id,
      enabled: true,
      activatedAt: new Date()
    }
  });

  for (const clause of clauses) {
    const control = await prisma.control.upsert({
      where: {
        orgId_frameworkId_controlId: {
          orgId,
          frameworkId: framework.id,
          controlId: clause.clauseCode
        }
      },
      update: {
        title: clause.title,
        description: clause.description ?? clause.title,
        category: clause.category,
        defaultApplicable: clause.defaultApplicable
      },
      create: {
        orgId,
        frameworkId: framework.id,
        controlId: clause.clauseCode,
        title: clause.title,
        description: clause.description ?? clause.title,
        category: clause.category,
        defaultApplicable: clause.defaultApplicable,
        status: "NOT_IMPLEMENTED"
      }
    });

    await prisma.controlApplicability.upsert({
      where: {
        orgId_controlId: {
          orgId,
          controlId: control.id
        }
      },
      update: {
        applicable: clause.defaultApplicable,
        justification: clause.defaultApplicable ? "Applicable by default" : "Excluded by default"
      },
      create: {
        orgId,
        controlId: control.id,
        applicable: clause.defaultApplicable,
        justification: clause.defaultApplicable ? "Applicable by default" : "Excluded by default"
      }
    });

    await prisma.controlFrameworkMapping.upsert({
      where: {
        controlId_frameworkId_clauseId: {
          controlId: control.id,
          frameworkId: framework.id,
          clauseId: clause.id
        }
      },
      update: {
        requirementReference: clause.clauseCode
      },
      create: {
        controlId: control.id,
        frameworkId: framework.id,
        clauseId: clause.id,
        requirementReference: clause.clauseCode
      }
    });
  }

  const mappedControls = await prisma.controlFrameworkMapping.count({
    where: { frameworkId: framework.id, control: { orgId } }
  });
  if (mappedControls < clauses.length) {
    throw new Error(`Framework activation incomplete: expected ${clauses.length} mapped controls, got ${mappedControls}.`);
  }

  return framework;
}

export async function getEnabledFrameworkForOrg(orgId: string) {
  const orgFramework = await prisma.organizationFramework.findFirst({
    where: { organizationId: orgId, enabled: true },
    include: { framework: true },
    orderBy: { activatedAt: "desc" }
  });

  return orgFramework?.framework ?? null;
}
