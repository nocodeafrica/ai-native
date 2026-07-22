# Sandboxed HTML Attachment Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Paperclip's Open action render self-contained HTML attachments while preserving strict isolation and the existing explicit download behavior.

**Architecture:** Extend the centralized attachment content-type policy to classify `text/html` as inline-capable, then make the attachment route attach an HTML-only response CSP that creates a script-disabled, opaque-origin sandbox. The storage bytes, authorization path, UI links, and `?download=1` behavior remain unchanged.

**Tech Stack:** TypeScript, Express, Vitest, Supertest, Paperclip in-app browser

---

## File Structure

- Modify `server/src/attachment-types.ts`: own the HTML MIME constant, sandbox policy, and inline-safe type classification.
- Modify `server/src/__tests__/attachment-types.test.ts`: prove HTML is intentionally classified as inline only after the sandbox design is introduced.
- Modify `server/src/routes/issues.ts`: apply the HTML-specific response CSP without changing storage or access control.
- Modify `server/src/__tests__/issue-attachment-routes.test.ts`: prove inline disposition, exact security headers, original bytes, and forced download behavior.

### Task 1: Specify the HTML attachment security contract in tests

**Files:**
- Modify: `server/src/__tests__/attachment-types.test.ts:189-201`
- Modify: `server/src/__tests__/issue-attachment-routes.test.ts:485-520`

- [ ] **Step 1: Change the content-type test to expect HTML inline classification**

Replace the unsafe-type assertion with:

```ts
it("allows sandboxed HTML previews", () => {
  expect(INLINE_ATTACHMENT_TYPES).toContain("text/html");
  expect(isInlineAttachmentContentType("text/html")).toBe(true);
});

it("rejects binary download types", () => {
  expect(isInlineAttachmentContentType("application/zip")).toBe(false);
});
```

- [ ] **Step 2: Replace the HTML-download route test with inline and forced-download tests**

Use these assertions:

```ts
it("serves html attachments inline inside a locked-down CSP sandbox", async () => {
  const body = Buffer.from("<!doctype html><h1>QA report</h1>");
  const storage = createStorageService(body);
  mockIssueService.getAttachmentById.mockResolvedValue({
    ...makeAttachment("text/html", "report.html"),
    byteSize: body.length,
  });

  const app = await createApp(storage);
  const res = await request(app)
    .get("/api/attachments/attachment-1/content")
    .buffer(true)
    .parse(parseBinaryResponse);

  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toContain("text/html");
  expect(res.headers["content-disposition"]).toBe('inline; filename="report.html"');
  expect(res.headers["content-security-policy"]).toBe(HTML_ATTACHMENT_CONTENT_SECURITY_POLICY);
  expect(res.headers["x-content-type-options"]).toBe("nosniff");
  expect(Buffer.from(res.body).toString("utf8")).toBe(body.toString("utf8"));
});

it("forces html attachment downloads when requested", async () => {
  const storage = createStorageService();
  mockIssueService.getAttachmentById.mockResolvedValue(makeAttachment("text/html", "report.html"));

  const app = await createApp(storage);
  const res = await request(app)
    .get("/api/attachments/attachment-1/content?download=1")
    .buffer(true)
    .parse(parseBinaryResponse);

  expect(res.status).toBe(200);
  expect(res.headers["content-disposition"]).toBe('attachment; filename="report.html"');
  expect(res.headers["content-security-policy"]).toBe(HTML_ATTACHMENT_CONTENT_SECURITY_POLICY);
});
```

Add this import near the existing test imports:

```ts
import { HTML_ATTACHMENT_CONTENT_SECURITY_POLICY } from "../attachment-types.js";
```

- [ ] **Step 3: Run the focused tests and confirm the new expectations fail**

Run:

```bash
pnpm exec vitest run server/src/__tests__/attachment-types.test.ts server/src/__tests__/issue-attachment-routes.test.ts
```

