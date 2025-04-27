"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorage = void 0;
exports.createStorage = createStorage;
exports.truncateCsvContent = truncateCsvContent;
var fs = require("fs");
var path = require("path");
/**
 * 本地文件系统存储实现
 */
var LocalStorage = /** @class */ (function () {
    /**
     * 初始化本地存储
     *
     * @param storagePath 存储路径
     * @param isFileProtocol 是否使用文件协议
     */
    function LocalStorage(storagePath, isFileProtocol) {
        this.storagePath = storagePath;
        this.isFileProtocol = isFileProtocol;
        fs.mkdirSync(storagePath, { recursive: true });
        console.log("LocalStorage \u5DF2\u521D\u59CB\u5316\uFF0C\u8DEF\u5F84: ".concat(storagePath, ", \u662F\u5426\u4F7F\u7528\u6587\u4EF6\u534F\u8BAE: ").concat(isFileProtocol));
    }
    /**
     * 获取文件路径
     *
     * @param threadId Quip 文档线程 ID
     * @param sheetName 工作表名称（可选）
     * @returns 文件路径
     */
    LocalStorage.prototype.getFilePath = function (threadId, sheetName) {
        var fileName = "".concat(threadId);
        if (sheetName) {
            // 替换无效的文件名字符
            var safeSheetName = sheetName.replace(/[\/\\]/g, "_");
            fileName += "-".concat(safeSheetName);
        }
        fileName += ".csv";
        return path.join(this.storagePath, fileName);
    };
    /**
     * 保存 CSV 内容到本地文件
     *
     * @param threadId Quip 文档线程 ID
     * @param sheetName 工作表名称（可选）
     * @param csvContent CSV 内容
     * @returns 文件路径
     */
    LocalStorage.prototype.saveCsv = function (threadId, sheetName, csvContent) {
        var filePath = this.getFilePath(threadId, sheetName);
        fs.writeFileSync(filePath, csvContent, { encoding: "utf-8" });
        // 计算并保存元数据
        var metadata = {
            total_rows: csvContent.split("\n").length,
            total_size: csvContent.length,
            resource_uri: this.getResourceUri(threadId, sheetName),
        };
        // 将元数据保存到单独的文件
        var metadataPath = filePath + ".meta";
        fs.writeFileSync(metadataPath, JSON.stringify(metadata), {
            encoding: "utf-8",
        });
        console.log("\u5DF2\u4FDD\u5B58 CSV \u5230 ".concat(filePath, "\uFF08").concat(metadata.total_size, " \u5B57\u8282\uFF0C").concat(metadata.total_rows, " \u884C\uFF09"));
        return filePath;
    };
    /**
     * 从本地文件获取 CSV 内容
     *
     * @param threadId Quip 文档线程 ID
     * @param sheetName 工作表名称（可选）
     * @returns CSV 内容，如果文件不存在则为 undefined
     */
    LocalStorage.prototype.getCsv = function (threadId, sheetName) {
        var filePath = this.getFilePath(threadId, sheetName);
        if (!fs.existsSync(filePath)) {
            console.warn("\u627E\u4E0D\u5230 CSV \u6587\u4EF6: ".concat(filePath));
            return undefined;
        }
        var content = fs.readFileSync(filePath, { encoding: "utf-8" });
        console.log("\u5DF2\u4ECE ".concat(filePath, " \u68C0\u7D22 CSV\uFF08").concat(content.length, " \u5B57\u8282\uFF09"));
        return content;
    };
    /**
     * 获取资源 URI
     *
     * @param threadId Quip 文档线程 ID
     * @param sheetName 工作表名称（可选）
     * @returns 资源 URI
     */
    LocalStorage.prototype.getResourceUri = function (threadId, sheetName) {
        if (this.isFileProtocol) {
            return "file://".concat(this.getFilePath(threadId, sheetName));
        }
        if (sheetName) {
            return "quip://".concat(threadId, "?sheet=").concat(encodeURIComponent(sheetName));
        }
        return "quip://".concat(threadId);
    };
    /**
     * 获取存储的 CSV 的元数据
     *
     * @param threadId Quip 文档线程 ID
     * @param sheetName 工作表名称（可选）
     * @returns 包含 total_rows、total_size 等的元数据
     */
    LocalStorage.prototype.getMetadata = function (threadId, sheetName) {
        var filePath = this.getFilePath(threadId, sheetName);
        var metadataPath = filePath + ".meta";
        if (!fs.existsSync(metadataPath)) {
            console.warn("\u627E\u4E0D\u5230\u5143\u6570\u636E\u6587\u4EF6: ".concat(metadataPath));
            // 如果元数据文件不存在但 CSV 文件存在，则生成元数据
            if (fs.existsSync(filePath)) {
                var content = fs.readFileSync(filePath, { encoding: "utf-8" });
                var metadata = {
                    total_rows: content.split("\n").length,
                    total_size: content.length,
                    resource_uri: this.getResourceUri(threadId, sheetName),
                };
                // 保存生成的元数据
                fs.writeFileSync(metadataPath, JSON.stringify(metadata), {
                    encoding: "utf-8",
                });
                return metadata;
            }
            // 如果两个文件都不存在，则返回空元数据
            return {
                total_rows: 0,
                total_size: 0,
                resource_uri: this.getResourceUri(threadId, sheetName),
            };
        }
        // 从文件读取元数据
        var metadataContent = fs.readFileSync(metadataPath, {
            encoding: "utf-8",
        });
        return JSON.parse(metadataContent);
    };
    return LocalStorage;
}());
exports.LocalStorage = LocalStorage;
/**
 * 创建存储实例的工厂函数
 *
 * @param storageType 存储类型，当前支持 "local"
 * @param options 传递给存储构造函数的参数
 * @returns 存储实例
 */
function createStorage(storageType, options) {
    if (storageType === void 0) { storageType = "local"; }
    if (options === void 0) { options = {}; }
    if (storageType === "local") {
        var storagePath = options.storagePath || "./storage";
        return new LocalStorage(storagePath, options.isFileProtocol || false);
    }
    else {
        throw new Error("\u4E0D\u652F\u6301\u7684\u5B58\u50A8\u7C7B\u578B: ".concat(storageType));
    }
}
/**
 * 截断 CSV 内容，使其小于指定的最大大小
 *
 * @param csvContent 原始 CSV 内容
 * @param maxSize 最大大小（字节）（默认：10KB）
 * @returns [截断的 CSV 内容, 是否进行了截断]
 */
function truncateCsvContent(csvContent, maxSize) {
    if (maxSize === void 0) { maxSize = 10 * 1024; }
    if (csvContent.length <= maxSize) {
        return [csvContent, false];
    }
    var lines = csvContent.split("\n");
    var header = lines[0] || "";
    // 始终包含标题
    var result = [header];
    var currentSize = header.length + 1; // +1 表示换行符
    // 添加尽可能多的数据行，但不超过 maxSize
    for (var i = 1; i < lines.length; i++) {
        var lineSize = lines[i].length + 1; // +1 表示换行符
        if (currentSize + lineSize > maxSize) {
            break;
        }
        result.push(lines[i]);
        currentSize += lineSize;
    }
    var truncatedContent = result.join("\n");
    console.log("\u5DF2\u5C06 CSV \u4ECE ".concat(csvContent.length, " \u5B57\u8282\u622A\u65AD\u4E3A ").concat(truncatedContent.length, " \u5B57\u8282"));
    return [truncatedContent, true];
}
