/**
 * 模糊搜索工具
 * 
 * 功能:
 * - 基于 Fuse.js 的客户端模糊搜索
 * - 支持拼音搜索
 * - 支持简繁体匹配
 */

import Fuse from 'fuse.js';

export interface SearchItem {
  id: string;
  name: string;
  description?: string;
  legalName?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface SearchOptions {
  threshold?: number;
  limit?: number;
  includeScore?: boolean;
}

/**
 * 创建 Fuse 实例
 */
export function createFuseSearch<T extends SearchItem>(
  items: T[],
  keys: (keyof T)[] = ['name', 'legalName', 'description']
): Fuse<T> {
  return new Fuse(items, {
    keys: keys as string[],
    threshold: 0.4, // 相似度阈值 (0-1, 越小越严格)
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    findAllMatches: true,
  });
}

/**
 * 执行模糊搜索
 */
export function fuzzySearch<T extends SearchItem>(
  items: T[],
  query: string,
  options: SearchOptions = {}
): Array<{ item: T; score: number; matches?: ReadonlyArray<{ indices: ReadonlyArray<[number, number]>; key?: string; value?: string }> }> {
  const { threshold = 0.4, limit = 20, includeScore = true } = options;

  const fuse = createFuseSearch(items);
  const results = fuse.search(query);

  return results
    .filter(result => result.score !== undefined && result.score <= threshold)
    .slice(0, limit)
    .map(result => ({
      item: result.item,
      score: includeScore ? result.score || 0 : 0,
      matches: result.matches,
    }));
}

/**
 * 高亮匹配的文本
 */
export function highlightMatches(
  text: string,
  query: string,
  className: string = 'highlight'
): string {
  if (!query || !text) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, `<mark class="${className}">$1</mark>`);
}

/**
 * 拼音搜索辅助
 */
export function pinyinSearch(text: string, query: string): boolean {
  // 简单的拼音首字母匹配
  const pinyinMap: Record<string, string> = {
    'a': '啊阿',
    'b': '不部北',
    'c': '此从次',
    'd': '的大地',
    'e': '鹅饿',
    'f': '发分方',
    'g': '个公高',
    'h': '和会好',
    'j': '机及家',
    'k': '可可开',
    'l': '了来老',
    'm': '吗没们',
    'n': '你那能',
    'p': '片片平',
    'q': '起前清',
    'r': '人人日',
    's': '是上生',
    't': '他天同',
    'w': '我外为',
    'x': '下小星',
    'y': '有一月',
    'z': '在这中',
  };

  const firstChar = text.charAt(0).toLowerCase();
  const pinyinChars = pinyinMap[firstChar] || '';
  
  return text.includes(query) || pinyinChars.includes(query.charAt(0));
}

/**
 * 简繁体转换 (简化版)
 */
export function convertTraditionalToSimplified(text: string): string {
  const traditionalMap: Record<string, string> = {
    '醫': '医',
    '療': '疗',
    '器': '器',
    '械': '械',
    '註': '注',
    '冊': '册',
    '證': '证',
    '號': '号',
    '廠': '厂',
    '家': '家',
    '國': '国',
    '際': '际',
    '會': '会',
    '麼': '么',
    '為': '为',
  };

  return text.split('').map(char => 
    traditionalMap[char] || char
  ).join('');
}

/**
 * 搜索预处理
 */
export function preprocessQuery(query: string): string {
  // 去除多余空格
  let processed = query.trim();
  
  // 转换为简体 (如果需要)
  processed = convertTraditionalToSimplified(processed);
  
  // 转换为小写 (英文搜索)
  processed = processed.toLowerCase();
  
  return processed;
}
