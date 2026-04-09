"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#fafafa" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            앱 오류가 발생했어요
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 }}>
            예상치 못한 오류가 발생했습니다.
            <br />
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={unstable_retry}
            style={{
              background: "#e85c3a",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              padding: "14px 32px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 12,
              width: "100%",
              maxWidth: 280,
            }}
          >
            다시 시도
          </button>
          <Link
            href="/"
            style={{
              display: "block",
              background: "#f3f4f6",
              color: "#374151",
              borderRadius: 16,
              padding: "14px 32px",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              width: "100%",
              maxWidth: 280,
              boxSizing: "border-box",
            }}
          >
            홈으로 돌아가기
          </Link>
          {error.digest && (
            <p style={{ fontSize: 10, color: "#d1d5db", marginTop: 24 }}>
              오류 코드: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
