// Electron API types for renderer process

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MCPServerConfig {
  transport?: 'sse' | 'stdio' | 'http';
  url?: string;
  command?: string;
  args?: string[];
}

interface MCPServersConfig {
  [key: string]: MCPServerConfig;
}

export interface ElectronAPI {
  ollamaChat: (options: {
    messages: ChatMessage[];
    stream?: boolean;
  }) => Promise<{ success: boolean; content?: string; error?: string }>;

  onOllamaStreamChunk: (callback: (chunk: string) => void) => void;
  removeOllamaStreamListener: () => void;

  getMcpConfig: () => Promise<{
    success: boolean;
    config?: MCPServersConfig;
    error?: string;
  }>;
  updateMcpConfig: (
    config: MCPServersConfig,
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
