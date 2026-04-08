import type { ExtractedInfo } from "@/types/receipt";

export const mockOcrSamples: ExtractedInfo[] = [
  {
    storeName: "스타벅스 강남역점",
    date: "2026.04.08",
    items: "아메리카노 Tall, 카페라떼 Grande",
    total: "12,500원",
  },
  {
    storeName: "맥도날드 홍대입구점",
    date: "2026.04.08",
    items: "빅맥 세트, 맥너겟 6조각",
    total: "14,200원",
  },
  {
    storeName: "올리브영 명동점",
    date: "2026.04.08",
    items: "라네즈 크림 스킨, 아이섀도우 팔레트",
    total: "38,900원",
  },
];

export function getRandomMockOcr(): { info: ExtractedInfo; index: number } {
  const index = Math.floor(Math.random() * mockOcrSamples.length);
  return { info: mockOcrSamples[index], index };
}
