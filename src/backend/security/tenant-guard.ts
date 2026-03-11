/**
 * Tenant Isolation Guard
 * 
 * Ensures strict data separation between organizations.
 * All database queries must be filtered by organization ID.
 */

import { prisma } from "@/backend/db/client";
import type { Session, User, Organization } from "@prisma/client";

/**
 * Tenant context extracted from session
 */
export interface TenantContext {
  orgId: string;
  userId: string;
  role: string;
}

/**
 * Extended session type with relations
 */
type SessionWithRelations = Session & {
  user: User;
  org: Organization;
};

/**
 * Extract tenant context from session
 */
export function extractTenantContext(session: SessionWithRelations): TenantContext {
  return {
    orgId: session.orgId,
    userId: session.userId,
    role: session.user.role
  };
}

/**
 * Verify that a resource belongs to the current organization
 * Throws an error if the resource doesn't belong to the org
 */
export async function verifyTenantAccess<T>(
  orgId: string,
  resourceType: string,
  findFn: () => Promise<T | null>
): Promise<T> {
  const resource = await findFn();
  
  if (!resource) {
    throw new Error(`${resourceType} not found`);
  }
  
  // Check if resource has orgId and verify it matches
  const resourceWithOrg = resource as { orgId?: string };
  if (resourceWithOrg.orgId && resourceWithOrg.orgId !== orgId) {
    console.error(`[TenantGuard] Access denied: ${resourceType} ${JSON.stringify(resource)} does not belong to org ${orgId}`);
    throw new Error(`Access denied: ${resourceType} does not belong to your organization`);
  }
  
  return resource;
}

/**
 * Guard function to ensure user can only access their organization's data
 */
export function createTenantGuard(orgId: string) {
  return {
    /**
     * Verify control belongs to org
     */
    async control(controlId: string) {
      return verifyTenantAccess(
        orgId,
        "Control",
        () => prisma.control.findFirst({ where: { id: controlId, orgId } })
      );
    },
    
    /**
     * Verify risk belongs to org
     */
    async risk(riskId: string) {
      return verifyTenantAccess(
        orgId,
        "Risk",
        () => prisma.risk.findFirst({ where: { id: riskId, orgId } })
      );
    },
    
    /**
     * Verify evidence belongs to org
     */
    async evidence(evidenceId: string) {
      return verifyTenantAccess(
        orgId,
        "Evidence",
        () => prisma.evidence.findFirst({ where: { id: evidenceId, orgId } })
      );
    },

    /**
     * Verify organization has enabled this framework
     * (Frameworks are global, access via OrganizationFramework)
     */
    async enabledFramework(frameworkId: string) {
      return verifyTenantAccess(
        orgId,
        "OrganizationFramework",
        () => prisma.organizationFramework.findFirst({
          where: {
            id: frameworkId,
            organizationId: orgId
          }
        })
      );
    },

    /**
     * Verify integration belongs to org
     */
    async integration(integrationId: string) {
      return verifyTenantAccess(
        orgId,
        "Integration",
        () => prisma.integration.findFirst({ where: { id: integrationId, orgId } })
      );
    },
    
    /**
     * Verify user belongs to org
     */
    async user(userId: string) {
      return verifyTenantAccess(
        orgId,
        "User",
        () => prisma.user.findFirst({ where: { id: userId, orgId } })
      );
    },
    
    /**
     * Verify audit assignment belongs to org
     */
    async auditAssignment(assignmentId: string) {
      return verifyTenantAccess(
        orgId,
        "AuditAssignment",
        () => prisma.auditAssignment.findFirst({ where: { id: assignmentId, orgId } })
      );
    }
  };
}

/**
 * Middleware helper to get tenant from request
 * Can be used in API routes
 */
export async function getTenantFromRequest(request: Request): Promise<TenantContext> {
  // Import dynamically to avoid issues with serverless
  const { getSession } = await import("@/backend/auth/session");
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return extractTenantContext(session as SessionWithRelations);
}

/**
 * Assert that the current user has a specific role
 */
export function assertRole(context: TenantContext, allowedRoles: string[]): void {
  if (!allowedRoles.includes(context.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${context.role}`);
  }
}

/**
 * Check if user has permission (non-throwing)
 */
export function hasRole(context: TenantContext, allowedRoles: string[]): boolean {
  return allowedRoles.includes(context.role);
}
