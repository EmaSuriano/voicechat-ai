import { contextBridge, ipcRenderer } from 'electron';

// Define message interface
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

// Expose IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Chat functionality
  ollamaChat: (options: { messages: ChatMessage[]; stream?: boolean }) =>
    ipcRenderer.invoke('ollama-chat', options),

  // Listen for streaming chunks
  onOllamaStreamChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('ollama-stream-chunk', (event, chunk) => callback(chunk));
  },

  // Remove listeners
  removeOllamaStreamListener: () => {
    ipcRenderer.removeAllListeners('ollama-stream-chunk');
  },

  // MCP configuration management
  getMcpConfig: () => ipcRenderer.invoke('get-mcp-config'),
  updateMcpConfig: (config: MCPServersConfig) =>
    ipcRenderer.invoke('update-mcp-config', config),
});

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
