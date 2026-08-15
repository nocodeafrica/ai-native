// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { IssueLinkedWorkflowCaseSummary } from "@paperclipai/shared";
import { createRoot, type Root } from "react-dom/client";
import { act, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { WorkflowReviewCard } from "./WorkflowReviewCard";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockPipelinesApi = vi.hoisted(() => ({
  getCase: vi.fn(),
  reviewCase: vi.fn(),
}));
const mockPushToast = vi.hoisted(() => vi.fn());

vi.mock("../api/pipelines", async () => {
  const actual = await vi.importActual<typeof import("../api/pipelines")>("../api/pipelines");
  return { ...actual, pipelinesApi: mockPipelinesApi };
});

vi.mock("../context/ToastContext", () => ({
  useToastActions: () => ({ pushToast: mockPushToast }),
}));

vi.mock("../lib/router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

const linkedCase: IssueLinkedWorkflowCaseSummary = {
  id: "case-1",
  caseKey: "website-1",
  title: "Wilton Plumbing website",
  status: "open",
  role: "automation",
  pipeline: { id: "workflow-1", key: "website-development", name: "Website Development" },
  stage: { id: "stage-review", key: "independent_qa", name: "Independent QA", kind: "review" },
};

function caseDetail(stageKind = "review") {
  return {
    case: {
      id: "case-1",
      pipelineId: "workflow-1",
      stageId: "stage-review",
      title: "Wilton Plumbing website",
      version: 4,
      terminalKind: null,
    },
    stage: {
      id: "stage-review",
      pipelineId: "workflow-1",
      key: "independent_qa",
      name: "Independent QA",
      kind: stageKind,
      position: 400,
      config: {
        approveToStageKey: "deploy_verify",
        requestChangesToStageKey: "design_build",
        rejectToStageKey: "website_blueprint",
        requireRequestChangesReason: true,
        requireRejectReason: true,
      },
    },
    pipeline: {
      id: "workflow-1",
      companyId: "company-1",
      key: "website-development",
      name: "Website Development",
      description: null,
      projectId: null,
      enforceTransitions: true,
      archivedAt: null,
      stageCount: 6,
      openCaseCount: 1,
      createdAt: "2026-07-22T00:00:00.000Z",
      updatedAt: "2026-07-22T00:00:00.000Z",
    },
    allowedNextStages: [
      { id: "stage-deploy", pipelineId: "workflow-1", key: "deploy_verify", name: "Deploy & Verify", kind: "review", position: 500 },
      { id: "stage-build", pipelineId: "workflow-1", key: "design_build", name: "Design & Build", kind: "working", position: 300 },
      { id: "stage-blueprint", pipelineId: "workflow-1", key: "website_blueprint", name: "Website Blueprint", kind: "review", position: 200 },
    ],
    links: [],
    blockers: [],
    blocks: [],
    childrenSummary: { childCount: 0, terminalChildCount: 0, loadedChildren: 0 },
  };
}

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

describe("WorkflowReviewCard", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    mockPipelinesApi.getCase.mockResolvedValue(caseDetail());
    mockPipelinesApi.reviewCase.mockResolvedValue({});
    mockPushToast.mockClear();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    container.remove();
    vi.clearAllMocks();
  });

  async function render(linkedCases: IssueLinkedWorkflowCaseSummary[] = [linkedCase]) {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <WorkflowReviewCard issueId="task-1" linkedCases={linkedCases} />
        </QueryClientProvider>,
      );
    });
    await flushReact();
  }

  it("renders the canonical configured decisions independently of task status", async () => {
    await render();

    expect(container.textContent).toContain("Workflow review");
    expect(container.textContent).toContain("Independent QA");
    expect(container.textContent).toContain("Approve");
    expect(container.textContent).toContain("Move to Deploy & Verify");
    expect(container.textContent).toContain("Request changes");
    expect(container.textContent).toContain("Move to Design & Build");
    expect(container.textContent).toContain("Agent confirmation cards do not advance this Workflow");
  });

  it("submits approval through the canonical review endpoint with the current version", async () => {
    await render();
    const approve = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Approve"));
    expect(approve).toBeDefined();

    await act(async () => approve!.click());
    await flushReact();

    expect(mockPipelinesApi.reviewCase).toHaveBeenCalledWith("case-1", {
      decision: "approve",
      reason: null,
      expectedVersion: 4,
    });
  });

  it("requires a reason for configured changes requests", async () => {
    await render();
    const requestChanges = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Request changes"));
    expect(requestChanges?.disabled).toBe(true);

    const textarea = container.querySelector("textarea")!;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(textarea, "The mobile menu still breaks.");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(requestChanges?.disabled).toBe(false);
  });

  it("refreshes the case instead of guessing after a stale review", async () => {
    mockPipelinesApi.reviewCase.mockRejectedValueOnce(new ApiError("Pipeline case version conflict", 409, {}));
    await render();
    const approve = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Approve"));

    await act(async () => approve!.click());
    await flushReact();

    expect(mockPipelinesApi.getCase.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockPushToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Workflow review changed",
      tone: "warn",
    }));
  });

  it("does not render non-automation, terminal, or no-longer-reviewable links", async () => {
    await render([{ ...linkedCase, role: "work" }, { ...linkedCase, id: "case-2", status: "done" }]);
    expect(container.textContent).not.toContain("Workflow review");

    mockPipelinesApi.getCase.mockResolvedValueOnce(caseDetail("working"));
    await render();
    expect(container.textContent).not.toContain("Workflow review");
  });
});
