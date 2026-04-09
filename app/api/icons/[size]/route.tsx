import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const ALLOWED_SIZES = new Set(["32", "180", "192", "512"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const resolved = ALLOWED_SIZES.has(size) ? size : "192";

  const filePath = path.join(process.cwd(), `public/icons/icon-${resolved}.png`);
  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
