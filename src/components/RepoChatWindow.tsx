import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Repository } from '../types/repo';
import { repoIndexingApi } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isProcessing?: boolean;
  searchResults?: any[];
}

interface RepoChatWindowProps {
  repository: Repository | null;
}

const RepoChatWindow: React.FC<RepoChatWindowProps> = ({ repository }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (repository) {
      setMessages([
        {
          id: '1',
          text: `Hi! I'm ready to answer questions about ${repository.displayName}. What would you like to know?`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [repository]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing || !repository) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Searching repository...',
      sender: 'bot',
      timestamp: new Date(),
      isProcessing: true,
    };

    setMessages((prev) => [...prev, userMessage, processingMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Search the repository
      const searchResults = await repoIndexingApi.search(
        repository.repoId,
        inputValue,
        5
      );

      // Generate insights based on search results
      const insights = await repoIndexingApi.generateInsights(
        repository.repoId,
        inputValue
      );

      // Format the response
      let responseText = '';

      if (searchResults && searchResults.length > 0) {
        responseText = `I found relevant information in the codebase:\n\n`;

        if (insights?.architecture) {
          responseText += `**Architecture:**\n${insights.architecture}\n\n`;
        }

        if (insights?.security) {
          responseText += `**Security:**\n${insights.security}\n\n`;
        }

        if (insights?.improvements) {
          responseText += `**Improvements:**\n${insights.improvements}\n\n`;
        }

        responseText += `**Relevant Code Locations:**\n`;
        searchResults.slice(0, 3).forEach((result: any, idx: number) => {
          responseText += `${idx + 1}. ${result.chunk.filePath}:${result.chunk.startLine}-${result.chunk.endLine}\n`;
          if (result.chunk.symbolName) {
            responseText += `   ${result.chunk.symbolType}: ${result.chunk.symbolName}\n`;
          }
        });
      } else {
        responseText = "I couldn't find relevant information for that query. Try rephrasing your question or check if the repository is properly indexed.";
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.isProcessing
            ? {
                ...msg,
                text: responseText,
                isProcessing: false,
                searchResults,
              }
            : msg
        )
      );
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isProcessing
            ? {
                ...msg,
                text: `Error: ${error.message}. Make sure the repository is indexed.`,
                isProcessing: false,
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!repository) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Repository Selected
          </h3>
          <p className="text-gray-500">
            Select a repository from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {repository.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{repository.displayName}</h3>
            <p className="text-sm text-gray-500">{repository.repoId}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-lg p-4 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full" />
                  <span>{message.text}</span>
                </div>
              ) : (
                <div className="markdown-content">
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
              )}
              <div
                className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder={
              repository.status?.status === 'idle'
                ? 'Ask a question about the repository...'
                : repository.status?.status === 'indexing'
                ? 'Wait for indexing to complete...'
                : 'Index the repository first...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing || repository.status?.status !== 'idle'}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={
              !inputValue.trim() ||
              isProcessing ||
              repository.status?.status !== 'idle'
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Send'
            )}
          </button>
        </div>
        {repository.status?.status !== 'idle' && (
          <p className="text-xs text-gray-500 mt-2">
            {repository.status?.status === 'indexing'
              ? 'Repository is currently being indexed. Please wait...'
              : 'Repository needs to be indexed before you can chat.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default RepoChatWindow;
