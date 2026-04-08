"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useReceiptStore } from "@/store/receipt";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

const STEP_LABELS = ["이미지 분석 중", "핵심 포인트 추출 중", "리뷰 생성 중"];
// 각 스텝 최소 표시 시간(ms) — API 응답 기다리는 동안 자연스럽게 진행
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
  const ranRef = useRef(false);

  const run = useCallback(async () => {
    if (!imageFile) return;

    setStatus("processing");

    // API 호출을 백그라운드에서 즉시 시작
    const apiPromise = callProcessApi(imageFile);

    // Step 0
    setCurrentStep(0);
    await delay(STEP_MIN_MS[0]);

    // Step 1
    setCurrentStep(1);
    await delay(STEP_MIN_MS[1]);

    // Step 2 — API 응답 대기
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

    // 이미 완료된 상태면 바로 이동
    if (status === "done") {
      router.replace("/result");
      return;
    }

    // 파일 없이 직접 접근한 경우 홈으로
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
  const progress = isError ? 100 : ((currentStep + 1) / 3) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-background">
      <div className="w-full max-w-xs">

        {/* ── Receipt + Scanner ── */}
        <div className="relative mx-auto w-44 h-56 mb-10">
          <div className="absolute inset-[-6px] rounded-[22px] bg-primary/8 blur-lg" />
          <div className="relative w-full h-full rounded-2xl receipt-lines bg-card border border-border/80 shadow-xl overflow-hidden">
            {!isError && (
              <div
                className="animate-scan-line"
                style={{
                  background:
                    "linear-gradient(to right, transparent 0%, oklch(0.578 0.212 36 / 0.7) 40%, oklch(0.578 0.212 36) 50%, oklch(0.578 0.212 36 / 0.7) 60%, transparent 100%)",
                  boxShadow: "0 0 10px 2px oklch(0.578 0.212 36 / 0.4)",
                }}
              />
            )}
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 px-5 pointer-events-none select-none">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[5px] rounded-full bg-border"
                  style={{ width: `${65 + (i % 3) * 12}%`, opacity: 0.5 }}
                />
              ))}
            </div>
          </div>
          {[
            "top-0 left-0 border-t-2 border-l-2 rounded-tl-md",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-md",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-md",
          ].map((cls, i) => (
            <div
              key={i}
              className={`absolute w-4 h-4 ${isError ? "border-destructive/50" : "border-primary/50"} ${cls}`}
            />
          ))}
        </div>

        {/* ── Title ── */}
        <div className="text-center mb-8 animate-fade-up">
          {isError ? (
            <>
              <h1 className="font-serif font-bold text-2xl text-destructive mb-1.5">
                인식 실패
              </h1>
              <p className="text-sm text-muted-foreground">
                {errorMessage ?? "처리 중 오류가 발생했습니다."}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif font-bold text-2xl text-foreground mb-1.5">
                {STEP_LABELS[currentStep]}...
              </h1>
              <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
            </>
          )}
        </div>

        {/* ── Steps ── */}
        <div className="space-y-2.5 mb-8 animate-fade-up delay-150">
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
                    ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/8"
                    : done
                    ? "border-border bg-muted/30"
                    : "border-border/50 bg-background opacity-35"
                }`}
              >
                {failed ? (
                  <XCircle size={18} className="text-destructive shrink-0" />
                ) : done ? (
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                ) : active ? (
                  <Loader2 size={18} className="text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-border shrink-0" />
                )}
                <span
                  className={`text-sm font-medium flex-1 ${
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
                  <span className="text-[11px] text-muted-foreground font-medium">완료</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Progress bar ── */}
        <div className="animate-fade-up delay-225">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">진행률</span>
            <span
              className={`text-xs font-semibold ${isError ? "text-destructive" : "text-primary"}`}
            >
              {isError ? "실패" : `${Math.round(progress)}%`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isError ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isError && (
          <div className="mt-6 space-y-2.5 animate-fade-up delay-300">
            <button
              onClick={handleRetry}
              disabled={isRetrying || !imageFile}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
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
              className="flex w-full items-center justify-center rounded-2xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// API 호출
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
