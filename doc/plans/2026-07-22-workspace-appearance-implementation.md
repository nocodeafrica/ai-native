# Workspace Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a company-scoped Appearance studio that previews and persists the workspace background, background presence, glass character, and focal position.

**Architecture:** Extend the company contract with typed appearance fields and a one-to-one background-asset association, reusing the existing company image asset pipeline. A focused appearance resolver converts stored preset names into semantic CSS variables shared by the live `Layout` and the settings preview. Company Settings owns editing and upload state; the shell remains presentation-only.

**Tech Stack:** React 19, TypeScript, TanStack Query, Express, Drizzle/PostgreSQL, Zod, Tailwind CSS v4, Vitest/jsdom.

**Approved design:** `doc/plans/2026-07-22-workspace-appearance-design.md`

---

## Acceptance gate

The slice ships only after persistence survives reload and server restart in the repo-local `HOR` instance, company switching does not leak appearance, upload/reset/fallback paths work, and focused tests, token gates, typecheck, build, and signed-in desktop/narrow browser checks pass. The pre-existing `.gitignore` modification is not part of this work.

### Task 1: Define the typed appearance contract

**Files:**
- Modify: `packages/shared/src/constants.ts`
- Modify: `packages/shared/src/types/company.ts`
- Modify: `packages/shared/src/validators/company.ts`
- Test: `packages/shared/src/validators/company.test.ts`

- [ ] **Step 1: Write validator failures first**

Add cases that accept the six supported appearance fields and reject unknown preset names, invalid positions, and an upload kind without an asset id:

```ts
expect(updateCompanySchema.parse({
  workspaceBackgroundKind: "preset",
  workspaceBackgroundPreset: "ainative-ambient",
  workspaceBackgroundPosition: "center",
  workspaceBackgroundPresence: "balanced",
  workspaceGlassCharacter: "balanced",
})).toMatchObject({ workspaceBackgroundKind: "preset" });

expect(() => updateCompanySchema.parse({ workspaceBackgroundPresence: "neon" })).toThrow();
expect(() => updateCompanySchema.parse({ workspaceBackgroundPosition: "13% 77%" })).toThrow();
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm exec vitest run packages/shared/src/validators/company.test.ts`  
Expected: FAIL because the appearance fields are stripped or unavailable.

- [ ] **Step 3: Add the closed unions and defaults**

Export constants and types:

```ts
export const WORKSPACE_BACKGROUND_KINDS = ["preset", "upload", "none"] as const;
export const WORKSPACE_BACKGROUND_PRESETS = ["ainative-ambient"] as const;
export const WORKSPACE_BACKGROUND_POSITIONS = [
  "top-left", "top", "top-right", "left", "center", "right",
  "bottom-left", "bottom", "bottom-right",
] as const;
export const WORKSPACE_BACKGROUND_PRESENCES = ["quiet", "balanced", "vivid"] as const;
export const WORKSPACE_GLASS_CHARACTERS = ["soft", "balanced", "clear"] as const;
```

Extend `Company` and `updateCompanySchema` with nullable `workspaceBackgroundAssetId`, resolved `workspaceBackgroundUrl`, and the five enum-backed settings. Keep defaults server-side so older rows resolve identically.

- [ ] **Step 4: Run tests and commit**

Run: `pnpm exec vitest run packages/shared/src/validators/company.test.ts`  
Expected: PASS.

Commit exact paths with: `git commit -m "feat(shared): define workspace appearance contract"`.

### Task 2: Persist company appearance and the optional image link

**Files:**
- Create: `packages/db/src/schema/company_workspace_backgrounds.ts`
- Modify: `packages/db/src/schema/companies.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/migrations/0182_company_workspace_appearance.sql`
- Modify: `packages/db/src/migrations/meta/_journal.json`
- Test: `packages/db/src/client.test.ts`

- [ ] **Step 1: Add a failing migration inventory assertion**

