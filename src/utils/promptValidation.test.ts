import { describe, it, expect } from 'vitest';
import { checkPromptLength, PROMPT_MAX_LENGTH } from './promptValidation';

describe('checkPromptLength', () => {
  it('빈 문자열의 길이는 0이다', () => {
    expect(checkPromptLength('').length).toBe(0);
  });

  it('입력한 문자 수를 센다', () => {
    expect(checkPromptLength('버튼 만들어줘').length).toBe(7);
  });

  it('앞뒤 공백은 길이에서 제외한다', () => {
    expect(checkPromptLength('  카드  ').length).toBe(2);
  });

  it('상한과 같은 길이는 유효하다', () => {
    expect(checkPromptLength('가'.repeat(PROMPT_MAX_LENGTH)).isValid).toBe(true);
  });

  it('상한을 한 글자라도 넘으면 유효하지 않다', () => {
    expect(checkPromptLength('가'.repeat(PROMPT_MAX_LENGTH + 1)).isValid).toBe(false);
  });

  it('상한을 넘겨도 실제 길이를 그대로 알려준다', () => {
    expect(checkPromptLength('가'.repeat(PROMPT_MAX_LENGTH + 3)).length).toBe(
      PROMPT_MAX_LENGTH + 3
    );
  });

  it('서로게이트 쌍으로 저장되는 이모지도 한 글자로 센다', () => {
    expect(checkPromptLength('🚀🚀').length).toBe(2);
  });

  it('이모지만 상한만큼 입력해도 유효하다', () => {
    expect(checkPromptLength('🚀'.repeat(PROMPT_MAX_LENGTH)).isValid).toBe(true);
  });
});
