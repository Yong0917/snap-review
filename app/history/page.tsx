"use client";

import { useState, useEffect } from "react";
import { Copy, Trash2, Check, ChevronDown, Camera, Clock, ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useHistoryStore } from "@/store/history";
import type { ReviewHistory, ReviewLength } from "@/types/receipt";

const TAB_LABELS: Record<ReviewLength, string> = {
  short: "짧게",
  medium: "보통",
  detail: "상세",
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function HistoryCard({ item, onDelete }: { item: ReviewHistory; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewLength>(item.activeReview);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.reviews[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("복사됐어요!");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    onDelete();
    setShowDelete(false);
    toast.success("리뷰가 삭제됐어요.");
  };

  return (
    <>
      <div className={`rounded-xl overflow-hidden border bg-card transition-colors duration-200 ${
        open ? "border-primary/40" : "border-border hover:border-primary/25"
      }`}>

        {/* Card header button */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-4 flex items-start gap-3 text-left"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mt-0.5">
            <Camera size={16} className="text-primary" strokeWidth={1.7} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-meta truncate text-foreground">{item.title}</span>
              <span className="shrink-0 text-eyebrow px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                {TAB_LABELS[item.activeReview]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <Clock size={10} strokeWidth={1.8} />
              <span>{timeAgo(item.createdAt)}</span>
              <span className="opacity-50">·</span>
              <span className="truncate">{item.category}</span>
            </div>
            {!open && (
              <p className="text-caption text-muted-foreground mt-2 line-clamp-1 leading-[1.6]">
                {item.reviews[item.activeReview]}
              </p>
            )}
          </div>

          <ChevronDown
            size={15}
            className={`shrink-0 text-muted-foreground/60 mt-1.5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expanded content */}
        {open && (
          <div className="border-t border-hairline">
            {/* Mini tab bar */}
            <div className="flex border-b border-hairline">
              {(["short", "medium", "detail"] as ReviewLength[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 text-meta font-semibold transition-colors ${
                    activeTab === t
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="receipt-lines bg-card px-4 py-4">
              <p className="text-body-lg leading-[1.78] text-foreground/88">
                {item.reviews[activeTab]}
              </p>
            </div>

            <div className="px-4 pb-4 pt-2.5 flex gap-2 border-t border-hairline bg-muted/15">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-meta font-semibold transition-all ${
                  copied
                    ? "bg-foreground text-background"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                }`}
              >
                {copied ? (
                  <><Check size={14} /> 복사됨</>
                ) : (
                  <><Copy size={13} /> 복사하기</>
                )}
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
                aria-label="삭제"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-[300px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-title">리뷰를 삭제할까요?</DialogTitle>
            <DialogDescription className="text-meta">
              <span className="font-semibold text-foreground">{item.title}</span>의
              리뷰가 히스토리에서 사라집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 rounded-lg border border-border py-2.5 text-meta font-medium hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-destructive text-destructive-foreground py-2.5 text-meta font-semibold hover:opacity-90 transition-all"
            >
              삭제
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function HistoryPage() {
  const { items, loadFromStorage, removeItem } = useHistoryStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-hairline">
        <div className="max-w-md mx-auto px-5 h-[58px] flex items-center justify-between">
          <h1 className="font-sans font-semibold text-title tracking-tight">
            히스토리
          </h1>
          {items.length > 0 && (
            <span className="text-eyebrow font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full tabular-nums">
              {items.length}개
            </span>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5">

        {items.length > 0 ? (
          <div className="space-y-2.5 animate-fade-up">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onDelete={() => removeItem(item.id)}
              />
            ))}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-[62vh] text-center animate-fade-up">
            <div className="relative w-20 h-20 mb-7">
              <div className="absolute inset-0 rounded-2xl bg-muted border border-hairline" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <ImageIcon size={28} className="text-muted-foreground/40" strokeWidth={1.5} />
                  <Clock
                    size={12}
                    className="absolute -bottom-1 -right-1 text-primary/60"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </div>

            <h2 className="font-sans font-bold text-title mb-2 tracking-tight">
              아직 리뷰가 없어요
            </h2>
            <p className="text-meta text-muted-foreground mb-8 leading-[1.65]">
              업로드한 사진으로 만든 리뷰가<br />여기에 저장됩니다
            </p>
            <Link
              href="/"
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-meta font-semibold transition-all hover:bg-primary/90 active:scale-95"
            >
              <Camera size={15} strokeWidth={2} />
              사진 업로드하기
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
