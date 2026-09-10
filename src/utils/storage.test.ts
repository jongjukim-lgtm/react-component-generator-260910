import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readJson, writeJson } from './storage';

describe('readJson', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('저장된 값이 없으면 null을 반환한다', () => {
    expect(readJson('없는-키')).toBeNull();
  });

  it('저장된 JSON을 파싱해 반환한다', () => {
    window.localStorage.setItem('키', JSON.stringify({ a: 1 }));
    expect(readJson('키')).toEqual({ a: 1 });
  });

  it('JSON이 깨져 있으면 null을 반환한다', () => {
    window.localStorage.setItem('키', '{깨진 JSON');
    expect(readJson('키')).toBeNull();
  });

  it('localStorage 접근이 예외를 던지면 null을 반환한다', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('접근 거부');
    });
    expect(readJson('키')).toBeNull();
  });
});

describe('writeJson', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('값을 JSON 문자열로 저장한다', () => {
    writeJson('키', { a: 1 });
    expect(window.localStorage.getItem('키')).toBe('{"a":1}');
  });

  it('저장이 실패해도 예외를 던지지 않는다', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('용량 초과');
    });
    expect(() => writeJson('키', { a: 1 })).not.toThrow();
  });
});
