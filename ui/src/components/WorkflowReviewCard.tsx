import { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import type { IssueLinkedWorkflowCaseSummary } from "@paperclipai/shared";
import { Check, Loader2, RotateCcw, ShieldCheck, X } from "lucide-react";
import { ApiError } from "../api/client";
import {
  pipelinesApi,
  type PipelineCaseDetail,
  type PipelineReviewDecision,
  type PipelineStage,
} from "../api/pipelines";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { Link } from "../lib/router";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

interface ReviewDecisionAction {
  decision: PipelineReviewDecision;
  label: string;
  targetStageKey: string;
  targetStageName: string;
  requireReason: boolean;
  variant: "default" | "outline" | "destructive";
}

function configString(config: Record<string, unknown> | null | undefined, key: string) {
  const value = config?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function fallbackStageKey(stages: PipelineStage[], kind: string) {
  return stages.find((stage) => stage.kind === kind)?.key
    ?? stages.find((stage) => stage.key === kind)?.key
    ?? null;
}

export function workflowReviewActions(detail: PipelineCaseDetail): ReviewDecisionAction[] {
  if (detail.stage.kind !== "review" || detail.case.terminalKind) return [];
  const stages = [detail.stage, ...(detail.allowedNextStages ?? [])];
  const stageNames = new Map(stages.map((stage) => [stage.key, stage.name]));
  const config = detail.stage.config ?? {};
  const actions: ReviewDecisionAction[] = [];
  const approveToStageKey = configString(config, "approveToStageKey") ?? fallbackStageKey(stages, "done");
  const requestChangesToStageKey = configString(config, "requestChangesToStageKey");
  const rejectToStageKey = configString(config, "rejectToStageKey") ?? fallbackStageKey(stages, "cancelled");

  if (approveToStageKey) {
    actions.push({
      decision: "approve",
      label: "Approve",
      targetStageKey: approveToStageKey,
      targetStageName: stageNames.get(approveToStageKey) ?? approveToStageKey,
      requireReason: false,
      variant: "default",
    });
  }
  if (requestChangesToStageKey) {
    actions.push({
      decision: "request_changes",
      label: "Request changes",
      targetStageKey: requestChangesToStageKey,
      targetStageName: stageNames.get(requestChangesToStageKey) ?? requestChangesToStageKey,
      requireReason: config.requireRequestChangesReason !== false,
      variant: "outline",
    });
  }
  if (rejectToStageKey) {
    actions.push({
      decision: "reject",
      label: "Reject",
      targetStageKey: rejectToStageKey,
      targetStageName: stageNames.get(rejectToStageKey) ?? rejectToStageKey,
      requireReason: config.requireRejectReason !== false,
      variant: "destructive",
    });
  }
  return actions;
}

function reviewToastTitle(decision: PipelineReviewDecision) {
  if (decision === "approve") return "Workflow item approved";
  if (decision === "request_changes") return "Workflow changes requested";
  return "Workflow item rejected";
}

function WorkflowReviewCaseCard({
  issueId,
  linkedCase,
  detail,
}: {
  issueId: string;
  linkedCase: IssueLinkedWorkflowCaseSummary;
  detail: PipelineCaseDetail;
}) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [note, setNote] = useState("");
  const [pendingDecision, setPendingDecision] = useState<PipelineReviewDecision | null>(null);
  const actions = useMemo(() => workflowReviewActions(detail), [detail]);

  const decide = useMutation({
    mutationFn: (decision: PipelineReviewDecision) => {
      if (!detail?.case.version) throw new Error("Missing Workflow item version");
      return pipelinesApi.reviewCase(linkedCase.id, {
        decision,
        reason: note.trim() || null,
        expectedVersion: detail.case.version,
      });
    },
    onSuccess: async (_result, decision) => {
      setNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.caseDetail(linkedCase.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.cases(linkedCase.pipeline.id) }),
      ]);
      pushToast({ title: reviewToastTitle(decision), tone: "success" });
    },
    onError: async (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.refetchQueries({ queryKey: queryKeys.pipelines.caseDetail(linkedCase.id) });
        pushToast({
          title: "Workflow review changed",
          body: "The item changed while you were reviewing it. Review the current version before deciding.",
          tone: "warn",
        });
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        pushToast({
          title: "Human Workflow approval required",
          body: error.message,
          tone: "error",
        });
        return;
      }
      pushToast({
        title: "Could not update the Workflow review",
        body: error instanceof Error ? error.message : "Try again.",
        tone: "error",
      });
    },
    onSettled: () => setPendingDecision(null),
  });

  if (actions.length === 0) return null;

  const trimmedNote = note.trim();
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{detail.pipeline.name}</p>
        <p className="text-sm text-muted-foreground">
          {detail.stage.name} · {detail.case.title}
        </p>
      </div>

      <label className="block space-y-1.5 text-sm font-medium text-foreground">
        <span>Review note</span>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Optional for approval; required when configured for changes or rejection."
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const reasonMissing = action.requireReason && trimmedNote.length === 0;
          const isPending = decide.isPending && pendingDecision === action.decision;
          return (
            <Button
              key={action.decision}
              type="button"
              variant={action.variant}
              className="h-auto min-h-14 justify-start px-4 py-3 text-left"
              aria-label={`${action.label} and move to ${action.targetStageName}`}
              disabled={decide.isPending || reasonMissing}
              onClick={() => {
                setPendingDecision(action.decision);
                decide.mutate(action.decision);
              }}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : action.decision === "approve" ? (
                <Check className="h-4 w-4" />
              ) : action.decision === "request_changes" ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="min-w-0">
                <span className="block">{action.label}</span>
                <span className="block truncate text-xs font-normal opacity-75">
                  Move to {action.targetStageName}
                </span>
              </span>
            </Button>
          );
        })}
      </div>

      <Link
        to={`/pipelines/${detail.pipeline.id}/items/${detail.case.id}`}
        className="inline-flex text-sm font-medium text-primary hover:underline"
      >
        Open Workflow item
      </Link>
    </div>
  );
}

export function WorkflowReviewCard({
  issueId,
  linkedCases,
}: {
  issueId: string;
  linkedCases: IssueLinkedWorkflowCaseSummary[] | undefined;
}) {
  const reviewLinks = (linkedCases ?? []).filter((linkedCase) =>
    linkedCase.role === "automation"
    && linkedCase.status === "open"
    && linkedCase.stage.kind === "review"
  );
  const caseQueries = useQueries({
    queries: reviewLinks.map((linkedCase) => ({
      queryKey: queryKeys.pipelines.caseDetail(linkedCase.id),
      queryFn: () => pipelinesApi.getCase(linkedCase.id),
    })),
  });
  if (reviewLinks.length === 0) return null;
  const reviewItems = reviewLinks.flatMap((linkedCase, index) => {
    const detail = caseQueries[index]?.data ?? null;
    return detail && workflowReviewActions(detail).length > 0 ? [{ linkedCase, detail }] : [];
  });
  const loading = caseQueries.some((query) => query.isLoading);
  if (!loading && reviewItems.length === 0) return null;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <CardTitle>Workflow review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Only a decision here can advance this Workflow. Agent confirmation cards do not advance this Workflow.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && reviewItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading Workflow review…</p>
        ) : null}
        {reviewItems.map(({ linkedCase, detail }) => (
          <WorkflowReviewCaseCard
            key={linkedCase.id}
            issueId={issueId}
            linkedCase={linkedCase}
            detail={detail}
          />
        ))}
      </CardContent>
    </Card>
  );
}
