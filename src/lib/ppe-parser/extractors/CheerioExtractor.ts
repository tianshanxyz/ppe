/**
 * Cheerio 静态 HTML 提取器
 * Phase 2: 智能解析模型开发
 */

import * as cheerio from 'cheerio';
import {
  FieldExtractor,
  FieldExtractionRule,
  PPEProduct,
  PPEProductDetail,
  ParseResult,
  ParseMetadata,
} from '../types';

/**
 * Cheerio 提取选项
 */
export interface CheerioExtractOptions {
  /** 是否移除 script 和 style 标签 */
  removeScripts: boolean;
  /** 是否解码 HTML 实体 */
  decodeEntities: boolean;
  /** 是否保留换行符 */
  preserveLineBreaks: boolean;
  /** 最大文本长度 */
  maxTextLength?: number;
}

/**
 * Cheerio 静态提取器
 * 用于解析静态 HTML 内容
 */
export class CheerioExtractor implements FieldExtractor {
  readonly name = 'CheerioExtractor';

  private options: CheerioExtractOptions;

  constructor(options: Partial<CheerioExtractOptions> = {}) {
    this.options = {
      removeScripts: true,
      decodeEntities: true,
      preserveLineBreaks: false,
      ...options,
    };
  }

  /**
   * 加载 HTML 并返回 Cheerio 实例
   */
  load(html: string): cheerio.CheerioAPI {
    return cheerio.load(html, {
      decodeEntities: this.options.decodeEntities,
    });
  }

  /**
   * 提取字段
   */
  async extract(
    html: string,
    rules: FieldExtractionRule[]
  ): Promise<Record<string, any>> {
    const $ = this.load(html);
    const result: Record<string, any> = {};

    for (const rule of rules) {
      const value = this.extractField($, rule);
      if (value !== undefined && value !== null && value !== '') {
        result[rule.field] = value;
      } else if (rule.required && rule.fallback) {
        result[rule.field] = rule.fallback;
      }
    }

    return result;
  }

  /**
   * 提取单个字段
   */
  private extractField($: cheerio.CheerioAPI, rule: FieldExtractionRule): any {
    for (const selector of rule.selectors) {
      try {
        const element = $(selector);

        if (element.length === 0) {
          continue;
        }

        let value: string;

        // 获取属性值
        if (rule.attribute) {
          value = element.attr(rule.attribute) || '';
        } else {
          // 获取文本内容
          value = element.text();
        }

        // 清理文本
        value = this.cleanText(value);

        // 应用正则表达式
        if (rule.regex && value) {
          const match = value.match(new RegExp(rule.regex));
          value = match ? match[1] || match[0] : '';
        }

        // 应用转换函数
        if (rule.transform && value) {
          return rule.transform(value);
        }

        if (value) {
          return value;
        }
      } catch (error) {
        console.warn(`[CheerioExtractor] Failed to extract ${rule.field} with selector: ${selector}`, error);
        continue;
      }
    }

    return undefined;
  }

  /**
   * 验证提取结果
   */
  validate(extracted: Record<string, any>): boolean {
    return Object.keys(extracted).length > 0;
  }

  /**
   * 从 HTML 中提取所有文本
   */
  extractAllText(html: string): string {
    const $ = this.load(html);

    if (this.options.removeScripts) {
      $('script, style, noscript').remove();
    }

    let text = $('body').text();
    text = this.cleanText(text);

    if (this.options.maxTextLength && text.length > this.options.maxTextLength) {
      text = text.substring(0, this.options.maxTextLength) + '...';
    }

    return text;
  }

