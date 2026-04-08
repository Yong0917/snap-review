import { create } from "zustand";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

export type ProcessingStatus = "idle" | "processing" | "done" | "error";
export type ProcessingStep = 0 | 1 | 2;

interface ReceiptState {
  imageFile: File | null;
  imagePreviewUrl: string | null;
  status: ProcessingStatus;
  currentStep: ProcessingStep;
  extractedInfo: ExtractedInfo | null;
  reviews: GeneratedReviews | null;
  sessionId: string | null;
  errorMessage: string | null;

  setImageFile: (file: File) => void;
  setStatus: (status: ProcessingStatus) => void;
  setCurrentStep: (step: ProcessingStep) => void;
  setResult: (info: ExtractedInfo, reviews: GeneratedReviews, sessionId?: string | null) => void;
  updateReviews: (reviews: GeneratedReviews) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const initialState = {
  imageFile: null,
  imagePreviewUrl: null,
  status: "idle" as ProcessingStatus,
  currentStep: 0 as ProcessingStep,
  extractedInfo: null,
  reviews: null,
  sessionId: null,
  errorMessage: null,
};

export const useReceiptStore = create<ReceiptState>((set) => ({
  ...initialState,

  setImageFile: (file) => {
    const url = URL.createObjectURL(file);
    set({ imageFile: file, imagePreviewUrl: url, status: "processing" });
  },

  setStatus: (status) => set({ status }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setResult: (extractedInfo, reviews, sessionId = null) =>
    set({ extractedInfo, reviews, sessionId, status: "done" }),

  updateReviews: (reviews) => set({ reviews }),

  setError: (errorMessage) => set({ errorMessage, status: "error" }),

  reset: () =>
    set((state) => {
      if (state.imagePreviewUrl) {
        URL.revokeObjectURL(state.imagePreviewUrl);
      }
      return initialState;
    }),
}));
