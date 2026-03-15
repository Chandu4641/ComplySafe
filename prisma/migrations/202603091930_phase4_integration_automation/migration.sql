-- Phase 4 integration automation schema updates
-- Adds integration account metadata model and evidence payload support.

ALTER TABLE "Integration"
  ADD COLUMN IF NOT EXISTS "provider" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Integration_orgId_type_key" ON "Integration"("orgId", "type");

ALTER TABLE "Evidence"
  ADD COLUMN IF NOT EXISTS "data" JSONB;

CREATE TABLE IF NOT EXISTS "IntegrationAccount" (
  "id" TEXT NOT NULL,
  "integrationId" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationAccount_integrationId_accountName_key"
  ON "IntegrationAccount"("integrationId", "accountName");

CREATE INDEX IF NOT EXISTS "IntegrationAccount_integrationId_idx"
  ON "IntegrationAccount"("integrationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IntegrationAccount_integrationId_fkey'
  ) THEN
    ALTER TABLE "IntegrationAccount"
      ADD CONSTRAINT "IntegrationAccount_integrationId_fkey"
      FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
