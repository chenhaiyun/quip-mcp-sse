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
exports.getQuipTools = getQuipTools;
exports.handleQuipReadSpreadsheet = handleQuipReadSpreadsheet;
var fs = require("fs");
var os = require("os");
var path = require("path");
var zod_1 = require("zod");
var quipClient_js_1 = require("./quipClient.js");
var storage_js_1 = require("./storage.js");
/**
 * 获取可用的 Quip 工具列表
 *
 * @returns Quip 工具的模式定义
 */
function getQuipTools() {
    return {
        quip_read_spreadsheet: {
            description: "通过其线程 ID 读取 Quip 电子表格的内容。返回一个 JSON 对象，包含截断的 CSV 内容（限制为 10KB）和元数据。对于大型电子表格，返回的内容可能会被截断。要访问完整的 CSV 数据，请使用资源接口，URI 格式为 'quip://{threadId}/{sheetName}' 或 'file:///<storage path>/{threadId}-{sheetName}.csv'。返回的数据结构包括：{ 'csv_content': string（可能被截断的 CSV 数据）, 'metadata': { 'rows': number, 'columns': number, 'is_truncated': boolean, 'resource_uri': string } }",
            parameters: zod_1.z.object({
                threadId: zod_1.z.string().describe("Quip 文档线程 ID"),
                sheetName: zod_1.z
                    .string()
                    .optional()
                    .describe("要读取的工作表或选项卡名称（可选）"),
            }),
        },
    };
}
/**
 * 处理 quip_read_spreadsheet 工具
 *
 * @param args 工具参数
 * @param storage 存储接口
 * @returns 工具执行结果
 */
function handleQuipReadSpreadsheet(args, storage) {
    return __awaiter(this, void 0, void 0, function () {
        var threadId, sheetName, quipToken, quipBaseUrl, client, isSpreadsheet, csvData, errorMessage, tempDir, xlsxPath, e_1, metadata, MAX_SIZE, _a, truncatedCsv, isTruncated, responseData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    threadId = args.threadId, sheetName = args.sheetName;
                    if (!threadId) {
                        throw new Error("threadId 是必需的");
                    }
                    console.log("\u6B63\u5728\u8BFB\u53D6\u7EBF\u7A0B ".concat(threadId, " \u7684\u7535\u5B50\u8868\u683C\uFF0C\u5DE5\u4F5C\u8868\uFF1A").concat(sheetName || "默认"));
                    quipToken = process.env.QUIP_TOKEN;
                    quipBaseUrl = process.env.QUIP_BASE_URL || "https://platform.quip.com";
                    if (!quipToken) {
                        throw new Error("未设置 QUIP_TOKEN 环境变量");
                    }
                    client = new quipClient_js_1.QuipClient(quipToken, quipBaseUrl);
                    return [4 /*yield*/, client.isSpreadsheet(threadId)];
                case 1:
                    isSpreadsheet = _b.sent();
                    if (!isSpreadsheet) {
                        throw new Error("\u7EBF\u7A0B ".concat(threadId, " \u4E0D\u662F\u7535\u5B50\u8868\u683C\u6216\u4E0D\u5B58\u5728"));
                    }
                    csvData = undefined;
                    errorMessage = undefined;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    // 首先将线程导出为 XLSX
                    console.log("\u6B63\u5728\u5C1D\u8BD5\u4E3B\u8981\u5BFC\u51FA\u65B9\u6CD5\uFF1A\u7EBF\u7A0B ".concat(threadId, " \u7684 XLSX"));
                    tempDir = os.tmpdir();
                    xlsxPath = path.join(tempDir, "".concat(threadId, ".xlsx"));
                    return [4 /*yield*/, client.exportThreadToXlsx(threadId, xlsxPath)];
                case 3:
                    _b.sent();
                    // 将 XLSX 转换为 CSV
                    console.log("\u6B63\u5728\u5C06\u5DE5\u4F5C\u8868 '".concat(sheetName || "默认", "' \u4ECE XLSX \u8F6C\u6362\u4E3A CSV"));
                    csvData = (0, quipClient_js_1.convertXlsxToCsv)(xlsxPath, sheetName);
                    // 清理临时 XLSX 文件
                    try {
                        fs.unlinkSync(xlsxPath);
                        console.log("\u5DF2\u6E05\u7406\u4E34\u65F6 XLSX \u6587\u4EF6\uFF1A".concat(xlsxPath));
                    }
                    catch (e) {
                        console.warn("\u65E0\u6CD5\u6E05\u7406\u4E34\u65F6 XLSX \u6587\u4EF6\uFF1A".concat(e));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _b.sent();
                    errorMessage = String(e_1);
                    console.warn("\u4E3B\u8981\u5BFC\u51FA\u65B9\u6CD5\u5931\u8D25\uFF1A".concat(errorMessage));
                    throw new Error("\u5BFC\u51FA\u7535\u5B50\u8868\u683C\u5931\u8D25\uFF1A".concat(errorMessage));
                case 5:
                    if (!csvData) {
                        throw new Error("导出数据失败：未生成 CSV 内容");
                    }
                    // 将完整的 CSV 内容保存到存储
                    storage.saveCsv(threadId, sheetName, csvData);
                    metadata = storage.getMetadata(threadId, sheetName);
                    MAX_SIZE = 10 * 1024;
                    _a = (0, storage_js_1.truncateCsvContent)(csvData, MAX_SIZE), truncatedCsv = _a[0], isTruncated = _a[1];
                    // 更新元数据中的截断信息
                    metadata.is_truncated = isTruncated;
                    responseData = {
                        csv_content: truncatedCsv,
                        metadata: metadata,
                    };
                    // 转换为 JSON 并返回
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(responseData),
                                },
                            ],
                        }];
            }
        });
    });
}
