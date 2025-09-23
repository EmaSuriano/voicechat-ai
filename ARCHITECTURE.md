# VoiceChat AI Architecture

This document explains the architectural decisions and structure of VoiceChat AI.

## 🏗️ Application Architecture

### Electron Multi-Process Architecture

VoiceChat AI follows Electron's recommended multi-process architecture:

```
┌─────────────────┐    IPC     ┌─────────────────┐
│   Main Process  │ ◄─────────► │ Renderer Process│
│                 │             │                 │
│ - Ollama API    │             │ - React UI      │
│ - File System   │             │ - Speech-to-Text│
│ - Window Mgmt   │             │ - User Interface│
└─────────────────┘             └─────────────────┘
```

### Process Separation

#### Main Process (`src/main.ts`)

- **Purpose**: Backend operations and system integration
- **Responsibilities**:
  - Ollama API communication
  - Window management
  - File system access
  - IPC message handling

#### Renderer Process (`src/components/ChatInterface.tsx`)

- **Purpose**: User interface and client-side logic
- **Responsibilities**:
  - React UI components
  - Speech-to-text processing (Whisper AI)
  - User interactions
  - Markdown rendering

### IPC Communication

Communication between processes uses Electron's IPC (Inter-Process Communication):

```typescript
// Main Process (main.ts)
ipcMain.handle('ollama-chat', async (event, { model, messages, stream }) => {
  // Handle Ollama requests
});

// Renderer Process (ChatInterface.tsx)
window.electronAPI.ollamaChat({
  model: 'gpt-oss:120b-cloud',
  messages: [...],
  stream: true
});
```

## 🔧 Key Architectural Decisions

### 1. Ollama in Main Process

**Decision**: Move Ollama API calls from renderer to main process.

**Reasoning**:

- **Security**: Prevents Node.js modules in renderer process
- **Performance**: Better resource management
- **Compatibility**: Avoids Vite bundling issues with Node.js dependencies
- **Separation of Concerns**: API logic separated from UI logic

**Implementation**:

- `src/main.ts`: Handles Ollama communication
- `src/preload.ts`: Exposes secure IPC methods
- `src/types/electron.d.ts`: Type definitions for IPC

### 2. Speech-to-Text in Renderer

**Decision**: Keep speech processing in renderer process.

**Reasoning**:

- **Web APIs**: Requires access to `navigator.mediaDevices`
- **Real-time Processing**: Better performance for audio streaming
- **User Permissions**: Direct browser permission handling

### 3. Streaming Response Architecture

**Implementation**:

```typescript
// Main process streams data
for await (const part of response) {
  event.sender.send('ollama-stream-chunk', part.message.content);
}

// Renderer listens for chunks
window.electronAPI.onOllamaStreamChunk((chunk) => {
  // Update UI in real-time
});
```

## 📁 Project Structure

```
src/
├── main.ts                 # Main process entry point
├── preload.ts             # Secure IPC bridge
├── renderer.tsx           # Renderer process entry point
├── App.tsx               # Root React component
├── components/
│   └── ChatInterface.tsx  # Main chat UI component
├── hooks/
│   └── useSpeechToText.ts # Speech recognition hook
└── types/
    └── electron.d.ts      # IPC type definitions
```

## 🔄 Data Flow

### Message Sending Flow

1. **User Input**: User types or speaks message
2. **State Update**: React state updated with user message
3. **IPC Call**: Renderer sends request to main process
4. **Ollama API**: Main process calls Ollama
5. **Streaming**: Main process streams response chunks
6. **UI Update**: Renderer updates UI with each chunk
7. **Completion**: Final state update and cleanup

### Speech-to-Text Flow

1. **Permission**: Request microphone access
2. **Recording**: Capture audio in renderer
3. **Processing**: Use Whisper AI for transcription
4. **Auto-send**: Automatically trigger message sending
5. **Cleanup**: Clear audio data and reset state

## 🛠️ Build Process

### Development vs Production

- **Development**: All processes run with hot reload
- **Production**: Bundled and packaged for distribution

### Vite Configuration

```typescript
// vite.renderer.config.ts
build: {
  rollupOptions: {
    external: ['ollama']; // Externalize Node.js packages
  }
}
```

## 🔒 Security Considerations

### Context Isolation

- **Enabled**: Full context isolation between processes
- **Preload Script**: Controlled API exposure
- **No Node Integration**: Renderer cannot access Node.js directly

### IPC Security

```typescript
// Only specific methods exposed
contextBridge.exposeInMainWorld('electronAPI', {
  ollamaChat: (options) => ipcRenderer.invoke('ollama-chat', options),
  // No direct file system or Node.js access
});
```

## 🚀 Performance Optimizations

### 1. Streaming Responses

- Real-time UI updates during API calls
- Better perceived performance

### 2. Process Separation

- UI remains responsive during API calls
- Better memory management

### 3. External Dependencies

- Node.js packages not bundled with renderer
- Smaller bundle size and faster loading

## 🔧 Troubleshooting

### Common Issues

1. **IPC Not Working**
   - Check preload script is loaded
   - Verify context bridge setup
   - Ensure main process handlers are registered

2. **Build Errors**
   - Node.js packages should be externalized
   - Check Vite configuration
   - Verify imports are correct

3. **Speech Recognition Failing**
   - Check microphone permissions
   - Verify browser compatibility
   - Check for HTTPS requirement

---

This architecture ensures a secure, performant, and maintainable application while leveraging the best features of both Electron and modern web technologies.
