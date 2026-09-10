import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom의 localStorage가 Node의 실험적 구현(`--localstorage-file` 없이는 undefined)에
// 가려져 `window.localStorage`가 undefined로 잡힌다. sessionStorage는 정상인데
// localStorage만 그렇다. 브라우저에는 진짜 localStorage가 있으므로 프로덕션 코드를
// 비틀지 않고 테스트 환경에만 최소 shim을 심는다.
if (!window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

// 각 테스트 후 렌더된 DOM을 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
});
