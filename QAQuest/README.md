# QAQuest - Security Review Package

## What is included

- `QAQuest/` (Forge app source code)
  - `manifest.yml`
  - `package.json` and `package-lock.json`
  - `src/` (backend/resolvers/triggers/lifecycle)
  - `static/hello-world/` (frontend source + build artifacts)
  - `README.md`
- `privacy_policy.md`
- `terms_of_use.md`

## What is intentionally excluded

- `node_modules/`
- `.git/`
- local logs

These are excluded to reduce package size and avoid leaking local environment details.

## Setup steps

1. Install Node.js (20+) and Atlassian Forge CLI.
2. Authenticate Forge CLI.
3. Open `QAQuest/`.
4. Run `npm install`.
5. Open `QAQuest/static/hello-world/` and run:
   - `npm install`
   - `npm run build`
6. Return to `QAQuest/` and run:
   - `forge deploy`
   - `forge install` (if needed for target Jira site)

## Recommended security checks

From `QAQuest/`:
- `npm audit --production`

From `QAQuest/static/hello-world/`:
- `npm audit --production`

Optional:
- run SAST/static analysis (Semgrep, CodeQL, Sonar)
- produce SBOM (CycloneDX/SPDX)

## Included security evidence

- SCA (full scope, including dev dependencies):
  - `reports/sca-backend-full-npm-audit.json`
  - `reports/sca-frontend-full-npm-audit.json`
  - `reports/sca-full-summary.txt`
  - `reports/sca-full-status.txt`
- SCA (production dependencies only):
  - `reports/sca-backend-prod-npm-audit.json`
  - `reports/sca-frontend-prod-npm-audit.json`
  - `reports/sca-prod-summary.txt`
  - `reports/sca-prod-status.txt`
- SAST (keyword-based static scan):
  - `reports/sast-manual-keyword-scan.txt`

Current package status:
- Backend full-scope SCA: 0 vulnerabilities
- Frontend full-scope SCA: 0 vulnerabilities
- Backend production SCA: 0 vulnerabilities
- Frontend production SCA: 0 vulnerabilities

## Data and permission notes (quick reference)

- Forge scopes in `manifest.yml`:
  - `read:jira-work`
  - `storage:app`
- Main event triggers:
  - `jira:issue_created`
  - `jira:issue_updated`
  - `app:installed`
  - `app:uninstalled`
- App model: reads Jira/Xray data and computes gamification metrics.
