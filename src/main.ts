import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'VoiceChat AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Initialize AI SDK with Ollama-compatible OpenAI client
const openai = createOpenAI({
  baseURL: 'http://localhost:11434/v1', // Ollama's OpenAI-compatible API endpoint
  apiKey: 'ollama', // Ollama uses 'ollama' as the API key
});

// Handle AI chat requests from renderer
ipcMain.handle(
  'ollama-chat',
  async (event, { model, messages, stream = true }) => {
    try {
      if (stream) {
        // Use Vercel AI SDK for streaming responses
        const result = await streamText({
          model: openai(model),
          messages: messages,
        });

        const chunks: string[] = [];
        for await (const textPart of result.textStream) {
          chunks.push(textPart);
          // Send partial response back to renderer
          event.sender.send('ollama-stream-chunk', textPart);
        }

        return { success: true, content: chunks.join('') };
      } else {
        // Use Vercel AI SDK for non-streaming responses
        const result = await streamText({
          model: openai(model),
          messages: messages,
        });

        const fullText = await result.text;
        return { success: true, content: fullText };
      }
    } catch (error) {
      console.error('AI chat error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
