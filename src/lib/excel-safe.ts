import { Readable } from 'stream';

/**
 * 安全的 Excel 数据处理工具
 * 替代有安全漏洞的 xlsx 库
 */

export interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ExcelParseOptions {
  sheetName?: string;
  headerRow?: number;
}

export interface ExcelParseResult {
  rows: ExcelRow[];
  headers: string[];
  sheetNames: string[];
}

/**
 * 安全的 CSV 解析器（替代 xlsx 的简单功能）
 */
export class SafeExcelParser {
  
  /**
   * 解析 Excel 文件（仅支持 CSV 格式作为安全替代）
   */
  static async parseExcel(file: File, options: ExcelParseOptions = {}): Promise<ExcelParseResult> {
    const { sheetName = 'Sheet1', headerRow = 0 } = options;
    
    // 安全检查：限制文件大小
    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('文件大小超过安全限制 (10MB)');
    }
    
    // 安全检查：限制文件类型
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('不支持的文件格式，请使用 CSV 格式');
    }
    
    try {
      const text = await file.text();
      return this.parseCSV(text, { headerRow });
    } catch (error) {
      throw new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 解析 CSV 数据
   */
  static parseCSV(csvText: string, options: { headerRow?: number } = {}): ExcelParseResult {
    const { headerRow = 0 } = options;
    
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length <= headerRow) {
      return { rows: [], headers: [], sheetNames: ['Sheet1'] };
    }
    
    // 提取表头
    const headerLine = lines[headerRow];
    const headers = this.parseCSVLine(headerLine);
    
    // 提取数据行
    const rows: ExcelRow[] = [];
    for (let i = headerRow + 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: ExcelRow = {};
      
      headers.forEach((header, index) => {
        if (header && index < values.length) {
          row[header] = this.sanitizeValue(values[index]);
        }
      });
      
      // 跳过空行
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }
    
    return {
      rows,
      headers,
      sheetNames: ['Sheet1']
    };
  }
  
  /**
   * 解析 CSV 单行
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  /**
   * 清理和验证值
   */
  private static sanitizeValue(value: string): string | number | boolean | null {
    if (!value || value.trim() === '') return null;
    
    const trimmed = value.trim();
    
    // 尝试解析为数字
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) return num;
    }
    
    // 尝试解析为布尔值
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // 返回清理后的字符串
    return this.escapeHtml(trimmed);
  }
  
  /**
   * HTML 转义，防止 XSS
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => map[char]);
  }
  
  /**
   * 生成 CSV 文件
   */
  static generateCSV(rows: ExcelRow[], headers: string[]): string {
    const csvLines: string[] = [];
    
    // 表头
    const headerLine = headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',');
    csvLines.push(headerLine);
    
    // 数据行
    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        
        const stringValue = String(value);
        // 转义引号和逗号
        return `"${stringValue.replace(/"/g, '""')}"`;
      });
      
      csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
  }
  
  /**
   * 创建 CSV 下载链接
   */
  static createDownloadLink(csvContent: string, filename: string): string {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  }
}

/**
 * 安全的 Excel 处理工具工厂
 */
export const createSafeExcelProcessor = () => {
  return {
    parse: SafeExcelParser.parseExcel,
    generate: SafeExcelParser.generateCSV,
    createDownloadLink: SafeExcelParser.createDownloadLink
  };
};

export default SafeExcelParser;