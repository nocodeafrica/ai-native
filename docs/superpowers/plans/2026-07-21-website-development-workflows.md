# Website Development Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Productize Paperclip's hidden Pipelines subsystem as Workflows, add five website-production skills, configure the real five-stage Website Development journey, and prove it through preview, QA repair, approval, and live verification.

**Architecture:** Keep the existing pipelines database, services, API routes, permission keys, routines, automation ledgers, and deep links unchanged. Remove only the UI feature gate, rename visible product copy to Workflows, package the recovered website craft as bundled Paperclip skills, and configure the real journey through the existing settings/API rather than adding a template engine.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, Vitest, Express, Drizzle/PostgreSQL, Paperclip routines/skills/workspaces, pnpm.

---

## File map

Productization:

- Modify ui/src/App.tsx: expose Workflow routes without the experimental gate.
- Delete ui/src/components/PipelinesExperimentalGate.tsx and its test.
- Modify ui/src/components/Sidebar.tsx and Sidebar.test.tsx: always show Workflows at /pipelines.
- Modify ui/src/App.cases-routing.test.tsx: exercise the real Workflow route table.
- Modify ui/src/pages/Pipelines.tsx and Pipelines.test.tsx: visible index, board, item, review, and add-item terminology.
- Modify ui/src/pages/PipelineSettings.tsx and PipelineSettings.test.ts: visible settings terminology.

Skills:

- Create five SKILL.md files under packages/skills-catalog/catalog/bundled/website-production/.
- Modify packages/skills-catalog/src/shipped-catalog.test.ts.
- Regenerate packages/skills-catalog/generated/catalog.json.

Configuration and proof:

- Create doc/plans/2026-07-21-website-development-workflow-runbook.md.
- Modify doc/PRODUCT.md and doc/DEVELOPING.md.

No server, shared-contract, database-schema, or migration file changes are planned. If a proof exposes an engine defect, stop that task, diagnose it, add a failing server test, and revise the plan before changing engine behavior.

---

### Task 1: Make Workflow routes permanently available

**Files:**
- Modify: ui/src/App.tsx:1-230
- Delete: ui/src/components/PipelinesExperimentalGate.tsx
- Delete: ui/src/components/PipelinesExperimentalGate.test.tsx
- Modify: ui/src/App.cases-routing.test.tsx

- [ ] **Step 1: Add Workflow sentinels to the real route-table test**

Add these mocks to App.cases-routing.test.tsx:

    vi.mock("./pages/Pipelines", () => ({
      Pipelines: () => <div>WORKFLOWS_PAGE</div>,
      PipelineItemDetail: () => <div>WORKFLOW_ITEM_PAGE</div>,
      PipelineItemLegacyRedirect: () => <div>WORKFLOW_LEGACY_REDIRECT</div>,
      ReviewQueue: () => <div>WORKFLOW_REVIEW_QUEUE</div>,
      Learnings: () => <div>WORKFLOW_LEARNINGS</div>,
    }));
    vi.mock("./pages/PipelineSettings", () => ({
      PipelineSettings: () => <div>WORKFLOW_SETTINGS_PAGE</div>,
    }));

Add:

    it("reaches Workflows without an experimental gate", async () => {
      const root = await renderAppAt(container, "/pipelines");
      await waitForText(container, "WORKFLOWS_PAGE");
      expect(container.textContent).not.toContain("No company matches prefix");
      flushSync(() => root.unmount());
    }, 20000);

- [ ] **Step 2: Run the focused test before implementation**

Run:

    pnpm --filter @paperclipai/ui exec vitest run src/App.cases-routing.test.tsx

Expected: the new test remains dependent on PipelinesExperimentalGate and cannot establish permanent access.

- [ ] **Step 3: Remove the gate from App.tsx**

Remove the PipelinesExperimentalGate import. Replace all eight wrapped elements with their direct pages:

    <Route path="review-queue" element={<ReviewQueue />} />
    <Route path="learnings" element={<Learnings />} />
    <Route path="pipelines" element={<Pipelines />} />
    <Route path="pipelines/:pipelineId" element={<Pipelines />} />
    <Route path="pipelines/:pipelineId/add" element={<Pipelines />} />
    <Route path="pipelines/:pipelineId/settings" element={<PipelineSettings />} />
    <Route path="pipelines/:pipelineId/items/:caseId" element={<PipelineItemDetail />} />
    <Route path="pipelines/:pipelineId/cases/:caseId" element={<PipelineItemLegacyRedirect />} />

Delete both obsolete gate files.

- [ ] **Step 4: Run the route test**

    pnpm --filter @paperclipai/ui exec vitest run src/App.cases-routing.test.tsx

Expected: PASS.

