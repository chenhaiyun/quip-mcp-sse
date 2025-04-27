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
exports.QuipClient = void 0;
exports.convertXlsxToCsv = convertXlsxToCsv;
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var XLSX = require("xlsx");
/**
 * Quip API 客户端实现
 */
var QuipClient = /** @class */ (function () {
    /**
     * 初始化 Quip 客户端
     *
     * @param accessToken Quip API 访问令牌
     * @param baseUrl Quip API 基础 URL（默认：https://platform.quip.com）
     */
    function QuipClient(accessToken, baseUrl) {
        if (baseUrl === void 0) { baseUrl = "https://platform.quip.com"; }
        this.accessToken = accessToken;
        this.baseUrl = baseUrl.replace(/\/$/, ""); // 移除尾部斜杠
        console.log("QuipClient \u5DF2\u521D\u59CB\u5316\uFF0C\u57FA\u7840 URL: ".concat(this.baseUrl));
    }
    /**
     * 获取线程信息
     *
     * @param threadId 线程 ID
     * @returns 线程信息
     */
    QuipClient.prototype.getThread = function (threadId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\u83B7\u53D6\u7EBF\u7A0B: ".concat(threadId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/1/threads/").concat(threadId), {
                                headers: {
                                    Authorization: "Bearer ".concat(this.accessToken),
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 3:
                        error_1 = _a.sent();
                        console.error("\u83B7\u53D6\u7EBF\u7A0B\u5931\u8D25: ".concat(error_1));
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 将线程导出为 XLSX 格式并保存到本地
     *
     * @param threadId 线程 ID
     * @param outputPath 输出路径
     * @returns 保存的 XLSX 文件路径
     */
    QuipClient.prototype.exportThreadToXlsx = function (threadId, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var response, dir, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\u5C06\u7EBF\u7A0B ".concat(threadId, " \u5BFC\u51FA\u4E3A XLSX"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/1/threads/").concat(threadId, "/export/xlsx"), {
                                headers: {
                                    Authorization: "Bearer ".concat(this.accessToken),
                                },
                                responseType: "arraybuffer",
                            })];
                    case 2:
                        response = _a.sent();
                        dir = path.dirname(outputPath);
                        fs.mkdirSync(dir, { recursive: true });
                        // 写入文件
                        fs.writeFileSync(outputPath, Buffer.from(response.data));
                        console.log("\u6210\u529F\u5BFC\u51FA XLSX \u5230 ".concat(outputPath));
                        return [2 /*return*/, outputPath];
                    case 3:
                        error_2 = _a.sent();
                        console.error("\u5BFC\u51FA XLSX \u5931\u8D25: ".concat(error_2));
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 检查线程是否为电子表格
     *
     * @param threadId 线程 ID
     * @returns 如果线程是电子表格则为 true，否则为 false
     */
    QuipClient.prototype.isSpreadsheet = function (threadId) {
        return __awaiter(this, void 0, void 0, function () {
            var thread, threadType, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getThread(threadId)];
                    case 1:
                        thread = _b.sent();
                        if (!thread || !thread.thread) {
                            return [2 /*return*/, false];
                        }
                        threadType = (_a = thread.thread.type) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                        return [2 /*return*/, threadType === "spreadsheet"];
                    case 2:
                        error_3 = _b.sent();
                        console.error("\u68C0\u67E5\u7EBF\u7A0B\u662F\u5426\u4E3A\u7535\u5B50\u8868\u683C\u65F6\u51FA\u9519: ".concat(error_3));
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return QuipClient;
}());
exports.QuipClient = QuipClient;
/**
 * 将 XLSX 文件转换为 CSV 格式
 *
 * @param xlsxPath XLSX 文件路径
 * @param sheetName 工作表名称（可选）
 * @returns CSV 数据字符串
 */
function convertXlsxToCsv(xlsxPath, sheetName) {
    console.log("\u4ECE ".concat(xlsxPath, " \u8BFB\u53D6 XLSX \u6587\u4EF6"));
    // 加载工作簿
    var workbook = XLSX.readFile(xlsxPath);
    // 确定要使用的工作表
    var targetSheet;
    if (sheetName) {
        // 尝试精确匹配
        if (workbook.Sheets[sheetName]) {
            targetSheet = workbook.Sheets[sheetName];
        }
        else {
            // 尝试不区分大小写的匹配
            var sheetLower_1 = sheetName.toLowerCase();
            var matchingSheet = Object.keys(workbook.Sheets).find(function (s) { return s.toLowerCase() === sheetLower_1; });
            if (matchingSheet) {
                targetSheet = workbook.Sheets[matchingSheet];
            }
            else {
                throw new Error("\u627E\u4E0D\u5230\u5DE5\u4F5C\u8868 '".concat(sheetName, "'\u3002\u53EF\u7528\u5DE5\u4F5C\u8868: ").concat(workbook.SheetNames.join(", ")));
            }
        }
    }
    else {
        // 如果未指定名称，则使用第一个工作表
        targetSheet = workbook.Sheets[workbook.SheetNames[0]];
    }
    // 转换为 CSV
    var csvOptions = {
        FS: ",",
        RS: "\n",
        strip: true,
        blankrows: false,
    };
    var csv = XLSX.utils.sheet_to_csv(targetSheet, csvOptions);
    return csv;
}
