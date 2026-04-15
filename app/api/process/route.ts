import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import { createServerClient } from "@/lib/supabase/server";
import { generateContentWithFallback, isRetryableQuotaError } from "@/lib/gemini";
import type { ExtractedInfo, GeneratedReviews } from "@/types/receipt";

const PROMPT = `다음 이미지를 분석하여 아래 JSON 형식으로만 응답해주세요. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.

{
  "extracted": {
    "subjectName": "사진의 핵심 대상, 장소, 음식, 제품명 또는 장면 이름",
    "category": "음식/카페, 디저트, 공간, 전자기기, 패션, 뷰티, 라이프스타일 등 간단한 분류",
    "keyDetails": "사진에서 눈에 띄는 특징 2~4개를 쉼표로 구분",
    "moodAndContext": "사진의 분위기, 사용감, 상황을 한 문장으로 요약",
    "tags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8", "#태그9", "#태그10", "#태그11", "#태그12", "#태그13", "#태그14", "#태그15", "#태그16", "#태그17", "#태그18", "#태그19", "#태그20"]
  },
  "reviews": {
    "short": "진짜 SNS 이용자가 직접 쓴 것 같은 솔직한 후기 (40~60자)",
    "medium": "진짜 SNS 이용자가 직접 쓴 것 같은 솔직한 후기 (80~120자)",
    "detail": "진짜 SNS 이용자가 직접 쓴 것 같은 솔직한 후기 (150~250자)"
  },
  "captions": [
    "숏폼 영상 한 줄 자막 - 친근하고 편한 말투 (15~30자)",
    "숏폼 영상 한 줄 자막 - 감탄·감동형 (15~30자)",
    "숏폼 영상 한 줄 자막 - 궁금증 유발 질문형 (15~30자)",
    "숏폼 영상 한 줄 자막 - 정보·팁 전달형 (15~30자)",
    "숏폼 영상 한 줄 자막 - 유머·트렌드형 (15~30자)"
  ]
}

규칙:
- 음식, 공간, 제품, 소품, 디저트, 데스크셋업 등 어떤 사진이든 리뷰를 작성
- 보이는 정보만 바탕으로 작성하고, 확인할 수 없는 브랜드명이나 가격은 지어내지 말 것
- 대상이 명확하지 않더라도 가장 핵심으로 보이는 장면 기준으로 subjectName을 작성할 것
- tags는 사진 대상·분위기·카테고리를 반영한 SNS용 해시태그 정확히 20개 (# 포함, 공백 없이)
- tags는 네이버·카카오·인스타그램에 바로 붙여넣을 수 있도록 자연스러운 한국어 태그로 작성 (영문 혼용 가능)
- 영수증, 계산서, 카드전표 이미지인 경우: 영수증 자체나 결제 내역이 아닌, 구매한 상품명 또는 방문한 가게/식당을 리뷰 대상(subjectName)으로 삼을 것
- 영수증, 계산서, 카드전표 이미지인 경우: keyDetails는 메뉴명·상품명·수량 위주로, moodAndContext는 방문/구매 상황을 추정해서 작성할 것. 금액·카드번호·날짜는 언급하지 말 것

리뷰 작성 규칙 (중요):
- 절대 금지 표현: "강추", "최고예요", "완벽한", "환상적인", "놀라운", "강력 추천", "대박", "레전드", "인생 OOO", 광고 카피 같은 과장 표현
- 권장: 구어체, 개인 경험 서술, 구체적 묘사 ("생각보다", "다음에 또", "솔직히", "처음엔", "의외로" 등)
- 실제 후기처럼 담담하고 솔직하게, 한 사람의 개인적인 경험담처럼 작성

숏폼 자막 작성 규칙:
- 각 자막은 15~30자 이내의 짧은 한 줄
- 5개가 서로 다른 톤과 방식으로 작성되어야 함 (친근체 / 감탄형 / 질문형 / 정보형 / 유머·트렌드형)
- 영상에서 첫 3초 안에 시청자를 잡아끌 수 있는 후킹력 있는 문구로 작성
- captions 배열은 정확히 5개`;



export async function POST(request: NextRequest) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
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

    const geminiPromise = generateContentWithFallback(ai, {
      contents: [{ role: "user", parts: [imagePart, { text: PROMPT }] }],
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("TIMEOUT")), 15000);
    });
    const { model, response } = await Promise.race([geminiPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    console.info(`[/api/process] generated with ${model}`);

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
      tags: Array.isArray(parsed.extracted?.tags) ? parsed.extracted.tags.slice(0, 20) : [],
    };
    const reviews: GeneratedReviews = {
      short: parsed.reviews?.short ?? "리뷰를 생성하지 못했습니다.",
      medium: parsed.reviews?.medium ?? "리뷰를 생성하지 못했습니다.",
      detail: parsed.reviews?.detail ?? "리뷰를 생성하지 못했습니다.",
      captions: Array.isArray(parsed.captions) ? parsed.captions.slice(0, 5) : [],
    };

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
    clearTimeout(timeoutId);
    console.error("[/api/process]", err);
    if (err instanceof Error) {
      if (err.message === "TIMEOUT") {
        return NextResponse.json(
          { error: "처리 시간이 초과되었습니다. 다시 시도해주세요." },
          { status: 408 }
        );
      }
      if (isRetryableQuotaError(err)) {
        return NextResponse.json(
          { error: "AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }
    }
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
