// localStorage 접근 자체가 예외를 던지는 환경이 있다 — 사생활 보호 모드,
// 브라우저의 사이트 데이터 차단 설정. 유지가 안 되는 것보다 앱이 죽는 게 나쁘므로
// 읽기·쓰기 모두 실패를 삼키고 기본값으로 동작하게 한다.
//
// `window.`를 붙이는 이유: 맨 `localStorage`는 Node의 실험적 구현으로 잡혀
// jsdom 테스트에서 undefined가 된다. 브라우저에서도 같은 객체를 가리키므로
// 명시하는 편이 안전하다.

export function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과·쓰기 차단. 이번 세션은 그대로 쓰고 유지만 포기한다.
  }
}