  /**
   * 提取表格数据
   */
  extractTable(
    html: string,
    tableSelector: string
  ): { headers: string[]; rows: string[][] } {
    const $ = this.load(html);
    const table = $(tableSelector);

    const headers: string[] = [];
    const rows: string[][] = [];

    // 提取表头
    table.find('thead th, thead td, tr:first-child th, tr:first-child td').each((_, elem) => {
      headers.push(this.cleanText($(elem).text()));
    });

    // 提取数据行
    table.find('tbody tr, tr:not(:first-child)').each((_, row) => {
      const rowData: string[] = [];
      $(row)
        .find('td, th')
        .each((_, cell) => {
          rowData.push(this.cleanText($(cell).text()));
        });

      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    return { headers, rows };
  }

  /**
   * 提取链接
   */
  extractLinks(html: string, baseUrl?: string): Array<{ text: string; href: string }> {
    const $ = this.load(html);
    const links: Array<{ text: string; href: string }> = [];

    $('a[href]').each((_, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href') || '';
      const text = this.cleanText($elem.text());

      // 解析相对 URL
      const absoluteUrl = baseUrl ? this.resolveUrl(href, baseUrl) : href;

      links.push({ text, href: absoluteUrl });
    });

    return links;
  }

  /**
   * 提取列表项
   */
  extractListItems(html: string, listSelector: string): string[] {
    const $ = this.load(html);
    const items: string[] = [];

    $(listSelector)
      .find('li')
      .each((_, elem) => {
        const text = this.cleanText($(elem).text());
        if (text) {
          items.push(text);
        }
      });

    return items;
  }

  /**
   * 提取元数据
   */
  extractMetadata(html: string): Record<string, string> {
    const $ = this.load(html);
    const metadata: Record<string, string> = {};

    // 标准 meta 标签
    $('meta').each((_, elem) => {
      const $elem = $(elem);
      const name = $elem.attr('name') || $elem.attr('property');
      const content = $elem.attr('content');

      if (name && content) {
        metadata[name] = content;
      }
    });

    // Open Graph
    $('meta[property^="og:"]').each((_, elem) => {
      const $elem = $(elem);
      const property = $elem.attr('property');
      const content = $elem.attr('content');

      if (property && content) {
        metadata[property] = content;
      }
    });

    // 标题
    metadata['title'] = $('title').text();

    // 描述
    if (!metadata['description']) {
      metadata['description'] = $('meta[name="description"]').attr('content') || '';
    }

    return metadata;
  }

  /**
   * 检查元素是否存在
   */
  hasElement(html: string, selector: string): boolean {
    const $ = this.load(html);
    return $(selector).length > 0;
  }

  /**
   * 获取元素数量
   */
  countElements(html: string, selector: string): number {
    const $ = this.load(html);
    return $(selector).length;
  }

  /**
   * 获取元素 HTML
   */
  getElementHtml(html: string, selector: string): string | null {
    const $ = this.load(html);
    const element = $(selector);

    if (element.length === 0) {
      return null;
    }

    return element.html();
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    if (!text) {
      return '';
    }

    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, this.options.preserveLineBreaks ? '\n' : ' ')
      .trim();

    // 解码 HTML 实体
    if (this.options.decodeEntities) {
      cleaned = this.decodeHtmlEntities(cleaned);
    }

    return cleaned;
  }

  /**
   * 解码 HTML 实体
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
    };

    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * 解析相对 URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    const base = new URL(baseUrl);

    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    }

    return `${base.protocol}//${base.host}${base.pathname.replace(/\/[^\/]*$/, '/')}${url}`;
  }

  /**
   * 提取结构化数据（JSON-LD）
   */
  extractJsonLd(html: string): any[] {
    const $ = this.load(html);
    const jsonLdData: any[] = [];

    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const content = $(elem).html();
        if (content) {
          const data = JSON.parse(content);
          jsonLdData.push(data);
        }
      } catch (error) {
        console.warn('[CheerioExtractor] Failed to parse JSON-LD:', error);
      }
    });

    return jsonLdData;
  }

  /**
   * 提取图片
   */
  extractImages(html: string, baseUrl?: string): Array<{ src: string; alt: string; width?: number; height?: number }> {
    const $ = this.load(html);
    const images: Array<{ src: string; alt: string; width?: number; height?: number }> = [];

    $('img').each((_, elem) => {
      const $elem = $(elem);
      let src = $elem.attr('src') || '';
      const alt = $elem.attr('alt') || '';
      const width = parseInt($elem.attr('width') || '0') || undefined;
      const height = parseInt($elem.attr('height') || '0') || undefined;

      // 解析相对 URL
      if (baseUrl) {
        src = this.resolveUrl(src, baseUrl);
      }

      if (src) {
        images.push({ src, alt, width, height });
      }
    });

    return images;
  }
}

/**
 * 创建 Cheerio 提取器实例
 */
export function createCheerioExtractor(
  options?: Partial<CheerioExtractOptions>
): CheerioExtractor {
  return new CheerioExtractor(options);
}
