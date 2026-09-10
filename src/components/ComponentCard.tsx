import { useState } from 'react';
import type { GeneratedComponent } from '../types';
import { LivePreview } from './LivePreview';
import { CodeView } from './CodeView';

interface ComponentCardProps {
  component: GeneratedComponent;
  onRemove: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  isLoading: boolean;
}

type Tab = 'preview' | 'code';

function partNumber(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 10000;
  }
  return `RC-${String(hash).padStart(4, '0')}`;
}

export function ComponentCard({ component, onRemove, onRegenerate, isLoading }: ComponentCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [previewKey, setPreviewKey] = useState(0);
  const panelId = `sheet-${component.id}`;
  const createdAt = component.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="sheet">
      <div className="sheet-head">
        <div className="stamp">
          <span className="part-no">{partNumber(component.id)}</span>
          <time>{createdAt}</time>
        </div>

        <div className="sheet-actions">
          <button
            className="ctl btn-icon"
            onClick={() => setPreviewKey((k) => k + 1)}
            title="미리보기 새로고침"
            aria-label="미리보기 새로고침"
          >
            ↻
          </button>
          <button
            className="ctl"
            onClick={() => onRegenerate(component.prompt)}
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '재생성'}
          </button>
          <button className="ctl btn-remove" onClick={() => onRemove(component.id)}>
            삭제
          </button>
        </div>

        <p className="sheet-title">{component.prompt}</p>
      </div>

      <div className="switch" role="tablist">
        <button
          id={`${panelId}-tab-preview`}
          role="tab"
          aria-selected={activeTab === 'preview'}
          aria-controls={panelId}
          className={`tab ${activeTab === 'preview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          미리보기
        </button>
        <button
          id={`${panelId}-tab-code`}
          role="tab"
          aria-selected={activeTab === 'code'}
          aria-controls={panelId}
          className={`tab ${activeTab === 'code' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          코드
        </button>
      </div>

      <div
        className="sheet-body"
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${panelId}-tab-${activeTab}`}
      >
        {activeTab === 'preview' ? (
          <LivePreview key={previewKey} code={component.code} />
        ) : (
          <CodeView code={component.code} />
        )}
      </div>
    </article>
  );
}
