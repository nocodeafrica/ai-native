---
name: Website Truth and Assets
description: Crawl an existing website, preserve source-faithful business facts and brand assets, and build a visually inspected image pool for a governed rebuild.
key: paperclipai/bundled/website-production/website-truth-and-assets
recommendedForRoles:
  - researcher
  - designer
  - engineer
tags:
  - website
  - crawl
  - brand
  - images
  - provenance
---

# Website Truth and Assets

Produce the evidence base for a website rebuild. Do not design the new site in this stage.

## Inputs

- The existing website URL and owner-supplied sources.
- The Workflow item, linked issue, and project workspace.
- Image sources and credential bindings already approved by the owner.

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

Persist and attach:

- the crawl manifest with URL, status, title, page purpose, and canonical URL;
- the fact and content ledger with source URL for each entry;
- the current information-architecture map;
- the brand asset inventory with stable attachment or workspace references;
- the observed brand-token sheet;
- an image contact sheet showing every viable candidate;
- an image ledger with source, source class, dimensions, intended use, inspection verdict, and rejection reason;
- explicit unknowns and owner questions.

## Exit gate

Do not suggest advancing until every included fact is traceable, every candidate image has a visual inspection verdict, and all unresolved unknowns are visible. Link the Truth Pack and its evidence in the Workflow issue.
