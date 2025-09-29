# MCP Server Configuration via UI

This update allows you to configure Model Context Protocol (MCP) servers directly from the VoiceChat AI interface, making it easy to customize the tools and capabilities available to your AI agent.

## Features

- **Real-time Configuration**: Configure MCP servers directly from the UI without restarting the application
- **Multiple Transport Types**: Support for SSE, HTTP, and STDIO transport protocols
- **Persistent Settings**: Your MCP server configurations are automatically saved to localStorage
- **Live Updates**: Changes to MCP servers are applied immediately to the AI agent

## How to Use

### 1. Access Settings

- Click the "Settings" button in the top-right corner of the interface
- The MCP Server Configuration modal will open

### 2. Configure Servers

Each server can be configured with:

- **Server Name**: A unique identifier for your server (editable)
- **Transport Type**: Choose from SSE, HTTP, or STDIO
- **Connection Details**: URL for web servers or command/args for STDIO

### 3. Transport Types

#### SSE (Server-Sent Events)

Best for real-time web services:

```
Transport: SSE
URL: https://your-server.com/sse
```

#### HTTP

Standard web API servers:

```
Transport: HTTP
URL: https://your-server.com/mcp
```

#### STDIO

Command-line tools and npm packages:

```
Transport: STDIO
Command: npx
Arguments: -y, @modelcontextprotocol/server-math
```

### 4. Manage Servers

- **Add Server**: Click "+ Add New Server" to create a new configuration
- **Remove Server**: Click "Remove" next to any server to delete it
- **Reset**: Click "Reset to Defaults" to restore the original Gmail and Calendar servers
- **Edit Name**: Click on the server name to rename it

## Default Servers

The application comes with two pre-configured servers:

- **Gmail**: Email management capabilities
- **Calendar**: Calendar operations

## Example Configurations

### Math Server (STDIO)

```
Name: math
Transport: STDIO
Command: npx
Arguments: -y, @modelcontextprotocol/server-math
```

### Weather API (SSE)

```
Name: weather
Transport: SSE
URL: https://api.weather.com/mcp/sse
```

### File System (STDIO)

```
Name: filesystem
Transport: STDIO
Command: npx
Arguments: -y, @modelcontextprotocol/server-filesystem, /path/to/directory
```

## Technical Implementation

### Architecture Changes

1. **Main Process**: Updated to accept dynamic MCP server configurations via IPC
2. **Renderer Process**: Added UI components for server configuration
3. **Agent Initialization**: Modified to reinitialize with custom configurations
4. **Persistence**: Configurations saved to localStorage for persistence

### Key Components

- **ChatInterface.tsx**: Main UI with settings modal
- **main.ts**: Updated IPC handlers and agent initialization
- **Types**: Extended to support MCP server configuration

### IPC Communication

The renderer process sends MCP server configurations along with chat messages:

```typescript
window.electronAPI.ollamaChat({
  messages: [...],
  stream: true,
  mcpServers: mcpServersConfig
})
```

## Benefits

1. **No Code Changes**: Users can add new MCP servers without modifying source code
2. **Live Configuration**: Changes apply immediately without restarting
3. **User-Friendly**: Intuitive UI for managing complex server configurations
4. **Flexible**: Supports all MCP transport types and configurations
5. **Persistent**: Settings are saved and restored between sessions

This implementation makes VoiceChat AI much more flexible and user-friendly, allowing easy integration with any MCP-compatible server or service.