- [ ] **Step 5: Commit**

    git add ui/src/App.tsx ui/src/App.cases-routing.test.tsx ui/src/components/PipelinesExperimentalGate.tsx ui/src/components/PipelinesExperimentalGate.test.tsx
    git commit -m "feat: expose workflow routes by default"

---

### Task 2: Make Workflows a permanent sidebar destination

**Files:**
- Modify: ui/src/components/Sidebar.tsx:80-235
- Modify: ui/src/components/Sidebar.test.tsx:435-505

- [ ] **Step 1: Replace the three Pipelines-flag tests with this failing contract**

    it("always shows Workflows at the compatible pipelines route", async () => {
      mockInstanceSettingsApi.getExperimental.mockResolvedValue({
        enableIsolatedWorkspaces: false,
        enablePipelines: false,
      });
      const root = await renderSidebar();
      const link = [...container.querySelectorAll("a")].find(
        (anchor) => anchor.textContent === "Workflows",
      );
      expect(link?.getAttribute("href")).toBe("/pipelines");
      expect(container.textContent).not.toContain("Pipelines");
      flushSync(() => root.unmount());
    });

- [ ] **Step 2: Run the test and verify it fails**

    pnpm --filter @paperclipai/ui exec vitest run src/components/Sidebar.test.tsx

Expected: FAIL because the link is hidden when enablePipelines is false.

- [ ] **Step 3: Implement the permanent nav item**

Delete:

    const showPipelines = experimentalSettings?.enablePipelines === true;

Replace the conditional block with:

    <SidebarNavItem to="/pipelines" label="Workflows" icon={GitBranch} />

- [ ] **Step 4: Verify and commit**

    pnpm --filter @paperclipai/ui exec vitest run src/components/Sidebar.test.tsx
    pnpm check:token-gates
    git add ui/src/components/Sidebar.tsx ui/src/components/Sidebar.test.tsx
    git commit -m "feat: surface Workflows in navigation"

Expected: both commands pass.

---

### Task 3: Rename visible Workflow index and item copy

**Files:**
- Modify: ui/src/pages/Pipelines.tsx
- Modify: ui/src/pages/Pipelines.test.tsx

- [ ] **Step 1: Add a product-copy contract**

Export:

    export const WORKFLOW_PRODUCT_COPY = {
      singular: "Workflow",
      plural: "Workflows",
      new: "New workflow",
      create: "Create workflow",
      empty: "No workflows yet.",
      search: "Search workflows",
      settings: "Workflow settings",
    } as const;

Test:

    describe("workflow product terminology", () => {
      it("uses Workflow while keeping compatible pipeline routes", () => {
        expect(WORKFLOW_PRODUCT_COPY.plural).toBe("Workflows");
        expect(WORKFLOW_PRODUCT_COPY.empty).toBe("No workflows yet.");
        expect(pipelineStageAutomationSettingsHref("pipeline-1", "stage-1")).toBe(
          "/pipelines/pipeline-1/settings?stage=stage-1&section=instructions",
        );
      });
    });

- [ ] **Step 2: Run the focused test**

    pnpm --filter @paperclipai/ui exec vitest run src/pages/Pipelines.test.tsx

Expected: PASS for the new contract.

- [ ] **Step 3: Replace rendered terminology, not internal contracts**

Apply this exact visible-copy map in Pipelines.tsx:

| Existing | Replacement |
|---|---|
| Pipelines | Workflows |
| Pipeline | Workflow |
| New pipeline | New workflow |
| Create pipeline | Create workflow |
| No pipelines yet. | No workflows yet. |
| Search pipelines | Search workflows |
| No pipelines match your search. | No workflows match your search. |
| Select a company to view pipelines. | Select a company to view workflows. |
| Could not load pipelines. | Could not load workflows. |
| Could not create the pipeline. | Could not create the workflow. |
| Pipeline not found. | Workflow not found. |
| No stages are set up for this pipeline yet. | No stages are set up for this workflow yet. |
| Add stages in pipeline settings to enable the board. | Add stages in workflow settings to enable the board. |
| Pipeline settings | Workflow settings |
| another pipeline | another workflow |
| this pipeline review queue | this workflow review queue |

Keep /pipelines URLs, paperclip.pipelineBoard.groupBy., pipeline_id, pipeline_key, pipeline_name, API names, type names, and query/storage keys unchanged.

- [ ] **Step 4: Audit all quoted remnants**

    rg -n '"[^"\n]*(Pipeline|pipeline)|>[^<]*(Pipeline|pipeline)' ui/src/pages/Pipelines.tsx

Expected: every rendered noun says Workflow; remaining matches are internal symbols, URLs, compatibility keys, test fixtures, or developer comments.

- [ ] **Step 5: Verify and commit**

    pnpm --filter @paperclipai/ui exec vitest run src/pages/Pipelines.test.tsx
    pnpm check:token-gates
    git add ui/src/pages/Pipelines.tsx ui/src/pages/Pipelines.test.tsx
    git commit -m "feat: present pipelines as Workflows"

