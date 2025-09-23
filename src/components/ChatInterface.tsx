import React, { useState, useRef, useEffect } from 'react';
import { Ollama } from 'ollama';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ollama = new Ollama();

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
              const response = await ollama.chat({
                model: 'gpt-oss:120b-cloud',
                messages: [...messages, userMessage],
                stream: true,
              });

              let assistantContent = '';
              const assistantMessage: Message = {
                role: 'assistant',
                content: '',
              };
              setMessages((prev) => [...prev, assistantMessage]);

              for await (const part of response) {
                if (part.message?.content) {
                  assistantContent += part.message.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...assistantMessage,
                      content: assistantContent,
                    };
                    return newMessages;
                  });
                }
              }
            } catch (error) {
              console.error('Error sending message:', error);
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content:
                    'Sorry, I encountered an error while processing your message.',
                },
              ]);
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
  }, [transcript, clearTranscript, messages, ollama]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ollama.chat({
        model: 'gpt-oss:120b-cloud',
        messages: [...messages, userMessage],
        stream: true,
      });

      let assistantContent = '';
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMessage]);

      for await (const part of response) {
        if (part.message?.content) {
          assistantContent += part.message.content;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...assistantMessage,
              content: assistantContent,
            };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error while processing your message.',
        },
      ]);
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Ollama Chat</h1>
        <button
          onClick={handleNewChat}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Type a message to start chatting with Ollama
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
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-900'
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
                        code: ({ children, ...props }: any) => {
                          const isInline =
                            !props.className?.includes('language-');
                          return isInline ? (
                            <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs font-mono my-2">
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
                          <blockquote className="border-l-2 border-gray-300 pl-4 italic my-2 text-sm">
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
                            <table className="min-w-full border border-gray-200 text-sm">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-gray-50">{children}</thead>
                        ),
                        tbody: ({ children }) => (
                          <tbody className="divide-y divide-gray-200">
                            {children}
                          </tbody>
                        ),
                        tr: ({ children }) => (
                          <tr className="border-b border-gray-200">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200 last:border-r-0">
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
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        {speechError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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
              placeholder="Message Ollama..."
              className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50"
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
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
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
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
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
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
