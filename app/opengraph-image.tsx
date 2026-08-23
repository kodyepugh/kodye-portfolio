import { ImageResponse } from "next/og";
import { BrandSymbol } from "@/components/navigation/BrandSymbol";

export const alt = "Kodye Pugh — Digital Reservoir";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#111816",
          color: "#f4f5ef",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "74px 88px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span style={{ fontSize: 30, letterSpacing: 5, opacity: 0.72 }}>
            KODYE PUGH
          </span>
          <span style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3 }}>
            Digital Reservoir
          </span>
          <span style={{ fontSize: 28, lineHeight: 1.35, maxWidth: 610, opacity: 0.78 }}>
            A collection of all things Kodye Pugh.
          </span>
        </div>
        <BrandSymbol
          containerStyle={{
            color: "#f4f5ef",
            display: "flex",
            height: 248,
            width: 304,
          }}
          variant="metadata-icon"
          style={{ height: 248, width: 304 }}
        />
      </div>
    ),
    size,
  );
}