Extend the schema-table assertion to include `company_workspace_backgrounds`, then run: `pnpm exec vitest run packages/db/src/client.test.ts`.  
Expected: FAIL because the table is absent.

- [ ] **Step 2: Add additive schema fields**

Add non-null text columns with defaults to `companies`:

```ts
workspaceBackgroundKind: text("workspace_background_kind").notNull().default("preset"),
workspaceBackgroundPreset: text("workspace_background_preset").notNull().default("ainative-ambient"),
workspaceBackgroundPosition: text("workspace_background_position").notNull().default("center"),
workspaceBackgroundPresence: text("workspace_background_presence").notNull().default("balanced"),
workspaceGlassCharacter: text("workspace_glass_character").notNull().default("balanced"),
```

Create a one-to-one association table matching `company_logos`:

```ts
export const companyWorkspaceBackgrounds = pgTable("company_workspace_backgrounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyUq: uniqueIndex("company_workspace_backgrounds_company_uq").on(table.companyId),
  assetUq: uniqueIndex("company_workspace_backgrounds_asset_uq").on(table.assetId),
}));
```

- [ ] **Step 3: Add the forward-only migration and journal entry**

The SQL adds all five columns and the association table with FK, unique indexes, and no backfill loop. Existing rows receive the shipped defaults.

- [ ] **Step 4: Run DB test and commit**

Run: `pnpm exec vitest run packages/db/src/client.test.ts`  
Expected: PASS.

Commit exact paths with: `git commit -m "feat(db): persist company workspace appearance"`.

### Task 3: Expose safe appearance updates and uploads

**Files:**
- Modify: `server/src/services/companies.ts`
- Modify: `server/src/routes/assets.ts`
- Modify: `ui/src/api/assets.ts`
- Modify: `ui/src/api/companies.ts`
- Test: `server/src/__tests__/company-branding-route.test.ts`
- Test: `server/src/__tests__/companies-route-cross-company-authz.test.ts`

- [ ] **Step 1: Write failing API tests**

Cover: company responses include defaults; a same-company image asset can become the background; a foreign-company asset returns `422`; clearing the asset removes the link; an unsupported upload returns `422`.

Run: `pnpm exec vitest run server/src/__tests__/company-branding-route.test.ts server/src/__tests__/companies-route-cross-company-authz.test.ts`  
Expected: FAIL on missing fields and update behavior.

- [ ] **Step 2: Join and resolve the appearance asset**

Extend `companySelection`, `getCompanyQuery`, and `enrichCompany`:

```ts
workspaceBackgroundAssetId: companyWorkspaceBackgrounds.assetId,
workspaceBackgroundUrl: company.workspaceBackgroundAssetId
  ? `/api/assets/${company.workspaceBackgroundAssetId}/content`
  : null,
```

Update the service transaction to validate asset ownership, upsert/delete the association, and delete a replaced orphan asset using the existing logo pattern. Never accept a storage path from the client.

- [ ] **Step 3: Add the dedicated upload client**

Implement `assetsApi.uploadWorkspaceBackground(companyId, file)` through the existing `/assets/images` endpoint with namespace `workspace-backgrounds`. Add the appearance keys to `companiesApi.update`.

- [ ] **Step 4: Run focused tests and commit**

Run the two route suites above.  
Expected: PASS.

Commit exact paths with: `git commit -m "feat(api): manage company workspace backgrounds"`.

### Task 4: Preserve appearance in company portability

**Files:**
- Modify: `packages/shared/src/types/company-portability.ts`
- Modify: `packages/shared/src/validators/company-portability.ts`
- Modify: `server/src/services/company-portability.ts`
- Test: `server/src/__tests__/company-portability.test.ts`

- [ ] **Step 1: Write failing export/import coverage**

Add a fixture whose manifest includes the five appearance fields and `backgroundPath: "images/workspace-background.webp"`. Assert export writes the file and import restores the uploaded association.

Run: `pnpm exec vitest run server/src/__tests__/company-portability.test.ts`  
Expected: FAIL because the manifest drops appearance.

