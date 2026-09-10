import { useId, useState } from 'react';
import { checkPromptLength, PROMPT_MAX_LENGTH } from '../utils/promptValidation';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  history?: string[];
}

const EXAMPLES = [
  'SaaS 관리자용 KPI 카드 3개. 매출, 활성 사용자, 전환율을 비교 가능한 형태로 표시',
  '설정 페이지의 알림 토글 패널. 이메일, 슬랙, 주간 리포트 옵션 포함',
  '검색 필터 바. 상태, 담당자, 날짜 범위를 선택하고 결과 수를 보여주는 UI',
  '온보딩 체크리스트. 5단계 진행률과 완료/대기 상태를 보여주는 카드',
  '요금제 비교 카드 3개. 추천 플랜을 강조하고 CTA 버튼 포함',
  '테이블 행 상세보기 패널. 선택한 고객의 기본 정보와 최근 활동 표시',
];

export function PromptInput({ onGenerate, isLoading, history = [] }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const counterId = useId();
  const errorId = useId();

  const { length, isValid } = checkPromptLength(prompt);
  const canSubmit = length > 0 && isValid && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onGenerate(prompt.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="prompt">
      <h2 className="prompt-title">어떤 컴포넌트가 필요한가요?</h2>

      <form onSubmit={handleSubmit} className="prompt-form">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 고객 목록 테이블 위에 들어갈 검색 필터 바를 만들어줘. 상태, 담당자, 날짜 범위 필터가 필요해."
          className="slot prompt-slot"
          rows={3}
          aria-invalid={!isValid}
          aria-describedby={isValid ? counterId : `${counterId} ${errorId}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />
        <div className="prompt-launch">
          <button type="submit" className="btn-generate" disabled={!canSubmit}>
            {isLoading ? '생성 중...' : '컴포넌트 생성'}
          </button>
          <span className="shortcut">
            <kbd>⌘</kbd>
            <kbd>↵</kbd>
          </span>
          <span
            id={counterId}
            className={`prompt-counter ${isValid ? '' : 'prompt-counter--over'}`}
          >
            {`${length} / ${PROMPT_MAX_LENGTH}`}
          </span>
        </div>
        {!isValid && (
          <p id={errorId} className="prompt-error" role="alert">
            {`${PROMPT_MAX_LENGTH}자까지 입력할 수 있습니다. ${length - PROMPT_MAX_LENGTH}자를 줄여주세요.`}
          </p>
        )}
      </form>

      {history.length > 0 && (
        <>
          <p className="cards-hint">최근 프롬프트</p>
          <ul className="history-list" aria-label="최근 프롬프트">
            {history.map((item) => (
              <li key={item}>
                <button
                  className="history-item"
                  onClick={() => setPrompt(item)}
                  type="button"
                  title={item}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="cards-hint">눌러서 입력란을 채웁니다.</p>
      <div className="cards">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            className="card"
            onClick={() => handleExampleClick(example)}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
