# Liquid-Glass Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Turn Paperclip's primary sidebar into a dark-first floating liquid-glass instrument with a neutral diffuse-light interaction language, while preserving every current rail, peek, resize, mobile, and secondary-sidebar behavior.

**Architecture:** Keep the existing `Layout` → `SidebarShell` → `Sidebar` → `SidebarNavItem` structure. `Layout` adds one decorative, fixed workspace backdrop; `SidebarShell` remains the single material boundary; `Sidebar` becomes visually transparent; and `SidebarNavItem` exposes route state through stable data attributes consumed by CSS. All visual values live in `ui/src/index.css`, and the existing local-storage theme contract changes only so an absent preference resolves to dark.

**Tech Stack:** React 19, TypeScript, React Router, Tailwind CSS v4, Vitest/jsdom, Vite.

**Approved design:** `doc/plans/2026-07-22-liquid-glass-sidebar-design.md`

---

## Acceptance gate

This phase is complete only when focused component tests, `pnpm check:token-gates`, workspace typecheck, and production build are green; then the real app at `http://127.0.0.1:3100/HOR/dashboard` passes desktop and mobile browser checks. The proof must show expanded, rail, peek, active, hover, focus, resize, and drawer states without changing navigation behavior. Do not propagate glass to secondary sidebars or page cards in this phase.

## Task 1: Add the atmospheric workspace backdrop

**Files:**

- Modify: `ui/src/components/Layout.test.tsx`
- Modify: `ui/src/components/Layout.tsx`
- Modify: `ui/src/index.css`
- Add: `ui/public/backgrounds/ainative-ambient.webp`

### Step 1: Write the failing shell-structure test

Add a test near the first successful `Layout` render asserting that the layout mounts exactly one decorative backdrop and a foreground workspace layer:

```tsx
const backdrop = container.querySelector('[data-slot="workspace-backdrop"]');
expect(backdrop).not.toBeNull();
expect(backdrop?.getAttribute("aria-hidden")).toBe("true");
expect(container.querySelectorAll('[data-slot="workspace-backdrop"]')).toHaveLength(1);
expect(container.querySelector('[data-slot="workspace-foreground"]')).not.toBeNull();
```

Run:

```bash
pnpm exec vitest run ui/src/components/Layout.test.tsx
```

Expected: FAIL because neither slot exists yet.

### Step 2: Copy and verify the proof asset

Copy the curated abstract dark-liquid image from the old fork:

```bash
mkdir -p ui/public/backgrounds
cp /Users/mac/Desktop/Billion/Company-Agents-3/packages/web/public/backgrounds/bg_001.webp ui/public/backgrounds/ainative-ambient.webp
shasum -a 256 /Users/mac/Desktop/Billion/Company-Agents-3/packages/web/public/backgrounds/bg_001.webp ui/public/backgrounds/ainative-ambient.webp
```

Expected: the two SHA-256 hashes match. Do not modify or remove any old-fork assets.

### Step 3: Mount the decorative layer without changing layout ownership

In `Layout.tsx`, add one `aria-hidden="true"` element with `data-slot="workspace-backdrop"` at the app-shell root. Wrap the existing navigation/content composition in a `data-slot="workspace-foreground"` layer. Preserve every existing sidebar and route branch; this is only a stacking-context change.

Use named classes such as `workspace-shell`, `workspace-backdrop`, and `workspace-foreground`; do not add inline image, filter, opacity, or z-index values.

### Step 4: Define backdrop tokens and resilient CSS

In both `:root` and `.dark`, define semantic tokens for the local image, position, wash, and vignette. Add named rules that:

- keep the backdrop fixed, non-interactive, and behind the app;
- layer the local image with a dark tonal wash and vignette;
- keep foreground content in its own stacking context;
- use `min-height: 100dvh` without introducing horizontal overflow;
- retain an opaque background fallback when the image cannot load.

