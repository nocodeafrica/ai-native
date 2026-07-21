---
name: Website Deploy and Verify
description: Deploy an explicitly approved website revision, verify the exact public result route by route, and produce an auditable receipt with rollback information.
key: paperclipai/bundled/website-production/website-deploy-and-verify
recommendedForRoles:
  - engineer
  - devops
  - qa
tags:
  - website
  - deployment
  - verification
  - rollback
  - governance
---
# Website Deploy and Verify
Public deployment is an external action. Do not deploy without explicit owner approval of the exact QA-passed commit and assets.

## Procedure
1. Resolve the approved commit, asset manifest, target environment, domain, and provider settings.
2. Stop if the candidate differs or credentials, spend, or domain authority are missing.
3. Deploy the exact QA-passed commit and record provider identity.
4. Verify every public route, navigation path, form, asset, metadata, favicon, robots/sitemap where applicable, TLS, console/network, and critical responsive view.
5. Compare the live revision/assets to the approved candidate; roll back or block if they differ or smoke checks fail.

## Deployment Receipt
Persist public URL; commit/revision; provider deployment ID; timestamp; route/smoke results; desktop/mobile screenshots; rollback reference/outcome; and exact blocking failures.

## Exit gate
Mark Done only after the live site matches the approved revision and all critical smoke checks pass. Reachability alone is not verification.
