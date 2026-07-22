# Website Development Workflow Runbook

Status: configured and durably verified in the isolated `codex-workflows` instance. The Wilton Plumbing preview has reached its revision-bound Website Blueprint human gate; no build or deployment is authorized yet. This document records non-secret identifiers and evidence links only. Never put credentials or secret values here.

## Purpose

Configure one real Website Development Workflow using Paperclip's existing stage, routine, document, artifact, and human-review primitives. The UI calls this a Workflow; the compatibility API and storage layer remain `/pipelines` and `pipeline_*` internally.

## Exact stage graph

| Position | Key | Name | Kind | Gate |
|---:|---|---|---|---|
| 100 | `truth_assets` | Truth and Assets | working | Truth Pack complete |
| 200 | `website_blueprint` | Website Blueprint | review | human Blueprint/image approval |
| 300 | `design_build` | Design and Build | working | Build Candidate complete |
| 400 | `independent_qa` | Independent QA | review | human approval authorizes deploy |
| 500 | `deploy_verify` | Deploy and Live Verify | working | Deployment Receipt passes |
| 900 | `done` | Done | done | terminal |
| 1000 | `cancelled` | Cancelled | cancelled | terminal |

### Enforced transitions

```text
truth_assets -> website_blueprint
website_blueprint -> design_build (approve)
website_blueprint -> truth_assets (request changes to evidence/image pool)
website_blueprint -> cancelled (reject)
design_build -> independent_qa
independent_qa -> deploy_verify (approve)
independent_qa -> design_build (request changes)
independent_qa -> website_blueprint (reject/concept revision)
deploy_verify -> done
deploy_verify -> design_build (repair candidate)
```

Blueprint review configuration:

```json
{
  "requireApproval": true,
  "approver": { "kind": "any_human" },
  "approveToStageKey": "design_build",
  "rejectToStageKey": "cancelled",
  "requestChangesToStageKey": "truth_assets",
  "requireRejectReason": true,
  "requireRequestChangesReason": true
}
```

Independent QA review configuration:

```json
{
  "requireApproval": true,
  "approver": { "kind": "any_human" },
  "approveToStageKey": "deploy_verify",
  "rejectToStageKey": "website_blueprint",
  "requestChangesToStageKey": "design_build",
  "requireRejectReason": true,
  "requireRequestChangesReason": true
}
```

A Blueprint-only revision uses the existing current-stage rerun action. Request changes from Blueprint returns to Truth and Assets when crawl evidence, brand evidence, facts, or the candidate image pool must change. Independent QA request changes is for implementation repair; QA rejection is for a concept, IA, content-plan, or image-selection revision and requires renewed Blueprint approval.

## Stage skill bindings

| Stage | Bundled skill key | Assigned agent ID |
|---|---|---|
| Truth and Assets | `paperclipai/bundled/website-production/website-truth-and-assets` | `0f5addc6-47dc-4dad-834c-f1374a6c3c96` |
| Website Blueprint | `paperclipai/bundled/website-production/website-creative-director` | `cc9c213f-21da-469f-a052-1fb2bdb71ff7` |
| Design and Build | `paperclipai/bundled/website-production/website-design-and-build` | `2c84d154-a9be-49c6-9d53-49a3daa07bd9` |
| Independent QA | `paperclipai/bundled/website-production/website-independent-qa` | `fc6a3376-a7b8-4a84-b5cf-b7329a1eda82` (different from builder) |
| Deploy and Live Verify | `paperclipai/bundled/website-production/website-deploy-and-verify` | `8feb4560-b890-4b77-b5b9-74314449f780` |

## Owner-choice gate

Configuration must not begin until the owner explicitly confirms all of the following:

- Paperclip company ID and project ID for the real Workflow.
- Five stage-agent IDs. The Independent QA agent must not be the Design and Build agent.
- Project workspace ID/path and repository boundary.
- Secret-binding names or IDs required for crawling, image search, source control, preview, and deployment. Record references only, never secret values.
- Authorized image providers. Pexels and/or Pixabay are expected unless the owner chooses another source.
- Preview and deployment provider, plus the exact boundary between preview authorization and public deployment authorization.
- Spend ceiling and which actions may incur cost.
- Domain authority and the person who can approve a public deployment.

## Routine instruction pattern

Attach one routine-backed automation to each of the five production stages using this instruction, with the stage's bundled skill assigned:

> Use the assigned `paperclipai/bundled/website-production` skill. Read the current workflow item, linked issue, prior-stage documents, attachments, work products, and project workspace. Produce and persist the required stage artifact, attach inspectable evidence, post a concise issue summary with links, and do not claim the stage gate passed unless every exit criterion is true. Never bypass a human approval transition.

## Durable configuration proof

