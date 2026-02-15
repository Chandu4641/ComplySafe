# ComplySafe

Compliance automation platform: Scan → Detect → Generate → Fix → Prove.

## What’s Included
- Product plan and architecture docs in `docs/`.
- Next.js app scaffold with marketing site and dashboard shell.
- API route stubs for core modules.
- Prisma schema for data model.

## Getting Started
1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install deps: `npm install`
3. Run Prisma migrate: `npm run prisma:migrate`
4. Run dev: `npm run dev`

## Demo Flow
1. Visit `/login` and create a workspace.
2. Complete onboarding and reach the dashboard.
3. Trigger scans and integrations via API endpoints.

## MVP Modules
1. Compliance risk analysis scanner
2. Content‑aware policy engine (GRC)
3. Auto‑remediation layer
4. Compliance proof dashboard

## Release Gate
- Phase 1 sign-off and validation criteria: `docs/phase1-signoff.md`
- Branch protection settings for required checks: `docs/branch-protection.md`
