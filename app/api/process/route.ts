import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import { createServerClient } from "@/lib/supabase/server";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

const PROMPT = `다음 이미지를 분석하여 아래 JSON 형식으로만 응답해주세요. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.

{
  "extracted": {
    "subjectName": "사진의 핵심 대상, 장소, 음식, 제품명 또는 장면 이름",
    "category": "음식/카페, 디저트, 공간, 전자기기, 패션, 뷰티, 라이프스타일 등 간단한 분류",
    "keyDetails": "사진에서 눈에 띄는 특징 2~4개를 쉼표로 구분",
    "moodAndContext": "사진의 분위기, 사용감, 상황을 한 문장으로 요약"
  },
  "reviews": {
    "short": "실제 사용/방문/시식 후기를 떠올리게 하는 자연스러운 한국어 리뷰 (40~60자)",
    "medium": "실제 사용/방문/시식 후기를 떠올리게 하는 자연스러운 한국어 리뷰 (80~120자)",
    "detail": "실제 사용/방문/시식 후기를 떠올리게 하는 자연스러운 한국어 리뷰 (150~250자)"
  }
}

규칙:
- 음식, 공간, 제품, 소품, 디저트, 데스크셋업 등 어떤 사진이든 리뷰를 작성
- 보이는 정보만 바탕으로 작성하고, 확인할 수 없는 브랜드명이나 가격은 지어내지 말 것
- 대상이 명확하지 않더라도 가장 핵심으로 보이는 장면 기준으로 subjectName을 작성할 것
- 리뷰는 네이버·카카오·구글 후기처럼 자연스럽고 과장되지 않게 작성`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = (imageFile.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";

    // 1. Supabase Storage 업로드
    const supabase = createServerClient();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.jpg`;
    let imageUrl: string | null = null;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, buffer, { contentType: mimeType, cacheControl: "3600" });

    if (!uploadError) {
      imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;
    }

    // 2. Gemini Vision으로 이미지 분석 + 리뷰 생성
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const imagePart = createPartFromBase64(base64, mimeType);

    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [imagePart, { text: PROMPT }] }],
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 15000)
    );
    const response = await Promise.race([geminiPromise, timeoutPromise]);

    const rawText = response.text ?? "";

    // JSON 파싱 (마크다운 코드블록 제거 후 추출)
    const jsonMatch = rawText.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "이미지를 분석하지 못했습니다. 더 선명한 사진으로 다시 시도해주세요." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const extracted: ExtractedInfo = {
      subjectName: parsed.extracted?.subjectName ?? "사진 속 장면",
      category: parsed.extracted?.category ?? "기타",
      keyDetails: parsed.extracted?.keyDetails ?? "핵심 특징을 파악하지 못함",
      moodAndContext: parsed.extracted?.moodAndContext ?? "분위기 정보를 파악하지 못함",
    };
    const reviews: GeneratedReviews = parsed.reviews;

    // 3. DB에 세션 저장
    const { data: sessionData } = await supabase
      .from("receipt_sessions")
      .insert({ image_url: imageUrl, ocr_raw: rawText, extracted_info: extracted, generated_reviews: reviews })
      .select("id")
      .single();

    return NextResponse.json({
      sessionId: sessionData?.id ?? null,
      extractedInfo: extracted,
      reviews,
    });
  } catch (err) {
    console.error("[/api/process]", err);
    if (err instanceof Error) {
      if (err.message === "TIMEOUT") {
        return NextResponse.json(
          { error: "처리 시간이 초과되었습니다. 다시 시도해주세요." },
          { status: 408 }
        );
      }
      if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
        return NextResponse.json(
          { error: "AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }
    }
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
