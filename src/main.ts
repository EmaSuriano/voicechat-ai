import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { Ollama } from 'ollama';

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

// Initialize Ollama
const ollama = new Ollama();

// Handle Ollama chat requests from renderer
ipcMain.handle(
  'ollama-chat',
  async (event, { model, messages, stream = true }) => {
    try {
      if (stream) {
        // For streaming responses, we need to handle this differently
        const response = await ollama.chat({
          model,
          messages,
          stream: true,
        });

        const chunks: string[] = [];
        for await (const part of response) {
          if (part.message?.content) {
            chunks.push(part.message.content);
            // Send partial response back to renderer
            event.sender.send('ollama-stream-chunk', part.message.content);
          }
        }

        return { success: true, content: chunks.join('') };
      } else {
        const response = await ollama.chat({
          model,
          messages,
          stream: false,
        });

        return { success: true, content: response.message.content };
      }
    } catch (error) {
      console.error('Ollama chat error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
