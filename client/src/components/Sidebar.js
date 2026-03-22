import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ conversations, activeConvId, onSelect, onDelete, onNewChat, isOpen }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M10 12h12M10 16h8M10 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span>NexusChat</span>
        </div>
        <button className="new-chat-btn" onClick={onNewChat}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.id || conv._id}
            className={`conv-item ${(conv.id || conv._id) === activeConvId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id || conv._id)}
          >
            <div className="conv-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 5h8M4 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="conv-info">
              <span className="conv-title">{conv.title || 'Untitled'}</span>
              <span className="conv-model">{conv.model_id || ''}</span>
            </div>
            <button
              className="conv-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id || conv._id);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.display_name || 'User'}</span>
            <span className="user-email">{user?.email || ''}</span>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3v12h3M11 4l4 4-4 4M7 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
