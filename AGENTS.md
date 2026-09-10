# AGENTS.md

에이전트 작업 지침. 프로젝트 소개·설치 절차·기능 목록은 `README.md`에 있으므로 여기서 반복하지 않는다.

## Operational Commands

패키지 매니저는 **bun 고정**이다. `bun.lock`만 존재하므로 npm/yarn/pnpm을 쓰지 마라.

| 목적 | 명령어 |
|---|---|
| 의존성 설치 | `bun install` |
| 개발 (API + Vite 동시) | `bun run dev` |
| API 서버 단독 | `bun run server` |
| 타입체크 + 빌드 | `bun run build` |
| 린트 | `bun run lint` |
| 테스트 1회 | `bun run test` |
| 테스트 watch | `bun run test:watch` |

포트: Vite `5173`, API 서버 `3002`.

작업을 마치기 전 `bun run build`, `bun run lint`, `bun run test` 세 가지를 모두 통과시켜라. 단, 서버 코드에 대해서는 빌드 통과를 근거로 삼지 마라 (Hard Constraint 5 참조).

## Golden Rules

### Security Boundary

1. **API 키를 클라이언트로 내보내지 마라.** `/api/config`는 키의 존재 여부만 불리언으로 반환한다 (`server/index.ts:150-154`). 키 값 자체를 응답 본문·헤더에 싣지 마라.
2. **Google 호출 URL을 로그·에러 메시지에 출력하지 마라.** Google은 API 키를 쿼리스트링에 담는다 (`server/index.ts:99`). URL을 그대로 찍으면 키가 로그에 남는다.
3. `.env`는 gitignore 대상이다. 키를 코드·테스트 픽스처·커밋 메시지에 하드코딩하지 마라.
4. **이 서버는 로컬 전용이다.** CORS가 `Access-Control-Allow-Origin: '*'`이고 인증이 없다 (`server/index.ts:51-55`). 공개 배포하면 누구나 서버 `.env`의 키로 요청을 태울 수 있다. 배포·호스팅 작업을 요청받으면 이 제약을 먼저 알려라.

### Hard Constraint

5. **`server/`는 `bun run build`에서 타입체크되지 않는다.** `tsconfig.app.json`은 `include: ["src"]`, `tsconfig.node.json`은 `include: ["vite.config.ts"]`뿐이다. 검증: `bunx tsc -p tsconfig.app.json --listFiles | grep /server/` → 0건. 서버를 고쳤으면 `bun run test`와 실제 실행으로 확인하라.
6. **포트 3002는 두 곳에 하드코딩돼 있다.** `server/index.ts:139`의 `Bun.serve({ port: 3002 })`와 `vite.config.ts:11`의 프록시 target. 한쪽만 바꾸면 프론트에서 API가 죽는다.
7. **테스트는 `src/**/*.test.{ts,tsx}`와 `server/**/*.test.ts`만 수집된다** (`vite.config.ts:20`). 다른 위치에 만든 테스트는 조용히 실행되지 않는다.

### Double Defense (한쪽만 지우지 마라)

8. **코드펜스 제거가 두 겹이다.** 시스템 프롬프트가 "no markdown fences"를 지시하고 (`server/index.ts:16`), `stripCodeFences`가 다시 벗긴다 (`server/generator.ts:5-10`). 모델이 지시를 어기는 일이 잦아 서버 측 정규화가 남아 있다.
9. **`render()` 주입이 두 겹이다.** 프롬프트가 지시하고 (`server/index.ts:13`), `ensureRenderCall`이 없으면 주입한다 (`server/generator.ts:16-24`). react-live는 `noInline` 모드라 `render()`가 없으면 빈 화면을 그린다 (`src/components/LivePreview.tsx:9`).
10. **API 키 검사가 두 겹이다.** 클라이언트가 먼저 막고 (`src/App.tsx:34-37`), 서버가 다시 400을 낸다 (`server/index.ts:169-174`).

### Asymmetry (의도된 비대칭 — 대칭을 맞추려 들지 마라)

