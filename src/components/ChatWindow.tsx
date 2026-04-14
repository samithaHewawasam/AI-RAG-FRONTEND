import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import ChatBubble from './ChatBubble';
import ProcessViewer from './ProcessViewer';
import { useRagStream } from '../hooks/useRagStream';
import { Repository } from '../types/repo';
import './ChatWindow.css';

interface ChatWindowProps {
  onClose: () => void;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
  repository: Repository | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, fullScreen = false, onToggleFullScreen, repository }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! 👋 I can help you find information from your documents. Ask me anything!',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showProcess, setShowProcess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { processSteps, isProcessing, metrics, askQuestion, cleanup } = useRagStream();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Thinking...',
      sender: 'bot',
      timestamp: new Date(),
      isProcessing: true,
    };

    setMessages((prev) => [...prev, userMessage, processingMessage]);
    setInputValue('');
    setShowProcess(true);

    askQuestion(
      inputValue,
      repository?.repoId || null,
      (answer, resultMetrics) => {
        // Replace processing message with actual answer
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isProcessing
              ? { ...msg, text: answer, isProcessing: false, metrics: resultMetrics }
              : msg
          )
        );
      },
      () => {
        // Complete
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chat-window-overlay ${fullScreen ? 'fullscreen' : ''}`}>
      <div className={`chat-window ${fullScreen ? 'fullscreen' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <div className="bot-avatar">🤖</div>
            <div className="header-text">
              <h3>RAG Assistant</h3>
              <span className="status">
                <span className="status-dot"></span>
                Online
              </span>
            </div>
          </div>
          <div className="header-actions">
            {onToggleFullScreen && (
              <button
                className="header-button"
                onClick={onToggleFullScreen}
                aria-label={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {fullScreen ? '⊡' : '⊞'}
              </button>
            )}
            {!fullScreen && (
              <button className="close-button" onClick={onClose}>
                ✕
              </button>
            )}
            {fullScreen && (
              <button className="close-button" onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Process Viewer Toggle */}
        {isProcessing && (
          <button
            className="process-toggle"
            onClick={() => setShowProcess(!showProcess)}
          >
            {showProcess ? '📊 Hide Process' : '📊 Show Process'}
          </button>
        )}

        {/* Process Viewer */}
        {showProcess && isProcessing && (
          <ProcessViewer steps={processSteps} />
        )}

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            placeholder="Ask a question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
          >
            {isProcessing ? (
              <div className="spinner"></div>
            ) : (
              <span>➤</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
