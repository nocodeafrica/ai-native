import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Company,
  WorkspaceBackgroundKind,
  WorkspaceBackgroundPosition,
  WorkspaceBackgroundPresence,
  WorkspaceGlassCharacter,
} from "@paperclipai/shared";
import { Check, Image, ImageOff, RotateCcw, Upload } from "lucide-react";
import { assetsApi } from "../../api/assets";
import { companiesApi } from "../../api/companies";
import { useWorkspaceAppearancePreview } from "../../context/WorkspaceAppearanceContext";
import {
  appearanceFromCompany,
  DEFAULT_WORKSPACE_APPEARANCE,
  resolveWorkspaceAppearance,
  type WorkspaceAppearanceDraft,
} from "../../lib/workspace-appearance";
import { queryKeys } from "../../lib/queryKeys";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const SOURCES: Array<{ value: WorkspaceBackgroundKind; label: string; detail: string }> = [
  { value: "preset", label: "AI Native", detail: "The atmospheric original" },
  { value: "upload", label: "Custom", detail: "Your own workspace image" },
  { value: "none", label: "None", detail: "A calm tonal surface" },
];

const PRESENCES: Array<{ value: WorkspaceBackgroundPresence; label: string; detail: string }> = [
  { value: "quiet", label: "Quiet", detail: "Content leads" },
  { value: "balanced", label: "Balanced", detail: "Atmosphere and focus" },
  { value: "vivid", label: "Vivid", detail: "Image comes forward" },
];

const GLASS_CHARACTERS: Array<{ value: WorkspaceGlassCharacter; label: string; detail: string }> = [
  { value: "soft", label: "Soft", detail: "Calm and diffused" },
  { value: "balanced", label: "Balanced", detail: "The default material" },
  { value: "clear", label: "Clear", detail: "Sharper refraction" },
];

