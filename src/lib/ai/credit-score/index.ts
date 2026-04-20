/**
 * 制造商信用评分系统 - 主入口
 *
 * A-001: 制造商信用评分算法
 */

export * from './types'
export { CreditScoreCalculator, creditScoreCalculator } from './calculator'
export { ScoreExplainer, scoreExplainer } from './explainer'

// 便捷函数
import { creditScoreCalculator } from './calculator'
import { scoreExplainer } from './explainer'
import type { ManufacturerCreditScore, ScoreExplanation } from './types'

/**
 * 计算并解释信用评分
 */
export async function calculateAndExplain(
  manufacturerId: string
): Promise<{ score: ManufacturerCreditScore; explanation: ScoreExplanation } | null> {
  const score = await creditScoreCalculator.calculate(manufacturerId)
  if (!score) return null

  const explanation = scoreExplainer.explain(score)
  return { score, explanation }
}
