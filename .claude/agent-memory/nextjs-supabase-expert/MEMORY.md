# 프로젝트 메모리 (nextjs-supabase-expert)

## 인증 라우트 (구현 완료)

- `/auth/login` - 이메일/비밀번호 + Google OAuth 로그인
- `/auth/sign-up` - 이메일/비밀번호 + Google OAuth 회원가입
- `/auth/callback` - OAuth 인가 코드 교환 Route Handler (신규)
- `/auth/confirm` - 이메일 OTP 확인
- `/auth/forgot-password` - 비밀번호 찾기
- `/auth/update-password` - 비밀번호 변경
- `/auth/sign-up-success` - 회원가입 성공 페이지
- `/auth/error` - 인증 에러 페이지

## Google OAuth 구현 패턴

- `app/auth/callback/route.ts`: exchangeCodeForSession + NextResponse.redirect (쿠키 세팅 필요)
- 오픈 리다이렉트 방지: `next` 파라미터가 `/`로 시작하는지 검증
- 환경 분기: 개발(origin), 프로덕션+프록시(x-forwarded-host), 프로덕션(origin)
- 클라이언트에서 `signInWithOAuth({ provider: 'google', options: { redirectTo: .../auth/callback } })`
- OAuth 성공 시 isLoading을 false로 설정하지 않음 (리다이렉트로 페이지 이탈)

## 주요 컴포넌트

- `components/login-form.tsx` - handleGoogleLogin 포함
- `components/sign-up-form.tsx` - handleGoogleSignUp 포함
- Google SVG 아이콘 인라인으로 삽입 (lucide-react에 Google 아이콘 없음)

## Supabase Storage (event-images 버킷, 구현 완료)

- 버킷: `event-images` (공개, 5MB, jpeg/png/webp/gif)
- 업로드 경로: `{userId}/{randomUUID}.{ext}`
- Storage 유틸: `lib/supabase/storage.ts` (uploadEventImage, deleteEventImage, validateImageFile)
- events 테이블에 `cover_image_url text DEFAULT NULL` 컬럼 추가됨
- next.config.ts에 `*.supabase.co` remotePatterns 추가
- EventForm에 `userId` prop 필수

## Phase 3: 공지 + 댓글 기능 (구현 완료)

### 라우트 구조
- `/events/[id]/announcements` - 공지 목록 (승인 멤버 열람)
- `/events/[id]/announcements/new` - 공지 작성 (주최자 전용)
- `/events/[id]/announcements/[announcementId]` - 공지 상세 + 댓글
- `/events/[id]/announcements/[announcementId]/edit` - 공지 수정 (주최자 전용)

### 핵심 파일
- `app/(protected)/events/[id]/announcements/schemas.ts` - Zod 스키마 + 타입 정의
- `app/(protected)/events/[id]/announcements/actions.ts` - 7개 서버 액션
- `components/events/announcements/` - 6개 컴포넌트

### Supabase 조인 주의사항
- `from("table").select("*, related_table(field)")` 조인 결과는 배열 또는 단일 객체로 타입이 잘못 추론될 수 있음
- FK가 없는 author_id → profiles join은 별도 `.in()` 쿼리로 처리 (JavaScript에서 조립)
- 조인 타입 오류 시 별도 쿼리로 분리하는 것이 안전

### 접근 제어 패턴
- host: 모든 권한
- participant(approved): 열람 + 댓글 작성 + 본인 댓글 삭제
- participant(pending/rejected/cancelled): 안내 메시지 표시
- none: 이벤트 상세 페이지로 redirect

## 주의사항

- validate 실행 시 `.claude/` 디렉토리 Prettier 경고 발생 → `.prettierignore`에 `.claude/` 추가로 해결
- `app/(protected)/events/page.tsx` 76번째 줄 `item.events` → `item.event` 오타 수정 (기존 버그)
