import type { Asset } from "../../types/content";

export const ASSET_IDS = {
  brandSymbol: "asset-kodyepugh-symbol",
} as const;

export const assets = [
  {
    id: ASSET_IDS.brandSymbol,
    kind: "image",
    src: "/brand/kodyepugh-symbol.svg",
    filename: "kodyepugh-symbol.svg",
    mimeType: "image/svg+xml",
    width: 1000,
    height: 974,
    alt: "Kodye Pugh symbol and wordmark",
  },
] satisfies readonly Asset[];
