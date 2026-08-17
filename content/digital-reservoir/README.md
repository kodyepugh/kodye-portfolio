# Digital Reservoir content foundation

This directory contains semantic, local/static content records. Spatial layout
and prototype placement data remain in `content/reservoir/` and are intentionally
not imported here.

The registry in `lib/content/registry.ts` exposes five independent entity sets:

- artifacts: logical inspectable objects;
- collections: logical grouping objects;
- memberships: artifact/collection relationships, including many-to-many use;
- assets: stored public media payloads;
- source records: internal provenance for artifacts or assets.

Public reservoir presentation should enter through
`lib/content/reservoir-adapter.ts`. The adapter includes only records explicitly
marked `published: true` and never exposes source records or local source paths.
It also contains no geometry, vertex, camera, or generated layout fields.

## Content still required

- approved Bellabeat methodology, findings, visualizations, and case-study copy;
- the approved resume document and verified resume content;
- approved About / biography copy;
- approved Reservoir Interface Study narrative and supporting project evidence;
- additional real web, analytics, and film/creative artifacts as they become
  available.

Database persistence, uploads, ingestion, syncing, admin tools, authentication,
and automated metadata remain intentionally deferred.
