import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam, 10) || 192;
  const radius = Math.round(size * 0.2);
  const fontSize = Math.round(size * 0.6);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c85520",
          borderRadius: `${radius}px`,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize,
            fontWeight: 700,
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          S
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