---

### Task 4: Rename visible Workflow settings copy

**Files:**
- Modify: ui/src/pages/PipelineSettings.tsx
- Modify: ui/src/pages/PipelineSettings.test.ts

- [ ] **Step 1: Add and test a settings-copy contract**

Export:

    export const WORKFLOW_SETTINGS_COPY = {
      updated: "Workflow updated",
      restored: "Workflow restored",
      missingCompany: "Select a company to edit workflow settings.",
      missingSelection: "No workflow selected.",
      notFound: "Workflow not found.",
      actions: "Workflow actions",
      archiveTitle: "Archive workflow",
      archiveAction: "Archive workflow",
    } as const;

Test:

    describe("workflow settings terminology", () => {
      it("uses Workflow for every top-level setting action", () => {
        expect(Object.values(WORKFLOW_SETTINGS_COPY).every(
          (value) => !value.includes("Pipeline"),
        )).toBe(true);
        expect(WORKFLOW_SETTINGS_COPY.archiveTitle).toBe("Archive workflow");
      });
    });

- [ ] **Step 2: Run the focused test**

    pnpm --filter @paperclipai/ui exec vitest run src/pages/PipelineSettings.test.ts

Expected: PASS for the new copy object.

- [ ] **Step 3: Replace all rendered settings labels**

Use Workflow in breadcrumbs, toasts, empty states, selector labels, target descriptions, action menus, screen-reader labels, name/description inputs, stage deletion copy, and archive dialogs. Display Workflow ID/key/name while retaining the actual pipeline_id, pipeline_key, and pipeline_name variable keys.

- [ ] **Step 4: Audit and verify**

    rg -n '"[^"\n]*(Pipeline|pipeline)|>[^<]*(Pipeline|pipeline)' ui/src/pages/PipelineSettings.tsx
    pnpm --filter @paperclipai/ui exec vitest run src/pages/PipelineSettings.test.ts src/pages/Pipelines.test.tsx src/components/Sidebar.test.tsx src/App.cases-routing.test.tsx
    pnpm check:token-gates

Expected: rendered copy is clean; tests pass.

- [ ] **Step 5: Commit**

    git add ui/src/pages/PipelineSettings.tsx ui/src/pages/PipelineSettings.test.ts
    git commit -m "feat: rename workflow settings copy"

---

### Task 5: Add the Truth and Assets skill

**Files:**
- Modify: packages/skills-catalog/src/shipped-catalog.test.ts
- Create: packages/skills-catalog/catalog/bundled/website-production/website-truth-and-assets/SKILL.md
- Modify: packages/skills-catalog/generated/catalog.json

- [ ] **Step 1: Add the expected key and failing assertions**

Add paperclipai/bundled/website-production/website-truth-and-assets to EXPECTED_BUNDLED_KEYS and add:

    it("ships the website truth and asset evidence contract", () => {
      const skill = readFileSync(path.join(REPO_ROOT,
        "packages/skills-catalog/catalog/bundled/website-production/website-truth-and-assets/SKILL.md"), "utf8");
      expect(skill).toContain("URL-level provenance");
      expect(skill).toContain("Visually inspect every candidate image");
      expect(skill).toContain("Do not invent");
      expect(skill).toContain("Truth Pack");
      expect(skill).toContain("image contact sheet");
    });

- [ ] **Step 2: Run the catalog test**

    pnpm --filter @paperclipai/skills-catalog test

Expected: FAIL because the key/file is absent.

- [ ] **Step 3: Create the complete skill**

Write this complete file:

    ---
    name: Website Truth and Assets
    description: Crawl an existing website, preserve source-faithful business facts and brand assets, and build a visually inspected image pool for a governed rebuild.
    key: paperclipai/bundled/website-production/website-truth-and-assets
    recommendedForRoles: [researcher, designer, engineer]
    tags: [website, crawl, brand, images, provenance]
    ---
    # Website Truth and Assets
    Produce the evidence base for a website rebuild. Do not design the new site in this stage.
    ## Procedure
    1. Crawl every legitimate reachable page, including navigation, sitemap, and high-value orphan routes.
    2. Record URL-level provenance for every factual claim and reusable content block.
    3. Inventory routes, page purposes, navigation, services, proof, contact details, forms, legal content, and calls to action.
    4. Download the real logo, favicon, photography, illustrations, icons, and fonts. Never recreate a logo when a real asset exists.
    5. Separate observed colors and typography from inference.
    6. Source missing candidates only from owner-approved sources such as Pexels and Pixabay.
    7. Visually inspect every candidate image; metadata and filenames are not inspection.
    8. Reject embedded text, watermarks, irrelevant or misleading subjects, unusable resolution, broken crops, and design-section screenshots presented as photography.
    9. Do not invent services, claims, testimonials, addresses, people, statistics, or brand assets.
    ## Truth Pack
    Persist the crawl manifest, provenance ledger, current IA map, brand asset inventory, observed token sheet, image contact sheet, image ledger with source/dimensions/use/verdict/rejection reason, and explicit unknowns/owner questions.
    ## Exit gate
    Do not suggest advancing until every included fact is traceable, every candidate image has a visual inspection verdict, and all unresolved unknowns are visible. Link the Truth Pack and evidence in the workflow issue.

