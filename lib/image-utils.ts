const MAX_PX = 1600;
const JPEG_QUALITY = 0.85;

/**
 * HEIC/HEIF → JPEG 변환 + 최대 1600px 리사이즈 압축.
 * JPG/PNG는 리사이즈만 적용.
 * 브라우저(클라이언트) 전용 — SSR에서 호출 금지.
 */
export async function prepareImageFile(file: File): Promise<File> {
  let blob: Blob = file;

  // HEIC/HEIF 변환:
  // iOS WebKit은 HEIC를 네이티브 지원하므로 canvas가 직접 디코딩 가능.
  // heic2any(WASM)는 iOS에서 JIT 제한으로 실패하므로 건너뜀.
  // 비iOS 브라우저(Chrome, Firefox 등)는 HEIC 미지원 → heic2any로 변환.
  if (isHeicFile(file) && !isIOSWebKit()) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
    blob = Array.isArray(converted) ? converted[0] : converted;
  }

  // Canvas 리사이즈 + JPEG 압축
  const resized = await resizeToJpeg(blob, MAX_PX, JPEG_QUALITY);

  const baseName = file.name.replace(/\.(heic|heif)$/i, "");
  const newName = baseName.endsWith(".jpg") || baseName.endsWith(".jpeg")
    ? baseName
    : `${baseName}.jpg`;

  return new File([resized], newName, { type: "image/jpeg" });
}

/** iOS Safari / 모든 iOS 브라우저(WebKit 기반) 여부 감지 */
function isIOSWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPad Pro는 desktop mode에서 platform이 MacIntel이므로 maxTouchPoints로 구분
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isHeicFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    mime === "image/heic" ||
    mime === "image/heif" ||
    ext === "heic" ||
    ext === "heif"
  );
}

function resizeToJpeg(blob: Blob, maxPx: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}
