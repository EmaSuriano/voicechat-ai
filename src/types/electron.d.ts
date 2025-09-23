// Electron API types for renderer process

export interface ElectronAPI {
  ollamaChat: (options: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
  }) => Promise<{ success: boolean; content?: string; error?: string }>;

  onOllamaStreamChunk: (callback: (chunk: string) => void) => void;
  removeOllamaStreamListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
