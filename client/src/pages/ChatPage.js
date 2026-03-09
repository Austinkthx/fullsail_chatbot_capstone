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
    fetchModels().then(setModels).catch(console.error);
    fetchConversations().then(setConversations).catch(console.error);
  }, []);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    try {
      const msgs = await fetchMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  useEffect(() => {
    loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    // Set the model to match the conversation
    const conv = conversations.find((c) => c.id === convId);
    if (conv?.model_id) setSelectedModel(conv.model_id);
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || streaming) return;

    setInput('');
    setStreaming(true);

    try {
      let convId = activeConvId;

      // Create new conversation if needed
      if (!convId) {
        const conv = await createConversation('New Conversation', selectedModel);
        convId = conv.id;
        setActiveConvId(convId);
        setConversations((prev) => [conv, ...prev]);
      }

      // Add user message to UI
      const userMsg = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        model_id: selectedModel,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder assistant message
      const assistantId = `temp-assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          model_id: selectedModel,
          created_at: new Date().toISOString(),
        },
      ]);

      // Stream the response
      await sendMessageStream(convId, content, selectedModel, (partialText) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: partialText } : msg
          )
        );
      });

      // Refresh conversations to update title
      const updatedConvs = await fetchConversations();
      setConversations(updatedConvs);
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please check that your backend and LLM provider are running.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className={`chat-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
      />

      <main className="chat-main">
        {/* Top bar */}
        <div className="chat-topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="topbar-title">
            {activeConv ? activeConv.title : 'NexusChat'}
          </div>
          <ModelSelector
            models={models}
            selected={selectedModel}
            onChange={setSelectedModel}
          />
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#6366f1" fillOpacity="0.1" />
                  <path d="M16 18h16M16 24h10M16 30h13" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h2>Start a conversation</h2>
              <p>Select a model from the dropdown above and type a message below.</p>
              <div className="model-pills">
                {models
                  .filter((m) => m.available)
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

        {/* Input */}
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 10l7-7m0 0l7 7m-7-7v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
