import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatMessage({ message, models }) {
  const isUser = message.role === 'user';
  const model = models?.find((m) => m.id === message.model_id);

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">
        {isUser ? '▶' : '◆'}
      </div>
      <div className="message-body">
        <div className="message-header">
          <span className="message-role">
            {isUser ? 'You' : model?.name || message.model_id || 'Assistant'}
          </span>
        </div>
        <div className="message-content">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="code-block">
                      <div className="code-header">
                        <span>{match[1]}</span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                          }
                        >
                          Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content || '▊'}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