- [ ] **Step 2: Extend the manifest contract**

Add the fields:

```ts
workspaceBackgroundKind: "preset" | "upload" | "none";
workspaceBackgroundPreset: "ainative-ambient";
workspaceBackgroundPath: string | null;
workspaceBackgroundPosition: WorkspaceBackgroundPosition;
workspaceBackgroundPresence: WorkspaceBackgroundPresence;
workspaceGlassCharacter: WorkspaceGlassCharacter;
```

Export uploaded bytes using the same safe image-file machinery as the logo. During import, create the asset first, then update the company with its returned id. Missing legacy fields resolve to defaults.

- [ ] **Step 3: Run portability tests and commit**

Run: `pnpm exec vitest run server/src/__tests__/company-portability.test.ts`  
Expected: PASS.

Commit exact paths with: `git commit -m "feat(portability): preserve workspace appearance"`.

### Task 5: Build a single appearance resolver for preview and shell

**Files:**
- Create: `ui/src/lib/workspace-appearance.ts`
- Create: `ui/src/lib/workspace-appearance.test.ts`
- Modify: `ui/src/components/Layout.tsx`
- Modify: `ui/src/components/Layout.test.tsx`
- Modify: `ui/src/index.css`

- [ ] **Step 1: Write resolver failures**

Assert default, none, upload, missing-upload fallback, all three presence values, all three glass values, and position mapping. The resolver returns only semantic CSS variables:

```ts
expect(resolveWorkspaceAppearance(company)).toMatchObject({
  "--workspace-image": 'url("/backgrounds/ainative-ambient.webp")',
  "--workspace-image-position": "50% 50%",
  "--workspace-presence": "balanced",
  "--workspace-glass-character": "balanced",
});
```

Run: `pnpm exec vitest run ui/src/lib/workspace-appearance.test.ts ui/src/components/Layout.test.tsx`  
Expected: FAIL because the resolver does not exist.

- [ ] **Step 2: Implement the pure resolver**

Use closed lookup maps for asset URL, nine positions, and data attributes. Escape URLs through CSS string quoting; do not allow arbitrary CSS from the API.

- [ ] **Step 3: Bind the selected company at the workspace root**

Read `selectedCompany` from `useCompany`, apply the resolver to `.workspace-shell`, and expose `data-background-presence` and `data-glass-character`. Define token overrides for Quiet/Balanced/Vivid and Soft/Balanced/Clear in `index.css`; components continue consuming the existing surface tokens.

- [ ] **Step 4: Run tests, token gate, and commit**

Run:

```bash
pnpm exec vitest run ui/src/lib/workspace-appearance.test.ts ui/src/components/Layout.test.tsx
pnpm check:token-gates
```

Expected: PASS.

Commit exact paths with: `git commit -m "feat(ui): resolve workspace appearance tokens"`.

### Task 6: Add draft preview coordination

**Files:**
- Create: `ui/src/context/WorkspaceAppearanceContext.tsx`
- Create: `ui/src/context/WorkspaceAppearanceContext.test.tsx`
- Modify: `ui/src/main.tsx`
- Modify: `ui/src/components/Layout.tsx`

- [ ] **Step 1: Write provider lifecycle tests**

Assert that a draft overrides persisted company appearance, clearing restores persisted values, and switching company ids clears the previous draft.

Run: `pnpm exec vitest run ui/src/context/WorkspaceAppearanceContext.test.tsx`  
Expected: FAIL because the provider is absent.

- [ ] **Step 2: Implement the narrow context**

Expose:

```ts
interface WorkspaceAppearanceContextValue {
  draft: WorkspaceAppearanceDraft | null;
  preview: (companyId: string, draft: WorkspaceAppearanceDraft) => void;
  clearPreview: () => void;
}
```

Mount it inside `CompanyProvider`. `Layout` resolves the matching draft, otherwise the selected company. No API calls live in this context.

