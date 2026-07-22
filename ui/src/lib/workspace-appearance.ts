import type {
  Company,
  WorkspaceBackgroundKind,
  WorkspaceBackgroundPosition,
  WorkspaceBackgroundPresence,
  WorkspaceBackgroundPreset,
  WorkspaceGlassCharacter,
} from "@paperclipai/shared";
import type { CSSProperties } from "react";

export interface WorkspaceAppearanceDraft {
  workspaceBackgroundKind: WorkspaceBackgroundKind;
  workspaceBackgroundPreset: WorkspaceBackgroundPreset;
  workspaceBackgroundUrl: string | null;
  workspaceBackgroundPosition: WorkspaceBackgroundPosition;
  workspaceBackgroundPresence: WorkspaceBackgroundPresence;
  workspaceGlassCharacter: WorkspaceGlassCharacter;
}

export const DEFAULT_WORKSPACE_APPEARANCE: WorkspaceAppearanceDraft = {
  workspaceBackgroundKind: "preset",
  workspaceBackgroundPreset: "ainative-ambient",
  workspaceBackgroundUrl: null,
  workspaceBackgroundPosition: "center",
  workspaceBackgroundPresence: "balanced",
  workspaceGlassCharacter: "balanced",
};

const POSITION_VALUES: Record<WorkspaceBackgroundPosition, string> = {
  "top-left": "0% 0%",
  top: "50% 0%",
  "top-right": "100% 0%",
  left: "0% 50%",
  center: "50% 50%",
  right: "100% 50%",
  "bottom-left": "0% 100%",
  bottom: "50% 100%",
  "bottom-right": "100% 100%",
};

const PRESET_URLS: Record<WorkspaceBackgroundPreset, string> = {
  "ainative-ambient": "/backgrounds/ainative-ambient.webp",
};

function cssUrl(url: string) {
  return `url("${url.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}")`;
}

export function appearanceFromCompany(company: Company | null): WorkspaceAppearanceDraft {
  if (!company) return DEFAULT_WORKSPACE_APPEARANCE;
  return {
    workspaceBackgroundKind: company.workspaceBackgroundKind ?? "preset",
    workspaceBackgroundPreset: company.workspaceBackgroundPreset ?? "ainative-ambient",
    workspaceBackgroundUrl: company.workspaceBackgroundUrl ?? null,
    workspaceBackgroundPosition: company.workspaceBackgroundPosition ?? "center",
    workspaceBackgroundPresence: company.workspaceBackgroundPresence ?? "balanced",
    workspaceGlassCharacter: company.workspaceGlassCharacter ?? "balanced",
  };
}

export function resolveWorkspaceAppearance(appearance: WorkspaceAppearanceDraft) {
  const presetUrl = PRESET_URLS[appearance.workspaceBackgroundPreset] ?? PRESET_URLS["ainative-ambient"];
  const image = appearance.workspaceBackgroundKind === "none"
    ? "none"
    : appearance.workspaceBackgroundKind === "upload" && appearance.workspaceBackgroundUrl
      ? cssUrl(appearance.workspaceBackgroundUrl)
      : cssUrl(presetUrl);

  return {
    style: {
      "--workspace-image": image,
      "--workspace-image-position": POSITION_VALUES[appearance.workspaceBackgroundPosition],
    } as CSSProperties,
    backgroundPresence: appearance.workspaceBackgroundPresence,
    glassCharacter: appearance.workspaceGlassCharacter,
  };
}
