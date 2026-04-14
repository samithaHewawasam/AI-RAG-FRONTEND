import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`chat-bubble-container ${isUser ? 'user' : 'bot'}`}>
      {!isUser && (
        <div className="message-avatar">🤖</div>
      )}

      <div className={`chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {message.isProcessing ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <>
            <div className="message-text">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
            {!isUser && message.metrics && (
              <div className="metrics-display">
                <div className="metrics-row">
                  {message.metrics.cacheHit ? (
                    <span className="metric-badge cache-hit">💾 Cached</span>
                  ) : (
                    <>
                      <span className="metric-badge">
                        📊 {message.metrics.finalChunks} chunks
                      </span>
                      <span className="metric-badge">
                        🎯 {message.metrics.avgDistance.toFixed(2)} avg distance
                      </span>
                      <span className="metric-badge">
                        📝 {message.metrics.contextTokens} tokens
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div className="message-time">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {isUser && (
        <div className="message-avatar user-avatar">👤</div>
      )}
    </div>
  );
};

export default ChatBubble;
