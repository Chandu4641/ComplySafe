-- Phase 1 ISO core hardening migration
-- NOTE: Generated as source-controlled SQL template. Execute via Prisma migrate in your target environment.

-- Enums
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'compliance_manager', 'auditor', 'member');
CREATE TYPE "ControlStatus" AS ENUM ('NOT_IMPLEMENTED', 'IN_PROGRESS', 'PARTIAL', 'IMPLEMENTED', 'NOT_APPLICABLE');
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'IN_TREATMENT', 'MITIGATED', 'ACCEPTED', 'CLOSED');
CREATE TYPE "EvidenceStatus" AS ENUM ('VALID', 'EXPIRED', 'MISSING');
CREATE TYPE "ReviewFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- This migration intentionally references prisma/schema.prisma as source of truth.
-- Apply with:
--   npx prisma migrate dev --name phase1_iso_core_hardening
-- or
--   npx prisma migrate deploy
