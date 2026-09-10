// 저장된 값은 신뢰할 수 없다 — 이전 버전이 남긴 형태이거나 사용자가 직접 고쳤을 수 있다.
// 그대로 상태에 넣으면 렌더링 중에 죽으므로, 읽는 쪽에서 검증하고 못 쓸 항목은 버린다.

import type { GeneratedComponent, Provider } from '../types';

export const PROMPT_HISTORY_LIMIT = 20;

export const STORAGE_KEYS = {
  apiKey: 'rcg:api-key',
  provider: 'rcg:provider',
  promptHistory: 'rcg:prompt-history',
  components: 'rcg:components',
} as const;

const PROVIDERS: readonly string[] = ['anthropic', 'google'];

export function parseApiKey(raw: unknown): string | null {
  return typeof raw === 'string' ? raw : null;
}

export function parseProvider(raw: unknown): Provider | null {
  return typeof raw === 'string' && PROVIDERS.includes(raw) ? (raw as Provider) : null;
}

export function parsePromptHistory(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, PROMPT_HISTORY_LIMIT);
}

export function parseComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];

  const components: GeneratedComponent[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;

    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') continue;
    if (typeof createdAt !== 'string') continue;

    // ComponentCard가 createdAt.toLocaleTimeString을 호출하므로 Date로 되돌려야 한다.
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) continue;

    components.push({ id, prompt, code, createdAt: date });
  }
  return components;
}

export function addPrompt(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;
  return [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, PROMPT_HISTORY_LIMIT);
}
