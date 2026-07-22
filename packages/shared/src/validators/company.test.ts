import { describe, expect, it } from "vitest";
import { updateCompanySchema } from "./company.js";

describe("updateCompanySchema workspace appearance", () => {
  it("accepts the supported workspace appearance contract", () => {
    expect(updateCompanySchema.parse({
      workspaceBackgroundKind: "preset",
      workspaceBackgroundPreset: "ainative-ambient",
      workspaceBackgroundPosition: "center",
      workspaceBackgroundPresence: "balanced",
      workspaceGlassCharacter: "balanced",
    })).toMatchObject({
      workspaceBackgroundKind: "preset",
      workspaceBackgroundPreset: "ainative-ambient",
      workspaceBackgroundPosition: "center",
      workspaceBackgroundPresence: "balanced",
      workspaceGlassCharacter: "balanced",
    });
  });

  it("rejects style values outside the designed presets", () => {
    expect(() => updateCompanySchema.parse({ workspaceBackgroundPresence: "neon" })).toThrow();
    expect(() => updateCompanySchema.parse({ workspaceBackgroundPosition: "13% 77%" })).toThrow();
    expect(() => updateCompanySchema.parse({ workspaceGlassCharacter: "invisible" })).toThrow();
  });
});