Light-mode tokens must remain readable, but dark mode is the visual target. Keep all literal values in `ui/src/index.css` so component files remain token-clean.

### Step 5: Run the focused gate

```bash
pnpm exec vitest run ui/src/components/Layout.test.tsx
pnpm check:token-gates
```

Expected: PASS.

### Step 6: Commit the backdrop slice

```bash
git add ui/src/components/Layout.test.tsx ui/src/components/Layout.tsx ui/src/index.css ui/public/backgrounds/ainative-ambient.webp
git commit -m "feat(ui): add atmospheric workspace backdrop"
```

## Task 2: Make `SidebarShell` the single floating glass instrument

**Files:**

- Modify: `ui/src/components/SidebarShell.test.tsx`
- Modify: `ui/src/components/SidebarShell.tsx`
- Modify: `ui/src/components/Sidebar.test.tsx`
- Modify: `ui/src/components/Sidebar.tsx`
- Modify: `ui/src/index.css`

### Step 1: Write failing material-boundary tests

Extend `SidebarShell.test.tsx` with assertions covering stable material and mode hooks:

```tsx
const instrument = container.querySelector('[data-slot="navigation-instrument"]');
expect(instrument).not.toBeNull();
expect(instrument?.getAttribute("data-mode")).toBe("expanded");
```

Exercise the existing collapsed and peek setup and expect `data-mode="rail"` and `data-mode="peek"` respectively. Assert that `data-sidebar-overlay` remains present only during peek, preserving its existing behavioral contract.

In `Sidebar.test.tsx`, assert the root `aside` exposes `data-slot="navigation-sidebar"`; add an assertion that its component class list no longer includes `bg-sidebar` or the outer border class that would create a second opaque surface.

Run:

```bash
pnpm exec vitest run ui/src/components/SidebarShell.test.tsx ui/src/components/Sidebar.test.tsx
```

Expected: FAIL on the new data hooks and opaque-surface assertion.

### Step 2: Add stable state hooks without changing width logic

In `SidebarShell.tsx`:

- derive `mode` from existing state: `hidden`, `rail`, `peek`, or `expanded`;
- add `data-slot="navigation-instrument"` and `data-mode={mode}` to the absolutely positioned panel;
- add a stable `navigation-instrument` class;
- keep the current inline width styles because they are behavioral geometry, not visual styling;
- remove the peek-only opaque `border-r bg-background shadow-lg` classes; elevation will come from the single material class and a `data-sidebar-overlay` refinement;
- keep resize/pointer/focus handlers and all timers untouched.

In `Sidebar.tsx`, add `data-slot="navigation-sidebar"` and make its outer `aside` transparent by removing only the background/border surface classes. Do not alter sections, actions, company selection, scrolling, badges, or footer behavior.

### Step 3: Define the glass material once

In `ui/src/index.css`, add semantic light and dark tokens for instrument fill, fallback fill, border, inner highlight, blur, saturation, base shadow, overlay shadow, desktop inset, mobile inset, and radius. Implement:

- a continuous rounded silhouette with a fine outer edge and inset highlight;
- one `backdrop-filter` layer on `.navigation-instrument` only;
- slightly stronger elevation for `[data-sidebar-overlay]` without changing fill language;
- an opaque fallback inside `@supports not (backdrop-filter: blur(...))`;
- safe desktop inset and mobile drawer treatment through media queries;
- no width transition, preserving the current snap behavior;
- reduced-motion handling for any non-essential material transition.

Ensure the resizer remains reachable and visually clear against the glass edge.

### Step 4: Run focused behavior and token gates

```bash
pnpm exec vitest run ui/src/components/SidebarShell.test.tsx ui/src/components/Sidebar.test.tsx ui/src/components/Layout.test.tsx
pnpm check:token-gates
```

Expected: PASS, including all pre-existing rail, resize, peek, and route-sidebar tests.

### Step 5: Commit the instrument slice