const POSITIONS: Array<{ value: WorkspaceBackgroundPosition; label: string }> = [
  { value: "top-left", label: "Top left" },
  { value: "top", label: "Top" },
  { value: "top-right", label: "Top right" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom", label: "Bottom" },
  { value: "bottom-right", label: "Bottom right" },
];

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; detail: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn("workspace-appearance-choice", selected && "workspace-appearance-choice-selected")}
              onClick={() => onChange(option.value)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium">{option.label}</span>
                {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              </span>
              <span className="text-xs text-muted-foreground">{option.detail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WorkspaceAppearanceEditor({ company }: { company: Company }) {
  const queryClient = useQueryClient();
  const { preview, clearPreview } = useWorkspaceAppearancePreview();
  const persisted = useMemo(() => appearanceFromCompany(company), [company]);
  const [draft, setDraft] = useState<WorkspaceAppearanceDraft>(persisted);
  const [backgroundAssetId, setBackgroundAssetId] = useState(company.workspaceBackgroundAssetId);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const companyIdRef = useRef(company.id);

  useEffect(() => {
    companyIdRef.current = company.id;
    setDraft(persisted);
    setBackgroundAssetId(company.workspaceBackgroundAssetId);
    setUploadError(null);
    clearPreview();
  }, [clearPreview, company.id, company.workspaceBackgroundAssetId, persisted]);

  useEffect(() => {
    preview(company.id, draft);
  }, [company.id, draft, preview]);

  useEffect(() => () => clearPreview(), [clearPreview]);

  const resolved = resolveWorkspaceAppearance(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(persisted)
    || backgroundAssetId !== company.workspaceBackgroundAssetId;

  const uploadMutation = useMutation({
    mutationFn: (file: File) => assetsApi.uploadWorkspaceBackground(company.id, file),
    onSuccess: (asset) => {
      if (companyIdRef.current !== company.id) return;
      setBackgroundAssetId(asset.assetId);
      setDraft((current) => ({
        ...current,
        workspaceBackgroundKind: "upload",
        workspaceBackgroundUrl: asset.contentPath,
      }));
      setUploadError(null);
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : "Background upload failed");
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => companiesApi.update(company.id, {
      workspaceBackgroundKind: draft.workspaceBackgroundKind,
      workspaceBackgroundPreset: draft.workspaceBackgroundPreset,
      workspaceBackgroundAssetId: draft.workspaceBackgroundKind === "upload" ? backgroundAssetId : null,
      workspaceBackgroundPosition: draft.workspaceBackgroundPosition,
      workspaceBackgroundPresence: draft.workspaceBackgroundPresence,
      workspaceGlassCharacter: draft.workspaceGlassCharacter,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      clearPreview();
    },
  });

  function updateDraft(patch: Partial<WorkspaceAppearanceDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    setUploadError(null);
    uploadMutation.mutate(file);
  }

  function resetDraft() {
    setDraft(DEFAULT_WORKSPACE_APPEARANCE);
    setBackgroundAssetId(null);
    setUploadError(null);
  }

  const customUnavailable = draft.workspaceBackgroundKind === "upload" && !backgroundAssetId;

  return (
    <section className="workspace-appearance-editor space-y-5" aria-labelledby="workspace-atmosphere-heading">
      <div className="space-y-1">
        <h3 id="workspace-atmosphere-heading" className="text-sm font-medium">Workspace atmosphere</h3>
        <p className="text-xs text-muted-foreground">
          Shape the background and glass material shared by everyone in this company.
        </p>
      </div>

      <div
        className="workspace-appearance-preview"
        style={resolved.style}
        data-background-presence={resolved.backgroundPresence}
        data-glass-character={resolved.glassCharacter}
        aria-label="Workspace appearance preview"
      >
        <div className="workspace-appearance-preview-image" />
        <div className="workspace-appearance-preview-sidebar">
          <span className="workspace-appearance-preview-mark" />
          <span className="workspace-appearance-preview-line workspace-appearance-preview-line-active" />
          <span className="workspace-appearance-preview-line" />
          <span className="workspace-appearance-preview-line" />
        </div>
        <div className="workspace-appearance-preview-content">
          <span className="workspace-appearance-preview-kicker">HORIZON / OPERATIONS</span>
          <strong>Workspace, in focus.</strong>
          <span>Atmosphere behind the work — never on top of it.</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground">Background</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Background source">
          {SOURCES.map((source) => {
            const selected = source.value === draft.workspaceBackgroundKind;
            const Icon = source.value === "preset" ? Image : source.value === "upload" ? Upload : ImageOff;
            return (
              <button
                key={source.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cn("workspace-appearance-source", selected && "workspace-appearance-choice-selected")}
                onClick={() => updateDraft({ workspaceBackgroundKind: source.value })}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>
                  <span className="block font-medium">{source.label}</span>
                  <span className="block text-xs text-muted-foreground">{source.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
        {draft.workspaceBackgroundKind === "upload" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-accent">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {uploadMutation.isPending ? "Uploading…" : backgroundAssetId ? "Replace image" : "Choose image"}
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleUpload}
                disabled={uploadMutation.isPending}
              />
            </label>
            {backgroundAssetId ? <span className="text-xs text-muted-foreground">Custom image ready</span> : null}
            {uploadError ? <span className="text-xs text-destructive">{uploadError}</span> : null}
          </div>
        ) : null}
      </div>

      <ChoiceGroup
        label="Background presence"
        value={draft.workspaceBackgroundPresence}
        options={PRESENCES}
        onChange={(workspaceBackgroundPresence) => updateDraft({ workspaceBackgroundPresence })}
      />

      <ChoiceGroup
        label="Glass character"
        value={draft.workspaceGlassCharacter}
        options={GLASS_CHARACTERS}
        onChange={(workspaceGlassCharacter) => updateDraft({ workspaceGlassCharacter })}
      />

      {draft.workspaceBackgroundKind !== "none" ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground">Image focal point</div>
          <div className="workspace-appearance-position-grid" role="radiogroup" aria-label="Image focal point">
            {POSITIONS.map((position) => (
              <button
                key={position.value}
                type="button"
                role="radio"
                aria-label={position.label}
                aria-checked={draft.workspaceBackgroundPosition === position.value}
                title={position.label}
                className="workspace-appearance-position"
                data-selected={draft.workspaceBackgroundPosition === position.value ? "true" : "false"}
                onClick={() => updateDraft({ workspaceBackgroundPosition: position.value })}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || customUnavailable || uploadMutation.isPending || saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save appearance"}
        </Button>
        <Button size="sm" variant="ghost" onClick={resetDraft} disabled={saveMutation.isPending}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </Button>
        {customUnavailable ? (
          <span className="text-xs text-muted-foreground">Choose an image before saving Custom.</span>
        ) : saveMutation.isSuccess && !dirty ? (
          <span className="text-xs text-muted-foreground">Appearance saved</span>
        ) : null}
        {saveMutation.isError ? (
          <span className="text-xs text-destructive">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Appearance could not be saved"}
          </span>
        ) : null}
      </div>
    </section>
  );
}
