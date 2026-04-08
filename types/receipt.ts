export interface ExtractedInfo {
  storeName: string;
  date: string;
  items: string;
  total: string;
}

export type ReviewLength = "short" | "medium" | "detail";

export interface GeneratedReviews {
  short: string;
  medium: string;
  detail: string;
}

export interface ReviewHistory {
  id: string;
  storeName: string;
  date: string;
  reviews: GeneratedReviews;
  activeReview: ReviewLength;
  createdAt: string; // ISO string
  sessionId?: string | null;
}
