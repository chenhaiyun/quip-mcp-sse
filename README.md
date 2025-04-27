# MCP Quip SSE 服务器

一个使用 Server-Sent Events (SSE) 作为传输层的 Model Context Protocol (MCP) 服务器，用于访问 Quip 电子表格数据。

## 概述

这个项目实现了一个 MCP 服务器，可以让 AI 助手通过 MCP 协议访问 Quip 电子表格数据。它使用 SSE 作为传输层，适用于 Web 应用程序和支持 MCP 的 AI 客户端。

主要功能：

- 使用 SSE 作为传输层实现 MCP 服务器
- 提供访问 Quip 电子表格数据的工具
- 支持将电子表格数据导出为 CSV 格式
- 支持通过资源 URI 访问完整的电子表格数据

## 安装

### 先决条件

- Node.js (v18 或更高版本)
- NPM 或 Yarn
- Quip API 令牌

### 使用 Docker 安装

1. 克隆仓库并进入项目目录：

```bash
git clone https://github.com/chenhaiyun/mcp-quip-sse.git
cd mcp-quip-sse
```

2. 创建 `.env` 文件并设置您的 Quip API 令牌：

```
QUIP_TOKEN=your_quip_api_token_here
```

3. 使用 Docker Compose 构建并启动服务器：

```bash
docker-compose up -d
```

服务器将在 `http://localhost:8082` 上运行。

### 手动安装

1. 克隆仓库并进入项目目录：

```bash
git clone https://github.com/chenhaiyun/mcp-quip-sse.git
cd mcp-quip-sse
```

2. 安装依赖：

```bash
npm install
```

3. 创建 `.env` 文件并设置您的 Quip API 令牌：

```
QUIP_TOKEN=your_quip_api_token_here
```

4. 构建项目：

```bash
npm run build
```

5. 启动服务器：

```bash
npm start
```

服务器将在 `http://localhost:8082` 上运行。

## 配置

通过 `.env` 文件或环境变量配置服务器：

| 变量                | 描述                  | 默认值                      |
| ------------------- | --------------------- | --------------------------- |
| `QUIP_TOKEN`        | Quip API 令牌（必需） | -                           |
| `QUIP_BASE_URL`     | Quip API 基础 URL     | `https://platform.quip.com` |
| `PORT`              | 服务器端口            | `8082`                      |
| `QUIP_STORAGE_PATH` | CSV 文件的存储路径    | `./storage`                 |

## 使用方法

### 可用的 MCP 工具

#### quip_read_spreadsheet

通过其线程 ID 读取 Quip 电子表格的内容。

**参数：**

- `threadId`：Quip 文档线程 ID（必需）
- `sheetName`：要读取的工作表或选项卡名称（可选）

**返回：**

返回一个 JSON 对象，包含：

- `csv_content`：CSV 内容（可能被截断为最大 10KB）
- `metadata`：包含行数、大小、是否被截断等信息的元数据

### 资源 URI

要访问完整的 CSV 数据，可以使用以下资源 URI 格式：

- `quip://{threadId}?sheet={sheetName}`：通过 Quip 线程 ID 和工作表名称访问
- `file:///{storagePath}/{threadId}-{sheetName}.csv`：直接访问本地存储的 CSV 文件

## 兼容的客户端

许多 MCP 客户端支持 SSE 传输协议，包括：

- [Claude Desktop App](https://claude.ai/download)
- [Continue](https://github.com/continuedev/continue)
- [Cursor](https://cursor.com)
- [LibreChat](https://github.com/danny-avila/LibreChat)
- 以及 [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients) 上列出的许多其他客户端

## 调试

调试 MCP SSE 实现时：

```bash
# 实时查看日志（适用于 MacOS）
tail -n 20 -F ~/Library/Logs/Claude/mcp*.log
```

有关更详细的调试说明，请参阅 [MCP 调试指南](https://modelcontextprotocol.io/docs/tools/debugging)。

## 许可证

本项目采用 MIT 许可证 - 有关详细信息，请参阅 LICENSE 文件。
