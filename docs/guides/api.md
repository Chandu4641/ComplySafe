# API Surface (MVP)

## Integrations
- `POST /api/integrations/connect`
- `GET /api/integrations`

## Scans
- `POST /api/scans/run`
- `GET /api/scans/:id`

## Findings
- `GET /api/findings`

## Policies
- `POST /api/policies/generate`
- `GET /api/policies`

## Remediation
- `POST /api/tasks/create`
- `GET /api/tasks`

## Evidence
- `POST /api/evidence/upload`
- `GET /api/evidence`

## Audit Export
- `POST /api/audits/export`

## Frameworks (Phase 2)
- `GET /api/frameworks`
- `POST /api/frameworks/select`
- `GET /api/frameworks/mappings?frameworkKey=SOC2`
- `GET /api/frameworks/report`
- `POST /api/frameworks/scores`
- `GET /api/frameworks/soc2/export?format=json|csv`
