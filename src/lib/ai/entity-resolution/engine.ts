/**
 * 实体关联模型（企业去重）- 解析引擎
 *
 * A-007: 实体关联模型（企业去重）
 */

import {
  CompanyEntity,
  EntityCluster,
  EntityResolutionRequest,
  EntityResolutionResponse,
  EntityResolutionConfig,
  DEFAULT_ENTITY_RESOLUTION_CONFIG,
  EntityQueryRequest,
  EntityMatchResult,
  EntityGraph,
} from './types'
import { companyNameNormalizer } from './normalizer'
import { similarityCalculator } from './similarity'
import { entityClustering } from './clustering'

/**
 * 实体解析引擎
 */
export class EntityResolutionEngine {
  private config: EntityResolutionConfig

  constructor(config: Partial<EntityResolutionConfig> = {}) {
    this.config = { ...DEFAULT_ENTITY_RESOLUTION_CONFIG, ...config }
  }

  /**
   * 执行实体解析（去重）
   */
  async resolve(request: EntityResolutionRequest): Promise<EntityResolutionResponse> {
    const startTime = Date.now()

    try {
      const { entities, config: customConfig } = request

      // 合并配置
      const effectiveConfig = customConfig
        ? { ...this.config, ...customConfig }
        : this.config

      // 更新聚类器配置
      const clustering = new (await import('./clustering')).EntityClustering(effectiveConfig)

      // 1. 标准化所有实体名称
      const normalizedEntities = entities.map((entity) => ({
        ...entity,
        normalized_name: companyNameNormalizer.normalize(entity.name).normalized,
      }))

      // 2. 执行聚类
      const clusters = clustering.cluster(normalizedEntities)

      // 3. 计算统计信息
      const stats = clustering.getClusteringStats(clusters)

      return {
        success: true,
        clusters,
        total_entities: stats.total_entities,
        total_clusters: stats.total_clusters,
        duplicates_found: stats.duplicates_found,
        processing_time_ms: Date.now() - startTime,
      }
    } catch (error) {
      console.error('实体解析失败:', error)
      return {
        success: false,
        clusters: [],
        total_entities: request.entities.length,
        total_clusters: 0,
        duplicates_found: 0,
        processing_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : '实体解析失败',
      }
    }
  }

  /**
   * 查询相似实体
   */
  async querySimilarEntities(
    query: EntityQueryRequest,
    allEntities: CompanyEntity[]
  ): Promise<Array<{ entity: CompanyEntity; similarity: number }>> {
    const { name, threshold = 0.7, limit = 10 } = query

    if (!name) {
      return []
    }

    const results: Array<{ entity: CompanyEntity; similarity: number }> = []

    for (const entity of allEntities) {
      const similarity = similarityCalculator.calculate(name, entity.name)

      if (similarity >= threshold) {
        results.push({ entity, similarity })
      }
    }

    // 按相似度排序并限制数量
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  /**
   * 检查两个实体是否匹配
   */
  checkMatch(entity1: CompanyEntity, entity2: CompanyEntity): EntityMatchResult {
    return similarityCalculator.calculateEntityMatch(
      entity1,
      entity2,
      this.config.high_confidence_threshold,
      this.config.similarity_threshold
    )
  }

  /**
   * 获取潜在匹配（用于人工审核）
   */
  async getPotentialMatches(
    entities: CompanyEntity[],
    threshold: number = 0.7
  ): Promise<Array<{ entity1: CompanyEntity; entity2: CompanyEntity; similarity: number }>> {
    return entityClustering.findPotentialMatches(entities, threshold)
  }

  /**
   * 构建实体关联图谱
   */
  async buildGraph(entities: CompanyEntity[]): Promise<EntityGraph> {
    const clusters = entityClustering.cluster(entities)
    return entityClustering.buildEntityGraph(entities, clusters)
  }

  /**
   * 标准化企业名称
   */
  normalizeName(name: string): string {
    return companyNameNormalizer.normalize(name).normalized
  }

  /**
   * 批量标准化
   */
  normalizeNames(names: string[]): string[] {
    return names.map((name) => this.normalizeName(name))
  }

  /**
   * 获取配置
   */
  getConfig(): EntityResolutionConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EntityResolutionConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// 导出单例
export const entityResolutionEngine = new EntityResolutionEngine()