Expected: FAIL because `text/html` is not inline-safe and `HTML_ATTACHMENT_CONTENT_SECURITY_POLICY` does not exist.

### Task 2: Implement sandboxed inline HTML delivery

**Files:**
- Modify: `server/src/attachment-types.ts:45-70`
- Modify: `server/src/routes/issues.ts:130-150`
- Modify: `server/src/routes/issues.ts:10525-10550`

- [ ] **Step 1: Define the HTML MIME type and sandbox CSP beside the attachment policy**

Add:

```ts
export const HTML_CONTENT_TYPE = "text/html";
export const HTML_ATTACHMENT_CONTENT_SECURITY_POLICY = [
  "sandbox",
  "default-src 'none'",
  "script-src 'none'",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "img-src data:",
  "style-src 'unsafe-inline'",
  "font-src data:",
].join("; ");
```

Add `HTML_CONTENT_TYPE` to `INLINE_ATTACHMENT_TYPES`.

- [ ] **Step 2: Import the HTML policy in the attachment route**

Extend the existing attachment-type import with:

```ts
HTML_ATTACHMENT_CONTENT_SECURITY_POLICY,
HTML_CONTENT_TYPE,
```

- [ ] **Step 3: Apply the HTML-only CSP before choosing content disposition**

Keep the SVG branch unchanged and add:

```ts
if (responseContentType === HTML_CONTENT_TYPE) {
  res.setHeader("Content-Security-Policy", HTML_ATTACHMENT_CONTENT_SECURITY_POLICY);
}
```

The existing disposition expression will now select `inline` for HTML unless `download=1` is present.

- [ ] **Step 4: Run focused tests and confirm they pass**

Run:

```bash
pnpm exec vitest run server/src/__tests__/attachment-types.test.ts server/src/__tests__/issue-attachment-routes.test.ts
```

Expected: both files PASS, including the existing SVG, image, video, range, and company-isolation coverage.

- [ ] **Step 5: Run server typecheck**

Run:

```bash
pnpm --filter @paperclipai/server typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit the implementation**

```bash
git add server/src/attachment-types.ts server/src/routes/issues.ts server/src/__tests__/attachment-types.test.ts server/src/__tests__/issue-attachment-routes.test.ts
git commit -m "fix: render HTML attachments in a secure sandbox"
```

### Task 3: Prove the real Paperclip report path

**Files:**
- Verify only; no planned file changes.

- [ ] **Step 1: Restart or allow the isolated port-3101 server to reload the changed route**

Verify health:

```bash
curl -sS http://127.0.0.1:3101/api/health | jq '{status, git}'
```

Expected: status `ok` and branch `codex/workflows`.

- [ ] **Step 2: Verify response headers on the exact QA attachment**

Run:

```bash
curl -sSI http://127.0.0.1:3101/api/attachments/40d74f2d-2de0-41e7-8acf-8194d57d0f91/content
```

Expected: `Content-Type: text/html`, `Content-Disposition: inline`, the locked-down CSP, and `X-Content-Type-Options: nosniff`.

- [ ] **Step 3: Browser-verify the exact Open URL**

Open:

```text
http://127.0.0.1:3101/api/attachments/40d74f2d-2de0-41e7-8acf-8194d57d0f91/content
```

Verify the `Independent QA Report` heading, `GATE: PASS` verdict, check matrix, and embedded evidence images are visible. Verify browser console/network inspection shows no script execution or external network access from the report.

- [ ] **Step 4: Verify explicit download behavior**

Run:

```bash
curl -sSI 'http://127.0.0.1:3101/api/attachments/40d74f2d-2de0-41e7-8acf-8194d57d0f91/content?download=1'
```

Expected: `Content-Disposition: attachment; filename="QA-REPORT.html"` with the same content length as the inline response.

- [ ] **Step 5: Push the completed branch**

```bash
git push origin codex/workflows
```

Expected: GitHub branch `codex/workflows` contains both the approved design and verified implementation commits. Do not open a PR until the owner confirms the workflow experience is satisfactory.
