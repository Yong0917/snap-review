export interface ExtractedInfo {
  subjectName: string;
  category: string;
  keyDetails: string;
  moodAndContext: string;
  tags: string[];
}

export type ReviewLength = "short" | "medium" | "detail";

export interface GeneratedReviews {
  short: string;
  medium: string;
  detail: string;
}

export interface ReviewHistory {
  id: string;
  title: string;
  category: string;
  reviews: GeneratedReviews;
  activeReview: ReviewLength;
  createdAt: string; // ISO string
  sessionId?: string | null;
}
