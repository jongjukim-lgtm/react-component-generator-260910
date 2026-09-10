import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';
import { readJson } from '../utils/storage';

describe('usePersistentState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('저장된 값을 초기값으로 읽는다', () => {
    window.localStorage.setItem('키', JSON.stringify(['저장된 것']));

    const { result } = renderHook(() =>
      usePersistentState<string[]>('키', (raw) => raw as string[], []),
    );

    expect(result.current[0]).toEqual(['저장된 것']);
  });

  it('파서가 거부한 값을 마운트만으로 덮어쓰지 않는다', () => {
    // 파서가 못 읽는 형태로 저장돼 있을 때(다른 버전이 남긴 형태 등)
    // 앱을 한 번 열기만 해도 fallback이 되쓰여 원본이 영구히 사라지면 안 된다.
    window.localStorage.setItem('키', JSON.stringify(['읽지 못했지만 살아있어야 함']));

    renderHook(() => usePersistentState<string[]>('키', () => null, []));

    expect(window.localStorage.getItem('키')).toBe(
      JSON.stringify(['읽지 못했지만 살아있어야 함']),
    );
  });

  it('값이 바뀌면 저장한다', () => {
    const { result } = renderHook(() =>
      usePersistentState<string[]>('키', (raw) => raw as string[], []),
    );

    act(() => result.current[1](['새 값']));

    expect(readJson('키')).toEqual(['새 값']);
  });
});
