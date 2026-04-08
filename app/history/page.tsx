"use client";

import { useState, useEffect } from "react";
import { Copy, Trash2, Check, ChevronDown, Camera, Clock } from "lucide-react";
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
      <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">

        {/* Card header button */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-3.5 flex items-start gap-3 text-left"
        >
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
            <Camera size={16} className="text-primary" strokeWidth={1.8} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-[13.5px] truncate">{item.storeName}</span>
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                {TAB_LABELS[item.activeReview]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={10} />
              <span>{timeAgo(item.createdAt)}</span>
              <span>·</span>
              <span>{item.date}</span>
            </div>
            {!open && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 leading-relaxed">
                {item.reviews[item.activeReview]}
              </p>
            )}
          </div>

          <ChevronDown
            size={16}
            className={`shrink-0 text-muted-foreground mt-1 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expanded content */}
        {open && (
          <div className="border-t border-border/60">
            {/* Mini tab bar */}
            <div className="flex border-b border-border/60 bg-muted/30">
              {(["short", "medium", "detail"] as ReviewLength[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    activeTab === t
                      ? "text-primary border-b-2 border-primary bg-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="receipt-lines bg-card/50 px-4 py-3.5">
              <p className="text-[13.5px] leading-[1.75] text-foreground/90">
                {item.reviews[activeTab]}
              </p>
            </div>

            <div className="px-4 pb-3.5 pt-2 flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                }`}
              >
                {copied ? (
                  <><Check size={14} /> 복사됨!</>
                ) : (
                  <><Copy size={14} /> 복사하기</>
                )}
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <Trash2 size={14} />
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
              <span className="font-semibold text-foreground">{item.storeName}</span>의
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
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground py-2.5 text-sm font-semibold hover:bg-destructive/90 transition-colors"
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
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-md mx-auto px-5 h-[58px] flex items-center justify-between">
          <h1
            className="font-serif font-bold text-xl"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            히스토리
          </h1>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {items.length}개의 리뷰
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
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5 receipt-lines">
              <Clock size={28} className="text-muted-foreground/40" />
            </div>
            <h2 className="font-serif font-bold text-lg mb-1.5">
              아직 리뷰가 없어요
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              영수증을 찍으면 리뷰가 여기에 저장됩니다
            </p>
            <Link
              href="/"
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              <Camera size={16} strokeWidth={2} />
              영수증 업로드하기
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
