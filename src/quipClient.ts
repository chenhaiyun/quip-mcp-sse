import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import pkg from "xlsx";
const { readFile, utils } = pkg;

/**
 * Quip API 客户端实现
 */
export class QuipClient {
  private accessToken: string;
  private baseUrl: string;

  /**
   * 初始化 Quip 客户端
   *
   * @param accessToken Quip API 访问令牌
   * @param baseUrl Quip API 基础 URL（默认：https://platform.quip.com）
   */
  constructor(
    accessToken: string,
    baseUrl: string = "https://platform.quip.com"
  ) {
    this.accessToken = accessToken;
    this.baseUrl = baseUrl.replace(/\/$/, ""); // 移除尾部斜杠
    console.log(`QuipClient 已初始化，基础 URL: ${this.baseUrl}`);
  }

  /**
   * 获取线程信息
   *
   * @param threadId 线程 ID
   * @returns 线程信息
   */
  async getThread(threadId: string): Promise<any> {
    console.log(`获取线程: ${threadId}`);
    try {
      const response = await axios.get(
        `${this.baseUrl}/1/threads/${threadId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`获取线程失败: ${error}`);
      throw error;
    }
  }

  /**
   * 将线程导出为 XLSX 格式并保存到本地
   *
   * @param threadId 线程 ID
   * @param outputPath 输出路径
   * @returns 保存的 XLSX 文件路径
   */
  async exportThreadToXlsx(
    threadId: string,
    outputPath: string
  ): Promise<string> {
    console.log(`将线程 ${threadId} 导出为 XLSX`);
    try {
      const response = await axios.get(
        `${this.baseUrl}/1/threads/${threadId}/export/xlsx`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          responseType: "arraybuffer",
        }
      );

      // 确保目录存在
      const dir = path.dirname(outputPath);
      fs.mkdirSync(dir, { recursive: true });

      // 写入文件
      fs.writeFileSync(outputPath, Buffer.from(response.data));

      console.log(`成功导出 XLSX 到 ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`导出 XLSX 失败: ${error}`);
      throw error;
    }
  }

  /**
   * 检查线程是否为电子表格
   *
   * @param threadId 线程 ID
   * @returns 如果线程是电子表格则为 true，否则为 false
   */
  async isSpreadsheet(threadId: string): Promise<boolean> {
    try {
      const thread = await this.getThread(threadId);
      if (!thread || !thread.thread) {
        return false;
      }

      // 检查线程类型是否为 'spreadsheet'
      const threadType = thread.thread.type?.toLowerCase();
      return threadType === "spreadsheet";
    } catch (error) {
      console.error(`检查线程是否为电子表格时出错: ${error}`);
      return false;
    }
  }
}

/**
 * 将 XLSX 文件转换为 CSV 格式
 *
 * @param xlsxPath XLSX 文件路径
 * @param sheetName 工作表名称（可选）
 * @returns CSV 数据字符串
 */
export function convertXlsxToCsv(xlsxPath: string, sheetName?: string): string {
  console.log(`从 ${xlsxPath} 读取 XLSX 文件`);

  // 加载工作簿
  const workbook = readFile(xlsxPath);

  // 确定要使用的工作表
  let targetSheet;
  if (sheetName) {
    // 尝试精确匹配
    if (workbook.Sheets[sheetName]) {
      targetSheet = workbook.Sheets[sheetName];
    } else {
      // 尝试不区分大小写的匹配
      const sheetLower = sheetName.toLowerCase();
      const matchingSheet = Object.keys(workbook.Sheets).find(
        (s) => s.toLowerCase() === sheetLower
      );

      if (matchingSheet) {
        targetSheet = workbook.Sheets[matchingSheet];
      } else {
        throw new Error(
          `找不到工作表 '${sheetName}'。可用工作表: ${workbook.SheetNames.join(
            ", "
          )}`
        );
      }
    }
  } else {
    // 如果未指定名称，则使用第一个工作表
    targetSheet = workbook.Sheets[workbook.SheetNames[0]];
  }

  // 转换为 CSV
  const csvOptions = {
    FS: ",",
    RS: "\n",
    strip: true,
    blankrows: false,
  };

  const csv = utils.sheet_to_csv(targetSheet, csvOptions);
  return csv;
}
