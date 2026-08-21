# KP Website / Digital Reservoir

This repository contains the KP Website portfolio and its Digital Reservoir interface: a spatial portfolio experience where Collections organize work and Resources provide directly addressable, inspectable content.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use the following checks before a reviewable implementation checkpoint:

```bash
npm run typecheck
npm run lint
npm run validate:content
npm run validate:inspection
npm run validate:label-geometry
npm run build
```

## Documentation index

- [`AGENTS.md`](AGENTS.md) — repository and implementation instructions.
- [`docs/release-preparation-roadmap.md`](docs/release-preparation-roadmap.md) — current public-launch objective, priorities, and deferrals.
- [`docs/l2-implementation-status.md`](docs/l2-implementation-status.md) — implemented L2 foundation and remaining runtime work.
- [`docs/l2-bellabeat-manual-ingestion-manifest.md`](docs/l2-bellabeat-manual-ingestion-manifest.md) — approved Bellabeat content and curatorial boundaries.
- [`docs/l2-external-link-repository-inspection-closeout.md`](docs/l2-external-link-repository-inspection-closeout.md) — accepted external-link/repository pass.
- [`docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`](docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md) — authoritative semantic object and Resource model.
- [`docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md`](docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md) — approved interface and interaction specification.
- [`docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md`](docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md) — implementation brief and foundation context.
- [`docs/operating/Shared Operating Contract.md`](docs/operating/Shared%20Operating%20Contract.md) — stable cross-agent operating rules.

Current sequencing follows the roadmap; detailed architecture and accepted behavior remain in the linked source documents above.
