"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Check, RefreshCw, Pencil, CheckCheck,
  Store, Calendar, ShoppingBag, Receipt, Hash, X, Plus, Video,
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
  { key: "subjectName"    as const, icon: Store,       label: "대상" },
  { key: "category"       as const, icon: Calendar,    label: "분류" },
  { key: "keyDetails"     as const, icon: ShoppingBag, label: "포인트" },
  { key: "moodAndContext" as const, icon: Receipt,     label: "분위기" },
];

export default function ResultPage() {
  const router = useRouter();
  const { extractedInfo, reviews, sessionId, updateReviews, reset } = useReceiptStore();
  const { addItem } = useHistoryStore();

  const _baseInfo = extractedInfo ?? mockOcrSamples[0];
  const initialInfo: ExtractedInfo = { ..._baseInfo, tags: _baseInfo.tags ?? [] };
  const initialReviews: GeneratedReviews = reviews ?? mockReviewSets[0];

  const [tab, setTab] = useState<ReviewType>("medium");
  const [editingReview, setEditingReview] = useState(false);
  const [reviewMap, setReviewMap] = useState({ ...initialReviews });
  const [ocrInfo, setOcrInfo] = useState<ExtractedInfo>({ ...initialInfo });
  const [editingField, setEditingField] = useState<keyof ExtractedInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [copiedCaptionIdx, setCopiedCaptionIdx] = useState<number | null>(null);
  const [captionsCopied, setCaptionsCopied] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [savedId] = useState(() => crypto.randomUUID());
  const fieldInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField && fieldInputRef.current) {
      fieldInputRef.current.focus();
    }
  }, [editingField]);

  useEffect(() => {
    if (addingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [addingTag]);

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

  const handleTagDelete = (idx: number) => {
    setOcrInfo((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));
  };

  const handleTagAdd = () => {
    const raw = newTagInput.trim();
    if (!raw) { setAddingTag(false); setNewTagInput(""); return; }
    const tag = raw.startsWith("#") ? raw : `#${raw}`;
    setOcrInfo((prev) => ({ ...prev, tags: [...prev.tags, tag].slice(0, 20) }));
    setNewTagInput("");
    setAddingTag(false);
  };

  const handleCaptionCopy = async (caption: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaptionIdx(idx);
      setTimeout(() => setCopiedCaptionIdx(null), 2200);
      toast.success("자막이 복사됐어요!");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleAllCaptionsCopy = async () => {
    const captions = reviewMap.captions ?? [];
    if (!captions.length) return;
    try {
      await navigator.clipboard.writeText(captions.join("\n"));
      setCaptionsCopied(true);
      setTimeout(() => setCaptionsCopied(false), 2200);
      toast.success("자막 전체가 복사됐어요!");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleTagsCopy = async () => {
    if (!ocrInfo.tags.length) return;
    try {
      await navigator.clipboard.writeText(ocrInfo.tags.join(" "));
      setTagsCopied(true);
      setTimeout(() => setTagsCopied(false), 2200);
      toast.success("태그가 복사됐어요!");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
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
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-hairline">
        <div className="max-w-md mx-auto px-4 h-[58px] flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-sans font-semibold text-title flex-1 tracking-tight">
            리뷰 완성
          </h1>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 px-2.5 py-1.5 rounded-lg hover:bg-muted"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
            다시 생성
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4 flex flex-col gap-4">

        {/* ── Image info ── */}
        <section className="animate-fade-up">
          <p className="text-eyebrow font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-3">
            이미지에서 읽은 정보
          </p>
          <div className="rounded-xl overflow-hidden border border-border bg-card">
            {OCR_ROW_CONFIG.map(({ key, icon: Icon, label }, i) => (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < OCR_ROW_CONFIG.length - 1 ? "border-b border-hairline" : ""
                }`}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-muted">
                  <Icon size={12} className="text-muted-foreground" strokeWidth={1.8} />
                </div>
                <span className="text-eyebrow font-semibold text-muted-foreground uppercase tracking-[0.08em] w-12 shrink-0">{label}</span>

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
                    className="flex-1 text-meta font-medium bg-transparent outline-none border-b border-primary/60 focus:border-primary pb-0.5"
                  />
                ) : (
                  <span className="text-meta font-medium flex-1 text-foreground truncate">
                    {ocrInfo[key]}
                  </span>
                )}

                <button
                  onClick={() =>
                    editingField === key ? handleOcrFieldSave() : setEditingField(key)
                  }
                  className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors p-1"
                  aria-label={editingField === key ? "저장" : "수정"}
                >
                  {editingField === key ? (
                    <CheckCheck size={12} className="text-primary" />
                  ) : (
                    <Pencil size={11} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tags ── */}
        <section className="animate-fade-up delay-75">
          <div className="flex items-center justify-between mb-3">
            <p className="text-eyebrow font-semibold text-muted-foreground uppercase tracking-[0.14em]">
              SNS 태그
            </p>
            <div className="flex items-center gap-3">
              <span className="text-caption text-muted-foreground/70 tabular-nums">
                {ocrInfo.tags.length}/20
              </span>
              <button
                onClick={handleTagsCopy}
                disabled={!ocrInfo.tags.length}
                className="flex items-center gap-1 text-caption text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
              >
                {tagsCopied ? <Check size={11} /> : <Copy size={11} />}
                {tagsCopied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap gap-1.5">
              {ocrInfo.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15 text-caption font-medium text-primary"
                >
                  {tag}
                  <button
                    onClick={() => handleTagDelete(idx)}
                    className="text-primary/40 hover:text-primary transition-colors ml-0.5"
                    aria-label="태그 삭제"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}

              {addingTag ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5">
                  <Hash size={10} className="text-primary/60 shrink-0" />
                  <input
                    ref={tagInputRef}
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onBlur={handleTagAdd}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTagAdd();
                      if (e.key === "Escape") { setAddingTag(false); setNewTagInput(""); }
                    }}
                    placeholder="태그 입력"
                    className="text-caption font-medium bg-transparent outline-none w-16 text-primary placeholder:text-muted-foreground/50"
                  />
                </span>
              ) : ocrInfo.tags.length < 20 ? (
                <button
                  onClick={() => setAddingTag(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border text-caption text-muted-foreground/70 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus size={10} />
                  추가
                </button>
              ) : null}

              {ocrInfo.tags.length === 0 && !addingTag && (
                <span className="text-caption text-muted-foreground/50 py-0.5">
                  태그가 없습니다
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Short-form Captions ── */}
        {(reviewMap.captions?.length ?? 0) > 0 && (
          <section className="animate-fade-up delay-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Video size={11} className="text-muted-foreground" strokeWidth={1.8} />
                <p className="text-eyebrow font-semibold text-muted-foreground uppercase tracking-[0.14em]">
                  숏폼 자막 추천
                </p>
              </div>
              <button
                onClick={handleAllCaptionsCopy}
                disabled={!reviewMap.captions?.length}
                className="flex items-center gap-1 text-caption text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
              >
                {captionsCopied ? <Check size={11} /> : <Copy size={11} />}
                {captionsCopied ? "복사됨" : "전체 복사"}
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {(reviewMap.captions ?? []).map((caption, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < (reviewMap.captions?.length ?? 0) - 1 ? "border-b border-hairline" : ""
                  } ${regenerating ? "opacity-40" : ""}`}
                >
                  <span className="text-eyebrow font-serif text-muted-foreground/60 tabular-nums w-4 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-meta font-medium text-foreground leading-snug">
                    {regenerating ? "자막을 생성하고 있어요..." : caption}
                  </span>
                  <button
                    onClick={() => handleCaptionCopy(caption, idx)}
                    disabled={regenerating}
                    className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors p-1 disabled:opacity-30"
                    aria-label="자막 복사"
                  >
                    {copiedCaptionIdx === idx ? (
                      <Check size={12} className="text-primary" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Review Tabs ── */}
        <section className="flex-1 animate-fade-up delay-150">
          <p className="text-eyebrow font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-3">
            AI 생성 리뷰
          </p>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as ReviewType);
              setEditingReview(false);
            }}
          >
            <TabsList className="w-full mb-3 bg-muted/40 p-1 rounded-lg h-auto border border-hairline">
              {(["short", "medium", "detail"] as ReviewType[]).map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="flex-1 rounded-md py-2 transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border"
                >
                  <span className="text-meta font-semibold">{tabLabel[t]}</span>
                  <span className="text-eyebrow text-muted-foreground ml-1 font-normal hidden sm:inline">
                    {tabDesc[t]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {(["short", "medium", "detail"] as ReviewType[]).map((t) => (
              <TabsContent key={t} value={t} className="mt-0">
                <div className={`rounded-xl overflow-hidden border transition-all ${
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
                        className="w-full px-4 pt-4 pb-2 text-body-lg leading-[1.78] resize-none min-h-[110px] bg-transparent outline-none font-sans"
                        autoFocus
                      />
                    ) : (
                      <p className="px-4 pt-4 pb-2 text-body-lg leading-[1.78] text-foreground/88">
                        {regenerating ? "새 리뷰를 생성하고 있어요..." : reviewMap[t]}
                      </p>
                    )}
                  </div>

                  {/* Footer bar */}
                  <div className="px-4 py-2.5 border-t border-hairline bg-muted/15 flex items-center justify-between">
                    <span className="text-caption text-muted-foreground tabular-nums">
                      {regenerating ? "—" : `${reviewMap[t].length}자`}
                    </span>
                    <button
                      onClick={() => setEditingReview(!editingReview)}
                      className="flex items-center gap-1 text-caption text-muted-foreground hover:text-primary transition-colors"
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
      <div className="sticky bottom-0 bg-background/92 backdrop-blur-xl border-t border-hairline px-4 py-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleCopy}
            disabled={regenerating}
            className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-body-lg font-semibold transition-all duration-300 disabled:opacity-50 ${
              copied
                ? "bg-foreground text-background"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
            }`}
          >
            {copied ? (
              <>
                <Check size={18} strokeWidth={2.5} />
                클립보드에 복사됐어요
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2} />
                {tabLabel[tab]} 리뷰 복사하기
              </>
            )}
          </button>
          <p className="text-center text-eyebrow text-muted-foreground/65 mt-2.5">
            복사 시 히스토리에 자동 저장됩니다
          </p>
        </div>
      </div>

    </div>
  );
}