After configuration, reload and fetch `GET /api/pipelines/{id}`. Do not call configuration proven until the response and reloaded UI show:

- seven stages and exactly ten enforced transitions;
- five routine-backed automations and five skill bindings;
- two human review gates with the exact routing above;
- the confirmed company, project, workspace, and agent assignments;
- no missing-assignee, permission, transition, or workspace health warning.

## Acceptance proofs to record

1. Agent approval attempt at Website Blueprint returns `403 review_required` and does not transition.
2. Human request-changes, revision, and approval prove Build starts only after approval.
3. A material post-approval update returns `409 review_outdated` until renewed review.
4. A harmless build defect is caught with screenshot/reproduction evidence, routed to Build, repaired, and regression-tested.
5. A Blueprint or image-suitability defect routes to Creative Direction and requires renewed human approval.
6. A real preview journey produces a Truth Pack, approved revision-bound Blueprint and contact sheet, multi-page Build Candidate, independent browser QA, and at least one repair cycle.
7. Public deployment stops for explicit owner approval. If approved, the exact QA-passed commit produces a route-by-route Deployment Receipt and rollback reference.

## Evidence index

| Evidence | Non-secret ID or link | Status |
|---|---|---|
| Worktree instance health | `codex-workflows`; `http://127.0.0.1:3101/api/health`; status `ok`; branch `codex/workflows`; observed commit `54c6f06c` | proven |
| Company and project | Horizon Labs `de263ea8-c521-44ec-a96b-4f43c53cb334`; Onboarding `2c0db6c8-c93f-4426-b2bf-6778731c41ba` | proven from active port-3100 clone |
| Five agent assignments | IDs recorded in Stage skill bindings; Claude Opus 4.8; QA and builder are distinct agents | proven |
| Workspace and provider bindings | isolated managed project workspace; shared-workspace preference; Pexels and Pixabay authorized; preview-only; no public deployment authority | proven for preview boundary |
| Installed skill records | `4808a27c-5049-4422-9a9a-20f32000857d`, `8cb9fadd-0acd-4d35-aa12-8ef0a6d2ca78`, `6df739db-7c86-4318-9f9e-20da3c99ca55`, `f2732210-bb53-4f5a-8e68-76affb1a03b1`, `c965e800-c387-4120-9e8f-e875cd3bc605` | proven |
| Workflow configuration response | Website Development `f48d28c4-19d1-4ba3-b3d0-87357c372c8f`; seven stages; ten transitions; five routines; two human gates | proven |
| Reloaded persistence proof | `GET /api/pipelines/f48d28c4-19d1-4ba3-b3d0-87357c372c8f`; health `ok: true`, warnings `[]` | proven |
| Truth and Assets run | case `30008433-97e9-46c9-8c45-cf649745fdcc`; HOR-9 `c27acb3e-f640-4958-ae89-6f1b379000ae`; run `675fd1ff-811e-4908-99e5-004b9277d742`; 9 pages + 10 posts; 76 visually inspected source images; 65 keep-high, 9 keep-low, 2 rejected | proven |
| Website Blueprint run | HOR-10 `b3136fbb-e3fc-481b-aa16-a436315a8f31`; run `8584b085-16bd-41cd-a21b-af46ad4fe2e2`; document `website-blueprint` revision 20 `b13a5372-5c95-48fb-b10e-3fe92c354ab9`; approval interaction `92313fbb-e5aa-45e8-b29a-d2eb2155787f` | proven; pending human decision |
| Blueprint artifacts | visual Blueprint attachment `0387af81-7f1f-4f0f-958a-cbefc5cd0079`; Production Image Contact Sheet `6619f012-3a59-4087-abf7-f272b0ac3002` | proven |
| Approval and stale-review proof | exact revision-bound confirmation is pending; no agent transition occurred | partial |
| Build-repair proof | pending controlled run | not started |
| Blueprint-revision proof | pending controlled run | not started |
| Real preview journey | source `https://wiltonplumbing.co.za/`; preview-only; case remains at `website_blueprint`, HOR-10 is `in_review`, no Build issue exists | stopped at intended human gate |
| Public Deployment Receipt | pending separate explicit approval | blocked |

## Defects exposed by the Wilton proof

- Generated stage instructions named a nonexistent `pipeline-case-operations` skill. The prompt now names the shipped `paperclipai/paperclip/paperclip` skill, protected by a pipeline-service regression test.
- The Creative Director's shell command accidentally sent malformed JSON while attempting a whole-document update; Paperclip returned an opaque `500`. A disposable update on superseded HOR-8 proved the actual 16,977-character Blueprint updates in one request with HTTP 200. The error middleware now classifies body-parser `entity.parse.failed` errors as `400 {"error":"Malformed JSON body"}`, protected by a regression test. The disposable reproduction document was deleted.
