# server/AGENTS.md

## Module Context

Bun 런타임에서 도는 AI API 프록시. 브라우저가 API 키를 직접 들고 프로바이더를 호출하지 않도록 중간에 서고, 모델 응답을 react-live가 실행할 수 있는 코드로 정규화해 돌려준다. Vite 빌드 파이프라인 밖에 있다.

## Tech Stack & Constraints

- **`Bun.serve` 단일 서버.** Express·Hono 같은 웹 프레임워크가 없다. 라우팅 프레임워크를 도입하지 말고 기존 방식을 따라라.
- **HTTP 클라이언트는 전역 `fetch`.** axios 등을 추가하지 마라.
- **프로바이더 SDK를 쓰지 않는다.** Anthropic·Google 모두 REST 엔드포인트를 직접 호출한다 (`index.ts:69, 99`). SDK 도입은 의존성·키 취급 방식을 바꾸므로 임의로 하지 마라.
- 이 디렉토리는 타입체크 대상이 아니다 (루트 Hard Constraint 5).

## Implementation Patterns

- **라우팅은 `req.method` + `url.pathname` if문**이다 (`index.ts:147, 159`). 매칭되지 않으면 404로 떨어진다 (`index.ts:215`).
- **모든 응답에 `CORS_HEADERS`를 붙여야 한다** (`index.ts:51-55`). 새 라우트를 추가할 때 가장 흔히 빠뜨리는 부분이다. `OPTIONS` 프리플라이트도 따로 처리한다 (`index.ts:141`).
- **에러 → HTTP 상태 매핑은 메시지 문자열 검사로 한다.** `message.includes('503')`, `includes('429')` (`index.ts:194-206`). 새 에러를 던질 때 상태코드를 메시지에 넣는 기존 형식(`` `Gemini API error: ${response.status}` ``, `index.ts:112`)을 유지해야 이 매핑이 동작한다.
- **키 해석은 `resolveApiKey` 한 곳을 거친다.** 클라이언트 키가 `.env` 키보다 우선한다 (`index.ts:64-66`). 이 우선순위를 바꾸지 마라.
- **모델 폴백은 `withModelFallback`으로 감싼다** (`fallback.ts`). 첫 성공을 반환하고 전부 실패하면 마지막 에러를 던진다.

## Testing Strategy

```bash
bun run test          # 전체
bun run test:watch    # watch
```

- **`index.ts`를 테스트에서 import하지 마라.** 모듈 최상위에서 `Bun.serve`가 실행되므로 (`index.ts:138`) import하는 순간 3002 포트에 서버가 뜬다.
- 테스트할 로직은 `generator.ts`·`fallback.ts`처럼 부수효과 없는 모듈로 분리한 뒤 테스트를 붙인다.
- 테스트 파일은 대상 모듈 옆에 `*.test.ts`로 둔다 (`generator.test.ts`, `fallback.test.ts`).

## Local Golden Rules

- **`SYSTEM_PROMPT`의 두 제약을 빼지 마라.** "Do NOT use import statements" (`index.ts:12`)와 "Do NOT use TypeScript syntax" (`index.ts:20`). react-live 스코프에는 React만 전역으로 있고 타입 문법은 런타임에 그대로 깨진다. 프롬프트를 손볼 때 이 두 줄이 살아 있는지 확인하라.
- **`SYSTEM_PROMPT`는 인라인 스타일만 허용한다** (`index.ts:10`). 생성 코드가 CSS를 import하면 미리보기가 실패한다.
- **`stripCodeFences`·`ensureRenderCall`을 우회하지 마라.** 모델 응답은 반드시 이 두 함수를 거쳐 클라이언트로 나간다 (`index.ts:188`).
- **모델 ID를 바꿀 때는 두 프로바이더의 응답 스키마 차이를 확인하라.** Anthropic은 `content[].text`를 이어붙이고 (`index.ts:92-95`), Google은 `candidates[0].content.parts[].text`를 이어붙인다 (`index.ts:127-131`).
- 사용자에게 노출되는 에러 메시지는 한국어로 쓴다 (`index.ts:124, 196, 202`). 내부 예외 메시지는 영어여도 된다.