- [ ] **Step 4: Generate, validate, test, and commit**

    pnpm --filter @paperclipai/skills-catalog build:manifest
    pnpm --filter @paperclipai/skills-catalog validate
    pnpm --filter @paperclipai/skills-catalog test
    git add packages/skills-catalog/catalog/bundled/website-production/website-truth-and-assets/SKILL.md packages/skills-catalog/src/shipped-catalog.test.ts packages/skills-catalog/generated/catalog.json
    git commit -m "feat: add website truth and assets skill"

Expected: PASS.

---

### Task 6: Add the Creative Director skill

**Files:**
- Modify: packages/skills-catalog/src/shipped-catalog.test.ts
- Create: packages/skills-catalog/catalog/bundled/website-production/website-creative-director/SKILL.md
- Modify: packages/skills-catalog/generated/catalog.json

- [ ] **Step 1: Add the expected key and failing assertions**

Add paperclipai/bundled/website-production/website-creative-director to EXPECTED_BUNDLED_KEYS and add:

    it("ships one integrated website blueprint contract", () => {
      const skill = readFileSync(path.join(REPO_ROOT,
        "packages/skills-catalog/catalog/bundled/website-production/website-creative-director/SKILL.md"), "utf8");
      expect(skill).toContain("information architecture, content, imagery, and visual direction together");
      expect(skill).toContain("visual rhythm");
      expect(skill).toContain("every production image");
      expect(skill).toContain("Human approval");
      expect(skill).toContain("toolkit-unconstrained");
    });

- [ ] **Step 2: Run the failing test**

    pnpm --filter @paperclipai/skills-catalog test

- [ ] **Step 3: Create the skill with this complete content**

    ---
    name: Website Creative Director
    description: Turn a source-faithful Truth Pack into one approved Website Blueprint combining IA, complete content, imagery, visual direction, and visual rhythm.
    key: paperclipai/bundled/website-production/website-creative-director
    recommendedForRoles: [designer, product, creative-director]
    tags: [website, creative-direction, information-architecture, content, images]
    ---
    # Website Creative Director
    Decide information architecture, content, imagery, and visual direction together. Do not split them into disconnected passes.
    ## Method
    1. Read the complete Truth Pack and unresolved questions.
    2. Identify genre, audience expectations, business goal, and reference principles.
    3. Work toolkit-unconstrained: choose the visual language the concept requires instead of forcing a component kit.
    4. Define the complete multi-page route/navigation architecture and map every important source fact to a destination.
    5. Declare one strong creative concept and recognizable through-line.
    6. Define visual rhythm through motif, transitions, overlap, scale, density, image choreography, and intentional contrast.
    7. Specify every page and section closely enough that the builder executes a resolved direction.
    8. Select every production image and specify crop, treatment, placement, alt-text intent, and rationale.
    9. Preserve the real logo and recognizable brand system unless the Blueprint documents a reasoned extension.
    ## Anti-slop rules
    Reject generic hero-plus-cards, disconnected flat bands, arbitrary glass cards, decorative gradients without concept, repeated grids, invented logos, placeholders, and copied reference layouts.
    ## Website Blueprint
    Persist one versioned document containing design direction; genre/audience/goals; complete IA; complete content plan with provenance; global visual system; responsive behavior; visual-rhythm rules; page/section content plus design specification; animation; every production image preview/source/crop/destination/rationale; and unknowns/risks.
    ## Human approval gate
    Build cannot start until a human approves the exact Blueprint revision and contact sheet containing every production image. Material IA, content, creative, or image changes require renewed approval.

- [ ] **Step 4: Generate, validate, test, and commit**

    pnpm --filter @paperclipai/skills-catalog build:manifest
    pnpm --filter @paperclipai/skills-catalog validate
    pnpm --filter @paperclipai/skills-catalog test
    git add packages/skills-catalog/catalog/bundled/website-production/website-creative-director/SKILL.md packages/skills-catalog/src/shipped-catalog.test.ts packages/skills-catalog/generated/catalog.json
    git commit -m "feat: add website creative director skill"

---

### Task 7: Add the Design and Build skill

**Files:**
- Modify: packages/skills-catalog/src/shipped-catalog.test.ts
- Create: packages/skills-catalog/catalog/bundled/website-production/website-design-and-build/SKILL.md
- Modify: packages/skills-catalog/generated/catalog.json

