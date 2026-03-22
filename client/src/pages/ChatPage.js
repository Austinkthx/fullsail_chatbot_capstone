import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ModelSelector from '../components/ModelSelector';
import ChatMessage from '../components/ChatMessage';
import {
  fetchModels,
  fetchConversations,
  createConversation,
  deleteConversation,
  fetchMessages,
  sendMessageStream,
} from '../services/api';

export default function ChatPage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load models and conversations on mount
  useEffect(() => {
    fetchModels()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setModels(list);
        if (list.length > 0) setSelectedModel(list[0].id);
  }).catch(console.error);

    loadConversations();
  }, []);

  const loadConversations = useCallback(() => {
    fetchConversations()
      .then((res) => setConversations(Array.isArray(res) ? res : res?.data || []))
      .catch(console.error);
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId)
        .then((res) => setMessages(Array.isArray(res) ? res : res?.data || []))
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setStreaming(true);

    try {
      let convId = activeConvId;

      if (!convId) {
        const res = await createConversation(userMsg.slice(0, 50), selectedModel);
        convId = res.data.id || res.data._id;
        setActiveConvId(convId);
        loadConversations();
      }

      // Add user message locally
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: userMsg,
        model_id: selectedModel,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add placeholder for assistant
      const assistantId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', model_id: selectedModel },
      ]);

      // Stream response
      await sendMessageStream(convId, userMsg, selectedModel, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      });

      loadConversations();
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversation(convId);
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="chat-layout">
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={setActiveConvId}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
      />

      <main className="chat-main">
        {/* Holographic topbar */}
        <div className="chat-topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="topbar-title">NexusChat</span>
          </div>

          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
        </div>

        {/* Messages or empty state */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              {/* Rotating square logo */}
              <div className="empty-logo">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M10 12h12M10 16h8M10 20h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2>Start a conversation</h2>
              <p>Select a model from the dropdown above and type a message below.</p>

              {/* Quick model pills */}
              <div className="model-pills">
                {models
                  .filter((m) => m.available !== false)
                  .slice(0, 4)
                  .map((m) => (
                    <button
                      key={m.id}
                      className={`model-pill ${selectedModel === m.id ? 'active' : ''}`}
                      onClick={() => setSelectedModel(m.id)}
                    >
                      <span className="pill-provider">{m.provider}</span>
                      {m.name}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} models={models} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={streaming}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!input.trim() || streaming}
            >
              {streaming ? (
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 10l7-7m0 0l7 7m-7-7v14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="input-footer">
            Using <strong>{models.find((m) => m.id === selectedModel)?.name || selectedModel}</strong>
          </div>
        </div>
      </main>
    </div>
  );
}