- [ ] **Step 3: Run tests and commit**

Run: `pnpm exec vitest run ui/src/context/WorkspaceAppearanceContext.test.tsx ui/src/components/Layout.test.tsx`  
Expected: PASS.

Commit exact paths with: `git commit -m "feat(ui): coordinate workspace appearance previews"`.

### Task 7: Build the Appearance studio

**Files:**
- Create: `ui/src/components/company-settings/WorkspaceAppearanceEditor.tsx`
- Create: `ui/src/components/company-settings/WorkspaceAppearanceEditor.test.tsx`
- Modify: `ui/src/pages/CompanySettings.tsx`
- Modify: `ui/src/pages/CompanySettings.test.tsx`
- Modify: `ui/src/index.css`

- [ ] **Step 1: Write interaction failures**

Test keyboard-selectable source cards, immediate preview calls, nine-position selection, upload progress/error, save payload, reset payload, dirty-state navigation cleanup, and that Attachment size limit appears under General.

Run: `pnpm exec vitest run ui/src/components/company-settings/WorkspaceAppearanceEditor.test.tsx ui/src/pages/CompanySettings.test.tsx`  
Expected: FAIL because the editor is absent.

- [ ] **Step 2: Implement a focused editor component**

The component owns only draft form state and renders:

- a miniature shell preview using the same resolver classes;
- radio-card source choices for AI Native, Custom, and None;
- segmented selectors for Presence and Glass character;
- a labelled 3 × 3 focal grid enabled only for image sources;
- upload, remove, save, and reset actions with inline status.

Use native buttons/radios and existing `Button`/`Field` primitives. All visual literals go into semantic tokens in `index.css`; no arbitrary Tailwind values enter the component.

- [ ] **Step 3: Integrate Company Settings**

Keep logo and brand color in Appearance, mount the editor below them, and move Attachment size limit into General. On save, update the company query cache and clear the draft only after the persisted response arrives. On unmount or company change, clear unsaved preview state.

- [ ] **Step 4: Run focused UI tests and token gate**

```bash
pnpm exec vitest run ui/src/components/company-settings/WorkspaceAppearanceEditor.test.tsx ui/src/pages/CompanySettings.test.tsx
pnpm check:token-gates
```

Expected: PASS.

- [ ] **Step 5: Commit the studio**

Commit exact paths with: `git commit -m "feat(ui): add workspace appearance studio"`.

### Task 8: Prove the complete slice

**Files:**
- Modify only files required to correct failures discovered by the gates.

- [ ] **Step 1: Run focused suites**

```bash
pnpm exec vitest run packages/shared/src/validators/company.test.ts packages/db/src/client.test.ts \
  server/src/__tests__/company-branding-route.test.ts \
  server/src/__tests__/companies-route-cross-company-authz.test.ts \
  server/src/__tests__/company-portability.test.ts \
  ui/src/lib/workspace-appearance.test.ts \
  ui/src/context/WorkspaceAppearanceContext.test.tsx \
  ui/src/components/company-settings/WorkspaceAppearanceEditor.test.tsx \
  ui/src/pages/CompanySettings.test.tsx ui/src/components/Layout.test.tsx
pnpm check:token-gates
```

Expected: PASS.

- [ ] **Step 2: Run repository gates**

```bash
pnpm -r typecheck
pnpm test:run
pnpm build
```

Expected: PASS. Report any unrelated pre-existing failure separately; do not mask it.

- [ ] **Step 3: Verify the active signed-in journey**

Against `http://127.0.0.1:3100/HOR/company/settings`, prove AI Native/custom/none, all presence and glass presets, focal positions, cancel-by-navigation, reload persistence, server-restart persistence, company isolation, dark/light readability, and narrow layout. Capture before/after screenshots for the final handoff.

- [ ] **Step 4: Final exact-path commit if verification required fixes**

Commit only owned corrective paths with: `git commit -m "fix(ui): harden workspace appearance controls"`.
