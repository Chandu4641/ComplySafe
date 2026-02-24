-- Phase 2: Cross-framework mapping catalog
CREATE TABLE "CrossFrameworkMapping" (
  "id" TEXT NOT NULL,
  "canonicalControlId" TEXT NOT NULL,
  "sourceFrameworkKey" TEXT NOT NULL,
  "sourceClauseCode" TEXT NOT NULL,
  "targetFrameworkKey" TEXT NOT NULL,
  "targetClauseCode" TEXT NOT NULL,
  "relationType" TEXT NOT NULL DEFAULT 'equivalent',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrossFrameworkMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrossFrameworkMapping_canonicalControlId_sourceFrameworkKey_sour_key"
  ON "CrossFrameworkMapping"("canonicalControlId", "sourceFrameworkKey", "sourceClauseCode", "targetFrameworkKey", "targetClauseCode");

CREATE INDEX "CrossFrameworkMapping_sourceFrameworkKey_sourceClauseCode_idx"
  ON "CrossFrameworkMapping"("sourceFrameworkKey", "sourceClauseCode");

CREATE INDEX "CrossFrameworkMapping_targetFrameworkKey_targetClauseCode_idx"
  ON "CrossFrameworkMapping"("targetFrameworkKey", "targetClauseCode");
