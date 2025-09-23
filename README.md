# VoiceChat AI 🎤💬

A modern desktop AI chat application built with Electron, featuring voice-to-text capabilities and seamless integration with Ollama models.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-38.1.2-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.5.4-3178C6?logo=typescript)
![CI](https://github.com/emanuelsiuriano/voicechat-ai/workflows/CI/badge.svg)
![Release](https://github.com/emanuelsiuriano/voicechat-ai/workflows/Electron%20Forge%20Release/badge.svg)

## ✨ Features

- **🤖 AI-Powered Chat**: Seamless integration with Ollama for intelligent conversations
- **🎤 Voice Input**: Built-in speech-to-text using Whisper AI models
- **📝 Markdown Support**: Rich text rendering with support for code blocks, tables, and HTML tags
- **⚡ Real-time Streaming**: Live response streaming for instant feedback
- **🎨 Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **🖥️ Cross-Platform**: Native desktop app for Windows, macOS, and Linux
- **🔄 Auto-transcription**: Voice messages are automatically transcribed and sent
- **📋 Copy-Friendly**: Properly formatted code blocks and content

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Ollama](https://ollama.ai/) installed and running locally
- A compatible Ollama model (e.g., `gpt-oss:120b-cloud`)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd voicechat-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start Ollama service**

   ```bash
   # Make sure Ollama is running with your desired model
   ollama serve
   ```

4. **Run the application**
   ```bash
   npm start
   ```

## 🛠️ Development

### Scripts

- `npm start` - Start the development server
- `npm run package` - Package the app for distribution
- `npm run make` - Build the app for your current platform
- `npm run lint` - Run ESLint checks

### Tech Stack

#### Frontend

- **Electron** - Desktop app framework
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server

#### AI & Speech

- **Ollama** - Local AI model integration
- **Hugging Face Transformers** - Speech-to-text processing
- **Whisper Base English** - Voice recognition model

#### Markdown & Rendering

- **ReactMarkdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **rehype-raw** - HTML tag processing

### Project Structure

```
src/
├── components/
│   └── ChatInterface.tsx    # Main chat component
├── hooks/
│   └── useSpeechToText.ts   # Speech recognition hook
├── App.tsx                  # Root component
├── main.ts                  # Electron main process
├── preload.ts              # Electron preload script
└── renderer.tsx            # React app entry point
```

## 🎯 Usage

1. **Text Chat**: Type your message and press Enter or click Send
2. **Voice Chat**: Click the microphone button to start recording
   - The app will automatically transcribe and send your voice message
   - Wait for the transcription to complete before speaking again
3. **New Chat**: Click "New Chat" to start a fresh conversation
4. **Markdown**: The AI responses support full markdown including:
   - Code blocks with syntax highlighting
   - Tables and lists
   - Headers and formatting
   - HTML tags like `<br>` for line breaks

## ⚙️ Configuration

### Ollama Model

The app is configured to use `gpt-oss:120b-cloud` by default. To change the model, edit the model name in `src/components/ChatInterface.tsx`:

```typescript
const response = await ollama.chat({
  model: 'your-preferred-model', // Change this
  messages: [...messages, userMessage],
  stream: true,
});
```

### Speech Recognition

The speech-to-text feature uses Whisper Base English model and will automatically fall back from WebGPU to CPU if needed. Audio is optimized for:

- 16kHz sample rate
- Mono channel
- Echo cancellation
- Noise suppression

## 📦 Building for Production

### Package for Current Platform

```bash
npm run package
```

### Build Distributables

```bash
npm run make
```

This will create platform-specific distributables in the `out/` directory:

- **macOS**: `.app` bundle and `.dmg`
- **Windows**: `.exe` installer
- **Linux**: `.deb` and `.rpm` packages

## 🤖 Automated Releases

VoiceChat AI includes automated CI/CD workflows:

### 🔄 Continuous Integration

- **Automatic testing** on every push and pull request
- **Multi-platform builds** (Windows, macOS, Linux)
- **Code linting** and quality checks

### 🚀 Automated Releases

- **🤖 Fully Automated**: Releases created automatically on every commit
- **📝 Smart Versioning**: Version bumps based on commit message conventions
- **🏗️ Cross-platform**: Builds for macOS, Windows, and Linux automatically
- **📦 GitHub Releases**: Installers uploaded automatically

#### Creating a Release (Choose One)

**🎯 Automatic (Recommended)**
```bash
# Just commit and push - version automatically determined
git add .
git commit -m "feat: add amazing new feature"
git push
# → Automatically creates v1.1.0 release
```

**🎛️ Manual Control**
```bash
npm run release:patch  # 1.0.0 → 1.0.1
npm run release:minor  # 1.0.0 → 1.1.0  
npm run release:major  # 1.0.0 → 2.0.0
```

See [AUTO-RELEASE.md](AUTO-RELEASE.md) for automated release guide and [RELEASE.md](RELEASE.md) for manual release instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Requirements

- **Ollama**: Must be running locally with at least one model downloaded
- **Microphone**: Required for voice input functionality
- **Modern Browser Engine**: Uses Chromium via Electron for advanced features

## 🐛 Troubleshooting

### Common Issues

**Ollama Connection Failed**

- Ensure Ollama is running: `ollama serve`
- Check if your model is available: `ollama list`
- Verify the model name in the code matches your installed model

**Voice Recognition Not Working**

- Grant microphone permissions when prompted
- Check browser console for detailed error messages
- Ensure your microphone is working in other applications

**Build Errors**

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update Node.js to the latest LTS version
- Check that all peer dependencies are satisfied
- If you see Ollama/Node.js import errors, check that Vite externalization is configured correctly

**Architecture Notes**

- Ollama runs in the main process for security and compatibility
- Speech-to-text runs in the renderer for web API access
- See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local AI model infrastructure
- [Hugging Face](https://huggingface.co/) for Transformers and Whisper models
- [Electron Forge](https://www.electronforge.io/) for the excellent build tooling
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the modern UI stack

---

**Suggested Project Name: VoiceChat AI** 🎤💬

_A perfect blend of voice interaction and AI conversation in a beautiful desktop package._
