import { resolveGenericFileInspection } from "@/lib/content/generic-file-inspection";
import type { Resource } from "@/types/content";

type GenericFileInspectionBodyProps = {
  resource: Resource;
};

export function GenericFileInspectionBody({
  resource,
}: GenericFileInspectionBodyProps) {
  const resolution = resolveGenericFileInspection(resource);

  if (resolution.status === "unavailable") {
    return (
      <section className="inspection-generic-file inspection-generic-file--unavailable">
        <p className="artifact-window__section-index">Preview unavailable</p>
        <p>{resolution.reason}</p>
        {resolution.details.length > 0 ? (
          <ul>
            {resolution.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        ) : null}
      </section>
    );
  }

  const { asset } = resolution;

  return (
    <section className="inspection-generic-file" data-generic-file-source={resolution.source}>
      <object
        className="inspection-generic-file__preview"
        data={asset.src}
        type="application/pdf"
        title={`${resource.title} PDF preview`}
        aria-label={`${resource.title} PDF preview`}
      >
        <p className="inspection-generic-file__fallback">
          This browser cannot display the PDF inline.
        </p>
      </object>
    </section>
  );
}