- [ ] **Step 1: Add the key and failing contract test**

Add paperclipai/bundled/website-production/website-design-and-build to EXPECTED_BUNDLED_KEYS and add:

    it("ships the blueprint-faithful multi-page build contract", () => {
      const skill = readFileSync(path.join(REPO_ROOT,
        "packages/skills-catalog/catalog/bundled/website-production/website-design-and-build/SKILL.md"), "utf8");
      expect(skill).toContain("approved Blueprint revision");
      expect(skill).toContain("multi-page");
      expect(skill).toContain("real logo");
      expect(skill).toContain("production asset manifest");
      expect(skill).toContain("deviation log");
    });
- [ ] **Step 2: Run the failing catalog test**

    pnpm --filter @paperclipai/skills-catalog test

Expected: FAIL because the expected key and file are absent.
- [ ] **Step 3: Create the skill with this complete content**

    ---
    name: Website Design and Build
    description: Implement an approved Website Blueprint as a complete responsive multi-page site with exact assets, source-faithful content, and inspectable evidence.
    key: paperclipai/bundled/website-production/website-design-and-build
    recommendedForRoles: [engineer, designer]
    tags: [website, frontend, implementation, responsive, accessibility]
    ---
    # Website Design and Build
    Implement the approved Blueprint revision faithfully; this stage does not replace its direction.
    ## Rules
    - Refuse to start without approved Blueprint and production-image revisions.
    - Build every approved route and navigation path; never compress a multi-page plan into one page.
    - Use the real logo, brand system, sourced content, and approved images.
    - Preserve the through-line and visual rhythm at desktop, tablet, and mobile widths.
    - Use semantic HTML, keyboard-safe interactions, visible focus, responsive layouts, and meaningful alt text.
    - Never invent content or silently substitute imagery; record every necessary deviation and reason.
    ## Build Candidate
    Persist repository/worktree and exact commit; preview URL; route manifest; production asset manifest with hashes or stable references; desktop/mobile screenshots for every route; build/typecheck/lint/tests; and a deviation log linked to the Blueprint.
    ## Exit gate
    Advance only when every route renders, required content/assets are present, navigation works, the preview is reachable, and the evidence is inspectable by independent QA.

- [ ] **Step 4: Generate, validate, test, and commit**

    pnpm --filter @paperclipai/skills-catalog build:manifest
    pnpm --filter @paperclipai/skills-catalog validate
    pnpm --filter @paperclipai/skills-catalog test
    git add packages/skills-catalog/catalog/bundled/website-production/website-design-and-build/SKILL.md packages/skills-catalog/src/shipped-catalog.test.ts packages/skills-catalog/generated/catalog.json
    git commit -m "feat: add website design and build skill"

---

### Task 8: Add the Independent QA skill

**Files:**
- Modify: packages/skills-catalog/src/shipped-catalog.test.ts
- Create: packages/skills-catalog/catalog/bundled/website-production/website-independent-qa/SKILL.md
- Modify: packages/skills-catalog/generated/catalog.json

- [ ] **Step 1: Add the key and failing contract test**

Add paperclipai/bundled/website-production/website-independent-qa to EXPECTED_BUNDLED_KEYS and add:

    it("ships independent website QA with repair routing", () => {
      const skill = readFileSync(path.join(REPO_ROOT,
        "packages/skills-catalog/catalog/bundled/website-production/website-independent-qa/SKILL.md"), "utf8");
      expect(skill).toContain("must not be the builder");
      expect(skill).toContain("anti-slop");
      expect(skill).toContain("return to Design and Build");
      expect(skill).toContain("return to the Creative Director");
      expect(skill).toContain("Three unsuccessful repair cycles");
    });
- [ ] **Step 2: Run the failing catalog test**

    pnpm --filter @paperclipai/skills-catalog test

Expected: FAIL because the expected key and file are absent.
- [ ] **Step 3: Create the skill with this complete content**

    ---
    name: Website Independent QA
    description: Independently audit a website candidate for technical correctness, source fidelity, approved imagery, visual quality, accessibility, and repair routing.
    key: paperclipai/bundled/website-production/website-independent-qa
    recommendedForRoles: [qa, designer, engineer]
    tags: [website, qa, accessibility, visual-review, repair]
    ---
    # Website Independent QA
    The QA agent must not be the builder. Test the running preview and evidence; never accept a prose-only self-report.
    ## Checks
    Test build/routes/navigation/forms/console/network/links/assets; desktop/tablet/mobile; structure/keyboard/focus/contrast/labels/alt text; sourced content; real brand assets; exact approved-image use; multi-page IA; hierarchy/spacing/type/crops/responsive composition/section flow/visual rhythm; and anti-slop failures such as generic patterns, sameness, disconnected bands, weak focal points, and arbitrary decoration.
    ## QA Report
    Every finding includes severity, route, viewport, screenshot, reproduction, violated Blueprint clause, and specific repair. Attach regression evidence.
    ## Repair routing
    Implementation defects return to Design and Build. Concept, IA, content-plan, or image-selection defects return to the Creative Director and require renewed approval. Three unsuccessful repair cycles require human review.
    ## Exit gate
    Pass only with browser evidence for every route/viewport class, no unresolved critical/high findings, exact approved assets, and a source-faithful content audit.

