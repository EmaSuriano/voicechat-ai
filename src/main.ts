import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import * as fs from 'node:fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Electron Forge constants
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

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

// Default MCP Servers Configuration
const defaultMcpServers: MCPServersConfig = {
  filesystem: {
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
  },
};

// Configuration file path
const configPath = path.join(app.getPath('userData'), 'mcp-config.json');

// Load MCP configuration from file
const loadMcpConfig = (): MCPServersConfig => {
  // try {
  //   if (fs.existsSync(configPath)) {
  //     const configData = fs.readFileSync(configPath, 'utf-8');
  //     const config = JSON.parse(configData);
  //     console.log('📁 Loaded MCP configuration from file');
  //     return config;
  //   }
  // } catch (error) {
  //   console.warn('⚠️ Failed to load MCP config from file:', error);
  // }

  // Save default config and return it
  saveMcpConfig(defaultMcpServers);
  console.log('📁 Created default MCP configuration file');
  return defaultMcpServers;
};

// Save MCP configuration to file
const saveMcpConfig = (config: MCPServersConfig): void => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('💾 Saved MCP configuration to file');
  } catch (error) {
    console.error('❌ Failed to save MCP config to file:', error);
  }
};

// Initialize LangChain agent with MCP integration
let langchainAgent: ReturnType<typeof createReactAgent> | null = null;
let mcpClient: MultiServerMCPClient | null = null;
let currentMcpConfig: MCPServersConfig = {};

const initializeLangChainAgent = async (
  mcpServers: MCPServersConfig = defaultMcpServers,
) => {
  try {
    console.log('🚀 Initializing LangChain Agent with MCP integration...');

    // Close existing MCP client if it exists
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (error) {
        console.warn('Error closing existing MCP client:', error);
      }
    }

    // Initialize MCP client only if we have servers configured
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mcpClient = new MultiServerMCPClient({ mcpServers });
    const tools = await mcpClient.getTools();

    // Create ChatOpenAI model configured for Ollama
    const model = new ChatOpenAI({
      modelName: 'gpt-oss:120b-cloud',
      temperature: 0.7,
      apiKey: 'ollama', // Dummy key for Ollama
      openAIApiKey: 'ollama', // Dummy key for Ollama
      configuration: {
        baseURL: 'http://localhost:11434/v1', // Ollama endpoint
      },
    });

    // Create the React agent
    langchainAgent = createReactAgent({
      llm: model,
      tools,
    });

    currentMcpConfig = mcpServers;
    console.log(`✅ LangChain Agent initialized with ${tools.length} tools!`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize LangChain Agent:', error);
    langchainAgent = null;
    return false;
  }
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'VoiceChat AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Restore security
      nodeIntegration: false, // Restore security
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
app.on('ready', async () => {
  // Load MCP configuration from file and initialize agent
  const mcpConfig = loadMcpConfig();
  await initializeLangChainAgent(mcpConfig);
  createWindow();
});

// Quit when all windows are closed, except on macOS.
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

// LangChain chat handler
const handleLangChainChat = async (
  messages: ChatMessage[],
  stream: boolean,
  event: Electron.IpcMainInvokeEvent,
): Promise<{ success: boolean; content?: string; error?: string }> => {
  try {
    if (!langchainAgent) {
      throw new Error('LangChain agent not initialized');
    }

    console.log('🤖 Processing request with LangChain Agent...');

    // Convert messages to LangChain format
    const langchainMessages = messages.map((msg) => {
      return msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content);
    });

    // Run the agent
    const result = await langchainAgent.invoke({ messages: langchainMessages });
    const lastMessage = result.messages[result.messages.length - 1];
    const content =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    if (stream) {
      // Simulate streaming for the UI
      const words = content.split(' ');
      let streamedContent = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        streamedContent += word;
        event.sender.send('ollama-stream-chunk', word);

        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      return { success: true, content: streamedContent };
    } else {
      return { success: true, content };
    }
  } catch (error) {
    console.error('❌ LangChain agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Handle AI chat requests
ipcMain.handle('ollama-chat', async (event, { messages, stream = true }) => {
  try {
    console.log('📨 Processing chat request...');
    return await handleLangChainChat(messages, stream, event);
  } catch (error) {
    console.error('💥 Chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Handle MCP configuration updates
ipcMain.handle(
  'update-mcp-config',
  async (event, newConfig: MCPServersConfig) => {
    try {
      console.log('🔧 Updating MCP configuration...');

      // Save the new configuration to file
      saveMcpConfig(newConfig);

      // Reinitialize the agent with the new configuration
      await initializeLangChainAgent(newConfig);

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update MCP config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// Handle getting current MCP configuration
ipcMain.handle('get-mcp-config', async () => {
  try {
    return { success: true, config: currentMcpConfig };
  } catch (error) {
    console.error('❌ Failed to get MCP config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
