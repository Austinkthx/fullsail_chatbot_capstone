import React, { useState, useRef, useEffect } from 'react';

export default function ModelSelector({ models, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedModel = models.find((m) => m.id === selected);

  // Group models by provider
  const grouped = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {});

  const providerLabels = {
    ollama: 'Ollama (Local)',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
  };

  return (
    <div className="model-selector" ref={ref}>
      <button className="model-selector-btn" onClick={() => setOpen(!open)}>
        <span className="model-selector-name">
          {selectedModel?.name || selected}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="model-dropdown">
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <div key={provider} className="model-group">
              <div className="model-group-label">
                {providerLabels[provider] || provider}
              </div>
              {providerModels.map((model) => (
                <button
                  key={model.id}
                  className={`model-option ${selected === model.id ? 'active' : ''} ${!model.available ? 'unavailable' : ''}`}
                  onClick={() => {
                    if (model.available) {
                      onChange(model.id);
                      setOpen(false);
                    }
                  }}
                  disabled={!model.available}
                >
                  <span className="model-option-name">{model.name}</span>
                  <span className="model-option-desc">{model.description}</span>
                  {!model.available && (
                    <span className="model-unavailable-badge">Not available</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
