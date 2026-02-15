# Branch Protection (Phase 1 Release Gate)

Date: 2026-02-15

Apply these settings in GitHub:
`Settings` -> `Branches` -> `Add branch protection rule`

## Rule target
- Branch name pattern: `main`

## Protect matching branches
- [x] Require a pull request before merging
- [x] Require approvals: `1` (minimum)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

## Required status checks
- `Phase 1 Release Gate / release-gate`

## Notes
- If the check name appears differently in your repository UI, select the exact check shown under the PR `Checks` tab for this workflow: `.github/workflows/phase1-release-gate.yml`.
