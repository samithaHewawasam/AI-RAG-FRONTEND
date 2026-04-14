import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import { Repository } from '../types/repo';
import './FloatingChat.css';

interface FloatingChatProps {
  repository: Repository | null;
}

const FloatingChat: React.FC<FloatingChatProps> = ({ repository }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Show welcome animation after 2 seconds
    const timer = setTimeout(() => {
      setHasNewMessage(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsFullScreen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <>
      {isOpen && (
        <ChatWindow
          onClose={handleClose}
          repository={repository}
          fullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
        />
      )}

      <button
        className={`floating-button ${isOpen ? 'hidden' : ''} ${hasNewMessage ? 'pulse' : ''}`}
        onClick={toggleChat}
        aria-label="Open chat"
      >
        {hasNewMessage && <div className="notification-badge">1</div>}
        <div className="chat-icon">💬</div>
      </button>
    </>
  );
};

export default FloatingChat;
