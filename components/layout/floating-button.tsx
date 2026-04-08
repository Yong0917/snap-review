"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { prepareImageFile } from "@/lib/image-utils";
import { useReceiptStore } from "@/store/receipt";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
const MAX_SIZE = 10 * 1024 * 1024;

function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const validExt = ["jpg", "jpeg", "png", "heic", "heif"];
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && !validExt.includes(ext ?? "")) {
    return "JPG, PNG, HEIC 파일만 업로드할 수 있습니다.";
  }
  if (file.size > MAX_SIZE) {
    return "파일 크기는 10MB 이하여야 합니다.";
  }
  return null;
}

export default function FloatingButton() {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [converting, setConverting] = useState(false);
  const setImageFile = useReceiptStore((s) => s.setImageFile);
  const reset = useReceiptStore((s) => s.reset);

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setConverting(true);
      try {
        const prepared = await prepareImageFile(file);
        reset();
        setImageFile(prepared);
        router.push("/processing");
      } catch {
        toast.error("이미지 변환에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setConverting(false);
      }
    },
    [reset, setImageFile, router]
  );

  if (pathname === "/processing" || pathname === "/result") return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-md mx-auto relative h-16">
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">

            {/* Pulse rings */}
            <span className="absolute inset-0 rounded-full bg-primary/25 animate-pulse-ring" />
            <span
              className="absolute inset-0 rounded-full bg-primary/15 animate-pulse-ring delay-300"
              style={{ animationDelay: "0.7s" }}
            />

            {/* FAB */}
            <button
              onClick={() => !converting && fileInputRef.current?.click()}
              disabled={converting}
              className="relative w-[54px] h-[54px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/35 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
              aria-label="영수증 촬영"
            >
              {converting
                ? <Loader2 size={22} className="animate-spin" />
                : <Camera size={22} strokeWidth={2} />
              }
            </button>

          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
