import { resolveGenericFileInspection } from "@/lib/content/generic-file-inspection";
import type { Resource } from "@/types/content";

type GenericFileInspectionBodyProps = {
  resource: Resource;
};

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M7.25 1.5h1.5v7.21l2.18-2.17L12 7.6 8 11.6 4 7.6l1.07-1.06 2.18 2.17V1.5ZM2 13h12v1.5H2V13Z" fill="currentColor" />
    </svg>
  );
}

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
  const downloadName = asset.filename ?? `${resource.slug}.pdf`;

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
          This browser cannot display the PDF inline. Use the download action below.
        </p>
      </object>
      <a
        className="inspection-generic-file__download"
        href={asset.src}
        download={downloadName}
        aria-label={`Download ${resource.title} PDF`}
      >
        <span>Download PDF</span>
        <DownloadIcon />
      </a>
    </section>
  );
}
