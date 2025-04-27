import * as fs from "fs";
import * as path from "path";

/**
 * 存储接口，定义存储操作的标准方法
 */
export interface StorageInterface {
  /**
   * 保存 CSV 内容
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @param csvContent CSV 内容
   * @returns 资源标识符（如文件路径或对象 URL）
   */
  saveCsv(
    threadId: string,
    sheetName: string | undefined,
    csvContent: string
  ): string;

  /**
   * 获取 CSV 内容
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns CSV 内容，如果不存在则为 undefined
   */
  getCsv(threadId: string, sheetName?: string): string | undefined;

  /**
   * 获取资源 URI
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns 资源 URI
   */
  getResourceUri(threadId: string, sheetName?: string): string;

  /**
   * 获取存储的 CSV 的元数据
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns 包含 total_rows、total_size 等的元数据
   */
  getMetadata(threadId: string, sheetName?: string): Record<string, any>;
}

/**
 * 本地文件系统存储实现
 */
export class LocalStorage implements StorageInterface {
  storagePath: string;
  isFileProtocol: boolean;

  /**
   * 初始化本地存储
   *
   * @param storagePath 存储路径
   * @param isFileProtocol 是否使用文件协议
   */
  constructor(storagePath: string, isFileProtocol: boolean) {
    this.storagePath = storagePath;
    this.isFileProtocol = isFileProtocol;
    fs.mkdirSync(storagePath, { recursive: true });
    console.log(
      `LocalStorage 已初始化，路径: ${storagePath}, 是否使用文件协议: ${isFileProtocol}`
    );
  }

  /**
   * 获取文件路径
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns 文件路径
   */
  getFilePath(threadId: string, sheetName?: string): string {
    let fileName = `${threadId}`;
    if (sheetName) {
      // 替换无效的文件名字符
      const safeSheetName = sheetName.replace(/[\/\\]/g, "_");
      fileName += `-${safeSheetName}`;
    }
    fileName += ".csv";
    return path.join(this.storagePath, fileName);
  }

  /**
   * 保存 CSV 内容到本地文件
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @param csvContent CSV 内容
   * @returns 文件路径
   */
  saveCsv(
    threadId: string,
    sheetName: string | undefined,
    csvContent: string
  ): string {
    const filePath = this.getFilePath(threadId, sheetName);
    fs.writeFileSync(filePath, csvContent, { encoding: "utf-8" });

    // 计算并保存元数据
    const metadata = {
      total_rows: csvContent.split("\n").length,
      total_size: csvContent.length,
      resource_uri: this.getResourceUri(threadId, sheetName),
    };

    // 将元数据保存到单独的文件
    const metadataPath = filePath + ".meta";
    fs.writeFileSync(metadataPath, JSON.stringify(metadata), {
      encoding: "utf-8",
    });

    console.log(
      `已保存 CSV 到 ${filePath}（${metadata.total_size} 字节，${metadata.total_rows} 行）`
    );
    return filePath;
  }

  /**
   * 从本地文件获取 CSV 内容
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns CSV 内容，如果文件不存在则为 undefined
   */
  getCsv(threadId: string, sheetName?: string): string | undefined {
    const filePath = this.getFilePath(threadId, sheetName);
    if (!fs.existsSync(filePath)) {
      console.warn(`找不到 CSV 文件: ${filePath}`);
      return undefined;
    }

    const content = fs.readFileSync(filePath, { encoding: "utf-8" });
    console.log(`已从 ${filePath} 检索 CSV（${content.length} 字节）`);
    return content;
  }

  /**
   * 获取资源 URI
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns 资源 URI
   */
  getResourceUri(threadId: string, sheetName?: string): string {
    if (this.isFileProtocol) {
      return `file://${this.getFilePath(threadId, sheetName)}`;
    }
    if (sheetName) {
      return `quip://${threadId}?sheet=${encodeURIComponent(sheetName)}`;
    }
    return `quip://${threadId}`;
  }

  /**
   * 获取存储的 CSV 的元数据
   *
   * @param threadId Quip 文档线程 ID
   * @param sheetName 工作表名称（可选）
   * @returns 包含 total_rows、total_size 等的元数据
   */
  getMetadata(threadId: string, sheetName?: string): Record<string, any> {
    const filePath = this.getFilePath(threadId, sheetName);
    const metadataPath = filePath + ".meta";

    if (!fs.existsSync(metadataPath)) {
      console.warn(`找不到元数据文件: ${metadataPath}`);
      // 如果元数据文件不存在但 CSV 文件存在，则生成元数据
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, { encoding: "utf-8" });

        const metadata = {
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
    const metadataContent = fs.readFileSync(metadataPath, {
      encoding: "utf-8",
    });
    return JSON.parse(metadataContent);
  }
}

/**
 * 创建存储实例的工厂函数
 *
 * @param storageType 存储类型，当前支持 "local"
 * @param options 传递给存储构造函数的参数
 * @returns 存储实例
 */
export function createStorage(
  storageType: string = "local",
  options: { storagePath?: string; isFileProtocol?: boolean } = {}
): StorageInterface {
  if (storageType === "local") {
    const storagePath = options.storagePath || "./storage";
    return new LocalStorage(storagePath, options.isFileProtocol || false);
  } else {
    throw new Error(`不支持的存储类型: ${storageType}`);
  }
}

/**
 * 截断 CSV 内容，使其小于指定的最大大小
 *
 * @param csvContent 原始 CSV 内容
 * @param maxSize 最大大小（字节）（默认：10KB）
 * @returns [截断的 CSV 内容, 是否进行了截断]
 */
export function truncateCsvContent(
  csvContent: string,
  maxSize: number = 10 * 1024
): [string, boolean] {
  if (csvContent.length <= maxSize) {
    return [csvContent, false];
  }

  const lines = csvContent.split("\n");
  const header = lines[0] || "";

  // 始终包含标题
  const result = [header];
  let currentSize = header.length + 1; // +1 表示换行符

  // 添加尽可能多的数据行，但不超过 maxSize
  for (let i = 1; i < lines.length; i++) {
    const lineSize = lines[i].length + 1; // +1 表示换行符
    if (currentSize + lineSize > maxSize) {
      break;
    }

    result.push(lines[i]);
    currentSize += lineSize;
  }

  const truncatedContent = result.join("\n");
  console.log(
    `已将 CSV 从 ${csvContent.length} 字节截断为 ${truncatedContent.length} 字节`
  );
  return [truncatedContent, true];
}
