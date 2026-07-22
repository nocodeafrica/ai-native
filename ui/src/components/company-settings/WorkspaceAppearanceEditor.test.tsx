// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Company } from "@paperclipai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAppearanceProvider } from "../../context/WorkspaceAppearanceContext";
import { WorkspaceAppearanceEditor } from "./WorkspaceAppearanceEditor";

const mockCompaniesApi = vi.hoisted(() => ({ update: vi.fn() }));
const mockAssetsApi = vi.hoisted(() => ({ uploadWorkspaceBackground: vi.fn() }));

vi.mock("../../api/companies", () => ({ companiesApi: mockCompaniesApi }));
vi.mock("../../api/assets", () => ({ assetsApi: mockAssetsApi }));

const company: Company = {
  id: "company-1",
  name: "Horizon",
  description: null,
  status: "active",
  pauseReason: null,
  pausedAt: null,
  issuePrefix: "HOR",
  issueCounter: 1,
  budgetMonthlyCents: 0,
  spentMonthlyCents: 0,
  attachmentMaxBytes: 10 * 1024 * 1024,
  defaultResponsibleUserId: null,
  requireBoardApprovalForNewAgents: false,
  feedbackDataSharingEnabled: false,
  feedbackDataSharingConsentAt: null,
  feedbackDataSharingConsentByUserId: null,
  feedbackDataSharingTermsVersion: null,
  brandColor: null,
  logoAssetId: null,
  logoUrl: null,
  workspaceBackgroundKind: "preset",
  workspaceBackgroundPreset: "ainative-ambient",
  workspaceBackgroundAssetId: null,
  workspaceBackgroundUrl: null,
  workspaceBackgroundPosition: "center",
  workspaceBackgroundPresence: "balanced",
  workspaceGlassCharacter: "balanced",
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void>;
  flushSync(() => { result = callback(); });
  await result;
}

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

function click(element: Element | null) {
  element?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

describe("WorkspaceAppearanceEditor", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockCompaniesApi.update.mockResolvedValue(company);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <WorkspaceAppearanceProvider>
            <WorkspaceAppearanceEditor company={company} />
          </WorkspaceAppearanceProvider>
        </QueryClientProvider>,
      );
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("previews designed material choices and saves the typed company settings", async () => {
    const vivid = Array.from(container.querySelectorAll('[role="radio"]'))
      .find((node) => node.textContent?.includes("Vivid")) ?? null;
    const clear = Array.from(container.querySelectorAll('[role="radio"]'))
      .find((node) => node.textContent?.includes("Clear")) ?? null;
    const topRight = container.querySelector('[aria-label="Top right"]');

    await act(async () => {
      click(vivid);
      click(clear);
      click(topRight);
    });

    const preview = container.querySelector('[aria-label="Workspace appearance preview"]');
    expect(preview?.getAttribute("data-background-presence")).toBe("vivid");
    expect(preview?.getAttribute("data-glass-character")).toBe("clear");

    const save = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Save appearance")) ?? null;
    await act(async () => click(save));
    await flushReact();

    expect(mockCompaniesApi.update).toHaveBeenCalledWith("company-1", expect.objectContaining({
      workspaceBackgroundKind: "preset",
      workspaceBackgroundPosition: "top-right",
      workspaceBackgroundPresence: "vivid",
      workspaceGlassCharacter: "clear",
    }));
  });

  it("keeps Custom unsaveable until an image is available", async () => {
    const custom = Array.from(container.querySelectorAll('[role="radio"]'))
      .find((node) => node.textContent?.includes("Custom")) ?? null;
    await act(async () => click(custom));
    const save = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Save appearance")) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(container.textContent).toContain("Choose an image before saving Custom.");
  });
});
