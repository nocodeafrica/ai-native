import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Company,
  WorkspaceBackgroundPosition,
  WorkspaceBackgroundPresence,
  WorkspaceBackgroundPreset,
  WorkspaceGlassCharacter,
} from "@paperclipai/shared";
import { WORKSPACE_BACKGROUND_PRESETS } from "@paperclipai/shared";
import { Check, ImageOff, RotateCcw, Upload } from "lucide-react";
import { assetsApi } from "../../api/assets";
import { companiesApi } from "../../api/companies";
import { useWorkspaceAppearancePreview } from "../../context/WorkspaceAppearanceContext";
import {
  appearanceFromCompany,
  DEFAULT_WORKSPACE_APPEARANCE,
  resolveWorkspaceAppearance,
  workspaceBackgroundPresetUrl,
  type WorkspaceAppearanceDraft,
} from "../../lib/workspace-appearance";
import { queryKeys } from "../../lib/queryKeys";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

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

function presetLabel(preset: WorkspaceBackgroundPreset) {
  if (preset === "ainative-ambient") return "AI Native original";
  return `Atmosphere ${preset.slice(3)}`;
}

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
  const uploadInputRef = useRef<HTMLInputElement>(null);

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

  function renderPresetTile(preset: WorkspaceBackgroundPreset) {
    const selected = draft.workspaceBackgroundKind === "preset"
      && draft.workspaceBackgroundPreset === preset;
    return (
      <button
        key={preset}
        type="button"
        aria-pressed={selected}
        aria-label={`Background ${presetLabel(preset)}`}
        className={cn("workspace-appearance-background-tile", selected && "workspace-appearance-background-tile-selected")}
        onClick={() => updateDraft({
          workspaceBackgroundKind: "preset",
          workspaceBackgroundPreset: preset,
        })}
      >
        <img
          src={workspaceBackgroundPresetUrl(preset)}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="workspace-appearance-background-tile-label">
          {presetLabel(preset)}
        </span>
        {selected ? <Check className="workspace-appearance-background-tile-check" aria-hidden="true" /> : null}
      </button>
    );
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
        <div>
          <div className="text-xs font-medium text-foreground">Background</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a scene directly, or upload your own. The workspace previews it immediately.
          </p>
        </div>
        <div className="workspace-appearance-gallery" aria-label="Background gallery">
          {renderPresetTile(WORKSPACE_BACKGROUND_PRESETS[0])}

          <button
            type="button"
            aria-pressed={draft.workspaceBackgroundKind === "upload"}
            aria-label={backgroundAssetId ? "Replace custom background" : "Upload custom background"}
            className={cn(
              "workspace-appearance-background-tile workspace-appearance-background-tile-upload",
              draft.workspaceBackgroundKind === "upload" && "workspace-appearance-background-tile-selected",
            )}
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {draft.workspaceBackgroundKind === "upload" && draft.workspaceBackgroundUrl ? (
              <img src={draft.workspaceBackgroundUrl} alt="" />
            ) : (
              <Upload className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="workspace-appearance-background-tile-label">
              {uploadMutation.isPending ? "Uploading…" : backgroundAssetId ? "Replace upload" : "Upload image"}
            </span>
            {draft.workspaceBackgroundKind === "upload"
              ? <Check className="workspace-appearance-background-tile-check" aria-hidden="true" />
              : null}
          </button>

          <button
            type="button"
            aria-pressed={draft.workspaceBackgroundKind === "none"}
            aria-label="No background image"
            className={cn(
              "workspace-appearance-background-tile workspace-appearance-background-tile-none",
              draft.workspaceBackgroundKind === "none" && "workspace-appearance-background-tile-selected",
            )}
            onClick={() => updateDraft({ workspaceBackgroundKind: "none" })}
          >
            <ImageOff className="h-5 w-5" aria-hidden="true" />
            <span className="workspace-appearance-background-tile-label">No image</span>
            {draft.workspaceBackgroundKind === "none"
              ? <Check className="workspace-appearance-background-tile-check" aria-hidden="true" />
              : null}
          </button>

          {WORKSPACE_BACKGROUND_PRESETS.slice(1).map(renderPresetTile)}
          <input
            ref={uploadInputRef}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleUpload}
            disabled={uploadMutation.isPending}
            aria-label="Choose custom background image"
          />
        </div>
        {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
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