11. **모델 폴백은 Google 경로에만 있다.** `GOOGLE_MODELS` 2개를 순차 시도하고 (`server/index.ts:5, 134-136`), Anthropic은 단일 모델 고정이다 (`server/index.ts:77`). 커밋 `a89cb31 feat: Google 모델 실패 시 자동 폴백 추가`로 나중에 들어온 대응이다. Anthropic에 폴백을 임의로 추가하지 말고 요청자에게 확인하라.
12. **`MAX_TOKENS` 처리도 Google 경로에만 있다** (`server/index.ts:123-126`). Anthropic 경로에는 대응 로직이 없다.
13. **토큰 상한이 다르다.** Anthropic `max_tokens: 4096` (`server/index.ts:78`), Google `maxOutputTokens: 8192` (`server/index.ts:107`).
14. **기본 provider가 클라이언트와 서버에서 다르다.** 클라이언트 초기값은 `'google'` (`src/App.tsx:16`), 서버 기본값은 `'anthropic'` (`server/index.ts:161`). 요청에서 `provider`를 빼면 서버는 Anthropic으로 처리한다.

### Test Boundary

15. **테스트는 순수 함수와 사용자 입력 경계에 있다:** `server/generator.ts`, `server/fallback.ts`, `src/utils/*`(`promptValidation`, `persistence`, `storage`), `src/components/PromptInput.tsx`. `server/index.ts`, 프리뷰 컴포넌트에는 없다.
    - **예외적으로 `src/hooks/usePersistentState.ts`에는 테스트가 있다** (`src/hooks/usePersistentState.test.ts`). 마운트 시 저장을 건너뛰는 동작은 순수 함수로 뺄 수 없는 effect 타이밍 문제이고, 실제로 데이터가 사라지는 버그가 있었기 때문이다. **훅에 테스트를 붙이는 것은 이런 경우로 한정한다** — 로직은 여전히 순수 함수로 빼는 것이 우선이다 (규칙 16).
16. **로직은 부수효과에서 분리해 테스트를 붙인다.** `server/generator.ts:1-2` 주석이 의도를 명시한다 — "부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다". 서버에 로직을 더할 때 `Bun.serve` 핸들러 안에 묻지 말고 순수 함수로 빼라.
17. **테스트 설명은 한국어 서술문으로 쓴다** (`server/generator.test.ts:5`, `src/components/PromptInput.test.tsx:7`).
18. **버튼 문자열이 테스트 계약이다.** `src/components/PromptInput.test.tsx:9,18,27`이 접근성 이름 `'컴포넌트 생성'`과 `'생성 중...'`에 의존한다. 바꾸려면 테스트를 함께 고쳐라.

## Project Context

프롬프트를 받아 AI가 React 컴포넌트를 생성하고, 브라우저에서 즉시 렌더링해 미리보기와 코드를 함께 보여주는 로컬 워크벤치.

Tech Stack: React 19, TypeScript, Vite 8, Bun (API 프록시), react-live 4, Vitest + Testing Library. CSS 프레임워크·상태관리 라이브러리 없음.

## Standards & References

- **커밋:** Conventional Commits + 한국어 설명. 예: `feat: Google 모델 실패 시 자동 폴백 추가`, `chore(skills): agents-md 스킬 최신화`. 스코프는 선택.
- **주석:** 한국어로, "무엇"이 아니라 "왜"를 적는다 (`server/fallback.ts:1-2`, `src/test/setup.ts:5`).
- **UI 문구:** 한국어. 에러 메시지는 무엇이 잘못됐고 어떻게 고치는지 말한다.
- **Maintenance Policy:** 이 문서의 규칙과 실제 코드가 어긋난 것을 발견하면, 코드를 규칙에 맞추기 전에 **규칙 업데이트를 먼저 제안하라.** 근거(파일·라인)를 함께 제시한다.

## Context Map

- **[API 서버 / AI 프로바이더 연동](./server/AGENTS.md)** — Bun 런타임, 라우팅, 프롬프트, 응답 정규화 작업 시.
- **[프론트엔드 / UI·디자인 시스템](./src/AGENTS.md)** — React 컴포넌트, CSS 토큰, react-live 미리보기 작업 시.
