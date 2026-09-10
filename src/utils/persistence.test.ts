import { describe, it, expect } from 'vitest';
import { readJson, writeJson } from './storage';
import type { GeneratedComponent } from '../types';
import {
  parseApiKeys,
  withApiKey,
  parseProvider,
  parsePromptHistory,
  parseComponents,
  addPrompt,
  PROMPT_HISTORY_LIMIT,
} from './persistence';

describe('parseApiKeys', () => {
  it('두 provider의 키를 그대로 반환한다', () => {
    expect(parseApiKeys({ anthropic: 'sk-ant-abc', google: 'AIza-xyz' })).toEqual({
      anthropic: 'sk-ant-abc',
      google: 'AIza-xyz',
    });
  });

  it('객체가 아니면 빈 키 쌍을 반환한다', () => {
    expect(parseApiKeys(null)).toEqual({ anthropic: '', google: '' });
    expect(parseApiKeys('sk-ant-abc')).toEqual({ anthropic: '', google: '' });
  });

  it('한쪽만 저장돼 있으면 나머지는 빈 문자열로 채운다', () => {
    expect(parseApiKeys({ google: 'AIza-xyz' })).toEqual({ anthropic: '', google: 'AIza-xyz' });
  });

  it('문자열이 아닌 값은 빈 문자열로 만든다', () => {
    expect(parseApiKeys({ anthropic: 42, google: null })).toEqual({ anthropic: '', google: '' });
  });
});

describe('withApiKey', () => {
  it('지정한 provider의 키만 바꾼다', () => {
    const keys = { anthropic: 'sk-ant-abc', google: 'AIza-xyz' };
    expect(withApiKey(keys, 'google', 'AIza-새것')).toEqual({
      anthropic: 'sk-ant-abc',
      google: 'AIza-새것',
    });
  });

  it('다른 provider의 키를 지우지 않는다', () => {
    // provider를 바꿨다 되돌리면 키가 사라지던 버그의 재현 지점.
    // 슬롯이 하나뿐이라 전환할 때마다 기존 키를 비워야 했다.
    const keys = { anthropic: 'sk-ant-abc', google: '' };
    const afterSwitch = withApiKey(keys, 'google', 'AIza-xyz');

    expect(afterSwitch.anthropic).toBe('sk-ant-abc');
  });
});

describe('parseProvider', () => {
  it('알려진 provider 문자열은 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
  });

  it('알 수 없는 문자열은 null을 반환한다', () => {
    // 저장된 값이 그대로 PROVIDER_CONFIG 조회에 쓰이므로,
    // 걸러내지 않으면 undefined.label 접근으로 화면이 죽는다.
    expect(parseProvider('openai')).toBeNull();
  });

  it('문자열이 아니면 null을 반환한다', () => {
    expect(parseProvider(null)).toBeNull();
    expect(parseProvider(42)).toBeNull();
  });
});

describe('parsePromptHistory', () => {
  it('문자열 배열을 그대로 반환한다', () => {
    expect(parsePromptHistory(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(parsePromptHistory('a')).toEqual([]);
    expect(parsePromptHistory(null)).toEqual([]);
  });

  it('문자열이 아닌 항목은 걸러낸다', () => {
    expect(parsePromptHistory(['a', 42, null, 'b'])).toEqual(['a', 'b']);
  });

  it('빈 문자열과 공백만 있는 항목은 걸러낸다', () => {
    expect(parsePromptHistory(['a', '', '   '])).toEqual(['a']);
  });

  it('상한을 넘게 저장돼 있으면 상한까지만 반환한다', () => {
    const stored = Array.from({ length: PROMPT_HISTORY_LIMIT + 5 }, (_, i) => `p${i}`);
    expect(parsePromptHistory(stored)).toHaveLength(PROMPT_HISTORY_LIMIT);
  });
});

describe('parseComponents', () => {
  const valid = {
    id: 'abc',
    prompt: '버튼 만들어줘',
    code: 'render(<button />)',
    createdAt: '2026-09-10T04:30:00.000Z',
  };

  it('createdAt을 Date 객체로 복원한다', () => {
    const [component] = parseComponents([valid]);
    // JSON 왕복 후에는 문자열이 되는데, ComponentCard가 toLocaleTimeString을
    // 호출하므로 복원하지 않으면 렌더링 중 예외가 난다.
    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.createdAt.toISOString()).toBe('2026-09-10T04:30:00.000Z');
  });

  it('id·prompt·code를 그대로 유지한다', () => {
    const [component] = parseComponents([valid]);
    expect(component.id).toBe('abc');
    expect(component.prompt).toBe('버튼 만들어줘');
    expect(component.code).toBe('render(<button />)');
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(parseComponents(null)).toEqual([]);
    expect(parseComponents({})).toEqual([]);
  });

  it('필수 필드가 없는 항목은 걸러낸다', () => {
    expect(parseComponents([{ id: 'a', prompt: 'p' }])).toEqual([]);
  });

  it('createdAt이 유효한 날짜가 아닌 항목은 걸러낸다', () => {
    expect(parseComponents([{ ...valid, createdAt: '날짜아님' }])).toEqual([]);
  });

  it('유효한 항목과 깨진 항목이 섞여 있으면 유효한 것만 남긴다', () => {
    const result = parseComponents([valid, { id: 'x' }, { ...valid, id: 'def' }]);
    expect(result.map((c) => c.id)).toEqual(['abc', 'def']);
  });
});

describe('저장·복원 왕복', () => {
  it('저장했다 읽은 컴포넌트의 createdAt이 원래 시각 그대로 복원된다', () => {
    // parseComponents는 createdAt이 ISO 문자열로 온다고 가정하는데, 그 가정을
    // 실제로 만드는 건 writeJson의 JSON.stringify다. 둘을 따로 테스트하면
    // 한쪽이 형식을 바꿔도 각자는 통과하므로 연결을 직접 확인한다.
    const original: GeneratedComponent = {
      id: 'abc',
      prompt: '버튼',
      code: 'render(<button />)',
      createdAt: new Date('2026-09-10T04:30:00.000Z'),
    };

    writeJson('왕복-키', [original]);
    const [restored] = parseComponents(readJson('왕복-키'));

    expect(restored).toEqual(original);
    expect(restored.createdAt.getTime()).toBe(original.createdAt.getTime());
  });

  it('저장했다 읽은 프롬프트 히스토리가 순서를 유지한다', () => {
    const history = addPrompt(addPrompt([], '먼저'), '나중');

    writeJson('히스토리-키', history);

    expect(parsePromptHistory(readJson('히스토리-키'))).toEqual(['나중', '먼저']);
  });
});

describe('addPrompt', () => {
  it('새 프롬프트를 맨 앞에 넣는다', () => {
    expect(addPrompt(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addPrompt(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('상한을 넘으면 가장 오래된 것을 버린다', () => {
    const full = Array.from({ length: PROMPT_HISTORY_LIMIT }, (_, i) => `p${i}`);
    const result = addPrompt(full, '새것');
    expect(result).toHaveLength(PROMPT_HISTORY_LIMIT);
    expect(result[0]).toBe('새것');
    expect(result).not.toContain(`p${PROMPT_HISTORY_LIMIT - 1}`);
  });

  it('앞뒤 공백을 제거해 저장한다', () => {
    expect(addPrompt([], '  버튼  ')).toEqual(['버튼']);
  });

  it('공백만 있는 프롬프트는 넣지 않는다', () => {
    expect(addPrompt(['a'], '   ')).toEqual(['a']);
  });
});
