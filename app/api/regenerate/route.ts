import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      extractedInfo: ExtractedInfo;
      previousReviews: GeneratedReviews;
    };

    const { extractedInfo, previousReviews } = body;

    if (!extractedInfo?.subjectName) {
      return NextResponse.json({ error: "사진 정보가 없습니다." }, { status: 400 });
    }

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

응답 형식:
{
  "short": "새로운 한국어 리뷰 (40~60자)",
  "medium": "새로운 한국어 리뷰 (80~120자)",
  "detail": "새로운 한국어 리뷰 (150~250자)"
}

규칙:
- 이전 리뷰와 다른 표현, 다른 관점, 다른 감성으로 작성
- 음식, 제품, 공간, 소품 등 어떤 사진에도 어울리게 자연스럽게 작성
- 네이버·카카오맵·구글에 바로 올릴 수 있도록 자연스럽게`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 15000)
    );
    const response = await Promise.race([geminiPromise, timeoutPromise]);

    const rawText = response.text ?? "";
    const jsonMatch = rawText.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "리뷰 생성에 실패했습니다." }, { status: 422 });
    }

    const reviews: GeneratedReviews = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[/api/regenerate]", err);
    if (err instanceof Error) {
      if (err.message === "TIMEOUT") {
        return NextResponse.json({ error: "처리 시간이 초과되었습니다. 다시 시도해주세요." }, { status: 408 });
      }
      if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
        return NextResponse.json({ error: "AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
      }
    }
    return NextResponse.json({ error: "리뷰 재생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
