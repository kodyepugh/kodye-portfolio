import { BrandSymbol } from "@/components/navigation/BrandSymbol";
import { ReservoirScene } from "@/components/reservoir/ReservoirScene";
import { activeReservoirArtifacts } from "@/content/reservoir/artifacts";

export default function Home() {
  return (
    <main className="reservoir-study">
      <ReservoirScene />

      <BrandSymbol />

      <div className="interaction-note" aria-hidden="true">
        <span>Drag to traverse</span>
        <span>Wheel to travel</span>
      </div>

      <section className="sr-only" aria-label="Reservoir artifacts">
        <h1>Digital Reservoir spatial study</h1>
        <p>
          An interactive sphere containing {activeReservoirArtifacts.length}{" "}
          placeholder artifacts.
        </p>
        <ul>
          {activeReservoirArtifacts.map((artifact) => (
            <li key={artifact.id}>
              {artifact.type}: {artifact.title}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
