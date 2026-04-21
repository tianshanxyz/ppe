/**
 * 实体关联模型（企业去重）- 聚类算法
 *
 * A-007: 实体关联模型（企业去重）
 */

import {
  CompanyEntity,
  EntityCluster,
  EntityResolutionConfig,
  DEFAULT_ENTITY_RESOLUTION_CONFIG,
  EntityGraph,
  EntityGraphNode,
  EntityGraphEdge,
} from './types'
import { similarityCalculator } from './similarity'
import { companyNameNormalizer } from './normalizer'

/**
 * 实体聚类器（基于连通分量）
 */
export class EntityClustering {
  private config: EntityResolutionConfig

  constructor(config: Partial<EntityResolutionConfig> = {}) {
    this.config = { ...DEFAULT_ENTITY_RESOLUTION_CONFIG, ...config }
  }

  /**
   * 执行实体聚类
   */
  cluster(entities: CompanyEntity[]): EntityCluster[] {
    if (entities.length === 0) return []

    // 1. 构建相似度图
    const graph = this.buildSimilarityGraph(entities)

    // 2. 找到连通分量（每个连通分量是一个簇）
    const connectedComponents = this.findConnectedComponents(graph, entities)

    // 3. 构建实体簇
    const clusters: EntityCluster[] = connectedComponents.map((component, index) => {
      const clusterEntities = component.map((idx) => entities[idx])
      const canonicalName = this.selectCanonicalName(clusterEntities)
      const countries = [...new Set(clusterEntities.map((e) => e.country).filter(Boolean))]

      return {
        id: `cluster_${index + 1}`,
        canonical_name: canonicalName,
        entities: clusterEntities,
        entity_count: clusterEntities.length,
        countries: countries as string[],
        confidence: this.calculateClusterConfidence(clusterEntities),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    return clusters
  }

  /**
   * 构建相似度图
   */
  private buildSimilarityGraph(entities: CompanyEntity[]): Map<number, Set<number>> {
    const graph = new Map<number, Set<number>>()
    const n = entities.length

    // 初始化图
    for (let i = 0; i < n; i++) {
      graph.set(i, new Set())
    }

    // 计算相似度并构建边
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const match = similarityCalculator.calculateEntityMatch(
          entities[i],
          entities[j],
          this.config.high_confidence_threshold,
          this.config.similarity_threshold
        )

        if (match.is_match) {
          graph.get(i)?.add(j)
          graph.get(j)?.add(i)
        }
      }
    }

    return graph
  }

  /**
   * 找到连通分量
   */
  private findConnectedComponents(
    graph: Map<number, Set<number>>,
    entities: CompanyEntity[]
  ): number[][] {
    const visited = new Set<number>()
    const components: number[][] = []

    for (let i = 0; i < entities.length; i++) {
      if (!visited.has(i)) {
        const component: number[] = []
        this.dfs(graph, i, visited, component)
        components.push(component)
      }
    }

    return components
  }

  /**
   * 深度优先搜索
   */
  private dfs(
    graph: Map<number, Set<number>>,
    node: number,
    visited: Set<number>,
    component: number[]
  ): void {
    visited.add(node)
    component.push(node)

    const neighbors = graph.get(node)
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          this.dfs(graph, neighbor, visited, component)
        }
      }
    }
  }

  /**
   * 选择规范名称（选择最长或最常见的名称）
   */
  private selectCanonicalName(entities: CompanyEntity[]): string {
    if (entities.length === 0) return ''

    // 优先选择包含最多信息的名称（最长）
    const sorted = [...entities].sort((a, b) => b.name.length - a.name.length)

    // 返回标准化后的名称
    return companyNameNormalizer.normalize(sorted[0].name).normalized
  }

  /**
   * 计算簇的置信度
   */
  private calculateClusterConfidence(entities: CompanyEntity[]): number {
    if (entities.length <= 1) return 1

    let totalSimilarity = 0
    let count = 0

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const similarity = similarityCalculator.calculate(
          entities[i].name,
          entities[j].name
        )
        totalSimilarity += similarity
        count++
      }
    }

    return count > 0 ? totalSimilarity / count : 1
  }

  /**
   * 构建实体关联图谱
   */
  buildEntityGraph(entities: CompanyEntity[], clusters: EntityCluster[]): EntityGraph {
    const nodes: EntityGraphNode[] = []
    const edges: EntityGraphEdge[] = []
    const nodeMap = new Map<string, number>()

    // 添加规范节点（簇）
    clusters.forEach((cluster, index) => {
      const nodeId = `cluster_${index}`
      nodes.push({
        id: nodeId,
        name: cluster.canonical_name,
        type: 'canonical',
        metadata: {
          entity_count: cluster.entity_count,
          countries: cluster.countries,
        },
      })
      nodeMap.set(nodeId, nodes.length - 1)

      // 添加别名节点和边
      cluster.entities.forEach((entity) => {
        const aliasNodeId = `entity_${entity.id}`
        nodes.push({
          id: aliasNodeId,
          name: entity.name,
          type: 'alias',
          cluster_id: nodeId,
          metadata: {
            country: entity.country,
            source: entity.source,
          },
        })
        nodeMap.set(aliasNodeId, nodes.length - 1)

        // 添加别名到规范的边
        edges.push({
          source: aliasNodeId,
          target: nodeId,
          weight: 1,
          type: 'canonical',
        })
      })
    })

    // 添加相似度边（跨簇）
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const similarity = similarityCalculator.calculate(
          entities[i].name,
          entities[j].name
        )

        if (similarity >= this.config.similarity_threshold * 0.8) {
          const sourceId = `entity_${entities[i].id}`
          const targetId = `entity_${entities[j].id}`

          edges.push({
            source: sourceId,
            target: targetId,
            weight: similarity,
            type: 'similarity',
          })
        }
      }
    }

    return { nodes, edges }
  }

  /**
   * 查找潜在匹配（用于人工审核）
   */
  findPotentialMatches(
    entities: CompanyEntity[],
    threshold: number = 0.7
  ): Array<{ entity1: CompanyEntity; entity2: CompanyEntity; similarity: number }> {
    const matches: Array<{ entity1: CompanyEntity; entity2: CompanyEntity; similarity: number }> = []

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const similarity = similarityCalculator.calculate(
          entities[i].name,
          entities[j].name
        )

        if (similarity >= threshold && similarity < this.config.similarity_threshold) {
          matches.push({
            entity1: entities[i],
            entity2: entities[j],
            similarity,
          })
        }
      }
    }

    // 按相似度排序
    return matches.sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * 获取聚类统计信息
   */
  getClusteringStats(clusters: EntityCluster[]): {
    total_clusters: number
    total_entities: number
    duplicates_found: number
    avg_cluster_size: number
    max_cluster_size: number
    min_cluster_size: number
  } {
    const totalEntities = clusters.reduce((sum, c) => sum + c.entity_count, 0)
    const clusterSizes = clusters.map((c) => c.entity_count)

    return {
      total_clusters: clusters.length,
      total_entities: totalEntities,
      duplicates_found: totalEntities - clusters.length,
      avg_cluster_size: totalEntities / clusters.length,
      max_cluster_size: Math.max(...clusterSizes),
      min_cluster_size: Math.min(...clusterSizes),
    }
  }
}

// 导出单例
export const entityClustering = new EntityClustering()
