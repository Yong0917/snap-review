"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanLine, Copy, Sparkles, ArrowRight, Upload, AlertCircle, Loader2 } from "lucide-react";
import { prepareImageFile } from "@/lib/image-utils";
import { useReceiptStore } from "@/store/receipt";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const steps = [
  {
    num: "01",
    icon: Camera,
    title: "사진 업로드",
    desc: "음식, 공간, 제품, 소품 등 원하는 사진을 선택하세요",
  },
  {
    num: "02",
    icon: ScanLine,
    title: "자동 분석",
    desc: "AI가 사진의 핵심 대상과 분위기를 읽어냅니다",
  },
  {
    num: "03",
    icon: Copy,
    title: "복사 & 붙여넣기",
    desc: "마음에 드는 리뷰를 복사해 원하는 플랫폼에 붙여넣기",
  },
];

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

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const setImageFile = useReceiptStore((s) => s.setImageFile);
  const reset = useReceiptStore((s) => s.reset);

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError(null);
      setConverting(true);
      try {
        const prepared = await prepareImageFile(file);
        reset();
        setImageFile(prepared);
        router.push("/processing");
      } catch {
        setFileError("이미지 변환에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setConverting(false);
      }
    },
    [reset, setImageFile, router]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
        <div className="max-w-md mx-auto px-5 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icons/icon-32.png"
              alt="SnapReview"
              width={32}
              height={32}
              className="rounded-[10px] shadow-sm"
              priority
            />
            <span
              className="text-[1.22rem] tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              SnapReview
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5">

        {/* ── Hero ── */}
        <section className="relative pt-10 pb-8 animate-fade-up overflow-hidden">
          {/* Ambient orbs */}
          <div
            className="absolute -top-16 -right-12 w-56 h-56 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)",
              animation: "orbFloat 14s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-4 -left-10 w-44 h-44 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 10%, transparent), transparent 70%)",
              animation: "orbFloatAlt 19s ease-in-out infinite",
            }}
          />

          <div className="relative">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary mb-4 tracking-wide uppercase">
              <Sparkles size={11} strokeWidth={2.5} />
              AI 리뷰 자동 생성
            </p>
            <h1 className="font-serif font-bold text-[2.85rem] leading-[1.1] tracking-tight text-foreground mb-3.5">
              사진만 올리면<br />
              <span className="text-primary">리뷰 완성.</span>
            </h1>
            <p className="text-muted-foreground text-[0.88rem] leading-relaxed">
              음식 · 공간 · 제품 · 소품 어떤 사진이든 OK<br />
              네이버 · 카카오 · 구글 어디에나 붙여넣기
            </p>
          </div>
        </section>

        {/* ── Upload Machine ── */}
        <section className="mb-10 animate-fade-up delay-150">
          <div
            className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all duration-300 ${
              dragging
                ? "border-primary shadow-xl shadow-primary/20 scale-[1.015]"
                : "border-border shadow-lg shadow-black/5 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/10"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Slot bar top */}
            <div className="h-[13px] flex items-center justify-center gap-1" style={{ background: "linear-gradient(90deg, #1a1208, #2d1f0e, #1a1208)" }}>
              <span className="w-10 h-[2.5px] rounded-full bg-white/10" />
              <span className="w-3 h-[2.5px] rounded-full bg-white/15" />
            </div>

            {/* Receipt paper interior */}
            <div className="receipt-lines bg-card pt-8 pb-7 px-6 flex flex-col items-center text-center">
              <div
                className={`w-[62px] h-[62px] rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                  dragging ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/18 animate-float"
                }`}
              >
                {dragging ? (
                  <Upload size={26} className="text-primary" strokeWidth={1.8} />
                ) : (
                  <Camera size={26} className="text-primary" strokeWidth={1.8} />
                )}
              </div>

              <p className="font-semibold text-[15px] text-foreground mb-1">
                {dragging ? "여기에 놓으세요" : "사진을 올려주세요"}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {dragging ? "파일을 드롭하세요" : "드래그하거나 눌러서 선택"}
              </p>

              <div className="flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={converting}
                  className="flex items-center gap-1.5 text-primary-foreground rounded-[10px] px-5 py-2.5 text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:pointer-events-none"
                  style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 80%, oklch(0.7 0.15 50)))" }}
                >
                  {converting ? <Loader2 size={13} className="animate-spin" /> : null}
                  {converting ? "변환 중..." : "사진 선택"}
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={converting}
                  className="bg-background border border-border rounded-[10px] px-5 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  바로 촬영
                </button>
              </div>
            </div>

            {/* Slot bar bottom */}
            <div className="h-[9px]" style={{ background: "linear-gradient(90deg, #1a1208, #241809, #1a1208)" }} />
          </div>
          {fileError ? (
            <p className="flex items-center justify-center gap-1.5 text-xs text-destructive mt-2.5">
              <AlertCircle size={12} />
              {fileError}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground/65 mt-2.5">
              JPG · PNG · HEIC 지원 &nbsp;·&nbsp; 최대 10MB
            </p>
          )}
        </section>

        {/* ── How it works ── */}
        <section className="mb-10 animate-fade-up delay-225">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-4">
            이렇게 사용하세요
          </h2>
          <div className="space-y-2">
            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div
                key={num}
                className="relative flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
              >
                {/* Large step number (background) */}
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[3.5rem] font-bold leading-none text-primary/5 select-none pointer-events-none"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  {num}
                </span>

                <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5 relative">
                  <span
                    className="text-[10px] font-bold text-primary/45 tracking-wider leading-none"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-primary/9 flex items-center justify-center border border-primary/12">
                    <Icon size={17} className="text-primary" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="relative">
                  <p className="font-semibold text-[13.5px] text-foreground mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample review card ── */}
        <section className="mb-12 animate-fade-up delay-300">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-4">
            리뷰 예시
          </h2>
          <div className="rounded-2xl overflow-hidden border border-border shadow-md">

            {/* Accent gradient strip */}
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, transparent, var(--primary), var(--primary), transparent)" }} />

            {/* Receipt content */}
            <div className="receipt-lines bg-card px-5 pt-4 pb-4">
              <div className="flex items-start justify-between mb-3.5">
                <div>
                  <p className="font-bold text-[14px] text-foreground">화이트 키보드 데스크셋업</p>
                  <p className="text-xs text-muted-foreground mt-0.5">전자기기/데스크 &nbsp;·&nbsp; 미니멀한 작업 공간</p>
                </div>
                <div className="flex gap-1 mt-0.5">
                  {[
                    { label: "짧게", active: false },
                    { label: "보통", active: true },
                    { label: "상세", active: false },
                  ].map(({ label, active }) => (
                    <span
                      key={label}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[13.5px] leading-[1.75] text-foreground/85 mb-4">
                화이트 톤으로 통일된 데스크가 깔끔해서 보는 것만으로도 집중이 잘 될 것 같아요.
                키보드 배열도 단정하고 조명 톤이 은은해서 작업 공간 분위기를 세련되게 만들어줍니다.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-primary/8 hover:bg-primary/14 text-primary rounded-xl py-2.5 text-sm font-semibold transition-colors border border-primary/12"
              >
                <Camera size={13} />
                나도 리뷰 만들기
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-muted/30 flex items-center justify-between border-t border-border/50">
              <span className="text-xs text-muted-foreground">직접 해보세요</span>
              <ArrowRight size={13} className="text-muted-foreground" />
            </div>
          </div>
        </section>

      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
