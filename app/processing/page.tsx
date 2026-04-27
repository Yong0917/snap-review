"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useReceiptStore } from "@/store/receipt";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

const STEP_LABELS = ["이미지 분석 중", "핵심 포인트 추출 중", "리뷰 생성 중"];
const STEP_MIN_MS = [1400, 1400, 0];

export default function ProcessingPage() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const {
    imageFile,
    status,
    currentStep,
    setCurrentStep,
    setResult,
    setError,
    setStatus,
    reset,
  } = useReceiptStore();
  const [displayProgress, setDisplayProgress] = useState(0);
  const ranRef = useRef(false);

  useEffect(() => {
    if (status === "error") {
      setDisplayProgress(100);
      return;
    }
    if (status === "done") {
      setDisplayProgress(100);
      return;
    }
    if (currentStep < 2) {
      setDisplayProgress(Math.round(((currentStep + 1) / 3) * 100));
      return;
    }
    // Step 2 (API 대기 중): 70% → 97% 부드럽게 증가
    setDisplayProgress(70);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const val = 70 + 27 * (1 - Math.exp(-elapsed / 8000));
      setDisplayProgress(Math.round(val));
      if (val >= 97) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [currentStep, status]);

  const run = useCallback(async () => {
    if (!imageFile) return;

    setStatus("processing");

    const apiPromise = callProcessApi(imageFile);

    setCurrentStep(0);
    await delay(STEP_MIN_MS[0]);

    setCurrentStep(1);
    await delay(STEP_MIN_MS[1]);

    setCurrentStep(2);
    const result = await apiPromise;

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setResult(result.extractedInfo, result.reviews, result.sessionId);
    router.replace("/result");
  }, [imageFile, router, setCurrentStep, setError, setResult, setStatus]);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (status === "done") {
      router.replace("/result");
      return;
    }

    if (!imageFile) {
      router.replace("/");
      return;
    }

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = async () => {
    if (!imageFile || isRetrying) return;
    setIsRetrying(true);
    try {
      await run();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleBackHome = () => {
    reset();
    router.replace("/");
  };

  const isError = status === "error";
  const errorMessage = useReceiptStore((s) => s.errorMessage);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-background">

      <div className="w-full max-w-xs relative">

        {/* ── Receipt + Scanner ── */}
        <div className="relative mx-auto w-44 h-56 mb-10">
          <div className="relative w-full h-full rounded-2xl receipt-lines bg-card border border-border overflow-hidden shadow-sm">
            {!isError && (
              <div
                className="animate-scan-line"
                style={{
                  background:
                    "linear-gradient(to right, transparent 0%, color-mix(in oklch, var(--primary) 30%, transparent) 35%, color-mix(in oklch, var(--primary) 45%, transparent) 50%, color-mix(in oklch, var(--primary) 30%, transparent) 65%, transparent 100%)",
                }}
              />
            )}
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 px-5 pointer-events-none select-none">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[5px] rounded-full bg-border"
                  style={{ width: `${65 + (i % 3) * 12}%`, opacity: 0.45 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="text-center mb-8 animate-fade-up">
          {isError ? (
            <>
              <h1 className="font-sans font-bold text-display text-destructive mb-2 tracking-tight">
                인식 실패
              </h1>
              <p className="text-meta text-muted-foreground">
                {errorMessage ?? "처리 중 오류가 발생했습니다."}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-sans font-bold text-display text-foreground mb-2 tracking-tight">
                {STEP_LABELS[currentStep]}
                <span className="animate-progress-glow">...</span>
              </h1>
              <p className="text-meta text-muted-foreground">잠시만 기다려주세요</p>
            </>
          )}
        </div>

        {/* ── Steps ── */}
        <div className="space-y-2 mb-8 animate-fade-up delay-150">
          {STEP_LABELS.map((label, i) => {
            const done = isError ? false : i < currentStep;
            const active = isError ? false : i === currentStep;
            const failed = isError && i === currentStep;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-500 ${
                  failed
                    ? "border-destructive/30 bg-destructive/5"
                    : active
                    ? "border-primary/40 bg-primary/5"
                    : done
                    ? "border-border bg-muted/25"
                    : "border-hairline bg-background opacity-35"
                }`}
              >
                {failed ? (
                  <XCircle size={18} className="text-destructive shrink-0" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                ) : active ? (
                  <Loader2 size={18} className="text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-border/60 shrink-0" />
                )}
                <span
                  className={`text-meta font-medium flex-1 ${
                    failed
                      ? "text-destructive"
                      : active
                      ? "text-primary"
                      : done
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {done && (
                  <span className="text-eyebrow text-primary/60 font-semibold">완료</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Progress bar ── */}
        <div className="animate-fade-up delay-225">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-muted-foreground">진행률</span>
            <span
              className={`text-caption font-semibold tabular-nums ${
                isError ? "text-destructive" : "text-primary"
              }`}
            >
              {isError ? "실패" : `${displayProgress}%`}
            </span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isError ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {isError && (
          <div className="mt-6 space-y-2.5 animate-fade-up delay-300">
            <button
              onClick={handleRetry}
              disabled={isRetrying || !imageFile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-body font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {isRetrying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  다시 시도하는 중...
                </>
              ) : (
                "다시 시도"
              )}
            </button>
            <button
              onClick={handleBackHome}
              className="flex w-full items-center justify-center rounded-xl border border-border py-3.5 text-body font-medium text-foreground transition-colors hover:bg-muted"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

async function callProcessApi(
  file: File
): Promise<
  | { extractedInfo: ExtractedInfo; reviews: GeneratedReviews; sessionId: string | null }
  | { error: string }
> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/process", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "처리 중 오류가 발생했습니다." };
    }

    return {
      extractedInfo: data.extractedInfo,
      reviews: data.reviews,
      sessionId: data.sessionId ?? null,
    };
  } catch {
    return { error: "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요." };
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
