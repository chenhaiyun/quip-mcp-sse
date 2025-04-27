# MCP Quip SSE Server

A Model Context Protocol (MCP) server using Server-Sent Events (SSE) as the transport layer for accessing Quip spreadsheet data.

## Overview

This project implements an MCP server that allows AI assistants to access Quip spreadsheet data through the MCP protocol. It uses SSE as the transport layer, making it suitable for web applications and MCP-compatible AI clients.

Key features:

- Implements an MCP server using SSE as the transport layer
- Provides tools for accessing Quip spreadsheet data
- Supports exporting spreadsheet data to CSV format
- Supports accessing complete spreadsheet data via resource URIs

## Installation

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- Quip API token

### Using Docker

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/chenhaiyun/mcp-quip-sse.git
cd mcp-quip-sse
```

2. Create a `.env` file and set your Quip API token:

```
QUIP_TOKEN=your_quip_api_token_here
```

3. Build and start the server using Docker Compose:

```bash
docker-compose up -d
```

The server will be running at `http://localhost:8082`.

### Manual Installation

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/chenhaiyun/mcp-quip-sse.git
cd mcp-quip-sse
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file and set your Quip API token:

```
QUIP_TOKEN=your_quip_api_token_here
```

4. Build the project:

```bash
npm run build
```

5. Start the server:

```bash
npm start
```

The server will be running at `http://localhost:8082`.

## Configuration

Configure the server using the `.env` file or environment variables:

| Variable            | Description               | Default Value               |
| ------------------- | ------------------------- | --------------------------- |
| `QUIP_TOKEN`        | Quip API token (required) | -                           |
| `QUIP_BASE_URL`     | Quip API base URL         | `https://platform.quip.com` |
| `PORT`              | Server port               | `8082`                      |
| `QUIP_STORAGE_PATH` | Path for CSV file storage | `./storage`                 |

## Usage

### Available MCP Tools

#### quip_read_spreadsheet

Read the content of a Quip spreadsheet by its thread ID.

**Parameters:**

- `threadId`: Quip document thread ID (required)
- `sheetName`: Sheet or tab name to read from (optional)

**Returns:**

Returns a JSON object containing:

- `csv_content`: CSV content (possibly truncated to a maximum of 10KB)
- `metadata`: Metadata including row count, size, whether it's truncated, etc.

### Resource URIs

To access complete CSV data, you can use the following resource URI formats:

- `quip://{threadId}?sheet={sheetName}`: Access via Quip thread ID and sheet name
- `file:///{storagePath}/{threadId}-{sheetName}.csv`: Direct access to locally stored CSV file

## Compatible Clients

Many MCP clients support the SSE transport protocol, including:

- [Claude Desktop App](https://claude.ai/download)
- [Continue](https://github.com/continuedev/continue)
- [Cursor](https://cursor.com)
- [LibreChat](https://github.com/danny-avila/LibreChat)
- And many others listed at [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients)

## Debugging

When debugging your MCP SSE implementation:

```bash
# Follow logs in real-time (for MacOS)
tail -n 20 -F ~/Library/Logs/Claude/mcp*.log
```

For more detailed debugging instructions, see the [MCP debugging guide](https://modelcontextprotocol.io/docs/tools/debugging).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
