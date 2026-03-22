import React, { useState, useRef, useEffect } from 'react';

export default function ModelSelector({ models, selectedModel, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = models.find((m) => m.id === selectedModel);

  return (
    <div className="model-selector" ref={ref}>
      <button className="model-selector-btn" onClick={() => setOpen(!open)}>
        <span>{current?.name || selectedModel}</span>
        <span className="caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="model-dropdown">
          {models
            .filter((m) => m.available !== false)
            .map((m) => (
              <div
                key={m.id}
                className={`model-option ${m.id === selectedModel ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(m.id);
                  setOpen(false);
                }}
              >
                <span className="model-provider">{m.provider}</span>
                <span className="model-name">{m.name}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
