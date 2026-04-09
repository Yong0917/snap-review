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
      <div className={`rounded-2xl overflow-hidden border bg-card shadow-sm transition-all duration-200 ${
        open
          ? "border-primary/25 shadow-md shadow-primary/8"
          : "border-border hover:border-primary/20 hover:shadow-md hover:shadow-black/5"
      }`}>

        {/* Card header button */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-4 flex items-start gap-3 text-left"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mt-0.5">
            <Camera size={16} className="text-primary" strokeWidth={1.8} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-[13.5px] truncate text-foreground">{item.title}</span>
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/12">
                {TAB_LABELS[item.activeReview]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Clock size={10} />
              <span>{timeAgo(item.createdAt)}</span>
              <span className="opacity-50">·</span>
              <span className="truncate">{item.category}</span>
            </div>
            {!open && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 leading-relaxed">
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
          <div className="border-t border-border/50">
            {/* Mini tab bar */}
            <div className="flex border-b border-border/50">
              {(["short", "medium", "detail"] as ReviewLength[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === t
                      ? "text-primary border-b-2 border-primary bg-primary/4"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="receipt-lines bg-card px-4 py-4">
              <p className="text-[13.5px] leading-[1.78] text-foreground/88">
                {item.reviews[activeTab]}
              </p>
            </div>

            <div className="px-4 pb-4 pt-2.5 flex gap-2 bg-muted/10">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                }`}
              >
                {copied ? (
                  <><Check size={14} /> 복사됨!</>
                ) : (
                  <><Copy size={13} /> 복사하기</>
                )}
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-[300px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">리뷰를 삭제할까요?</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-semibold text-foreground">{item.title}</span>의
              리뷰가 히스토리에서 사라집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition-all"
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
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
        <div className="max-w-md mx-auto px-5 h-[58px] flex items-center justify-between">
          <h1
            className="font-serif font-bold text-xl"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            히스토리
          </h1>
          {items.length > 0 && (
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/15 px-2.5 py-1 rounded-full tabular-nums">
              {items.length}개
            </span>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">

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
            {/* Empty state illustration */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-3xl bg-primary/8 border border-primary/12" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <ImageIcon size={32} className="text-muted-foreground/30" strokeWidth={1.5} />
                  <Clock
                    size={14}
                    className="absolute -bottom-1 -right-1 text-primary/50"
                    strokeWidth={2}
                  />
                </div>
              </div>
              {/* Decorative dots */}
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/25" />
              <div className="absolute bottom-3 left-2 w-1 h-1 rounded-full bg-primary/20" />
            </div>

            <h2
              className="font-serif font-bold text-[1.15rem] mb-2"
              style={{ fontFamily: "var(--font-gowun)" }}
            >
              아직 리뷰가 없어요
            </h2>
            <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
              업로드한 사진으로 만든 리뷰가<br />여기에 저장됩니다
            </p>
            <Link
              href="/"
              className="flex items-center gap-2 text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/20"
              style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 80%, oklch(0.7 0.15 50)))" }}
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
