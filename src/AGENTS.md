# src/AGENTS.md

## Module Context

Vite로 번들되는 React 19 SPA. 프롬프트를 받아 `/api/generate`를 호출하고, 돌아온 코드 문자열을 react-live로 렌더링해 미리보기와 소스를 보여준다. 서버와는 Vite 프록시를 통해 `/api`로만 통신한다 (`../vite.config.ts:9-14`).

## Tech Stack & Constraints

- **CSS 프레임워크가 없다.** 순수 CSS 두 파일뿐이다: `index.css`(리셋 + 디자인 토큰), `App.css`(전체 스타일). Tailwind·CSS-in-JS·CSS Modules를 임의로 도입하지 마라.
- **상태관리 라이브러리가 없다.** `useState`와 커스텀 훅(`hooks/useComponentGenerator.ts`)으로 충분히 관리되고 있다. Redux·Zustand 등을 추가하지 마라.
- **아이콘·UI 라이브러리가 없다.** 아이콘은 텍스트 글리프로 처리한다 (`components/ComponentCard.tsx`의 `↻`).

## Implementation Patterns

- **색상·폰트는 반드시 `index.css`의 `:root` 토큰을 쓴다.** `App.css`에 색상 리터럴을 새로 박지 마라. 예외는 이미 주석으로 이유가 달린 지점뿐이다.
- **재질이 위계를 표현한다.** border-radius가 재질을 뜻한다 — 섀시(기계 패널) `14px`, 컨트롤 `3px`, 종이(데이터시트) `2px`. 모든 요소에 같은 radius를 주지 마라.
- **그림자는 물리적으로 쓴다.** 솟은 컨트롤은 `inset 0 1px 0 흰색` + `0 2px 0 어두운색`(단단한 아랫날), 함몰 영역은 `inset` 그림자. SaaS풍 소프트 드롭섀도(`0 4px 12px rgba(0,0,0,.1)`)를 추가하지 마라.
- **클래스 네이밍은 BEM-lite `block--modifier`**다: `tab--active`, `figure--blank`, `key-status--ready`, `lamp--on`.
- **`App.css`는 선언 순서에 의존한다.** 같은 특정도의 규칙이 뒤에서 앞을 덮는 곳이 있다 — `.figure--blank`의 `min-height`가 `.figure`를 덮고, `.btn-remove:hover`가 `.ctl:hover`를 덮는다. 섹션 순서를 재배치하지 마라.
- **폼 컨트롤 클래스는 역할로 나뉜다:** 솟은 버튼은 `.ctl`, 함몰 입력은 `.slot`. 새 컨트롤은 둘 중 하나를 조합해 쓴다.

## Testing Strategy

```bash
bun run test
```

- jsdom 환경, Testing Library. `test/setup.ts`가 `afterEach`에 `cleanup()`을 걸어 테스트 간 격리를 보장한다.
- **쿼리는 role 기반으로 쓴다** (`getByRole('button', { name: ... })`, `getByRole('textbox')`). 클래스명·test-id로 찾지 마라 — `components/PromptInput.test.tsx`가 이 패턴을 따른다.
- 테스트 파일은 대상 컴포넌트 옆에 `*.test.tsx`로 둔다.

## Local Golden Rules

- **react-live는 `noInline` 모드다** (`components/LivePreview.tsx:9`). 미리보기에 들어오는 코드에 `render(...)` 호출이 없으면 화면이 빈 채로 남는다. 서버의 `ensureRenderCall`이 이를 보장하므로 클라이언트에서 코드를 가공하지 마라.
- **`LiveProvider`는 임의 코드를 평가한다.** 사실상 eval 경계다. 신뢰할 수 없는 출처의 코드를 이 경로로 흘리는 기능(붙여넣기 실행, URL로 코드 불러오기 등)을 추가하지 마라.
- **접근성 대비 규칙:** `--ink-soft`는 종이·섀시 양쪽에서 4.5:1을 넘지만 `--ink-faint`는 **종이 위에서만** 통과한다 (`index.css` 주석 참조). 섀시 배경 위 작은 글씨에 `--ink-faint`를 쓰지 마라.
- **탭의 ARIA 연결을 끊지 마라.** `components/ComponentCard.tsx`의 `role="tab"`은 `aria-controls`와 `role="tabpanel"`, `aria-labelledby`가 짝을 이룬다. role만 남기고 연결을 빼면 스크린리더에서 오히려 손해다.
- **모션은 기계 상태에만 쓴다.** 현재 애니메이션은 생성 중 램프 점멸(`lamp--on`)과 버튼 눌림뿐이다. 섹션 진입 페이드·카드 hover lift를 추가하지 마라. 새 애니메이션을 넣으면 `prefers-reduced-motion` 블록에도 대응을 추가하라 (`App.css` 최하단).
- **부품번호(`RC-0417`)는 표시용이다.** `component.id` 해시로 만들어진다 (`components/ComponentCard.tsx`의 `partNumber`). 식별자로 쓰거나 서버로 보내지 마라.
