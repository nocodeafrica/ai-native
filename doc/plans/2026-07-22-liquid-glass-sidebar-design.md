# Liquid-Glass Sidebar Design

**Status:** Owner-approved design for implementation
**Date:** 2026-07-22
**Repository:** `nocodeafrica/ai-native` (Paperclip fork)
**Scope:** Primary application sidebar and the minimum workspace backdrop required to prove its material

## Outcome

Paperclip's primary navigation should feel like a floating operational instrument laid over an atmospheric workspace. It remains dense, fast, and recognizably Paperclip, but loses the flat application-panel treatment. The visual language is dark-first liquid glass: restrained refraction, a fine edge highlight, background depth, and neutral diffuse light for interaction states.

This is a sidebar proof, not a whole-product redesign. It establishes the material and interaction language so the owner can judge it in the real fork before deciding whether to propagate it to secondary sidebars, headers, cards, or other surfaces.

## Existing Product Behavior That Must Not Change

The implementation must preserve Paperclip's current sidebar contract:

- Expanded width remains resizable and persisted.
- The 64px collapsed rail remains pixel-aligned with the expanded icon column.
- Hover/focus peek overlays content without reflow.
- Pin, collapse, keyboard shortcuts, Escape handling, and resize keyboard controls continue to work.
- Secondary route sidebars still force the primary sidebar into its rail.
- Mobile remains an off-canvas drawer and route selection closes it.
- Company switching, badges, live indicators, tooltips, starred resources, plugin launchers, and account actions retain their current behavior.

No route, information architecture, server contract, database schema, or control-plane behavior changes in this phase.

## Visual Direction

### 1. One floating instrument

The primary `SidebarShell` panel becomes the material boundary. It receives a small inset from the viewport on desktop, a continuous rounded silhouette, one outer hairline, and one shadow/refraction system. The `Sidebar` inside it becomes transparent so the rail and expanded navigation read as a single object rather than nested panes.

Collapsed, expanded, and peeked states are the same instrument at different widths. Peeking may strengthen elevation slightly because it overlaps work, but it must not switch to a different visual language.

On mobile, the same material fills the drawer with safe edge spacing. The backdrop outside the drawer remains a functional dismiss layer, not decorative glass.

### 2. Atmospheric workspace backdrop

Glass needs depth behind it. The app shell gains one background authority behind both navigation and content:

- The first proof ships with one curated atmospheric image derived from the old-fork background library and copied into this repository as a local asset.
- A dark vignette and tonal wash keep operational content readable.
- The background is decorative, non-interactive, non-scrolling, and hidden from accessibility APIs.
- Main content keeps enough surface opacity for dense operational scanning; this phase does not convert every page card to glass.
- The implementation exposes background image, position, and overlay through tokens so a future gallery can switch images without rewriting shell components.

A background picker, uploads, synchronization, and per-company persistence are explicitly deferred until the owner approves this proof.

### 3. Diffuse interaction states

The rejected selected state—a colored rail or generic tinted pill—must not return.

- **Rest:** no pill-shaped fill; label and icon sit directly on the glass.
- **Hover:** a weak neutral radial bloom appears inside the row, biased toward the icon/pointer side, with a barely brighter upper edge.
- **Selected:** the same bloom becomes broader and more stable, with crisp foreground text and icon. It reads as light caught inside material, not a badge pasted on top.
- **Pressed:** the bloom tightens and dims slightly; no large translation or bounce.
- **Keyboard focus:** a clear neutral focus outline remains visible independently of hover and selection.
- **Semantic status:** blue live dots, red failures, amber warnings, and other existing status colors remain semantic. They do not tint the selection material.

The row geometry stays compatible with the collapsed rail. The active light pool must remain centered around the unchanged icon position at 64px width.

## Theme and Typography

Paperclip's bundled Inter variable family remains the sidebar typeface. This phase does not transplant Company Agents' Geist/Satoshi typography because Paperclip's current font packaging, screenshots, and design token canon are built around Inter.

When no explicit theme preference exists, Paperclip should start in dark mode. Existing stored preferences remain authoritative, and the existing light/dark toggle continues to work. Light-mode tokens are defined in the same change so the sidebar is structurally ready, but dark is the visual acceptance target.

## Token and Component Architecture

`ui/src/index.css` remains the single visual source of truth. New values are defined as semantic tokens for:

- workspace background image, position, and overlay;
- glass fill, edge, inner highlight, blur, saturation, and shadow;
- navigation rest, hover, selected, pressed, and focus materials;
- desktop and mobile instrument inset/radius values.

Components consume named classes and tokens only. No raw hex, raw pixel values, arbitrary Tailwind values, or inline visual styles are added to `ui/src/components/**` or `ui/src/pages/**`.

Expected implementation boundary:

- `ui/src/components/Layout.tsx`: mounts the decorative workspace backdrop and keeps content above it.
- `ui/src/components/SidebarShell.tsx`: owns the floating glass silhouette across expanded, rail, peek, and mobile presentation.
- `ui/src/components/Sidebar.tsx`: removes the opaque nested sidebar surface while retaining layout and behavior.
- `ui/src/components/SidebarNavItem.tsx`: exposes stable state hooks and consumes the diffuse interaction material.
- `ui/src/context/ThemeContext.tsx`: resolves no-preference startup to dark without overriding stored choices.
- `ui/src/index.css`: owns every new visual value and state rule.
- `ui/public/backgrounds/`: contains the single local proof asset.

Secondary sidebars remain on their current material in this phase. Their later propagation is a separate owner decision.

## Accessibility and Performance

- The background is `aria-hidden` and never carries information.
- `aria-current`, accessible badge text, tooltips, and focus behavior remain intact.
- Text and icons must remain legible over both the darkest and brightest parts of the proof image.
- `prefers-reduced-motion` suppresses non-essential material transitions.
- The image is locally bundled, compressed appropriately, and does not block interaction.
- Backdrop blur is limited to the navigation instrument; the implementation must avoid stacking multiple full-height blur layers.
- Browsers without backdrop-filter support receive an opaque dark fallback with the same border and state hierarchy.

## Verification Gate

Implementation is acceptable only when all of the following are proven:

1. Focused `SidebarShell`, `SidebarNavItem`, `Sidebar`, `Layout`, and `ThemeContext` tests pass.
2. `pnpm check:token-gates` passes.
3. UI typecheck and production build pass.
4. Real-browser desktop proof covers expanded, collapsed rail, hover peek, resizing, active route, hover, keyboard focus, pressed state, and a long-scroll page.
5. Real-browser mobile proof covers drawer open/dismiss, route-close, scrolling, and no horizontal overflow.
6. The sidebar remains readable over the selected image's bright and dark regions.
7. No console errors are introduced.
8. The owner sees the real `http://127.0.0.1:3100` fork and approves the screenshot/browser result before the material propagates beyond the primary sidebar.

## Explicitly Deferred

- Background gallery, upload, shuffle, or persistence UI
- Additional background images beyond the single proof asset
- Liquid-glass conversion of page cards, top navigation, dialogs, or secondary sidebars
- Typography replacement
- New motion library or dependency
- Server, API, database, plugin, or workflow changes
- Deployment or upstream pull request