- [ ] **Step 4: Generate, validate, test, and commit**

    pnpm --filter @paperclipai/skills-catalog build:manifest
    pnpm --filter @paperclipai/skills-catalog validate
    pnpm --filter @paperclipai/skills-catalog test
    git add packages/skills-catalog/catalog/bundled/website-production/website-independent-qa/SKILL.md packages/skills-catalog/src/shipped-catalog.test.ts packages/skills-catalog/generated/catalog.json
    git commit -m "feat: add website independent QA skill"

---

### Task 9: Add the Deploy and Verify skill

**Files:**
- Modify: packages/skills-catalog/src/shipped-catalog.test.ts
- Create: packages/skills-catalog/catalog/bundled/website-production/website-deploy-and-verify/SKILL.md
- Modify: packages/skills-catalog/generated/catalog.json

- [ ] **Step 1: Add the key and failing contract test**

Add paperclipai/bundled/website-production/website-deploy-and-verify to EXPECTED_BUNDLED_KEYS and add:

    it("ships revision-bound website deployment verification", () => {
      const skill = readFileSync(path.join(REPO_ROOT,
        "packages/skills-catalog/catalog/bundled/website-production/website-deploy-and-verify/SKILL.md"), "utf8");
      expect(skill).toContain("explicit owner approval");
      expect(skill).toContain("exact QA-passed commit");
      expect(skill).toContain("Deployment Receipt");
      expect(skill).toContain("rollback");
    });
- [ ] **Step 2: Run the failing catalog test**

    pnpm --filter @paperclipai/skills-catalog test

Expected: FAIL because the expected key and file are absent.
- [ ] **Step 3: Create the skill with this complete content**

    ---
    name: Website Deploy and Verify
    description: Deploy an explicitly approved website revision, verify the exact public result route by route, and produce an auditable receipt with rollback information.
    key: paperclipai/bundled/website-production/website-deploy-and-verify
    recommendedForRoles: [engineer, devops, qa]
    tags: [website, deployment, verification, rollback, governance]
    ---
    # Website Deploy and Verify
    Public deployment is an external action. Do not deploy without explicit owner approval of the exact QA-passed commit and assets.
    ## Procedure
    1. Resolve the approved commit, asset manifest, target environment, domain, and provider settings.
    2. Stop if the candidate differs or credentials, spend, or domain authority are missing.
    3. Deploy the exact QA-passed commit and record provider identity.
    4. Verify every public route, navigation path, form, asset, metadata, favicon, robots/sitemap where applicable, TLS, console/network, and critical responsive view.
    5. Compare the live revision/assets to the approved candidate; roll back or block if they differ or smoke checks fail.
    ## Deployment Receipt
    Persist public URL; commit/revision; provider deployment ID; timestamp; route/smoke results; desktop/mobile screenshots; rollback reference/outcome; and exact blocking failures.
    ## Exit gate
    Mark Done only after the live site matches the approved revision and all critical smoke checks pass. Reachability alone is not verification.

- [ ] **Step 4: Generate, validate, test, and commit**

    pnpm --filter @paperclipai/skills-catalog build:manifest
    pnpm --filter @paperclipai/skills-catalog validate
    pnpm --filter @paperclipai/skills-catalog test
    git add packages/skills-catalog/catalog/bundled/website-production/website-deploy-and-verify/SKILL.md packages/skills-catalog/src/shipped-catalog.test.ts packages/skills-catalog/generated/catalog.json
    git commit -m "feat: add website deploy verification skill"

---

### Task 10: Write the exact real-workflow runbook

**Files:**
- Create: doc/plans/2026-07-21-website-development-workflow-runbook.md

- [ ] **Step 1: Record the exact stage graph**

| Position | Key | Name | Kind | Gate |
|---:|---|---|---|---|
| 100 | truth_assets | Truth and Assets | working | Truth Pack complete |
| 200 | website_blueprint | Website Blueprint | review | human Blueprint/image approval |
| 300 | design_build | Design and Build | working | Build Candidate complete |
| 400 | independent_qa | Independent QA | review | human approval authorizes deploy |
| 500 | deploy_verify | Deploy and Live Verify | working | Deployment Receipt passes |
| 900 | done | Done | done | terminal |
| 1000 | cancelled | Cancelled | cancelled | terminal |

