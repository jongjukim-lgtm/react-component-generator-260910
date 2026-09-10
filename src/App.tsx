import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistentState } from './hooks/usePersistentState';
import {
  addPrompt,
  parseApiKey,
  parsePromptHistory,
  parseProvider,
  STORAGE_KEYS,
} from './utils/persistence';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = usePersistentState(STORAGE_KEYS.apiKey, parseApiKey, '');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>(
    STORAGE_KEYS.provider,
    parseProvider,
    'google',
  );
  const [promptHistory, setPromptHistory] = usePersistentState<string[]>(
    STORAGE_KEYS.promptHistory,
    parsePromptHistory,
    [],
  );
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    setPromptHistory((prev) => addPrompt(prev, prompt));
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <div className="machine">
        <header className="rail">
          <div className="nameplate">
            <span className="badge" aria-hidden="true">
              RC
            </span>
            <div className="nameplate-copy">
              <h1 className="wordmark">Component Generator</h1>
              <p className="tagline">
                필요한 React 컴포넌트를 설명하면 만들어서 바로 보여줍니다.
              </p>
            </div>
          </div>

          <dl className="readout">
            <div>
              <dt>provider</dt>
              <dd>{activeProvider}</dd>
            </div>
            <div>
              <dt>output</dt>
              <dd>{String(components.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>
                <span className={`lamp ${isLoading ? 'lamp--on' : ''}`} aria-hidden="true" />
                {isLoading ? '생성 중' : '대기'}
              </dd>
            </div>
          </dl>
        </header>

        <div className="deck">
          <section className="order" aria-label="컴포넌트 생성">
            <PromptInput
              onGenerate={handleGenerate}
              isLoading={isLoading}
              history={promptHistory}
            />
          </section>

          <aside className="bay" aria-label="실행 설정">
            <h2 className="bay-title">실행 설정</h2>

            <div className="field">
              <label htmlFor="provider">provider</label>
              <select
                id="provider"
                className="ctl select"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="api-key">api key</label>
              <div className="key-row">
                <input
                  id="api-key"
                  className="slot key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    hasEnvKey ? '서버 키 사용 중' : PROVIDER_CONFIG[provider].placeholder
                  }
                />
                <button className="ctl btn-key" onClick={() => setShowKey(!showKey)} type="button">
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                <span className="lamp lamp--steady" aria-hidden="true" />
                {hasEnvKey
                  ? '.env 키를 쓰고 있습니다. 직접 입력하면 그 키가 우선합니다.'
                  : '키를 입력하거나 서버 .env에 설정하세요.'}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {error && (
        <div className="fault" role="alert">
          <h2>만들지 못했습니다</h2>
          <p>{error}</p>
        </div>
      )}

      <section className="output">
        {components.length > 0 && (
          <div className="output-head">
            <h2>생성된 컴포넌트</h2>
            <button className="ctl btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="sheet blank">
            <div className="figure figure--blank" aria-hidden="true">
              <span className="tick tick--tl" />
              <span className="tick tick--tr" />
              <span className="tick tick--bl" />
              <span className="tick tick--br" />
            </div>
            <div className="blank-copy">
              <h2>아직 만든 컴포넌트가 없습니다</h2>
              <p>위에 필요한 UI를 적으면 결과가 여기에 한 장씩 쌓입니다.</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="sheet working">
            <span className="lamp lamp--on" aria-hidden="true" />
            <p>컴포넌트를 만들고 있습니다</p>
          </div>
        )}

        <div className="sheets">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