```bash
git add ui/src/components/SidebarShell.test.tsx ui/src/components/SidebarShell.tsx ui/src/components/Sidebar.test.tsx ui/src/components/Sidebar.tsx ui/src/index.css
git commit -m "feat(ui): render sidebar as floating glass instrument"
```

## Task 3: Replace generic pill selection with diffuse neutral light

**Files:**

- Modify: `ui/src/components/SidebarNavItem.test.tsx`
- Modify: `ui/src/components/SidebarNavItem.tsx`
- Modify: `ui/src/index.css`

### Step 1: Make the router mock exercise both route states

Change the `NavLink` test mock to use a hoisted configurable `isActive` value and to call function-valued `className` with that value. Have the mock mirror React Router's `aria-current="page"` behavior when active.

Add tests for an inactive and active row asserting:

```tsx
expect(link.getAttribute("data-slot")).toBe("sidebar-nav-item");
expect(link.getAttribute("data-selected")).toBe("true");
expect(link.getAttribute("aria-current")).toBe("page");
expect(link.className).not.toContain("bg-accent");
```

Also cover the explicit `active` prop, because agent rows use it instead of router matching.

Run:

```bash
pnpm exec vitest run ui/src/components/SidebarNavItem.test.tsx
```

Expected: FAIL because the state hooks do not exist and the current active class is `bg-accent`.

### Step 2: Expose route state from the real `NavLink`

Inside the existing render callback, compute `selected = active ?? isActive` once and return the link markup from that callback so the element can receive:

- `data-slot="sidebar-nav-item"`;
- `data-selected={selected ? "true" : "false"}`;
- `aria-current={selected ? "page" : undefined}` so externally selected rows retain equivalent semantics;
- the named `sidebar-nav-item` class.

Remove the `bg-accent`, `hover:bg-accent/50`, and color transition classes that implement the generic pill. Preserve geometry, icon markup, rail labels, badge semantics, mobile close behavior, and caller-supplied classes.

### Step 3: Implement the five-state neutral material in CSS

Define tokens in light and dark themes for rest foreground, hover bloom, selected bloom, selected edge, pressed bloom, and focus outline. Implement states with a pseudo-element inside the existing rounded row:

- rest: transparent, no visible pill;
- hover: weak radial neutral bloom biased toward the icon side;
- selected: broader stable bloom plus a restrained top-edge catchlight;
- active/pressed: tighter, dimmer bloom with no translation;
- focus-visible: independent neutral outline with sufficient contrast;
- status dots/badges: unchanged semantic color and positioned above the bloom.

The same rule must work at 64px rail width without moving the icon. Avoid green or any semantic hue in navigation selection.

### Step 4: Run focused tests and token gate

```bash
pnpm exec vitest run ui/src/components/SidebarNavItem.test.tsx ui/src/components/SidebarShell.test.tsx ui/src/components/Sidebar.test.tsx
pnpm check:token-gates
```

Expected: PASS.

### Step 5: Commit the interaction slice

```bash
git add ui/src/components/SidebarNavItem.test.tsx ui/src/components/SidebarNavItem.tsx ui/src/index.css
git commit -m "feat(ui): add diffuse sidebar navigation states"
```

## Task 4: Make dark mode the no-preference default

**Files:**

- Modify: `ui/src/context/ThemeContext.test.tsx`
- Modify: `ui/src/context/ThemeContext.tsx`
- Modify: `ui/index.html`

### Step 1: Replace the OS-following tests with the approved contract

Rewrite the first two tests so they prove:

1. With no `paperclip.theme` entry and an OS light preference, the provider starts dark.
2. It attaches no OS change listener and remains dark when `matchMedia` changes.
3. An explicit `setTheme("light")` persists `light` and the toggle persists `dark`.
4. A stored `light` choice still starts light and remains authoritative.

Run:

```bash
pnpm exec vitest run ui/src/context/ThemeContext.test.tsx
```

Expected: FAIL because the current provider follows the OS when no preference is stored.

