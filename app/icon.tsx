import { ImageResponse } from "next/og";
import { BrandSymbol } from "@/components/navigation/BrandSymbol";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f4f5ef",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <BrandSymbol
          containerStyle={{ display: "flex", height: "78%", width: "78%" }}
          variant="metadata-icon"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    ),
    size,
  );
}
