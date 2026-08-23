# Digital Reservoir content foundation

This directory contains semantic, local/static content records. Spatial layout
and prototype placement data remain in `content/reservoir/` and are intentionally
not imported here.

The registry in `lib/content/registry.ts` exposes the canonical object sets plus
compatibility views:

- resources: canonical inspectable objects;
- artifacts: compatibility view over artifact-status resources;
- collections: logical grouping objects;
- memberships: resource/collection relationships, including many-to-many use;
- resource support relations: artifact-status resource-to-resource support/provenance links;
- assets: stored public media payloads;
- source records: internal provenance for resources or assets.

Public reservoir presentation should enter through
`lib/content/reservoir-adapter.ts`. The adapter includes only records explicitly
marked `published: true` and never exposes source records or local source paths.
It also contains no geometry, vertex, camera, or generated layout fields.

## Launch registry

The initial public launch is intentionally sparse. The published root
Collection curates the Bellabeat case study, the approved Resume, and Contact.
Bellabeat's supporting Resources remain independently addressable through its
support graph without receiving root membership.

Dormant or future Collections and unfinished Resources may remain in the
canonical registry for development and later curation, but they are unpublished
and must not appear in the production-visible launch surface.

Database persistence, uploads, ingestion, syncing, admin tools, authentication,
and automated metadata remain intentionally deferred.