### Step 2: Simplify provider initialization

In `ThemeContext.tsx`:

- keep `resolveThemeFromDocument()` so React hydrates the class set by the boot script;
- remove `hasStoredTheme`, `hasExplicitChoice`, and the `matchMedia` listener effect;
- persist only when `setTheme` or `toggleTheme` is invoked, not simply because the default rendered;
- keep `applyTheme()` and its theme-color update.

Use a ref or a small explicit-choice flag solely to prevent the implicit dark default from writing local storage. This preserves the distinction between default and user preference without listening to the OS.

### Step 3: Align the pre-React boot script

In `ui/index.html`, replace the OS-derived fallback with `"dark"`. Keep stored `light`/`dark` authoritative and retain the existing `try/catch`, `colorScheme`, and theme-color behavior. This prevents a light flash before React mounts.

### Step 4: Run the theme and token gates

```bash
pnpm exec vitest run ui/src/context/ThemeContext.test.tsx
pnpm check:token-gates
```

Expected: PASS.

### Step 5: Commit the theme slice

```bash
git add ui/src/context/ThemeContext.test.tsx ui/src/context/ThemeContext.tsx ui/index.html
git commit -m "feat(ui): default new sessions to dark theme"
```

## Task 5: Run the code-quality and regression gate

**Files:** Review all files changed in Tasks 1–4. Do not add unrelated fixes.

### Step 1: Run focused tests together

```bash
pnpm exec vitest run \
  ui/src/components/Layout.test.tsx \
  ui/src/components/SidebarShell.test.tsx \
  ui/src/components/Sidebar.test.tsx \
  ui/src/components/SidebarNavItem.test.tsx \
  ui/src/context/ThemeContext.test.tsx
```

Expected: PASS.

### Step 2: Run repository-required static gates

```bash
pnpm check:token-gates
pnpm -r typecheck
pnpm build
```

Expected: PASS. If a failure is pre-existing or unrelated, capture the exact command and output; do not blur it into a successful result.

### Step 3: Review scope before browser QA

```bash
git status --short
git diff --check
git diff --stat master...HEAD
```

Expected: only the approved design/plan and sidebar-proof files appear. `.gitignore` remains the user's pre-existing unstaged modification and must not be staged.

## Task 6: Prove the real UI at the owner gate

**Files:** No product edits unless a defect is found. Store screenshots outside tracked source, for example under `/tmp/ai-native-liquid-glass-sidebar/`.

### Step 1: Verify desktop behavior on the actual fork

Open `http://127.0.0.1:3100/HOR/dashboard` at a desktop viewport and prove:

- expanded instrument silhouette and atmospheric backdrop;
- active Dashboard row uses a neutral diffuse light pool, with no green selection rail;
- inactive row hover, pointer-down, and keyboard focus are visually distinct;
- collapse keeps icons aligned in the 64px rail;
- hover/focus peek overlays without content reflow;
- Escape closes peek;
- drag and keyboard resizing still persist width;
- a long page scrolls while the decorative backdrop remains fixed;
- text and icons remain readable over bright and dark image regions;
- no new console errors.

Capture at least expanded, rail, peek, and keyboard-focus screenshots.

### Step 2: Verify secondary-sidebar compatibility

Navigate to a route that opens a secondary sidebar, such as company settings. Prove the primary instrument becomes the rail and the secondary pane remains readable and behaviorally unchanged.

### Step 3: Verify mobile drawer behavior

At a narrow mobile viewport, prove drawer open/dismiss, route-close, internal scrolling, focus visibility, and absence of horizontal overflow. Confirm the desktop inset/radius rules do not clip mobile controls.

### Step 4: Present the owner proof and stop

Show the real screenshots and summarize:

- what is proven locally;
- any defects found and corrected;
- what remains deliberately deferred;
- that no deployment or upstream PR occurred.

Do not extend glass to page cards, headers, dialogs, or secondary sidebars until the owner approves this real-browser proof.
