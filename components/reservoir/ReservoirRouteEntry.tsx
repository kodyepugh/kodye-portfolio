import type { PublicRoute } from "@/lib/public-routing";
import { ReservoirScene } from "./ReservoirScene";
import { BrandSymbol } from "../navigation/BrandSymbol";

type ReservoirRouteEntryProps = {
  route: Exclude<PublicRoute, { kind: "not-found" | "redirect-root" }>;
};

export function ReservoirRouteEntry({ route }: ReservoirRouteEntryProps) {
  const routeKey =
    route.kind === "root"
      ? "root"
      : route.kind === "collection"
        ? `collection:${route.collectionId}`
        : route.kind === "resource"
          ? `resource:${route.resourceId}`
          : `contextual-resource:${route.collectionId}:${route.resourceId}`;

  return (
    <main className="reservoir-study">
      <ReservoirScene key={routeKey} initialRoute={route} />

      <BrandSymbol />

      <div className="interaction-note" aria-hidden="true">
        <span>Drag to traverse</span>
        <span>Wheel to zoom</span>
      </div>
    </main>
  );
}
