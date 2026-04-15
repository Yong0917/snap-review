import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { generateContentWithFallback, isRetryableQuotaError } from "@/lib/gemini";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

export async function POST(request: NextRequest) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const body = await request.json() as {
      extractedInfo: ExtractedInfo;
      previousReviews: GeneratedReviews;
    };

    const { extractedInfo, previousReviews } = body;

    if (!extractedInfo?.subjectName) {
      return NextResponse.json({ error: "사진 정보가 없습니다." }, { status: 400 });
    }

    const previousCaptions = Array.isArray(previousReviews.captions) ? previousReviews.captions : [];

    const prompt = `다음 이미지 정보를 바탕으로 이전 리뷰와 완전히 다른 새로운 리뷰를 작성해주세요.
아래 JSON 형식으로만 응답해주세요. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.

이미지 정보:
- 핵심 대상: ${extractedInfo.subjectName}
- 카테고리: ${extractedInfo.category}
- 주요 특징: ${extractedInfo.keyDetails}
- 분위기/맥락: ${extractedInfo.moodAndContext}

이전 리뷰 (반드시 다른 관점으로 작성):
- 짧게: ${previousReviews.short}
- 보통: ${previousReviews.medium}
- 상세: ${previousReviews.detail}

이전 자막 (반드시 다른 표현으로 작성):
${previousCaptions.map((c, i) => `- ${i + 1}: ${c}`).join("\n")}

응답 형식:
{
  "short": "새로운 한국어 리뷰 (40~60자)",
  "medium": "새로운 한국어 리뷰 (80~120자)",
  "detail": "새로운 한국어 리뷰 (150~250자)",
  "captions": [
    "숏폼 영상 한 줄 자막 - 친근하고 편한 말투 (15~30자)",
    "숏폼 영상 한 줄 자막 - 감탄·감동형 (15~30자)",
    "숏폼 영상 한 줄 자막 - 궁금증 유발 질문형 (15~30자)",
    "숏폼 영상 한 줄 자막 - 정보·팁 전달형 (15~30자)",
    "숏폼 영상 한 줄 자막 - 유머·트렌드형 (15~30자)"
  ]
}

규칙:
- 이전 리뷰와 다른 표현, 다른 관점, 다른 감성으로 작성
- 음식, 제품, 공간, 소품 등 어떤 사진에도 어울리게 자연스럽게 작성
- 절대 금지 표현: "강추", "최고예요", "완벽한", "환상적인", "놀라운", "강력 추천", "대박", "레전드", 광고 카피 같은 과장 표현
- 권장: 구어체, 개인 경험 서술, 구체적 묘사 ("생각보다", "다음에 또", "솔직히", "처음엔", "의외로" 등)
- 자막은 5개, 각 15~30자 이내, 서로 다른 톤으로 작성
- captions 배열은 정확히 5개`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const geminiPromise = generateContentWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("TIMEOUT")), 15000);
    });
    const { model, response } = await Promise.race([geminiPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    console.info(`[/api/regenerate] generated with ${model}`);

    const rawText = response.text ?? "";
    const jsonMatch = rawText.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "리뷰 생성에 실패했습니다." }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const reviews: GeneratedReviews = {
      short: parsed.short ?? "리뷰를 생성하지 못했습니다.",
      medium: parsed.medium ?? "리뷰를 생성하지 못했습니다.",
      detail: parsed.detail ?? "리뷰를 생성하지 못했습니다.",
      captions: Array.isArray(parsed.captions) ? parsed.captions.slice(0, 5) : [],
    };

    return NextResponse.json({ reviews });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[/api/regenerate]", err);
    if (err instanceof Error) {
      if (err.message === "TIMEOUT") {
        return NextResponse.json({ error: "처리 시간이 초과되었습니다. 다시 시도해주세요." }, { status: 408 });
      }
      if (isRetryableQuotaError(err)) {
        return NextResponse.json({ error: "AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
      }
    }
    return NextResponse.json({ error: "리뷰 재생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
