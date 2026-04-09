import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const image = await readFile(
    path.join(process.cwd(), "public/icons/icon-180.png")
  );
  const base64 = `data:image/png;base64,${image.toString("base64")}`;

  return new ImageResponse(
    <img src={base64} alt="" style={{ width: "100%", height: "100%" }} />,
    size
  );
}
