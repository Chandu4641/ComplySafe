import { prisma } from "@/backend/db/client";

function canTransition(
  from: "OPEN" | "IN_REVIEW" | "APPROVED" | "REJECTED",
  to: "OPEN" | "IN_REVIEW" | "APPROVED" | "REJECTED"
) {
  if (from === "OPEN") return to === "IN_REVIEW";
  if (from === "IN_REVIEW") return to === "APPROVED" || to === "REJECTED";
  return false;
}

export async function createAuditAssignment(params: {
  orgId: string;
  assignedTo: string;
  controlId?: string;
  riskId?: string;
  dueDate?: Date;
}) {
  if (!params.controlId && !params.riskId) {
    throw new Error("controlId or riskId is required");
  }

  const assignee = await prisma.user.findFirst({
    where: { id: params.assignedTo, orgId: params.orgId },
    select: { id: true }
  });
  if (!assignee) throw new Error("Assigned user not found in organization");

  if (params.controlId) {
    const control = await prisma.control.findFirst({ where: { id: params.controlId, orgId: params.orgId }, select: { id: true } });
    if (!control) throw new Error("Control not found in organization");
  }

  if (params.riskId) {
    const risk = await prisma.risk.findFirst({ where: { id: params.riskId, orgId: params.orgId }, select: { id: true } });
    if (!risk) throw new Error("Risk not found in organization");
  }

  return prisma.auditAssignment.create({
    data: {
      orgId: params.orgId,
      assignedTo: params.assignedTo,
      controlId: params.controlId,
      riskId: params.riskId,
      dueDate: params.dueDate,
      status: "OPEN"
    }
  });
}

export async function addAuditComment(params: {
  orgId: string;
  assignmentId: string;
  authorId: string;
  message: string;
  parentCommentId?: string;
}) {
  const assignment = await prisma.auditAssignment.findFirst({
    where: { id: params.assignmentId, orgId: params.orgId },
    select: { id: true }
  });
  if (!assignment) throw new Error("Assignment not found");

  const author = await prisma.user.findFirst({
    where: { id: params.authorId, orgId: params.orgId },
    select: { id: true }
  });
  if (!author) throw new Error("Author not found in organization");

  if (params.parentCommentId) {
    const parent = await prisma.auditComment.findFirst({
      where: {
        id: params.parentCommentId,
        orgId: params.orgId,
        assignmentId: params.assignmentId
      },
      select: { id: true }
    });
    if (!parent) throw new Error("Parent comment not found for assignment");
  }

  return prisma.auditComment.create({
    data: {
      orgId: params.orgId,
      assignmentId: params.assignmentId,
      authorId: params.authorId,
      message: params.message,
      parentCommentId: params.parentCommentId
    }
  });
}

export async function transitionAuditAssignment(params: {
  orgId: string;
  assignmentId: string;
  nextStatus: "IN_REVIEW" | "APPROVED" | "REJECTED";
}) {
  const assignment = await prisma.auditAssignment.findFirst({
    where: { id: params.assignmentId, orgId: params.orgId }
  });
  if (!assignment) throw new Error("Assignment not found");

  if (!canTransition(assignment.status, params.nextStatus)) {
    throw new Error(`Invalid assignment transition ${assignment.status} -> ${params.nextStatus}`);
  }

  return prisma.auditAssignment.update({
    where: { id: assignment.id },
    data: { status: params.nextStatus }
  });
}

export async function listAuditAssignments(orgId: string) {
  return prisma.auditAssignment.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    include: {
      control: {
        select: {
          id: true,
          controlId: true,
          title: true
        }
      },
      risk: {
        select: {
          id: true,
          title: true,
          residualRiskScore: true
        }
      },
      assignedUser: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      comments: {
        where: { parentCommentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}
