import express from "express";
import { config } from "dotenv";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import * as url from "url";
import { z } from "zod";
import { getQuipTools, handleQuipReadSpreadsheet } from "./tools.js";
import { createStorage, StorageInterface } from "./storage.js";

// 加载环境变量
config();

// 初始化存储
const storagePath = process.env.QUIP_STORAGE_PATH || "./storage";
const storage: StorageInterface = createStorage("local", {
  storagePath,
  isFileProtocol: true,
});

// 创建 MCP 服务器
const server = new McpServer({
  name: "mcp-quip-sse",
  version: "1.0.0",
});

// 注册 Quip 工具
const quipTools = getQuipTools();

// 添加 quip_read_spreadsheet 工具
server.tool(
  "quip_read_spreadsheet",
  {
    threadId: z.string().describe("Quip 文档线程 ID"),
    sheetName: z
      .string()
      .optional()
      .describe("要读取的工作表或选项卡名称（可选）"),
  },
  async (args: any) => {
    console.log("调用 quip_read_spreadsheet 工具，参数:", args);
    try {
      const result = await handleQuipReadSpreadsheet(
        args as { threadId: string; sheetName?: string },
        storage
      );
      console.log("quip_read_spreadsheet 工具执行成功");
      return result;
    } catch (error) {
      console.error("quip_read_spreadsheet 工具执行失败:", error);
      throw error;
    }
  }
);

// 添加资源模板
server.resource(
  "file",
  new ResourceTemplate("file://{path}", { list: undefined }),
  async (uri) => {
    const filePath = uri.pathname;

    if (!fs.existsSync(filePath)) {
      throw new Error(`资源不存在: ${uri.href}`);
    }

    const content = fs.readFileSync(filePath, { encoding: "utf-8" });

    return {
      contents: [
        {
          uri: uri.href,
          text: content,
        },
      ],
    };
  }
);

server.resource(
  "quip",
  new ResourceTemplate("quip://{threadId}", { list: undefined }),
  async (uri, { threadId }) => {
    // 解析查询参数
    const parsedUrl = new URL(uri.href);
    console.info("parsed URL", parsedUrl);
    const sheetNameParam = parsedUrl.searchParams.get("sheet");
    const sheetName = sheetNameParam !== null ? sheetNameParam : undefined;

    // 从存储中获取 CSV 内容
    const csvContent = storage.getCsv(String(threadId), sheetName);
    if (!csvContent) {
      throw new Error(`资源不存在: ${uri.href}`);
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: csvContent,
        },
      ],
    };
  }
);

// 创建 Express 应用
const app = express();

// 配置 CORS 中间件以允许所有来源
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);

// 添加 body-parser 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加简单的根路由处理程序
app.get("/", (req, res) => {
  res.json({
    name: "MCP Quip SSE Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      "/": "服务器信息（此响应）",
      "/sse": "用于 MCP 连接的 Server-Sent Events 端点",
      "/messages": "用于 MCP 消息的 POST 端点",
    },
    tools: [
      {
        name: "quip_read_spreadsheet",
        description: "通过其线程 ID 读取 Quip 电子表格的内容",
      },
    ],
  });
});

// 添加资源发现端点
app.get("/resources", async (req, res) => {
  try {
    // 扫描存储目录中的 CSV 文件
    const resources = [];

    if (fs.existsSync(storagePath)) {
      const files = fs.readdirSync(storagePath);

      for (const file of files) {
        if (file.endsWith(".csv") && !file.endsWith(".meta")) {
          const filePath = path.join(storagePath, file);
          const stats = fs.statSync(filePath);

          // 从文件名中提取 threadId 和 sheetName
          let threadId, sheetName;
          if (file.includes("-")) {
            const parts = file.split("-");
            threadId = parts[0];
            sheetName = parts.slice(1).join("-").replace(".csv", "");
          } else {
            threadId = file.replace(".csv", "");
            sheetName = undefined;
          }

          // 获取元数据
          const metadata = storage.getMetadata(threadId, sheetName);

          // 创建资源 URI
          const resourceUri = storage.getResourceUri(threadId, sheetName);

          // 创建资源名称
          let resourceName = `Quip 线程（电子表格）: ${threadId}`;
          if (sheetName) {
            resourceName += ` (工作表: ${sheetName})`;
          }

          // 创建资源描述
          const description = `来自 Quip 电子表格的 CSV 数据。${metadata.total_rows} 行，${metadata.total_size} 字节。`;

          resources.push({
            uri: resourceUri,
            name: resourceName,
            description: description,
          });
        }
      }
    }

    res.json(resources);
  } catch (error) {
    console.error("获取资源时出错:", error);
    res.status(500).json({ error: "获取资源时出错" });
  }
});

// 设置 SSE 和消息处理
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  console.log("收到 SSE 连接请求");
  try {
    // 创建 SSE 传输
    // 注意：不要手动设置 SSE 头，让 SSEServerTransport 处理
    transport = new SSEServerTransport("/messages", res);
    console.log("SSE 传输已创建");

    // 连接到 MCP 服务器
    await server.connect(transport);
    console.log("MCP 服务器已连接到 SSE 传输");
  } catch (error) {
    console.error("处理 SSE 连接时出错:", error);
    // 只有在头部尚未发送的情况下才尝试发送错误响应
    if (!res.headersSent) {
      res.status(500).json({ error: "处理 SSE 连接时出错" });
    }
  }
});

// 创建消息处理函数
const messageHandler = async (req: express.Request, res: express.Response) => {
  console.log("收到 POST 请求到 /messages");
  console.log("请求头:", req.headers);
  console.log("请求体:", req.body);

  // 检查会话 ID
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId");
  console.log(`处理会话 ID: ${sessionId}`);

  if (!transport) {
    console.error("错误: 尝试处理消息，但没有活动的 SSE 连接");
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "没有活动的 SSE 连接" },
      id: req.body?.id || null,
    });
  }

  // 检查会话 ID 是否匹配
  if (sessionId !== transport.sessionId) {
    console.error(
      `错误: 会话 ID 不匹配，预期: ${transport.sessionId}，实际: ${sessionId}`
    );
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "会话 ID 不匹配" },
      id: req.body?.id || null,
    });
  }

  try {
    // 检查请求体是否为有效的 JSON-RPC 消息
    const message = req.body;
    if (!message || !message.jsonrpc || message.jsonrpc !== "2.0") {
      console.error("无效的 JSON-RPC 消息:", message);
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32600, message: "无效的 JSON-RPC 请求" },
        id: message?.id || null,
      });
    }

    console.log(`处理 JSON-RPC 方法: ${message.method}`);

    // 直接将请求传递给 transport 的 handlePostMessage 方法
    await transport.handlePostMessage(req, res, req.body);
    return;
  } catch (error) {
    console.error("处理 POST 消息时出错:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "内部错误" },
        id: req.body?.id || null,
      });
    }
  }
};

// 注册路由
app.post("/messages", messageHandler as any);

// 启动服务器
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`MCP Quip SSE 服务器在端口 ${PORT} 上运行`);

  // 检查必需的环境变量
  if (!process.env.QUIP_TOKEN) {
    console.warn("警告: 未设置 QUIP_TOKEN 环境变量。Quip API 调用将失败。");
  }

  console.log(`存储路径: ${storagePath}`);
});
