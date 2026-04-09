import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const image = await readFile(
    path.join(process.cwd(), "public/icons/icon-32.png")
  );
  const base64 = `data:image/png;base64,${image.toString("base64")}`;

  return new ImageResponse(
    <img src={base64} alt="" style={{ width: "100%", height: "100%" }} />,
    size
  );
}
