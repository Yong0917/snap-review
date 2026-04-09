"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Check, RefreshCw, Pencil, CheckCheck,
  Store, Calendar, ShoppingBag, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useReceiptStore } from "@/store/receipt";
import { useHistoryStore } from "@/store/history";
import { mockOcrSamples } from "@/lib/mock/ocr-data";
import { mockReviewSets } from "@/lib/mock/review-data";
import type { ExtractedInfo, GeneratedReviews, ReviewLength } from "@/types/receipt";

type ReviewType = ReviewLength;

const OCR_ROW_CONFIG = [
  { key: "subjectName"    as const, icon: Store,       label: "대상",   color: "text-blue-500" },
  { key: "category"       as const, icon: Calendar,    label: "분류",   color: "text-violet-500" },
  { key: "keyDetails"     as const, icon: ShoppingBag, label: "포인트", color: "text-amber-500" },
  { key: "moodAndContext" as const, icon: Receipt,     label: "분위기", color: "text-emerald-500" },
];

export default function ResultPage() {
  const router = useRouter();
  const { extractedInfo, reviews, sessionId, updateReviews, reset } = useReceiptStore();
  const { addItem } = useHistoryStore();

  const initialInfo: ExtractedInfo = extractedInfo ?? mockOcrSamples[0];
  const initialReviews: GeneratedReviews = reviews ?? mockReviewSets[0];

  const [tab, setTab] = useState<ReviewType>("medium");
  const [editingReview, setEditingReview] = useState(false);
  const [reviewMap, setReviewMap] = useState({ ...initialReviews });
  const [ocrInfo, setOcrInfo] = useState<ExtractedInfo>({ ...initialInfo });
  const [editingField, setEditingField] = useState<keyof ExtractedInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savedId] = useState(() => crypto.randomUUID());
  const fieldInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField && fieldInputRef.current) {
      fieldInputRef.current.focus();
    }
  }, [editingField]);

  const currentReview = reviewMap[tab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);

      addItem({
        id: savedId,
        title: ocrInfo.subjectName,
        category: ocrInfo.category,
        reviews: reviewMap,
        activeReview: tab,
        createdAt: new Date().toISOString(),
        sessionId,
      });

      toast.success("클립보드에 복사됐어요!", {
        description: "네이버·카카오·구글에 바로 붙여넣기 하세요",
      });
    } catch {
      toast.error("복사에 실패했습니다. 텍스트를 직접 선택해 복사해주세요.");
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedInfo: ocrInfo, previousReviews: reviewMap }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewMap({ ...data.reviews });
      updateReviews(data.reviews);
      toast.success("리뷰가 새로 생성됐어요!");
    } catch {
      toast.error("재생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleBack = () => {
    reset();
    router.push("/");
  };

  const handleOcrFieldSave = () => {
    setEditingField(null);
  };

  const tabLabel: Record<ReviewType, string> = {
    short: "짧게",
    medium: "보통",
    detail: "상세",
  };

  const tabDesc: Record<ReviewType, string> = {
    short: "40~60자",
    medium: "80~120자",
    detail: "150~250자",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
        <div className="max-w-md mx-auto px-4 h-[58px] flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1
            className="font-serif font-bold text-[17px] flex-1"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            리뷰 완성!
          </h1>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 px-2.5 py-1.5 rounded-lg hover:bg-primary/8"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
            다시 생성
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4 flex flex-col gap-4">

        {/* ── Image info ── */}
        <section className="animate-fade-up">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-2.5">
            이미지에서 읽은 정보
          </p>
          <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-card">
            {/* Top accent */}
            <div className="h-[2.5px]" style={{ background: "linear-gradient(90deg, transparent 0%, var(--primary) 30%, var(--primary) 70%, transparent 100%)" }} />
            {OCR_ROW_CONFIG.map(({ key, icon: Icon, label, color }, i) => (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < OCR_ROW_CONFIG.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${color} bg-current/10`}>
                  <Icon size={12} className={color} />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground w-10 shrink-0">{label}</span>

                {editingField === key ? (
                  <input
                    ref={fieldInputRef}
                    value={ocrInfo[key]}
                    onChange={(e) =>
                      setOcrInfo((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    onBlur={handleOcrFieldSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleOcrFieldSave();
                      if (e.key === "Escape") {
                        setOcrInfo((prev) => ({ ...prev, [key]: initialInfo[key] }));
                        setEditingField(null);
                      }
                    }}
                    className="flex-1 text-[13px] font-medium bg-transparent outline-none border-b border-primary/60 focus:border-primary pb-0.5"
                  />
                ) : (
                  <span
                    className="text-[13px] font-medium flex-1 text-foreground"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {ocrInfo[key]}
                  </span>
                )}

                <button
                  onClick={() =>
                    editingField === key ? handleOcrFieldSave() : setEditingField(key)
                  }
                  className="shrink-0 text-muted-foreground/35 hover:text-primary transition-colors p-1"
                >
                  {editingField === key ? (
                    <CheckCheck size={11} className="text-primary" />
                  ) : (
                    <Pencil size={11} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Review Tabs ── */}
        <section className="flex-1 animate-fade-up delay-150">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-2.5">
            AI 생성 리뷰
          </p>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as ReviewType);
              setEditingReview(false);
            }}
          >
            <TabsList className="w-full mb-3 bg-muted/50 p-1 rounded-xl h-auto border border-border/50">
              {(["short", "medium", "detail"] as ReviewType[]).map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="flex-1 rounded-lg py-2 transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/15"
                >
                  <span className="text-xs font-semibold">{tabLabel[t]}</span>
                  <span className="text-[10px] text-muted-foreground ml-1 font-normal hidden sm:inline">
                    {tabDesc[t]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {(["short", "medium", "detail"] as ReviewType[]).map((t) => (
              <TabsContent key={t} value={t} className="mt-0">
                <div className={`rounded-xl overflow-hidden border shadow-sm transition-all ${
                  regenerating ? "border-primary/30 opacity-55" : "border-border"
                }`}>
                  {/* Review text */}
                  <div className="receipt-lines bg-card">
                    {editingReview && tab === t ? (
                      <textarea
                        value={reviewMap[t]}
                        onChange={(e) =>
                          setReviewMap((m) => ({ ...m, [t]: e.target.value }))
                        }
                        className="w-full px-4 pt-4 pb-2 text-[13.5px] leading-[1.78] resize-none min-h-[110px] bg-transparent outline-none font-sans"
                        autoFocus
                      />
                    ) : (
                      <p className="px-4 pt-4 pb-2 text-[13.5px] leading-[1.78] text-foreground/88">
                        {regenerating ? "새 리뷰를 생성하고 있어요..." : reviewMap[t]}
                      </p>
                    )}
                  </div>

                  {/* Footer bar */}
                  <div className="px-4 py-2.5 border-t border-border/50 bg-muted/15 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {regenerating ? "—" : `${reviewMap[t].length}자`}
                    </span>
                    <button
                      onClick={() => setEditingReview(!editingReview)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil size={10} />
                      {editingReview ? "완료" : "수정하기"}
                    </button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>

      {/* ── Sticky copy button ── */}
      <div className="sticky bottom-0 bg-background/92 backdrop-blur-xl border-t border-border/40 px-4 py-3.5 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleCopy}
            disabled={regenerating}
            className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold transition-all duration-300 disabled:opacity-50 ${
              copied
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-92 active:scale-[0.98]"
            }`}
            style={!copied ? {
              background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 82%, oklch(0.7 0.15 50)) 100%)",
            } : undefined}
          >
            {copied ? (
              <>
                <Check size={18} strokeWidth={2.5} />
                클립보드에 복사됐어요!
              </>
            ) : (
              <>
                <Copy size={17} strokeWidth={2} />
                {tabLabel[tab]} 리뷰 복사하기
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-muted-foreground/65 mt-2">
            복사 시 히스토리에 자동 저장됩니다
          </p>
        </div>
      </div>

    </div>
  );
}
