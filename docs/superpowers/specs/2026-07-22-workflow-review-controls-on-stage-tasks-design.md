# Workflow Review Controls on Stage Tasks

Date: 2026-07-22
Status: approved direction, pending implementation plan

## Problem

Workflow review stages already define what happens after `approve`, `request_changes`, and `reject`. The Workflow service owns the authoritative Case transition and runs the destination stage's existing `onEnter` automation.

The Wilton Plumbing Independent QA task, HOR-12, did not use that mechanism. Its agent created a generic `request_confirmation` interaction with `continuationPolicy: wake_assignee`. Accepting the card marked the issue interaction accepted and woke the QA agent. It did not call the Workflow Case review endpoint. The agent was then correctly forbidden from crossing an `any_human` review gate and could only leave a transition suggestion. The Case therefore remained in `independent_qa`, and the `deploy_verify` stage automation never started.

## Design decision

Use the existing Workflow Case review as the only authoritative approval for a Workflow review stage.

When a Task is linked as the automation work item for a Case currently in a review stage, the Task page displays the Case's existing review controls. Approving from either the Workflow item page or the linked Task calls the same existing endpoint:

```text
POST /api/cases/:caseId/review
```

The Task does not create, copy, or synchronize another approval record. It is only another surface for the existing Workflow review.

## Scope

### In scope

- Read the Task's existing `linkedCases` projection.
- For each active linked Workflow Case in a review stage, fetch its existing Case detail.
- Render a compact Workflow review card on the Task page.
- Show the Workflow, current stage, and configured outcome for each available decision.
- Submit `approve`, `request_changes`, or `reject` through the existing `pipelinesApi.reviewCase` client.
- Preserve configured reason requirements.
- Refresh Task and Workflow queries after a successful decision.
- Handle stale Case versions by refreshing and asking the user to review the current revision.
- Add focused UI regression coverage and retain existing Workflow service/route coverage.

### Out of scope

- No new approval table or status.
- No generic effect language, dispatcher, handler registry, or action DSL.
- No website-specific transition logic.
- No change to generic issue confirmations for non-Workflow questions.
- No automatic interpretation of arbitrary agent-authored confirmation text.
- No automatic public deployment.
- No refactor of unrelated Workflow pages or the existing company approval system.

## Existing primitives reused

1. `GET /api/issues/:id` already returns `linkedCases` with Workflow, Case, stage, and link-role information.
2. `GET /api/cases/:caseId` already returns the current Case version, current stage configuration, Workflow stages, and allowed destinations.
3. `POST /api/cases/:caseId/review` already validates the human approver, applies the configured decision target transactionally, records `review_decided`, clears the pending suggestion, and executes the destination stage automation ledger.
4. The Workflow item UI already derives review actions from `approveToStageKey`, `requestChangesToStageKey`, and `rejectToStageKey`.

The implementation should reuse these APIs directly. It must not add a second server mutation that attempts to bridge issue-interaction acceptance into Workflow review.

## UI behavior

The Task page shows a `Workflow review` card when all of the following are true:

- the Task has an active linked Workflow Case;
- that Case is currently in a stage whose kind is `review`;
- the Case is not terminal.

The card shows:

- Workflow name;
- Case title;
- current review-stage name;
- `Approve` with its configured destination;
- `Request changes` with its configured destination when configured;
- `Reject` with its configured destination;
- a reason field when the selected decision requires one;
- a link to the full Workflow Case.

After resolution, the card refreshes from the Case source of truth. It must not infer success from the Task status or from a generic interaction's accepted state.

## Data flow

```text
Workflow Case enters review stage
  -> stage automation creates linked Task
  -> Task page reads linked Case
  -> Task page displays Case review controls
  -> human chooses a decision
  -> existing Workflow review endpoint validates current version and human identity
  -> existing Workflow service records the decision and transitions the Case
  -> existing destination-stage onEnter automation runs
  -> Task and Workflow views refresh from durable state
```

No agent participates in the approval-to-transition path.

## Error handling

- `403 review_required`: show that the current actor is not an allowed human approver; do not fall back to waking an agent.
- `409` stale or outdated review: refresh Case detail and require a fresh decision on the current version.
- Missing or non-review linked Case: do not render approval controls; retain the ordinary link to the Workflow item.
- Destination automation failure: the Workflow transition remains auditable and its existing automation failure/retry state is shown by Workflow surfaces. The Task must not claim the downstream action completed merely because the review transition succeeded.
- Duplicate submission: disable controls while the mutation is pending; the existing expected-version guard prevents a second transition.

## Current Wilton Case repair

The accepted generic HOR-12 confirmation remains historical evidence but is not converted into a new approval primitive. After the UI fix is proven, the current Wilton Case should be resolved once through the canonical Workflow review path, citing the accepted HOR-12 interaction in the decision reason. This should advance the Case to `deploy_verify` and prove that the destination automation is invoked. It does not authorize or perform public deployment; the existing preview-only and explicit-deployment guards remain in force.

## Verification

1. A linked Task for a review-stage Case renders the Workflow review card with destinations taken from stage configuration.
2. Approving on the Task calls the existing Case review endpoint with the current Case version.
3. The Case moves to the configured destination and its `onEnter` automation is created exactly once.
4. Request changes and reject use their configured destinations and reason requirements.
5. A stale version cannot transition and refreshes to the current Case state.
6. A generic issue confirmation still behaves as a generic interaction and is not silently converted into a Workflow decision.
7. The existing Workflow item review controls continue to work unchanged.
8. HOR-12's canonical review advances the Wilton Case to `deploy_verify`; no public deployment is claimed without a Deployment Receipt.

## Non-goals and invariants

- Workflow definitions remain data-driven. Different Workflows configure different stages and destinations without new approval code.
- The Workflow Case remains the single source of truth for stage review.
- `Approve` on a Workflow review always means the existing Workflow engine applies the configured transition.
- Task completion and Case review remain distinct durable states.
