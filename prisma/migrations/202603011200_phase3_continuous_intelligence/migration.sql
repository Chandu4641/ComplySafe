-- Phase 3: Continuous Compliance Intelligence

-- Enums
CREATE TYPE "ControlHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'FAILED');
CREATE TYPE "AuditAssignmentStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- Control health snapshots over time
CREATE TABLE "ControlHealthSnapshot" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "healthScore" DOUBLE PRECISION NOT NULL,
  "status" "ControlHealthStatus" NOT NULL,
  "driftDetected" BOOLEAN NOT NULL DEFAULT false,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ControlHealthSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ControlHealthSnapshot_orgId_calculatedAt_idx"
  ON "ControlHealthSnapshot"("orgId", "calculatedAt");

CREATE INDEX "ControlHealthSnapshot_orgId_controlId_calculatedAt_idx"
  ON "ControlHealthSnapshot"("orgId", "controlId", "calculatedAt");

ALTER TABLE "ControlHealthSnapshot"
  ADD CONSTRAINT "ControlHealthSnapshot_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ControlHealthSnapshot"
  ADD CONSTRAINT "ControlHealthSnapshot_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Risk trend snapshots over time
CREATE TABLE "RiskTrendSnapshot" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "riskId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RiskTrendSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RiskTrendSnapshot_orgId_capturedAt_idx"
  ON "RiskTrendSnapshot"("orgId", "capturedAt");

CREATE INDEX "RiskTrendSnapshot_orgId_riskId_capturedAt_idx"
  ON "RiskTrendSnapshot"("orgId", "riskId", "capturedAt");

ALTER TABLE "RiskTrendSnapshot"
  ADD CONSTRAINT "RiskTrendSnapshot_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RiskTrendSnapshot"
  ADD CONSTRAINT "RiskTrendSnapshot_riskId_fkey"
  FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Effectiveness score used by advanced risk scoring
CREATE TABLE "ControlEffectiveness" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ControlEffectiveness_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ControlEffectiveness_orgId_controlId_key"
  ON "ControlEffectiveness"("orgId", "controlId");

CREATE INDEX "ControlEffectiveness_orgId_updatedAt_idx"
  ON "ControlEffectiveness"("orgId", "updatedAt");

ALTER TABLE "ControlEffectiveness"
  ADD CONSTRAINT "ControlEffectiveness_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ControlEffectiveness"
  ADD CONSTRAINT "ControlEffectiveness_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Auditor collaboration workflow
CREATE TABLE "AuditAssignment" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "controlId" TEXT,
  "riskId" TEXT,
  "assignedTo" TEXT NOT NULL,
  "status" "AuditAssignmentStatus" NOT NULL DEFAULT 'OPEN',
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuditAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditAssignment_orgId_status_dueDate_idx"
  ON "AuditAssignment"("orgId", "status", "dueDate");

CREATE INDEX "AuditAssignment_orgId_assignedTo_idx"
  ON "AuditAssignment"("orgId", "assignedTo");

CREATE INDEX "AuditAssignment_controlId_idx"
  ON "AuditAssignment"("controlId");

CREATE INDEX "AuditAssignment_riskId_idx"
  ON "AuditAssignment"("riskId");

ALTER TABLE "AuditAssignment"
  ADD CONSTRAINT "AuditAssignment_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditAssignment"
  ADD CONSTRAINT "AuditAssignment_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditAssignment"
  ADD CONSTRAINT "AuditAssignment_riskId_fkey"
  FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditAssignment"
  ADD CONSTRAINT "AuditAssignment_assignedTo_fkey"
  FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Threaded comments for assignments
CREATE TABLE "AuditComment" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "parentCommentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditComment_orgId_assignmentId_createdAt_idx"
  ON "AuditComment"("orgId", "assignmentId", "createdAt");

CREATE INDEX "AuditComment_parentCommentId_idx"
  ON "AuditComment"("parentCommentId");

ALTER TABLE "AuditComment"
  ADD CONSTRAINT "AuditComment_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditComment"
  ADD CONSTRAINT "AuditComment_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "AuditAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditComment"
  ADD CONSTRAINT "AuditComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditComment"
  ADD CONSTRAINT "AuditComment_parentCommentId_fkey"
  FOREIGN KEY ("parentCommentId") REFERENCES "AuditComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
