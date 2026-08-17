import { BrandSymbol } from "@/components/navigation/BrandSymbol";
import { ReservoirScene } from "@/components/reservoir/ReservoirScene";

export default function Home() {
  return (
    <main className="reservoir-study">
      <ReservoirScene />

      <BrandSymbol />

      <div className="interaction-note" aria-hidden="true">
        <span>Drag to traverse</span>
        <span>Wheel to zoom</span>
      </div>
    </main>
  );
}
