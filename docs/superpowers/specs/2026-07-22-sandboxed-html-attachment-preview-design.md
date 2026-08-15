# Sandboxed HTML Attachment Preview

**Date:** 2026-07-22  
**Status:** Approved design

## Problem

Paperclip work products expose an `openPath` and a separate `downloadPath`. For an HTML attachment, the UI opens `openPath` in a new tab, but the attachment route currently sends `Content-Disposition: attachment`. Chromium therefore opens a blank tab while downloading the file. The Wilton Plumbing Independent QA report reproduced this failure through the real Paperclip attachment URL.

The report HTML itself is valid. The defect is the mismatch between the UI's Open action and the attachment response policy.

## Decision

Allow `text/html` attachments to render inline only inside a strict response-level Content Security Policy sandbox. Preserve the current explicit download behavior when `?download=1` is present.

The inline HTML response will use:

```text
Content-Disposition: inline; filename="..."
Content-Security-Policy: sandbox; default-src 'none'; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:
X-Content-Type-Options: nosniff
```

This policy deliberately supports self-contained report styling and embedded screenshots while blocking scripts, same-origin privilege, forms, external requests, nested browsing contexts, plugins, and base-URL rewriting. HTML reports that depend on external fonts, images, scripts, or styles will render without those external resources rather than weakening the sandbox.

## Scope

- Add `text/html` to the attachment types eligible for inline rendering.
- Apply the HTML-specific sandbox CSP at the attachment content route.
- Leave existing SVG isolation unchanged.
- Leave `?download=1` byte delivery and `Content-Disposition: attachment` unchanged.
- Do not add a new viewer route, iframe component, conversion service, or database field.

## Request Flow

1. A user selects **Open** on an HTML artifact.
2. Paperclip serves the original bytes as `text/html` with inline disposition and the HTML sandbox CSP.
3. The browser creates a sandboxed document with no script or same-origin privileges.
4. Inline CSS and embedded `data:` images render.
5. A user selecting **Download** receives the same original bytes with attachment disposition.

## Error and Compatibility Behavior

- Existing authorization, company isolation, range handling, storage lookup, cache control, and filename sanitization remain unchanged.
- Unsupported or generic binary attachments remain downloads.
- The response remains usable when a report contains disallowed content; blocked resources fail closed under CSP.
- The original file is never rewritten or sanitized server-side.

## Verification

Targeted server tests must prove:

1. `text/html` without `download=1` is served inline.
2. The response includes the exact restrictive HTML sandbox directives.
3. `text/html?download=1` remains an attachment.
4. Existing inline image/video behavior and SVG CSP tests remain green.

Browser verification must open the existing Wilton QA attachment through its real Paperclip URL and prove that:

- the report heading and verdict are visible;
- embedded evidence images render;
- the response has no executable script capability or network access;
- the explicit download URL still downloads the original HTML.

## Alternatives Rejected

- **Dedicated iframe viewer:** safer isolation is possible, but it adds UI routing, byte-fetching, loading/error states, and duplicate preview logic for a response-header mismatch.
- **PDF conversion:** loses HTML fidelity, introduces a conversion runtime, and does not solve other HTML artifacts.
- **Unrestricted inline HTML:** renders correctly but would expose the Paperclip origin to active attachment content and is unacceptable.

