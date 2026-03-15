import { prisma } from "@/backend/db/client";
import { ISO_27001_2022 } from "./iso27001";
import { PHASE2_FRAMEWORK_CATALOGS } from "./catalog";
import type { FrameworkCatalog } from "./types";
import { ensureCrossFrameworkMappings } from "@/backend/mappings/service";

async function ensureFrameworkCatalog(catalog: FrameworkCatalog) {
  const framework = await prisma.framework.upsert({
    where: { key: catalog.key },
    update: {
      name: catalog.name,
      version: catalog.version,
      description: catalog.description
    },
    create: {
      key: catalog.key,
      name: catalog.name,
      version: catalog.version,
      description: catalog.description
    }
  });

  for (const clause of catalog.clauses) {
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

export async function ensureIsoFrameworkCatalog() {
  return ensureFrameworkCatalog(ISO_27001_2022);
}

export async function ensurePhase2FrameworkCatalogs() {
  const frameworks = [];
  for (const catalog of PHASE2_FRAMEWORK_CATALOGS) {
    frameworks.push(await ensureFrameworkCatalog(catalog));
  }
  await ensureCrossFrameworkMappings();
  return frameworks;
}

export async function activateFrameworkForOrganization(orgId: string, frameworkKey: string) {
  await ensurePhase2FrameworkCatalogs();

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
