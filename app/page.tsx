import { ReservoirScene } from "@/components/reservoir/ReservoirScene";
import { reservoirArtifacts } from "@/content/reservoir/artifacts";

export default function Home() {
  return (
    <main className="reservoir-study">
      <header className="study-label" aria-hidden="true">
        <span>Digital Reservoir</span>
        <span>Spatial study / 01</span>
      </header>

      <ReservoirScene />

      <div className="interaction-note" aria-hidden="true">
        <span>Drag to traverse</span>
        <span>Wheel to travel</span>
      </div>

      <section className="sr-only" aria-label="Reservoir artifacts">
        <h1>Digital Reservoir spatial study</h1>
        <p>An interactive sphere containing five placeholder artifacts.</p>
        <ul>
          {reservoirArtifacts.map((artifact) => (
            <li key={artifact.id}>{artifact.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
