/**
 * 拼写纠错工具
 * 
 * 功能:
 * - Levenshtein 距离算法
 * - 拼写建议
 * - 常见错误纠正
 */

/**
 * 计算 Levenshtein 距离 (编辑距离)
 * 
 * @param s1 字符串 1
 * @param s2 字符串 2
 * @returns 编辑距离 (需要多少次编辑操作)
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  
  // 创建二维数组
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // 初始化边界
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // 填充数组
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 计算相似度 (0-1)
 */
export function similarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * 拼写纠错建议
 * 
 * @param query 用户输入
 * @param candidates 候选词列表
 * @param threshold 相似度阈值
 * @returns 建议列表
 */
export function spellCorrect(
  query: string,
  candidates: string[],
  threshold: number = 0.7
): Array<{ word: string; score: number }> {
  const suggestions = candidates
    .map(candidate => ({
      word: candidate,
      score: similarity(query.toLowerCase(), candidate.toLowerCase()),
    }))
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return suggestions;
}

/**
 * 常见拼写错误纠正
 */
export const commonTypos: Record<string, string> = {
  // 医疗器械相关
  'fdaa': 'fda',
  'nmpa': 'nmpa',
  'ce 认证': 'ce 认证',
  '510k': '510(k)',
  '510 k': '510(k)',
  'pam': 'pma',
  
  // 公司名称常见错误
  'medtronic': 'medtronic',
  'johnson & johnson': 'johnson & johnson',
  'j&j': 'johnson & johnson',
  
  // 常见拼写错误
  'regualtion': 'regulation',
  'complience': 'compliance',
  'ceritifcate': 'certificate',
  'registartion': 'registration',
};

/**
 * 纠正常见错误
 */
export function correctCommonTypos(query: string): string {
  let corrected = query.toLowerCase();
  
  for (const [typo, correction] of Object.entries(commonTypos)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  }
  
  return corrected;
}

/**
 * 检测是否需要拼写纠正
 */
export function needsCorrection(query: string): boolean {
  // 检查是否包含常见错误
  const lowerQuery = query.toLowerCase();
  return Object.keys(commonTypos).some(typo => 
    lowerQuery.includes(typo)
  );
}

/**
 * 获取拼写建议消息
 */
export function getCorrectionMessage(
  originalQuery: string,
  suggestions: Array<{ word: string; score: number }>
): string | null {
  if (suggestions.length === 0) return null;
  
  const bestSuggestion = suggestions[0];
  if (bestSuggestion.score > 0.9) return null; // 太相似的不需要建议
  
  return `您是否要搜索："${bestSuggestion.word}"？`;
}

/**
 * 完整的拼写纠错流程
 */
export interface SpellCheckResult {
  originalQuery: string;
  correctedQuery: string;
  suggestions: Array<{ word: string; score: number }>;
  message: string | null;
}

export function spellCheck(
  query: string,
  candidates: string[] = []
): SpellCheckResult {
  // 1. 纠正常见错误
  const correctedAfterTypos = correctCommonTypos(query);
  
  // 2. 如果有候选词，计算相似度
  const suggestions = spellCorrect(correctedAfterTypos, candidates);
  
  // 3. 获取建议消息
  const message = getCorrectionMessage(query, suggestions);
  
  // 4. 如果有最佳建议且相似度足够高，使用建议
  let finalQuery = correctedAfterTypos;
  if (suggestions.length > 0 && suggestions[0].score > 0.8) {
    finalQuery = suggestions[0].word;
  }
  
  return {
    originalQuery: query,
    correctedQuery: finalQuery,
    suggestions,
    message,
  };
}
