import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Ollama chat functionality
  ollamaChat: (options: { model: string; messages: any[]; stream?: boolean }) =>
    ipcRenderer.invoke('ollama-chat', options),

  // Listen for streaming chunks
  onOllamaStreamChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('ollama-stream-chunk', (event, chunk) => callback(chunk));
  },

  // Remove listeners
  removeOllamaStreamListener: () => {
    ipcRenderer.removeAllListeners('ollama-stream-chunk');
  },
});

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
