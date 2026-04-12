import type { ExtractedInfo } from "@/types/receipt";

export const mockOcrSamples: ExtractedInfo[] = [
  {
    subjectName: "창가 자리의 카페 음료 세트",
    category: "음식/카페",
    keyDetails: "아이스 아메리카노, 라떼, 따뜻한 우드 톤 테이블, 자연광",
    moodAndContext: "가볍게 수다 떨거나 작업하기 좋은 차분한 카페 분위기",
    tags: ["#카페", "#아메리카노", "#라떼", "#카페투어", "#커피스타그램", "#카페추천", "#감성카페", "#브런치카페", "#주말카페", "#작업카페"],
  },
  {
    subjectName: "화이트 기계식 키보드 데스크셋업",
    category: "전자기기/데스크",
    keyDetails: "화이트 배열, LED 백라이트, 깔끔한 책상 정리, 미니멀 무드",
    moodAndContext: "집중해서 작업하거나 게임하기 좋은 정돈된 셋업 느낌",
    tags: ["#데스크셋업", "#기계식키보드", "#미니멀", "#홈오피스", "#책상인테리어", "#키보드", "#셋업투어", "#화이트셋업", "#게이밍", "#작업환경"],
  },
  {
    subjectName: "딸기 크림이 올라간 디저트 접시",
    category: "디저트",
    keyDetails: "부드러운 크림, 선명한 딸기 토핑, 플레이팅, 달콤한 비주얼",
    moodAndContext: "기분 전환용으로 즐기기 좋은 달콤하고 화사한 분위기",
    tags: ["#디저트", "#딸기케이크", "#달달한것", "#디저트스타그램", "#카페디저트", "#플레이팅", "#딸기", "#크림케이크", "#甜点", "#dessert"],
  },
];

export function getRandomMockOcr(): { info: ExtractedInfo; index: number } {
  const index = Math.floor(Math.random() * mockOcrSamples.length);
  return { info: mockOcrSamples[index], index };
}