Enforced edges:

    truth_assets -> website_blueprint
    website_blueprint -> design_build (approve)
    website_blueprint -> truth_assets (request changes to evidence/image pool)
    website_blueprint -> cancelled (reject)
    design_build -> independent_qa
    independent_qa -> deploy_verify (approve)
    independent_qa -> design_build (request changes)
    independent_qa -> website_blueprint (reject/concept revision)
    deploy_verify -> done
    deploy_verify -> design_build (repair candidate)

Blueprint review config:

    {
      "requireApproval": true,
      "approver": { "kind": "any_human" },
      "approveToStageKey": "design_build",
      "rejectToStageKey": "cancelled",
      "requestChangesToStageKey": "truth_assets",
      "requireRejectReason": true,
      "requireRequestChangesReason": true
    }

Independent QA config:

    {
      "requireApproval": true,
      "approver": { "kind": "any_human" },
      "approveToStageKey": "deploy_verify",
      "rejectToStageKey": "website_blueprint",
      "requestChangesToStageKey": "design_build",
      "requireRejectReason": true,
      "requireRequestChangesReason": true
    }

Explain that a Blueprint-only revision uses the existing current-stage rerun action; request changes returns to Truth and Assets when evidence or the image pool must change.

- [ ] **Step 2: Add the owner-choice gate**

The runbook must require explicit selection of company/project, five stage agents, a QA agent different from the builder, project workspace, secret bindings, image providers, deploy provider, and spend/domain authority. Store IDs and links, never secret values.

- [ ] **Step 3: Add the exact automation instruction pattern**

    Use the assigned paperclipai/bundled/website-production skill. Read the current workflow item, linked issue, prior-stage documents, attachments, work products, and project workspace. Produce and persist the required stage artifact, attach inspectable evidence, post a concise issue summary with links, and do not claim the stage gate passed unless every exit criterion is true. Never bypass a human approval transition.

- [ ] **Step 4: Commit**

    git add doc/plans/2026-07-21-website-development-workflow-runbook.md
    git commit -m "docs: add website workflow configuration runbook"

---

### Task 11: Configure and persist the real Workflow

**Files:**
- Modify: doc/plans/2026-07-21-website-development-workflow-runbook.md

- [ ] **Step 1: Start and identify the isolated worktree instance**

    pnpm dev:list
    pnpm dev

Read .paperclip/.env for the worktree port, then call /api/health. Expected: status ok for this isolated worktree.

- [ ] **Step 2: Pause at the owner-choice gate**

Ask the owner to confirm the actual company/project, five agents, workspace, credentials/provider choices, and spend boundary. Do not invent agents or select paid services.

- [ ] **Step 3: Install/assign all five skills through Skill Studio/API**

Capture non-secret response IDs and skill URLs in the runbook.

- [ ] **Step 4: Configure Website Development through the existing settings/API**

Create the Workflow, replace default stages with Task 10's seven rows, set enforced edges, save both human review configs, attach one routine-backed automation to each production stage, and bind the confirmed project/workspace.

- [ ] **Step 5: Reload and verify durable persistence**

Fetch GET /api/pipelines/{id}. Expected: seven stages, ten edges, five routines, two human gates, and the chosen project/workspace remain present. Workflow health has no missing assignee, permission, transition, or workspace warning.

- [ ] **Step 6: Commit only the non-secret evidence index**

    git add doc/plans/2026-07-21-website-development-workflow-runbook.md
    git commit -m "docs: record configured website workflow proof"

---

### Task 12: Prove approval and repair semantics

**Files:**
- Modify: the runbook evidence index.

- [ ] **Step 1: Create a controlled private Workflow item with source URL, workspace, and request key.**
- [ ] **Step 2: Attempt Stage 2 approval as an agent. Expected: 403 review_required and no transition.**
- [ ] **Step 3: Request changes as a human, revise, approve, and prove Build starts only after approval.**
- [ ] **Step 4: Materially update after approval and attempt completion. Expected: 409 review_outdated until renewed review.**
- [ ] **Step 5: Seed a harmless build defect; QA catches it with screenshot/repro evidence; request changes returns to Build; regression passes.**
- [ ] **Step 6: Seed a Blueprint/image suitability defect; QA reject returns to Blueprint and requires renewed approval.**
- [ ] **Step 7: Commit the non-secret evidence links.**

    git add doc/plans/2026-07-21-website-development-workflow-runbook.md
    git commit -m "test: record website workflow gate proof"

---

### Task 13: Run one real preview journey

**Files:**
- Modify: the runbook evidence index.

