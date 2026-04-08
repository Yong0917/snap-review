# 코드 리뷰어 메모리

## 프로젝트 개요
- Next.js 15 (App Router) + Supabase + Tailwind CSS v3 + shadcn/ui
- 패키지 매니저: npm
- TypeScript strict 모드 사용

## 주요 발견 패턴 및 안티패턴

### Supabase join 쿼리와 타입 불일치 (반복 주의)
- `select("*, events(*)")` 쿼리 결과 키는 테이블명 복수형 `events`로 반환됨
- 수동 타입 정의 시 `event` (단수)로 작성하면 타입 에러 발생
- `page.tsx:75`에서 `item.events` 사용, `ParticipatingEvent` 타입에는 `event` 선언 → TS 에러
- 해결: 타입 정의를 `events: Event` (복수)로 맞추거나, 쿼리를 `event:events(*)` alias로 변환

### Server Action 반환 타입 패턴
- `redirect()`는 `never`를 반환하므로 `Promise<{ error: string } | never>` 선언은 실제로 `Promise<{ error: string }>`과 동일
- 더 명확한 표현: `Promise<{ error: string }>` (createEvent, updateEvent)

### EventForm의 zodResolver 강제 캐스팅
- `resolver: zodResolver(EventFormSchema) as any` — Zod v4 + @hookform/resolvers 버전 불일치 시 발생
- 임시 우회책이므로 라이브러리 버전 확인 필요

### max_capacity 이중 변환 문제
- schemas.ts: `z.coerce.number()` (Zod가 string → number 변환)
- event-form.tsx `register("max_capacity", { setValueAs: (v) => v === "" ? undefined : Number(v) })`
- 두 곳에서 변환 처리 → 중복, `setValueAs`가 우선 적용되어 Zod coerce는 의미 없음

### 보안: cancelEvent의 응답 노출
- 에러 발생 시 `alert(result.error)` 사용 → toast/UI 컴포넌트로 교체 권장

### 미들웨어 동작 확인
- `/protected/*` 접근 시 미인증이면 `/auth/login` 리다이렉트 정상 작동 확인

## 아키텍처 결정사항
- schemas.ts는 `app/protected/events/` 하위에 위치 (클라이언트/서버 공용)
- Server Action에서 이중 인증 검증: getClaims() + host_id 비교
- EventForm은 action prop으로 Server Action을 받는 패턴 (재사용성 높음)
- Server Action에서 `redirect()`를 직접 호출하는 패턴 사용
