/**
 * 实体关联模型（企业去重）- 名称标准化
 *
 * A-007: 实体关联模型（企业去重）
 */

import {
  NormalizedName,
  LEGAL_SUFFIXES,
  ABBREVIATION_MAP,
  PHONETIC_MAP,
} from './types'

/**
 * 企业名称标准化器
 */
export class CompanyNameNormalizer {
  /**
   * 标准化企业名称
   */
  normalize(name: string): NormalizedName {
    const original = name.trim()

    // 1. 扩展缩写
    const abbreviationExpanded = this.expandAbbreviations(original)

    // 2. 移除法律后缀
    const legalSuffixRemoved = this.removeLegalSuffixes(abbreviationExpanded)

    // 3. 清理和标准化
    let normalized = this.cleanName(legalSuffixRemoved)

    // 4. 转换为音似编码（可选）
    normalized = this.toPhoneticCode(normalized)

    // 5. 分词
    const tokens = this.tokenize(normalized)

    return {
      original,
      normalized,
      tokens,
      abbreviation_expanded: abbreviationExpanded,
      legal_suffix_removed: legalSuffixRemoved,
    }
  }

  /**
   * 扩展常见缩写
   */
  private expandAbbreviations(name: string): string {
    let expanded = name.toLowerCase()

    for (const [abbr, full] of Object.entries(ABBREVIATION_MAP)) {
      // 使用正则表达式匹配完整的单词
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi')
      expanded = expanded.replace(regex, full)
    }

    return expanded
  }

  /**
   * 移除法律后缀
   */
  private removeLegalSuffixes(name: string): string {
    let cleaned = name.toLowerCase()

    // 按长度降序排序，先移除长的后缀
    const sortedSuffixes = [...LEGAL_SUFFIXES].sort((a, b) => b.length - a.length)

    for (const suffix of sortedSuffixes) {
      // 移除后缀（包括前面的空格或标点）
      const regex = new RegExp(`[\\s,]*\\b${suffix}\\b[\\s,]*$`, 'i')
      cleaned = cleaned.replace(regex, '')
    }

    return cleaned.trim()
  }

  /**
   * 清理名称
   */
  private cleanName(name: string): string {
    return name
      .toLowerCase()
      // 移除特殊字符
      .replace(/[^\w\s]/g, ' ')
      // 合并多个空格
      .replace(/\s+/g, ' ')
      // 移除首尾空格
      .trim()
  }

  /**
   * 转换为音似编码
   */
  private toPhoneticCode(name: string): string {
    let phonetic = name.toLowerCase()

    for (const [from, to] of Object.entries(PHONETIC_MAP)) {
      const regex = new RegExp(from, 'g')
      phonetic = phonetic.replace(regex, to)
    }

    return phonetic
  }

  /**
   * 分词
   */
  private tokenize(name: string): string[] {
    return name
      .split(/\s+/)
      .filter((token) => token.length > 0)
  }

  /**
   * 快速标准化（仅基础清理）
   */
  quickNormalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 获取名称的n-gram
   */
  getNGrams(name: string, n: number = 2): string[] {
    const tokens = this.tokenize(name)
    const ngrams: string[] = []

    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '))
    }

    return ngrams
  }

  /**
   * 判断是否为同一企业（快速检查）
   */
  isSameCompany(name1: string, name2: string): boolean {
    const normalized1 = this.quickNormalize(name1)
    const normalized2 = this.quickNormalize(name2)

    return normalized1 === normalized2
  }
}

// 导出单例
export const companyNameNormalizer = new CompanyNameNormalizer()
