import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SnapReview",
    short_name: "SnapReview",
    description:
      "사진을 올리면 AI가 리뷰를 써드립니다. 네이버·카카오·구글 어디에나 바로 붙여넣기.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9f5f0",
    theme_color: "#c85520",
    categories: ["utilities", "productivity"],
    lang: "ko",
    icons: [
      {
        src: "/api/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
