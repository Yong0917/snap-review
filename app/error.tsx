"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-background">
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={28} className="text-destructive" />
        </div>
        <h1 className="font-bold text-xl text-foreground mb-2">문제가 발생했어요</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          일시적인 오류가 발생했습니다.<br />잠시 후 다시 시도해주세요.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={unstable_retry}
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-semibold"
          >
            <RefreshCw size={15} />
            다시 시도
          </button>
          <Link
            href="/"
            className="flex items-center justify-center w-full bg-muted text-foreground rounded-2xl py-3.5 text-sm font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground/50 mt-6">오류 코드: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
