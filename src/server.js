"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var dotenv_1 = require("dotenv");
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
var cors_1 = require("cors");
var path = require("path");
var fs = require("fs");
var zod_1 = require("zod");
var tools_js_1 = require("./tools.js");
var storage_js_1 = require("./storage.js");
// 加载环境变量
(0, dotenv_1.config)();
// 初始化存储
var storagePath = process.env.QUIP_STORAGE_PATH || "./storage";
var storage = (0, storage_js_1.createStorage)("local", {
    storagePath: storagePath,
    isFileProtocol: true,
});
// 创建 MCP 服务器
var server = new mcp_js_1.McpServer({
    name: "mcp-quip-sse",
    version: "1.0.0",
});
// 注册 Quip 工具
var quipTools = (0, tools_js_1.getQuipTools)();
// 添加 quip_read_spreadsheet 工具
server.tool("quip_read_spreadsheet", {
    threadId: zod_1.z.string().describe("Quip 文档线程 ID"),
    sheetName: zod_1.z
        .string()
        .optional()
        .describe("要读取的工作表或选项卡名称（可选）"),
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("调用 quip_read_spreadsheet 工具，参数:", args);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, tools_js_1.handleQuipReadSpreadsheet)(args, storage)];
            case 2:
                result = _a.sent();
                console.log("quip_read_spreadsheet 工具执行成功");
                return [2 /*return*/, result];
            case 3:
                error_1 = _a.sent();
                console.error("quip_read_spreadsheet 工具执行失败:", error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); });
// 添加资源模板
server.resource("file", new mcp_js_1.ResourceTemplate("file://{path}", { list: undefined }), function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, content;
    return __generator(this, function (_a) {
        filePath = uri.pathname;
        if (!fs.existsSync(filePath)) {
            throw new Error("\u8D44\u6E90\u4E0D\u5B58\u5728: ".concat(uri.href));
        }
        content = fs.readFileSync(filePath, { encoding: "utf-8" });
        return [2 /*return*/, {
                contents: [
                    {
                        uri: uri.href,
                        text: content,
                    },
                ],
            }];
    });
}); });
server.resource("quip", new mcp_js_1.ResourceTemplate("quip://{threadId}", { list: undefined }), function (uri_1, _a) { return __awaiter(void 0, [uri_1, _a], void 0, function (uri, _b) {
    var parsedUrl, sheetNameParam, sheetName, csvContent;
    var threadId = _b.threadId;
    return __generator(this, function (_c) {
        parsedUrl = new URL(uri.href);
        console.info("parsed URL", parsedUrl);
        sheetNameParam = parsedUrl.searchParams.get("sheet");
        sheetName = sheetNameParam !== null ? sheetNameParam : undefined;
        csvContent = storage.getCsv(String(threadId), sheetName);
        if (!csvContent) {
            throw new Error("\u8D44\u6E90\u4E0D\u5B58\u5728: ".concat(uri.href));
        }
        return [2 /*return*/, {
                contents: [
                    {
                        uri: uri.href,
                        text: csvContent,
                    },
                ],
            }];
    });
}); });
// 创建 Express 应用
var app = (0, express_1.default)();
// 配置 CORS 中间件以允许所有来源
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
}));
// 添加 body-parser 中间件
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 添加简单的根路由处理程序
app.get("/", function (req, res) {
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
app.get("/resources", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var resources, files, _i, files_1, file, filePath, stats, threadId, sheetName, parts, metadata, resourceUri, resourceName, description;
    return __generator(this, function (_a) {
        try {
            resources = [];
            if (fs.existsSync(storagePath)) {
                files = fs.readdirSync(storagePath);
                for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                    file = files_1[_i];
                    if (file.endsWith(".csv") && !file.endsWith(".meta")) {
                        filePath = path.join(storagePath, file);
                        stats = fs.statSync(filePath);
                        threadId = void 0, sheetName = void 0;
                        if (file.includes("-")) {
                            parts = file.split("-");
                            threadId = parts[0];
                            sheetName = parts.slice(1).join("-").replace(".csv", "");
                        }
                        else {
                            threadId = file.replace(".csv", "");
                            sheetName = undefined;
                        }
                        metadata = storage.getMetadata(threadId, sheetName);
                        resourceUri = storage.getResourceUri(threadId, sheetName);
                        resourceName = "Quip \u7EBF\u7A0B\uFF08\u7535\u5B50\u8868\u683C\uFF09: ".concat(threadId);
                        if (sheetName) {
                            resourceName += " (\u5DE5\u4F5C\u8868: ".concat(sheetName, ")");
                        }
                        description = "\u6765\u81EA Quip \u7535\u5B50\u8868\u683C\u7684 CSV \u6570\u636E\u3002".concat(metadata.total_rows, " \u884C\uFF0C").concat(metadata.total_size, " \u5B57\u8282\u3002");
                        resources.push({
                            uri: resourceUri,
                            name: resourceName,
                            description: description,
                        });
                    }
                }
            }
            res.json(resources);
        }
        catch (error) {
            console.error("获取资源时出错:", error);
            res.status(500).json({ error: "获取资源时出错" });
        }
        return [2 /*return*/];
    });
}); });
// 设置 SSE 和消息处理
var transport;
app.get("/sse", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("收到 SSE 连接请求");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // 创建 SSE 传输
                // 注意：不要手动设置 SSE 头，让 SSEServerTransport 处理
                transport = new sse_js_1.SSEServerTransport("/messages", res);
                console.log("SSE 传输已创建");
                // 连接到 MCP 服务器
                return [4 /*yield*/, server.connect(transport)];
            case 2:
                // 连接到 MCP 服务器
                _a.sent();
                console.log("MCP 服务器已连接到 SSE 传输");
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error("处理 SSE 连接时出错:", error_2);
                // 只有在头部尚未发送的情况下才尝试发送错误响应
                if (!res.headersSent) {
                    res.status(500).json({ error: "处理 SSE 连接时出错" });
                }
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// 定义消息处理函数
var handleMessages = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // 注意：要支持多个同时连接，这些消息需要
                // 路由到特定的匹配传输。（此逻辑未在此处实现，为简单起见。）
                console.log("收到 POST 请求到 /messages");
                console.log("请求头:", req.headers);
                console.log("请求体:", req.body);
                if (!transport) {
                    console.error("错误: 尝试处理消息，但没有活动的 SSE 连接");
                    return [2 /*return*/, res.status(400).json({ error: "没有活动的 SSE 连接" })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // 使用 as any 来绕过类型检查
                return [4 /*yield*/, transport.handlePostMessage(req, res)];
            case 2:
                // 使用 as any 来绕过类型检查
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error("处理 POST 消息时出错:", error_3);
                res.status(500).json({ error: "处理消息时出错" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// 注册路由
app.post("/messages", handleMessages);
// 启动服务器
var PORT = process.env.PORT || 3001;
app.listen(PORT, function () {
    console.log("MCP Quip SSE \u670D\u52A1\u5668\u5728\u7AEF\u53E3 ".concat(PORT, " \u4E0A\u8FD0\u884C"));
    // 检查必需的环境变量
    if (!process.env.QUIP_TOKEN) {
        console.warn("警告: 未设置 QUIP_TOKEN 环境变量。Quip API 调用将失败。");
    }
    console.log("\u5B58\u50A8\u8DEF\u5F84: ".concat(storagePath));
});
