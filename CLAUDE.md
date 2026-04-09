# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

@AGENTS.md

## 명령어

```bash
npm run dev      # 개발 서버 시작 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npm start        # 프로덕션 서버 시작
```

테스트 러너는 설정되어 있지 않습니다.

## 환경 변수

`.env.local`에 필요한 값:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## 아키텍처

**SnapReview**는 모바일 우선 앱으로, 사용자가 사진을 업로드하면 Gemini Vision이 짧게/보통/상세 3가지 한국어 리뷰를 생성해 네이버·카카오·구글 등 플랫폼에 바로 붙여넣을 수 있게 해줍니다.

### 사용자 흐름

`/` (업로드) → `/processing` (API 호출 + 단계 애니메이션) → `/result` (리뷰 복사/재생성) → `/history` (localStorage에 저장된 과거 리뷰)

### 상태 관리

Zustand 스토어 2개:
- `store/receipt.ts` — 현재 세션 (이미지 파일, 처리 상태, 추출 정보, 생성된 리뷰, sessionId). 새 업로드 시 초기화.
- `store/history.ts` — `lib/storage.ts`를 통해 `localStorage`에 저장되는 리뷰 이력 (최대 50개, 키: `review_history`).

상태는 단방향으로 흐릅니다: 홈에서 `imageFile` 설정 → processing 페이지에서 API 호출 → result 페이지에서 `extractedInfo` + `reviews` 읽기.

### API 라우트

- `POST /api/process` — `multipart/form-data`의 `image` 필드를 받아 Supabase Storage 버킷 `receipts`에 업로드하고, Gemini 2.5 Flash로 이미지 분석 + 구조화된 JSON 프롬프트 실행 후 `receipt_sessions` 테이블에 저장. `{ sessionId, extractedInfo, reviews }` 반환. 타임아웃 15초.
- `POST /api/regenerate` — `{ extractedInfo, previousReviews }` JSON을 받아 다른 관점의 새 리뷰를 Gemini로 재생성. DB 저장 없음. 타임아웃 15초.

### 주요 라이브러리 및 패턴

- **Gemini**: `@google/genai`, 모델 `gemini-2.5-flash`. 프롬프트는 순수 JSON만 반환하도록 지시. 코드 블록 제거 후 정규식 `/\{[\s\S]*\}/`으로 JSON 추출.
- **이미지 전처리** (`lib/image-utils.ts`): 클라이언트 전용. `heic2any`로 HEIC/HEIF → JPEG 변환 후 캔버스에서 최대 1600px·품질 0.85로 리사이즈.
- **Supabase 클라이언트**: `lib/supabase/client.ts` (브라우저용), `lib/supabase/server.ts` (API 라우트용, `createServerClient()` 사용).
- **경로 별칭**: `@/`는 프로젝트 루트를 가리킵니다.

### 타입

핵심 타입은 모두 `types/receipt.ts`에 정의: `ExtractedInfo`, `GeneratedReviews`, `ReviewHistory`, `ReviewLength`.

### Next.js 버전 주의

이 프로젝트는 **Next.js 16.2.2**와 **React 19**를 사용합니다. 훈련 데이터와 API·컨벤션이 다를 수 있으므로, App Router나 서버 컴포넌트 코드를 작성하기 전에 `node_modules/next/dist/docs/`를 반드시 확인하세요.

## 코드 수정 후 검증 규칙

파일을 수정한 후에는 반드시 아래 순서로 검증한다:

1. `npm run lint` — lint 오류 확인 및 수정
2. `npm run build` — 빌드 성공 여부 확인

오류가 있으면 수정 후 다시 검증한다.