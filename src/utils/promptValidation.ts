export const PROMPT_MAX_LENGTH = 500;

export interface PromptLengthCheck {
  length: number;
  isValid: boolean;
}

export function checkPromptLength(prompt: string): PromptLengthCheck {
  // String.length 는 UTF-16 단위라 이모지가 2자로 잡힌다.
  // 사용자가 세는 글자 수와 맞추기 위해 코드포인트로 센다.
  const length = [...prompt.trim()].length;
  return { length, isValid: length <= PROMPT_MAX_LENGTH };
}
