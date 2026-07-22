# Workspace Appearance Design

**Date:** 2026-07-22
**Status:** Approved direction, written-spec review gate
**Scope:** Company Settings appearance controls for the liquid-glass workspace shell

## Product decision

Workspace atmosphere belongs in **Company Settings → Appearance**. It is part of the company's visual environment, not a new primary-navigation destination and not an expert-only collection of raw CSS controls.

The company owns the background choice and its readability treatment, so every operator entering that company sees the same workspace. The existing light/dark theme choice remains a browser-level user preference for this phase; dark stays the default and the current theme toggle continues to work.

## Selected approach

Add a focused appearance studio to the existing Appearance section:

1. A live workspace preview showing the backdrop, content wash, and floating navigation glass together.
2. A direct visual background gallery, following the old fork's proven interaction:
   - the recovered built-in atmospheric image set,
   - an always-visible custom-upload tile,
   - a no-image tile.
   The images themselves are the controls; there is no intermediate source-mode selection.
3. A **Background presence** selector with three designed presets:
   - **Quiet** — the image is restrained behind operational content,
   - **Balanced** — the default,
   - **Vivid** — more atmosphere without compromising text contrast.
4. A **Glass character** selector with three designed presets:
   - **Soft** — denser, calmer glass,
   - **Balanced** — the default,
   - **Clear** — more refraction and image visibility.
5. A simple 3 × 3 focal-position control for custom images. It changes background positioning without exposing CSS syntax.

Changes preview immediately in the current page. A single **Save appearance** action persists them for the company. **Reset** restores the shipped AI Native defaults. Upload progress and errors remain inside the Appearance section.

## Why this approach

This gives the owner meaningful control while keeping the visual system designed. Raw sidebar-opacity, page-opacity, blur, saturation, and gradient sliders would make it easy to create illegible combinations and would turn a polished feature into a configuration panel.

Two alternatives were rejected:

- **Browser-only preferences:** fast to build, but the company would look different on each browser and the setting would not survive a device change.
- **Fully granular material editor:** flexible, but unnecessarily technical and difficult to keep accessible. The preset system can evolve later without exposing implementation details.

## Information architecture

The existing Company Settings page keeps its current route. Within its Appearance section:

- Company identity: logo and brand color.
- Workspace atmosphere: preview, background source, presence, glass character, and focal position.

The attachment-size limit moves out of Appearance and into General because it is an operational policy, not a visual setting.

No Appearance item is added to the primary sidebar. If Company Settings gains secondary settings navigation later, Appearance can become a subsection there without changing this model.

## Persistence and contracts

Appearance is stored as a company-scoped, typed configuration rather than loose style values. The contract contains:

- background kind: `preset | upload | none`
- preset key when kind is `preset`
- uploaded asset id when kind is `upload`
- focal position: one of nine named positions
- background presence: `quiet | balanced | vivid`
- glass character: `soft | balanced | clear`

The server validates every value. Uploaded backgrounds use the existing company-scoped image asset pipeline and access checks. The company response exposes a resolved background URL only when needed; the UI never constructs storage paths.

The appearance configuration participates in company portability. A custom background asset is exported and imported with other selected company assets so the environment is not silently lost during a company transfer.

## Runtime behavior

The shell resolves the selected company's appearance into semantic CSS custom properties on the workspace root. Components continue to consume the existing tokens such as `--workspace-image`, `--workspace-content-surface`, and `--navigation-instrument-fill`; they do not branch on preset names.

The preview uses the same resolver and tokens as the live shell. This prevents a preview that looks different from the saved result.

While editing, a draft appearance is applied immediately. Navigating away or changing companies without saving restores the persisted configuration. Saving updates the company query cache so all mounted consumers converge without a reload.

The no-image option keeps the wash and vignette, producing a deliberate dark surface rather than an accidental flat color.

## Accessibility and resilience

- All selectors are keyboard operable and expose selected state through native or ARIA semantics.
- Text is never placed directly on the raw image; content and navigation retain their semantic surfaces.
- Presets are contrast-reviewed in both dark and light themes even though dark is the default.
- Reduced-motion users receive no animated backdrop transitions.
- Failed uploads leave the persisted appearance untouched and show a useful inline error.
- A missing or deleted custom asset falls back to the built-in atmospheric preset.
- Older companies with no appearance record receive the current shipped defaults.

## Verification gate

The phase passes when all of the following are proven:

1. The Appearance UI renders on Company Settings and the attachment limit is under General.
2. Background source, presence, glass character, and position preview immediately.
3. Saving persists through reload and a server restart for the active repo-local instance.
4. Changing companies resolves each company's own appearance without leakage.
5. Custom upload, remove/reset, invalid-file, and missing-asset fallback paths work.
6. Dark and light themes remain readable at desktop and narrow widths.
7. Relevant unit/API tests, token gates, typecheck, build, and the signed-in browser journey pass.

## Explicitly deferred

- Per-user overrides of the company background.
- Theme synchronization across devices.
- Arbitrary blur, opacity, saturation, or gradient controls.
- Animated or video backgrounds.
- A marketplace or downloadable third-party background catalogue. The recovered first-party gallery is included.