- [ ] **Step 1: Obtain the authorized real source URL and preview/public-deploy boundary from the owner.**
- [ ] **Step 2: Run Truth and Assets; fail if crawl/provenance/brand/image inspection evidence is incomplete.**
- [ ] **Step 3: Run Blueprint; present complete IA/content/direction/rhythm and every production image for revision-bound approval.**
- [ ] **Step 4: Run Build; require multi-page preview, real logo/colors/content/images, exact commit, routes, assets, screenshots, checks, and deviations.**
- [ ] **Step 5: Run independent QA and at least one targeted repair/regression cycle.**
- [ ] **Step 6: Stop at public deployment approval. No explicit approval means preview proof only.**
- [ ] **Step 7: If approved, deploy the exact candidate and attach a live Deployment Receipt.**
- [ ] **Step 8: Commit only non-secret evidence references.**

---

### Task 14: Align product and development documentation

**Files:**
- Modify: doc/PRODUCT.md
- Modify: doc/DEVELOPING.md

- [ ] **Step 1: Add the Product definition**

    ### Workflows

    Workflows are repeatable multi-stage journeys built from Paperclip stages, routine-backed agent work, documents, artifacts, and human review gates. They remain control-plane objects: Paperclip coordinates and records the journey while adapters execute the assigned agent work. In the current compatibility layer, Workflow pages use the existing /pipelines API and storage contracts internally.

- [ ] **Step 2: Add the development compatibility rule**

    ## Workflow compatibility naming

    The fork presents the former experimental Pipelines UI as Workflows and exposes it by default. Keep /pipelines routes, pipeline_* database names, permission keys, query/storage keys, and internal TypeScript symbols stable unless a separately approved migration changes the wire/storage contract. New user-facing copy should say Workflow or Workflows.

- [ ] **Step 3: Search for contradictory docs**

    rg -n "experimental pipelines|enablePipelines|Pipelines UI|Pipelines tab" README.md doc docs

Expected: no fork documentation tells users to enable a hidden toggle.

- [ ] **Step 4: Commit**

    git add doc/PRODUCT.md doc/DEVELOPING.md
    git commit -m "docs: document Workflow compatibility boundary"

---

### Task 15: Run the PR-ready verification gate

- [ ] **Step 1: Verify the changed-file boundary**

    git status --short
    git diff --name-only origin/master...HEAD

Expected: only approved UI, catalog, generated manifest, design/plan/runbook, and docs paths.

- [ ] **Step 2: Run focused gates**

    pnpm --filter @paperclipai/ui exec vitest run src/App.cases-routing.test.tsx src/components/Sidebar.test.tsx src/pages/Pipelines.test.tsx src/pages/PipelineSettings.test.ts
    pnpm --filter @paperclipai/skills-catalog validate
    pnpm --filter @paperclipai/skills-catalog test
    pnpm check:token-gates

Expected: PASS.

- [ ] **Step 3: Run full gates**

    pnpm -r typecheck
    pnpm test:run
    pnpm build

Expected: PASS. Owned failures must be fixed and committed before handoff.

- [ ] **Step 4: Run browser acceptance**

Prove Workflows is visible with enablePipelines false; /pipelines deep links resolve; create/edit/archive/restore/add/review/retry/settings use Workflow terminology; no normal label says Pipelines; the real Website Development configuration survives reload; and approval/repair evidence is inspectable. Capture screenshots plus console/network evidence in the runbook.

- [ ] **Step 5: Push**

    git push origin codex/workflows

---

### Task 16: Open the pull request to main

**Files:**
- Read: .github/PULL_REQUEST_TEMPLATE.md

- [ ] **Step 1: Fetch and reconcile**

    git fetch origin master
    git merge-base --is-ancestor origin/master HEAD

Expected: exit 0. Otherwise merge origin/master and rerun Task 15 after resolving owned conflicts.

- [ ] **Step 2: Fill every PR template section**

Include Thinking Path, What Changed, Verification, Risks, Model Used, and checklist. Distinguish code-proven, locally configured, preview-proven, and live-proven.

- [ ] **Step 3: Open, but do not merge, the PR**

    gh pr create --repo nocodeafrica/ai-native --base master --head codex/workflows --title "feat: productize website development Workflows" --body-file /tmp/ai-native-workflows-pr.md

Expected: PR URL targeting nocodeafrica/ai-native:master. Merge remains owner-gated.

---

## Final acceptance matrix

| Requirement | Tasks |
|---|---|
| Workflows visible without hidden flag | 1-2, 15 |
| Visible rename without wire/storage migration | 3-4, 14-15 |
| Five versioned website-production skills | 5-9 |
| Integrated IA/content/creative/image Blueprint | 6, 13 |
| Every candidate inspected and every production image approved | 5-6, 13 |
| Multi-page real-brand build | 7, 13 |
| Independent QA and repair routing | 8, 12-13 |
| Human Blueprint and deployment gates | 10-13 |
| Real configured journey persists | 10-12, 15 |
| Public deploy only after explicit approval | 9, 13 |
| Branch pushed and PR opened, not merged | 15-16 |
