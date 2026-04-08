"use client";

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
    title: "영수증 촬영",
    desc: "카메라로 찍거나 갤러리에서 영수증을 선택하세요",
  },
  {
    num: "02",
    icon: ScanLine,
    title: "자동 분석",
    desc: "AI가 가게명·메뉴·금액을 자동으로 읽어냅니다",
  },
  {
    num: "03",
    icon: Copy,
    title: "복사 & 붙여넣기",
    desc: "마음에 드는 리뷰를 복사해 원하는 플랫폼에 붙여넣기",
  },
];

function validateFile(file: File): string | null {
  // Check type by MIME or extension (HEIC may have empty MIME in some browsers)
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
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-md mx-auto px-5 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <Camera size={15} className="text-primary-foreground" strokeWidth={2.2} />
            </div>
            <span
              className="text-[1.25rem] tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              SnapReview
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Beta
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5">

        {/* ── Hero ── */}
        <section className="pt-10 pb-8 animate-fade-up">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-4">
            <Sparkles size={12} />
            AI 리뷰 자동 생성
          </p>
          <h1 className="font-serif font-bold text-[2.75rem] leading-[1.12] tracking-tight text-foreground mb-3">
            영수증 찍으면<br />
            <span className="text-primary">리뷰 완성.</span>
          </h1>
          <p className="text-muted-foreground text-[0.9rem] leading-relaxed">
            어떤 가게든 영수증만 있으면 OK<br />
            네이버 · 카카오 · 구글 어디에나 붙여넣기
          </p>
        </section>

        {/* ── Upload Machine ── */}
        <section className="mb-10 animate-fade-up delay-150">
          <div
            className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all duration-300 ${
              dragging
                ? "border-primary shadow-lg shadow-primary/20 scale-[1.01]"
                : "border-border shadow-md hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Machine top bar — the "slot" */}
            <div className="h-[14px] bg-foreground flex items-center justify-center gap-1">
              <span className="w-12 h-[3px] rounded-full bg-white/15" />
            </div>

            {/* Receipt paper interior */}
            <div className="receipt-lines bg-card pt-8 pb-7 px-7 flex flex-col items-center text-center">
              <div
                className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                  dragging ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/20 animate-float"
                }`}
              >
                {dragging ? (
                  <Upload size={26} className="text-primary" strokeWidth={1.8} />
                ) : (
                  <Camera size={26} className="text-primary" strokeWidth={1.8} />
                )}
              </div>

              <p className="font-semibold text-[15px] text-foreground mb-1">
                {dragging ? "여기에 놓으세요" : "영수증을 올려주세요"}
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                {dragging ? "파일을 여기 드롭하세요" : "드래그하거나 눌러서 선택"}
              </p>

              <div className="flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={converting}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-[10px] px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {converting ? <Loader2 size={13} className="animate-spin" /> : null}
                  {converting ? "변환 중..." : "사진 선택"}
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={converting}
                  className="bg-background border border-border rounded-[10px] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  카메라 촬영
                </button>
              </div>
            </div>

            {/* Machine bottom bar */}
            <div className="h-[10px] bg-foreground/80" />
          </div>
          {fileError ? (
            <p className="flex items-center justify-center gap-1.5 text-xs text-destructive mt-2.5">
              <AlertCircle size={12} />
              {fileError}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground/70 mt-2.5">
              JPG · PNG · HEIC 지원 &nbsp;·&nbsp; 최대 10MB
            </p>
          )}
        </section>

        {/* ── How it works ── */}
        <section className="mb-10 animate-fade-up delay-225">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.13em] mb-4">
            이렇게 사용하세요
          </h2>
          <div className="space-y-2">
            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div
                key={num}
                className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/25 hover:shadow-sm transition-all duration-200"
              >
                <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                  <span
                    className="text-[10px] font-bold text-primary/50 tracking-wider leading-none"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Icon size={17} className="text-primary" strokeWidth={1.8} />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[13.5px] text-foreground mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample review card ── */}
        <section className="mb-12 animate-fade-up delay-300">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.13em] mb-4">
            리뷰 예시
          </h2>
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm">

            {/* Colored top tape */}
            <div className="h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            {/* Receipt header */}
            <div className="receipt-lines bg-card px-5 pt-4 pb-3">
              <div className="flex items-start justify-between mb-3.5">
                <div>
                  <p className="font-bold text-[14px] text-foreground">스타벅스 강남역점</p>
                  <p className="text-xs text-muted-foreground mt-0.5">2026.04.08 &nbsp;·&nbsp; 아메리카노 외 2잔</p>
                </div>
                <div className="flex gap-1 mt-0.5">
                  {["짧게", "보통", "상세"].map((t, i) => (
                    <span
                      key={t}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        i === 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[13.5px] leading-[1.7] text-foreground/90 mb-4">
                조용하고 넓은 공간이라 오래 앉아 있기 좋았어요. 아메리카노가
                진하면서도 부드러워서 만족스러웠고, 직원분들도 친절해서 기분
                좋게 이용했습니다. ☕
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-primary/8 hover:bg-primary/14 text-primary rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                <Camera size={13} />
                나도 리뷰 만들기
              </button>
            </div>

            {/* Footer CTA */}
            <div className="px-5 py-3 bg-muted/40 flex items-center justify-between border-t border-border/50">
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
        accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
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
