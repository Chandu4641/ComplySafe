# Phase 1 Verification Report

Date: 2026-02-15

## 1. ISO Completeness
- Annex A 2022 clause structure seeded from `src/backend/frameworks/iso27001.ts`.
- Expected controls: 93 (`ISO_ANNEX_A_CONTROL_COUNT`).
- Activation seeds:
  - `Framework`
  - `FrameworkClause`
  - org-scoped `Control`
  - `ControlFrameworkMapping`
  - `ControlApplicability`
- Verification endpoint: `GET /api/system/verification`.

## 2. Multi-tenant Enforcement
- Risk, control, evidence, scans, and integrations queries scoped by `session.orgId`.
- New routes enforce tenant checks before update/link actions:
  - `src/app/api/risks/*`
  - `src/app/api/risk-controls/route.ts`
  - `src/app/api/controls/[id]/route.ts`
  - `src/app/api/evidence/[id]/route.ts`
  - `src/app/api/evidence/[id]/download/route.ts`

## 3. Scheduler Execution Proof
- Daily job: `src/backend/monitoring/daily.ts`.
- Idempotent run key: `(orgId, runDate)` in `MonitoringRun`.
- Scheduler orchestration: `src/backend/monitoring/scheduler.ts`.
- Trigger options:
  - secured endpoint: `POST /api/monitoring/scheduler`
  - automatic production opportunistic trigger from `src/app/dashboard/layout.tsx`.

## 4. No Hardcoded Framework Default
- Removed default `GDPR` fallback from organization update.
- Framework activation is explicit via `POST /api/frameworks/select`.
- Audit export resolves enabled framework from DB.

## 5. Compliance Scoring Accuracy
- Scoring service: `src/backend/compliance/score.ts`.
- Inputs included:
  - Controls implemented %
  - High risks mitigated %
  - Controls with valid evidence %
  - Overdue controls %
- Event-triggered recalculation wired on:
  - framework activation
  - risk create/update
  - control update
  - evidence create/update
- Background verification: daily monitoring job.

## 6. Evidence Health Automation
- Evidence model includes status/version/review metadata.
- Daily monitoring updates evidence health and emits monitoring issues for:
  - expired/missing evidence
  - overdue evidence review
  - controls with no evidence
  - overdue control reviews

## 7. Audit Logging Coverage
- `AuditLog` now supports before/after JSON snapshots.
- Implemented for:
  - risk create/update
  - control update
  - evidence create/update/download

## 8. Notes
- SoA exports are implemented at `GET /api/soa` for `json`, `csv`, and `pdf`.
- Regression suite is codified in `docs/verification/phase1-regression-matrix.json` and executed by `scripts/verification/phase1/regression.js`.
- Runtime validation (lint/build/migrate execution) depends on local Node/WSL runtime compatibility.
