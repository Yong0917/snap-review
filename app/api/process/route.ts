import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import { createServerClient } from "@/lib/supabase/server";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

const PROMPT = `다음 영수증 이미지를 분석하여 아래 JSON 형식으로만 응답해주세요. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.

{
  "extracted": {
    "storeName": "가게 상호명",
    "date": "구매 날짜 (YYYY.MM.DD 형식)",
    "items": "주문 상품명들 (쉼표로 구분, 최대 3개)",
    "total": "총 결제 금액 (예: 12,500원)"
  },
  "reviews": {
    "short": "실제 방문 고객 관점의 자연스러운 한국어 리뷰 (40~60자)",
    "medium": "실제 방문 고객 관점의 자연스러운 한국어 리뷰 (80~120자)",
    "detail": "실제 방문 고객 관점의 자연스러운 한국어 리뷰 (150~250자)"
  }
}

규칙:
- 리뷰는 네이버·카카오맵·구글에 바로 올릴 수 있도록 자연스럽게 작성
- 영수증 정보(가게명, 메뉴, 금액)를 최대한 활용
- 영수증이 아닌 이미지라면 extracted의 storeName을 빈 문자열로 반환`;

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

    // 2. Gemini Vision으로 OCR + 리뷰 생성
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
        { error: "영수증을 인식하지 못했습니다. 더 선명한 사진으로 다시 시도해주세요." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const extracted: ExtractedInfo = parsed.extracted;
    const reviews: GeneratedReviews = parsed.reviews;

    if (!extracted?.storeName) {
      return NextResponse.json(
        { error: "영수증 정보를 읽을 수 없습니다. 영수증 사진인지 확인해주세요." },
        { status: 422 }
      );
    }

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
