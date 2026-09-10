import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readJson, writeJson } from '../utils/storage';

// useState와 같은 인터페이스를 유지해 호출부가 저장을 신경 쓰지 않게 한다.
// 저장된 값은 신뢰할 수 없으므로 parse가 걸러낸 결과만 초기값으로 쓰고,
// 못 읽으면 fallback으로 시작한다.
export function usePersistentState<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => parse(readJson(key)) ?? fallback);
  const hasMounted = useRef(false);

  useEffect(() => {
    // 마운트에서는 쓰지 않는다. parse가 거부한 값을 fallback으로 되쓰면,
    // 읽지 못했을 뿐인 데이터가 앱을 한 번 여는 것만으로 영구히 사라진다.
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    writeJson(key, value);
  }, [key, value]);

  return [value, setValue];
}
