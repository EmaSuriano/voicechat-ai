import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useSpeechToText } from '../hooks/useSpeechToText';
import type { ChatMessage, MCPServersConfig } from '../types/electron';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usingTools, setUsingTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Load MCP servers from the main process (file-based)
  const [mcpServers, setMcpServers] = useState<MCPServersConfig>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load MCP configuration from main process on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const result = await window.electronAPI.getMcpConfig();
        if (result.success && result.config) {
          setMcpServers(result.config);
        }
      } catch (error) {
        console.error('Failed to load MCP configuration:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  // Save MCP configuration to main process (file-based)
  const saveMcpConfig = async (newConfig: MCPServersConfig) => {
    try {
      const result = await window.electronAPI.updateMcpConfig(newConfig);
      if (result.success) {
        setMcpServers(newConfig);
        console.log('✅ MCP configuration updated successfully');
      } else {
        console.error('❌ Failed to update MCP configuration:', result.error);
      }
    } catch (error) {
      console.error('❌ Error updating MCP configuration:', error);
    }
  };

  const {
    isRecording,
    isTranscribing,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useSpeechToText();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to process messages via IPC
  const sendToOllama = async (messages: Message[]): Promise<void> => {
    const lastUserMessage = messages[messages.length - 1]?.content;
    if (!lastUserMessage?.trim()) {
      console.warn('No message to send');
      return;
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Check if the message might trigger tool usage
    const toolKeywords = [
      'weather',
      'temperature',
      'climate',
      'forecast',
      'rain',
      'sunny',
      'cloudy',
      'snow',
      'email',
      'calendar',
      'schedule',
    ];
    const mightUseTools = toolKeywords.some((keyword) =>
      lastUserMessage.toLowerCase().includes(keyword),
    );

    if (mightUseTools) {
      setUsingTools(true);
    }

    try {
      console.log('🤖 Processing request via IPC...');

      // Convert all messages to the expected format
      const chatMessages: ChatMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send messages to main process via IPC
      const result = await window.electronAPI.ollamaChat({
        messages: chatMessages,
        stream: false,
      });

      if (result.success && result.content) {
        // Simulate streaming for better UX
        const words = result.content.split(' ');
        let streamedContent = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? ' ' : '');
          streamedContent += word;

          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...assistantMessage,
              content: streamedContent,
            };
            return newMessages;
          });

          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      } else {
        throw new Error(
          result.error || 'Failed to get response from main process',
        );
      }

      setUsingTools(false);
    } catch (error) {
      console.error('❌ IPC communication error:', error);
      setUsingTools(false);
      setMessages((prev) => [
        ...prev.slice(0, -1), // Remove the empty assistant message
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update input when transcript is available and send automatically
  useEffect(() => {
    if (transcript) {
      const transcribedText = transcript.trim();
      if (transcribedText) {
        // Set the input temporarily for visual feedback
        setInput(transcribedText);
        clearTranscript();

        // Send the message automatically after a brief delay
        setTimeout(() => {
          // Create a user message with the transcribed text
          const userMessage: Message = {
            role: 'user',
            content: transcribedText,
          };
          setMessages((prev) => [...prev, userMessage]);
          setInput(''); // Clear input after sending
          setIsLoading(true);

          // Send to Ollama
          (async () => {
            try {
              await sendToOllama([...messages, userMessage]);
            } catch (error) {
              console.error('Error sending message:', error);
            } finally {
              setIsLoading(false);
              // Restore focus to input
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }
          })();
        }, 200); // Brief delay to show the transcribed text
      }
    }
  }, [transcript, clearTranscript, messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await sendToOllama([...messages, userMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setIsLoading(false);

    // Restore focus to input after sending message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    clearTranscript();
    // Focus on input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-900">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          VoiceChat AI
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="MCP Server Settings"
          >
            Settings
          </button>
          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Show agent status */}
        {!isLoadingConfig && (
          <div className="flex items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <span className="text-xs text-green-800 dark:text-green-200">
              ✅ AI agent ready with MCP tools
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            {isLoadingConfig
              ? 'Loading configuration...'
              : 'Type a message or use voice input to start chatting'}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code: ({ children, ...props }) => {
                          const isInline =
                            !props.className?.includes('language-');
                          return isInline ? (
                            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto text-xs font-mono my-2">
                              <code {...props}>{children}</code>
                            </pre>
                          );
                        },
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 text-sm leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 mb-2 text-sm space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 mb-2 text-sm space-y-1">
                            {children}
                          </ol>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-4 italic my-2 text-sm">
                            {children}
                          </blockquote>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-lg font-semibold mb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-semibold mb-2">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-semibold mb-2">
                            {children}
                          </h3>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-gray-200 dark:border-gray-600 text-sm">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            {children}
                          </thead>
                        ),
                        tbody: ({ children }) => (
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {children}
                          </tbody>
                        ),
                        tr: ({ children }) => (
                          <tr className="border-b border-gray-200 dark:border-gray-600">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                            {children}
                          </td>
                        ),
                        br: () => <br className="block" />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <span>
                  {usingTools ? 'Using tools to fetch data...' : 'Thinking...'}
                </span>
                {usingTools && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">🔧</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-4">
        {speechError && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            Speech recognition error: {speechError}
          </div>
        )}

        <div className="flex space-x-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message VoiceChat AI..."
              className="w-full resize-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent disabled:opacity-50 placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleMicrophoneClick}
              disabled={isLoading || isTranscribing}
              className={`absolute right-2 top-2 p-1.5 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={
                isTranscribing
                  ? 'Transcribing...'
                  : isRecording
                    ? 'Stop recording'
                    : 'Start recording'
              }
            >
              {isTranscribing ? (
                <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C10.3 2 9 3.3 9 5V11C9 12.7 10.3 14 12 14S15 12.7 15 11V5C15 3.3 13.7 2 12 2M12 16C9.8 16 8 14.2 8 12V11H6V12C6 15.3 8.7 18 12 18S18 15.3 18 12V11H16V12C16 14.2 14.2 16 12 16M11 19H13V22H11V19Z" />
                </svg>
              )}
            </button>
          </div>

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* MCP Server Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                MCP Server Configuration
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>MCP Servers</strong> provide tools and capabilities to
                  the AI agent. You can configure different types:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>
                    <strong>SSE/HTTP:</strong> Web-based servers (e.g., APIs,
                    web services)
                  </li>
                  <li>
                    <strong>STDIO:</strong> Command-line tools (e.g., npm
                    packages, scripts)
                  </li>
                </ul>
              </div>

              {Object.entries(mcpServers).map(([serverName, config]) => (
                <div
                  key={serverName}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => {
                        if (e.target.value !== serverName) {
                          const newServers = { ...mcpServers };
                          delete newServers[serverName];
                          newServers[e.target.value] = config;
                          setMcpServers(newServers);
                        }
                      }}
                      className="font-medium text-gray-900 dark:text-white bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => {
                        const newServers = { ...mcpServers };
                        delete newServers[serverName];
                        setMcpServers(newServers);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Transport
                      </label>
                      <select
                        value={config.transport || 'sse'}
                        onChange={(e) => {
                          const newServers = { ...mcpServers };
                          newServers[serverName] = {
                            ...config,
                            transport: e.target.value as
                              | 'sse'
                              | 'stdio'
                              | 'http',
                          };
                          setMcpServers(newServers);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="sse">SSE</option>
                        <option value="http">HTTP</option>
                        <option value="stdio">STDIO</option>
                      </select>
                    </div>

                    {config.transport !== 'stdio' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={config.url || ''}
                          onChange={(e) => {
                            const newServers = { ...mcpServers };
                            newServers[serverName] = {
                              ...config,
                              url: e.target.value,
                            };
                            setMcpServers(newServers);
                          }}
                          placeholder="https://example.com/mcp"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    )}

                    {config.transport === 'stdio' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Command
                          </label>
                          <input
                            type="text"
                            value={config.command || ''}
                            onChange={(e) => {
                              const newServers = { ...mcpServers };
                              newServers[serverName] = {
                                ...config,
                                command: e.target.value,
                              };
                              setMcpServers(newServers);
                            }}
                            placeholder="npx"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Arguments (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={config.args?.join(', ') || ''}
                            onChange={(e) => {
                              const newServers = { ...mcpServers };
                              newServers[serverName] = {
                                ...config,
                                args: e.target.value
                                  .split(',')
                                  .map((arg) => arg.trim())
                                  .filter((arg) => arg),
                              };
                              setMcpServers(newServers);
                            }}
                            placeholder="--flag, value"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newServerName = `server-${Date.now()}`;
                      setMcpServers({
                        ...mcpServers,
                        [newServerName]: {
                          transport: 'sse',
                          url: '',
                        },
                      });
                    }}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add New Server
                  </button>
                  <button
                    onClick={() => {
                      setMcpServers({});
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await saveMcpConfig(mcpServers);
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
