CREATE TYPE "RegulatoryRecordStatus" AS ENUM ('NEW', 'UPDATED', 'SUPERSEDED');
CREATE TYPE "RegulatoryChangeType" AS ENUM ('ADDED', 'MODIFIED', 'REMOVED');
CREATE TYPE "RegulatoryImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "CopilotActionStatus" AS ENUM ('BLOCKED', 'APPROVAL_REQUIRED', 'EXECUTED');

CREATE TABLE "RegulatorySource" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL,
  "frameworkKey" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "lastFetchedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatorySource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryRecord" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL,
  "frameworkKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "normalizedControlId" TEXT NOT NULL,
  "versionTag" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3),
  "status" "RegulatoryRecordStatus" NOT NULL DEFAULT 'NEW',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatoryRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryChangeEvent" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "changeType" "RegulatoryChangeType" NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "impactLevel" "RegulatoryImpactLevel" NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegulatoryChangeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CopilotRecommendation" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CopilotRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CopilotActionExecution" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "actorId" TEXT,
  "actionType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "status" "CopilotActionStatus" NOT NULL,
  "reason" TEXT NOT NULL,
  "recommendationId" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CopilotActionExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegulatorySource_orgId_sourceKey_key" ON "RegulatorySource"("orgId", "sourceKey");
CREATE INDEX "RegulatorySource_orgId_frameworkKey_idx" ON "RegulatorySource"("orgId", "frameworkKey");

CREATE UNIQUE INDEX "RegulatoryRecord_orgId_sourceId_externalId_key" ON "RegulatoryRecord"("orgId", "sourceId", "externalId");
CREATE INDEX "RegulatoryRecord_orgId_frameworkKey_normalizedControlId_idx" ON "RegulatoryRecord"("orgId", "frameworkKey", "normalizedControlId");

CREATE INDEX "RegulatoryChangeEvent_orgId_changedAt_idx" ON "RegulatoryChangeEvent"("orgId", "changedAt");
CREATE INDEX "RegulatoryChangeEvent_recordId_idx" ON "RegulatoryChangeEvent"("recordId");

CREATE INDEX "CopilotRecommendation_orgId_generatedAt_idx" ON "CopilotRecommendation"("orgId", "generatedAt");
CREATE INDEX "CopilotRecommendation_orgId_category_idx" ON "CopilotRecommendation"("orgId", "category");

CREATE INDEX "CopilotActionExecution_orgId_executedAt_idx" ON "CopilotActionExecution"("orgId", "executedAt");
CREATE INDEX "CopilotActionExecution_orgId_status_idx" ON "CopilotActionExecution"("orgId", "status");

ALTER TABLE "RegulatorySource"
  ADD CONSTRAINT "RegulatorySource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RegulatoryRecord"
  ADD CONSTRAINT "RegulatoryRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "RegulatoryRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RegulatorySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RegulatoryChangeEvent"
  ADD CONSTRAINT "RegulatoryChangeEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "RegulatoryChangeEvent_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "RegulatoryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CopilotRecommendation"
  ADD CONSTRAINT "CopilotRecommendation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CopilotActionExecution"
  ADD CONSTRAINT "CopilotActionExecution_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CopilotActionExecution_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
