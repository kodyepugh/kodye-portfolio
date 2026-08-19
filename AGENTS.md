<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Digital Reservoir project references

Before implementing Digital Reservoir content architecture, ingestion, membership, Object addressability, direct-resource queries, supporting-resource navigation, or inspection-window behavior, read these project documents together:

1. `docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md`
2. `docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md`
3. `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`

The ontology addendum is currently at revision **0.7.1** and is authoritative where it conflicts with earlier Asset / Source Record / Artifact Window entity-model language.

It preserves the approved v0.6 Query Reservoir closure baseline while establishing that:

- persistent semantic `Object = Collection | Resource`;
- every persistent Object is directly addressable in its own right;
- Collection addresses resolve to persistent Collection Reservoirs;
- Resource addresses resolve through temporary Query Reservoirs;
- Artifact is reversible curatorial status on a Resource and grants Collection-membership eligibility;
- Asset and Source are supporting roles/relationships rather than mandatory peer public entity classes;
- Resource identity/addressability survives promotion/demotion;
- supporting Resources may be directly queried without receiving Collection membership;
- inspection renderer is selected by Resource inspection kind rather than Artifact status;
- Inspection Windows share a common chassis with type-driven bodies and a supporting-resource rail;
- document-like Resources render from reusable document structure rather than one hard-coded case-study template;
- resource queries issued from an open inspection surface should preserve meaningful return context where required;
- curatorial resolution, not technical decomposability, determines which constituent objects are materialized.

For the active Bellabeat L2 implementation, also read:

4. `docs/l2-bellabeat-manual-ingestion-manifest.md`

Do not build production ingestion, search, unassigned-resource inbox UI, or unrelated future inspection renderers unless the current task explicitly authorizes them.
