import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { z } from "zod";
import { QuipClient, convertXlsxToCsv } from "./quipClient.js";
import { StorageInterface, truncateCsvContent } from "./storage.js";

/**
 * 获取可用的 Quip 工具列表
 *
 * @returns Quip 工具的模式定义
 */
export function getQuipTools() {
  return {
    quip_read_spreadsheet: {
      description:
        "通过其线程 ID 读取 Quip 电子表格的内容。返回一个 JSON 对象，包含截断的 CSV 内容（限制为 10KB）和元数据。对于大型电子表格，返回的内容可能会被截断。要访问完整的 CSV 数据，请使用资源接口，URI 格式为 'quip://{threadId}/{sheetName}' 或 'file:///<storage path>/{threadId}-{sheetName}.csv'。返回的数据结构包括：{ 'csv_content': string（可能被截断的 CSV 数据）, 'metadata': { 'rows': number, 'columns': number, 'is_truncated': boolean, 'resource_uri': string } }",
      parameters: z.object({
        threadId: z.string().describe("Quip 文档线程 ID"),
        sheetName: z
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
export async function handleQuipReadSpreadsheet(
  args: { threadId: string; sheetName?: string },
  storage: StorageInterface
) {
  const { threadId, sheetName } = args;

  if (!threadId) {
    throw new Error("threadId 是必需的");
  }

  console.log(
    `正在读取线程 ${threadId} 的电子表格，工作表：${sheetName || "默认"}`
  );

  // 从环境变量获取 Quip 令牌
  const quipToken = process.env.QUIP_TOKEN;
  const quipBaseUrl = process.env.QUIP_BASE_URL || "https://platform.quip.com";

  if (!quipToken) {
    throw new Error("未设置 QUIP_TOKEN 环境变量");
  }

  // 初始化 Quip 客户端
  const client = new QuipClient(quipToken, quipBaseUrl);

  // 检查线程是否为电子表格
  const isSpreadsheet = await client.isSpreadsheet(threadId);
  if (!isSpreadsheet) {
    throw new Error(`线程 ${threadId} 不是电子表格或不存在`);
  }

  // 尝试主要导出方法
  let csvData: string | undefined = undefined;
  let errorMessage: string | undefined = undefined;

  try {
    // 首先将线程导出为 XLSX
    console.log(`正在尝试主要导出方法：线程 ${threadId} 的 XLSX`);
    const tempDir = os.tmpdir();
    const xlsxPath = path.join(tempDir, `${threadId}.xlsx`);

    await client.exportThreadToXlsx(threadId, xlsxPath);

    // 将 XLSX 转换为 CSV
    console.log(`正在将工作表 '${sheetName || "默认"}' 从 XLSX 转换为 CSV`);
    csvData = convertXlsxToCsv(xlsxPath, sheetName);

    // 清理临时 XLSX 文件
    try {
      fs.unlinkSync(xlsxPath);
      console.log(`已清理临时 XLSX 文件：${xlsxPath}`);
    } catch (e) {
      console.warn(`无法清理临时 XLSX 文件：${e}`);
    }
  } catch (e) {
    errorMessage = String(e);
    console.warn(`主要导出方法失败：${errorMessage}`);
    throw new Error(`导出电子表格失败：${errorMessage}`);
  }

  if (!csvData) {
    throw new Error("导出数据失败：未生成 CSV 内容");
  }

  // 将完整的 CSV 内容保存到存储
  storage.saveCsv(threadId, sheetName, csvData);

  // 获取元数据
  const metadata = storage.getMetadata(threadId, sheetName);

  // 如果 CSV 内容太大（> 10KB），则截断
  const MAX_SIZE = 10 * 1024; // 10KB
  const [truncatedCsv, isTruncated] = truncateCsvContent(csvData, MAX_SIZE);

  // 更新元数据中的截断信息
  metadata.is_truncated = isTruncated;

  // 创建带有 CSV 内容和元数据的响应
  const responseData = {
    csv_content: truncatedCsv,
    metadata: metadata,
  };

  // 转换为 JSON 并返回
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(responseData),
      },
    ],
  };
}
