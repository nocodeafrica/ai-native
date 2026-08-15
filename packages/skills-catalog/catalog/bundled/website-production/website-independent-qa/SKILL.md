---
name: Website Independent QA
description: Independently audit a website candidate for technical correctness, source fidelity, approved imagery, visual quality, accessibility, and repair routing.
key: paperclipai/bundled/website-production/website-independent-qa
recommendedForRoles:
  - qa
  - designer
  - engineer
tags:
  - website
  - qa
  - accessibility
  - visual-review
  - repair
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
