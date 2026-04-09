import { ImageResponse } from "next/og";

type IconKind = "favicon" | "app";

const BRAND = {
  cream: "#f8f1e7",
  creamShade: "#efe3d2",
  paperLine: "#e6d7c6",
  orange: "#bf4315",
  orangeBright: "#d96028",
  orangeDeep: "#7f2d13",
  white: "#fffaf5",
};

function CameraGlyph({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={small ? 18 : 120}
      height={small ? 18 : 120}
      fill="none"
    >
      <rect
        x="2"
        y="7"
        width="20"
        height="13"
        rx="3"
        stroke={BRAND.white}
        strokeWidth={small ? 2 : 1.9}
      />
      <path
        d="M8 7V5.8C8 4.81 8.81 4 9.8 4h4.4C15.19 4 16 4.81 16 5.8V7"
        stroke={BRAND.white}
        strokeWidth={small ? 2 : 1.9}
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="13.5"
        r={small ? 3.35 : 4}
        stroke={BRAND.white}
        strokeWidth={small ? 2 : 1.9}
      />
      <circle
        cx="12"
        cy="13.5"
        r={small ? 1.35 : 1.55}
        fill="rgba(255,250,245,0.35)"
      />
      <path
        d="M19.2 3.2 20 1.3 20.8 3.2 22.7 4 20.8 4.8 20 6.7 19.2 4.8 17.3 4Z"
        fill={BRAND.white}
      />
    </svg>
  );
}

function PwaIconArt({ size, kind }: { size: number; kind: IconKind }) {
  const small = kind === "favicon" || size <= 48;
  const tileSize = small ? size : Math.round(size * 0.66);
  const tileRadius = small ? Math.round(size * 0.22) : Math.round(size * 0.22);

  if (small) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #b83f14 0%, #d96028 58%, #cc5420 100%)",
          borderRadius: tileRadius,
        }}
      >
        <CameraGlyph small />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: `linear-gradient(180deg, ${BRAND.cream} 0%, ${BRAND.creamShade} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-8% auto auto -18%",
          width: `${Math.round(size * 0.72)}px`,
          height: `${Math.round(size * 0.72)}px`,
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(217,96,40,0.18) 0%, rgba(217,96,40,0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "auto -12% -16% auto",
          width: `${Math.round(size * 0.8)}px`,
          height: `${Math.round(size * 0.8)}px`,
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(191,67,21,0.14) 0%, rgba(191,67,21,0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: `${Math.round(size * 0.62)}px 0 0 0`,
          opacity: 0.75,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${Math.max(
            18,
            Math.round(size * 0.055)
          )}px, ${BRAND.paperLine} ${Math.max(19, Math.round(size * 0.055) + 1)}px, ${
            BRAND.paperLine
          } ${Math.max(20, Math.round(size * 0.055) + 2)}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${Math.round(size * 0.2)}px`,
          width: `${tileSize}px`,
          height: `${tileSize}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: `${tileRadius}px`,
          background: `linear-gradient(145deg, ${BRAND.orange} 0%, ${BRAND.orangeBright} 58%, ${BRAND.orangeDeep} 100%)`,
          boxShadow:
            "0 26px 50px rgba(110, 36, 12, 0.22), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        <CameraGlyph />
      </div>
    </div>
  );
}

export function createPwaIconResponse(size: number, kind: IconKind = "app") {
  return new ImageResponse(<PwaIconArt size={size} kind={kind} />, {
    width: size,
    height: size,
  });
}
