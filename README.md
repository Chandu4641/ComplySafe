# ComplySafe

Compliance automation platform: Scan -> Detect -> Generate -> Fix -> Prove.

## Project Structure

```text
complysafe/
  src/
    app/                    # Frontend routes, pages, layouts, client components, API route handlers
    backend/                # Backend domain logic (auth, db, scanner, frameworks, risk, monitoring)
    shared/                 # Shared declarations and cross-cutting types
    middleware.ts           # Request/session middleware
  prisma/                   # Database schema and migrations
  public/                   # Static frontend assets
  docs/                     # Product, architecture, verification, and release docs
  scripts/                  # Verification and release utility scripts
```

## Naming Conventions

- `src/app/*`: frontend route-first organization (kebab-case route folders)
- `src/backend/*`: backend domain-first organization (lowercase folders, concise service files)
- `src/shared/*`: shared contracts and declaration files
- Path aliases:
  - `@/frontend/*` -> `src/app/*`
  - `@/backend/*` -> `src/backend/*`
  - `@/shared/*` -> `src/shared/*`

Compatibility aliases are still available (`@/lib/*`, `@/types/*`) so existing imports continue to work during transition.

## Getting Started

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Quality Checks

```bash
npm run lint
npm run build
npm run github:ready
```

## GitHub Push Checklist

1. Verify `.env` is not committed.
2. Run `npm run lint` and `npm run build`.
3. Run `npm run github:ready`.
4. Commit with a clear message, for example:
   ```bash
   git add .
   git commit -m "chore: restructure into frontend/backend source layout"
   ```
5. Push branch:
   ```bash
   git push origin <branch-name>
   ```

## Release Gate

- Phase 1 sign-off and validation criteria: `docs/verification/phase1-signoff.md`
- Branch protection settings for required checks: `docs/guides/branch-protection.md`
