import { NextRequest } from "next/server";
import { createPwaIconResponse } from "@/lib/pwa-icon";

const ALLOWED_SIZES = new Set([192, 512]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const resolved = Number(size);
  const iconSize = ALLOWED_SIZES.has(resolved) ? resolved : 192;

  const response = createPwaIconResponse(iconSize);
  response.headers.set("Content-Type", "image/png");
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
