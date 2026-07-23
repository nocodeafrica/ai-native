import { describe, expect, it } from "vitest";
import { DEFAULT_WORKSPACE_APPEARANCE, resolveWorkspaceAppearance } from "./workspace-appearance";

describe("resolveWorkspaceAppearance", () => {
  it("resolves the shipped background and center focal point", () => {
    expect(resolveWorkspaceAppearance(DEFAULT_WORKSPACE_APPEARANCE)).toEqual({
      style: {
        "--workspace-image": 'url("/backgrounds/ainative-ambient.webp")',
        "--workspace-image-position": "50% 50%",
      },
      backgroundPresence: "balanced",
      glassCharacter: "balanced",
    });
  });

  it("supports uploads, none, and named focal points", () => {
    expect(resolveWorkspaceAppearance({
      ...DEFAULT_WORKSPACE_APPEARANCE,
      workspaceBackgroundKind: "upload",
      workspaceBackgroundUrl: "/api/assets/background/content",
      workspaceBackgroundPosition: "bottom-right",
    }).style).toEqual({
      "--workspace-image": 'url("/api/assets/background/content")',
      "--workspace-image-position": "100% 100%",
    });

    const none = resolveWorkspaceAppearance({
      ...DEFAULT_WORKSPACE_APPEARANCE,
      workspaceBackgroundKind: "none",
    });
    expect(none.style).toMatchObject({ "--workspace-image": "none" });
  });

  it("resolves every recovered gallery preset through its vendored image path", () => {
    const resolved = resolveWorkspaceAppearance({
      ...DEFAULT_WORKSPACE_APPEARANCE,
      workspaceBackgroundPreset: "bg_126",
    });
    expect(resolved.style).toMatchObject({
      "--workspace-image": 'url("/backgrounds/bg_126.webp")',
    });
  });

  it("falls back to the built-in image when an uploaded asset is missing", () => {
    const resolved = resolveWorkspaceAppearance({
      ...DEFAULT_WORKSPACE_APPEARANCE,
      workspaceBackgroundKind: "upload",
      workspaceBackgroundUrl: null,
    });
    expect(resolved.style).toMatchObject({
      "--workspace-image": 'url("/backgrounds/ainative-ambient.webp")',
    });
  });
});
