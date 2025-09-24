import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Electron Forge constants
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

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

// Handle AI chat requests from renderer using direct fetch to Ollama
ipcMain.handle(
  'ollama-chat',
  async (event, { model, messages, stream = true }) => {
    try {
      const response = await fetch(
        'http://localhost:11434/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ollama',
          },
          body: JSON.stringify({
            model,
            messages,
            stream,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (stream) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available for streaming response');
        }

        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          let isReading = true;
          while (isReading) {
            const { done, value } = await reader.read();
            if (done) {
              isReading = false;
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((line) => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  isReading = false;
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                    event.sender.send('ollama-stream-chunk', content);
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming chunk:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return { success: true, content: fullContent };
      } else {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';
        return { success: true, content };
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
