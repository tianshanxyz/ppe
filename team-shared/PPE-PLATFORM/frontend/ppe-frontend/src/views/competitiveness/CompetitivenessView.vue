<template>
  <div class="competitiveness-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">竞争力评估</h1>
        <p class="page-description">多维度分析PPE产品市场竞争力，助力战略决策</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="showNewAnalysis = true">
          新建分析
        </el-button>
        <el-button :icon="Download" @click="exportReport">
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 分析对象选择 -->
    <el-card class="analysis-target-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Aim /></el-icon>
            分析对象
          </span>
          <el-button link type="primary" @click="showTargetSelector = true">
            更换对象
          </el-button>
        </div>
      </template>
      <div v-if="selectedTarget" class="target-info">
        <div class="target-main">
          <el-avatar :size="64" :icon="FirstAidKit" class="target-avatar" />
          <div class="target-details">
            <h3 class="target-name">{{ selectedTarget.name }}</h3>
            <p class="target-desc">{{ selectedTarget.description }}</p>
            <div class="target-tags">
              <el-tag size="small" effect="plain">{{ selectedTarget.category }}</el-tag>
              <el-tag size="small" type="info" effect="plain">{{ selectedTarget.manufacturer }}</el-tag>
            </div>
          </div>
        </div>
        <div class="target-stats">
          <div class="stat-item">
            <div class="stat-value">{{ selectedTarget.marketShare }}%</div>
            <div class="stat-label">市场份额</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ selectedTarget.competitorCount }}</div>
            <div class="stat-label">竞争对手</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ selectedTarget.score }}</div>
            <div class="stat-label">综合评分</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="请选择分析对象">
        <el-button type="primary" @click="showTargetSelector = true">选择产品</el-button>
      </el-empty>
    </el-card>

    <!-- 综合评分卡片 -->
    <el-row :gutter="20" class="score-cards-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="score-card" shadow="hover">
          <div class="score-content">
            <el-progress
              type="dashboard"
              :percentage="overallScore"
              :color="scoreColors"
              :stroke-width="10"
            />
            <div class="score-label">综合竞争力</div>
            <div class="score-rank">行业排名: {{ industryRank }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="4" v-for="dimension in dimensionScores" :key="dimension.key">
        <el-card class="score-card" shadow="hover">
          <div class="score-content">
            <div class="dimension-icon" :style="{ background: dimension.color + '20', color: dimension.color }">
              <el-icon :size="32">
                <component :is="dimension.icon" />
              </el-icon>
            </div>
            <div class="dimension-score">{{ dimension.score }}</div>
            <div class="dimension-name">{{ dimension.name }}</div>
            <el-progress
              :percentage="dimension.score"
              :color="dimension.color"
              :show-text="false"
              :stroke-width="6"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 雷达图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><PieChart /></el-icon>
                竞争力雷达图
              </span>
              <el-tooltip content="展示各维度竞争力的均衡性">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="radarChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><TrendCharts /></el-icon>
                竞争力趋势
              </span>
              <el-radio-group v-model="trendTimeRange" size="small">
                <el-radio-button label="6m">6个月</el-radio-button>
                <el-radio-button label="1y">1年</el-radio-button>
                <el-radio-button label="2y">2年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <!-- 竞争对手对比 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><Histogram /></el-icon>
                竞争对手对比
              </span>
              <el-button link type="primary" @click="showAddCompetitor = true">
                <el-icon><Plus /></el-icon>
                添加对比
              </el-button>
            </div>
          </template>
          <div ref="comparisonChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 市场份额分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><PieChart /></el-icon>
                市场份额分布
              </span>
            </div>
          </template>
          <div ref="marketShareChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 竞争对手列表 -->
    <el-card class="competitor-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><OfficeBuilding /></el-icon>
            竞争对手分析
          </span>
          <el-input
            v-model="competitorSearch"
            placeholder="搜索竞争对手..."
            clearable
            size="small"
            style="width: 200px"
            :prefix-icon="Search"
          />
        </div>
      </template>

      <el-table :data="filteredCompetitors" style="width: 100%" v-loading="loading">
        <el-table-column type="index" width="50" />
        <el-table-column label="竞争对手" min-width="200">
          <template #default="{ row }">
            <div class="competitor-info">
              <el-avatar :size="40" :icon="OfficeBuilding" />
              <div class="competitor-details">
                <div class="competitor-name">{{ row.name }}</div>
                <div class="competitor-country">{{ row.country }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score)" size="small" effect="dark">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="市场份额" width="120" align="center">
          <template #default="{ row }">
            {{ row.marketShare }}%
          </template>
        </el-table-column>
        <el-table-column label="价格竞争力" width="120" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.priceScore" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column label="技术实力" width="120" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.techScore" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column label="认证覆盖" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="cert in row.certifications.slice(0, 3)"
              :key="cert"
              size="small"
              effect="plain"
              class="cert-tag"
            >
              {{ cert }}
            </el-tag>
            <el-tag v-if="row.certifications.length > 3" size="small" effect="plain">
              +{{ row.certifications.length - 3 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewCompetitorDetail(row)">
              详情
            </el-button>
            <el-button link @click="compareWith(row)">
              对比
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="competitorPage"
          v-model:page-size="competitorPageSize"
          :total="competitorTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>

    <!-- SWOT 分析 -->
    <el-card class="swot-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            SWOT 分析
          </span>
          <el-button link type="primary" @click="editSwot">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :lg="12">
          <div class="swot-section strength">
            <div class="swot-header">
              <el-icon><CircleCheck /></el-icon>
              <span>优势 (Strengths)</span>
            </div>
            <ul class="swot-list">
              <li v-for="(item, index) in swot.strengths" :key="index">
                <el-icon><Check /></el-icon>
                {{ item }}
              </li>
            </ul>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="12">
          <div class="swot-section weakness">
            <div class="swot-header">
              <el-icon><Warning /></el-icon>
              <span>劣势 (Weaknesses)</span>
            </div>
            <ul class="swot-list">
              <li v-for="(item, index) in swot.weaknesses" :key="index">
                <el-icon><Close /></el-icon>
                {{ item }}
              </li>
            </ul>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="12">
          <div class="swot-section opportunity">
            <div class="swot-header">
              <el-icon><Opportunity /></el-icon>
              <span>机会 (Opportunities)</span>
            </div>
            <ul class="swot-list">
              <li v-for="(item, index) in swot.opportunities" :key="index">
                <el-icon><ArrowUp /></el-icon>
                {{ item }}
              </li>
            </ul>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="12">
          <div class="swot-section threat">
            <div class="swot-header">
              <el-icon><WarningFilled /></el-icon>
              <span>威胁 (Threats)</span>
            </div>
            <ul class="swot-list">
              <li v-for="(item, index) in swot.threats" :key="index">
                <el-icon><ArrowDown /></el-icon>
                {{ item }}
              </li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 策略建议 -->
    <el-card class="strategy-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Lightbulb /></el-icon>
            策略建议
          </span>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="(strategy, index) in strategies"
          :key="index"
          :type="strategy.type"
          :icon="strategy.icon"
        >
          <div class="strategy-item">
            <h4 class="strategy-title">{{ strategy.title }}</h4>
            <p class="strategy-desc">{{ strategy.description }}</p>
            <div class="strategy-tags">
              <el-tag
                v-for="tag in strategy.tags"
                :key="tag"
                size="small"
                :type="strategy.type"
                effect="light"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 选择分析对象对话框 -->
    <el-dialog v-model="showTargetSelector" title="选择分析对象" width="700px">
      <el-input
        v-model="targetSearch"
        placeholder="搜索产品..."
        clearable
        :prefix-icon="Search"
        style="margin-bottom: 16px"
      />
      <el-scrollbar max-height="400px">
        <el-row :gutter="16">
          <el-col
            v-for="product in filteredProducts"
            :key="product.id"
            :xs="24"
            :sm="12"
          >
            <el-card
              class="product-select-card"
              shadow="hover"
              :class="{ selected: selectedTarget?.id === product.id }"
              @click="selectTarget(product)"
            >
              <div class="product-select-info">
                <el-avatar :size="48" :icon="FirstAidKit" />
                <div class="product-select-details">
                  <div class="product-select-name">{{ product.name }}</div>
                  <div class="product-select-meta">{{ product.manufacturer }} · {{ product.category }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-scrollbar>
    </el-dialog>

    <!-- 添加竞争对手对话框 -->
    <el-dialog v-model="showAddCompetitor" title="添加竞争对手" width="500px">
      <el-form :model="newCompetitor" label-width="100px">
        <el-form-item label="企业名称">
          <el-input v-model="newCompetitor.name" placeholder="输入企业名称..." />
        </el-form-item>
        <el-form-item label="国家/地区">
          <el-select v-model="newCompetitor.country" placeholder="选择国家/地区" style="width: 100%">
            <el-option label="中国" value="中国" />
            <el-option label="美国" value="美国" />
            <el-option label="欧盟" value="欧盟" />
            <el-option label="日本" value="日本" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="市场份额">
          <el-slider v-model="newCompetitor.marketShare" :max="100" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCompetitor = false">取消</el-button>
        <el-button type="primary" @click="addCompetitor">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  Plus,
  Download,
  Aim,
  FirstAidKit,
  PieChart,
  TrendCharts,
  Histogram,
  OfficeBuilding,
  Search,
  DataAnalysis,
  Edit,
  CircleCheck,
  Check,
  Warning,
  Close,
  Opportunity,
  ArrowUp,
  WarningFilled,
  ArrowDown,
  InfoFilled,
  Trophy,
  Money,
  Medal,
  Star,
  Pointer as Lightbulb,
  TopRight as TrendArrow
} from '@element-plus/icons-vue'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 选中的分析对象
const selectedTarget = ref<any>({
  id: '1',
  name: '3M 1860 N95 医用口罩',
  description: '医用级N95防护口罩，符合FDA和NIOSH标准',
  category: '呼吸防护',
  manufacturer: '3M',
  marketShare: 18.5,
  competitorCount: 24,
  score: 87
})

// 综合评分
const overallScore = ref(87)
const industryRank = ref('第3名')

// 评分颜色
const scoreColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#339999', percentage: 100 }
]

// 各维度评分
const dimensionScores = ref([
  { key: 'price', name: '价格竞争力', score: 75, icon: Money, color: '#67c23a' },
  { key: 'quality', name: '产品质量', score: 92, icon: Trophy, color: '#339999' },
  { key: 'tech', name: '技术实力', score: 88, icon: Medal, color: '#409eff' },
  { key: 'brand', name: '品牌影响力', score: 95, icon: Star, color: '#e6a23c' },
  { key: 'cert', name: '认证覆盖', score: 82, icon: CircleCheck, color: '#9254de' }
])

// 趋势时间范围
const trendTimeRange = ref('1y')

// 竞争对手搜索
const competitorSearch = ref('')
const competitorPage = ref(1)
const competitorPageSize = ref(10)
const competitorTotal = ref(24)

// 竞争对手列表
const competitors = ref([
  {
    id: '1',
    name: 'Honeywell Safety',
    country: '美国',
    score: 89,
    marketShare: 15.2,
    priceScore: 4,
    techScore: 5,
    certifications: ['FDA', 'NIOSH', 'CE']
  },
  {
    id: '2',
    name: 'Dräger',
    country: '德国',
    score: 86,
    marketShare: 12.8,
    priceScore: 3,
    techScore: 5,
    certifications: ['CE', 'FDA', 'TGA']
  },
  {
    id: '3',
    name: 'Moldex',
    country: '美国',
    score: 82,
    marketShare: 9.5,
    priceScore: 4,
    techScore: 4,
    certifications: ['NIOSH', 'FDA']
  },
  {
    id: '4',
    name: '金佰利 Clark',
    country: '美国',
    score: 79,
    marketShare: 8.3,
    priceScore: 3,
    techScore: 4,
    certifications: ['FDA', 'CE']
  },
  {
    id: '5',
    name: 'UVEX',
    country: '德国',
    score: 76,
    marketShare: 6.7,
    priceScore: 4,
    techScore: 4,
    certifications: ['CE', 'FDA']
  }
])

// SWOT 分析
const swot = reactive({
  strengths: [
    '品牌知名度高，市场认可度强',
    '产品线丰富，覆盖多个细分领域',
    '技术研发投入大，创新能力强',
    '全球认证齐全，出口便利'
  ],
  weaknesses: [
    '价格相对较高，性价比优势不明显',
    '部分新兴市场渠道覆盖不足',
    '产品更新周期较长',
    '售后服务网络有待完善'
  ],
  opportunities: [
    '全球PPE市场需求持续增长',
    '新兴市场对高端产品需求增加',
    '智能化、数字化产品趋势',
    '政府采购和大型企业集采机会'
  ],
  threats: [
    '新兴品牌价格竞争激烈',
    '原材料成本波动风险',
    '贸易壁垒和关税政策变化',
    '技术替代风险'
  ]
})

// 策略建议
const strategies = ref([
  {
    title: '加强价格竞争力',
    description: '通过优化供应链和生产工艺，降低成本，推出更多性价比产品，以应对价格竞争压力。',
    type: 'primary',
    icon: Money,
    tags: ['成本控制', '供应链优化']
  },
  {
    title: '拓展新兴市场渠道',
    description: '加大在亚太、拉美等新兴市场的渠道建设，建立本地化销售和服务团队。',
    type: 'success',
    icon: TrendArrow,
    tags: ['市场拓展', '渠道建设']
  },
  {
    title: '加快产品创新',
    description: '增加研发投入，推出智能化、环保型新产品，保持技术领先优势。',
    type: 'warning',
    icon: Lightbulb,
    tags: ['产品创新', '技术研发']
  },
  {
    title: '完善服务体系',
    description: '建立全球化的售后服务网络，提供技术支持和培训服务，提升客户满意度。',
    type: 'info',
    icon: CircleCheck,
    tags: ['服务升级', '客户体验']
  }
])

// 对话框显示状态
const showTargetSelector = ref(false)
const showAddCompetitor = ref(false)
const showNewAnalysis = ref(false)

// 目标搜索
const targetSearch = ref('')

// 产品列表
const products = ref([
  { id: '1', name: '3M 1860 N95 医用口罩', manufacturer: '3M', category: '呼吸防护' },
  { id: '2', name: 'Honeywell N95 防护口罩', manufacturer: 'Honeywell', category: '呼吸防护' },
  { id: '3', name: 'Dräger X-plore 呼吸器', manufacturer: 'Dräger', category: '呼吸防护' },
  { id: '4', name: '杜邦 Tyvek 防护服', manufacturer: 'DuPont', category: '防护服' },
  { id: '5', name: 'Ansell 防化手套', manufacturer: 'Ansell', category: '手部防护' },
  { id: '6', name: '3M 护目镜', manufacturer: '3M', category: '眼部防护' }
])

// 新竞争对手
const newCompetitor = reactive({
  name: '',
  country: '',
  marketShare: 0
})

// 图表引用
const radarChart = ref<HTMLElement | null>(null)
const trendChart = ref<HTMLElement | null>(null)
const comparisonChart = ref<HTMLElement | null>(null)
const marketShareChart = ref<HTMLElement | null>(null)

// 图表实例
let radarChartInstance: echarts.ECharts | null = null
let trendChartInstance: echarts.ECharts | null = null
let comparisonChartInstance: echarts.ECharts | null = null
let marketShareChartInstance: echarts.ECharts | null = null

// 过滤后的竞争对手
const filteredCompetitors = computed(() => {
  let result = competitors.value
  if (competitorSearch.value) {
    result = result.filter(c => c.name.toLowerCase().includes(competitorSearch.value.toLowerCase()))
  }
  return result
})

// 过滤后的产品
const filteredProducts = computed(() => {
  if (!targetSearch.value) return products.value
  return products.value.filter(p => p.name.toLowerCase().includes(targetSearch.value.toLowerCase()))
})

// 获取评分类型
const getScoreType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 70) return 'warning'
  return 'danger'
}

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChart.value) return
  
  radarChartInstance = echarts.init(radarChart.value)
  const option = {
    radar: {
      indicator: dimensionScores.value.map(d => ({ name: d.name, max: 100 })),
      radius: '70%',
      axisName: {
        color: '#606266'
      }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: dimensionScores.value.map(d => d.score),
          name: '当前产品',
          areaStyle: {
            color: 'rgba(51, 153, 153, 0.3)'
          },
          lineStyle: {
            color: '#339999'
          },
          itemStyle: {
            color: '#339999'
          }
        },
        {
          value: [80, 85, 82, 88, 78],
          name: '行业平均',
          lineStyle: {
            type: 'dashed',
            color: '#909399'
          },
          itemStyle: {
            color: '#909399'
          }
        }
      ]
    }],
    legend: {
      bottom: 0,
      data: ['当前产品', '行业平均']
    }
  }
  radarChartInstance.setOption(option)
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChart.value) return
  
  trendChartInstance = echarts.init(trendChart.value)
  const option = {
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      },
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      },
      axisLabel: {
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5'
        }
      }
    },
    series: [{
      data: [82, 83, 84, 85, 85, 86, 86, 87, 87, 87, 87, 87],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        color: '#339999',
        width: 3
      },
      itemStyle: {
        color: '#339999',
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(51, 153, 153, 0.3)'
          }, {
            offset: 1, color: 'rgba(51, 153, 153, 0.05)'
          }]
        }
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    }
  }
  trendChartInstance.setOption(option)
}

// 初始化对比图
const initComparisonChart = () => {
  if (!comparisonChart.value) return
  
  comparisonChartInstance = echarts.init(comparisonChart.value)
  const option = {
    xAxis: {
      type: 'category',
      data: ['价格', '质量', '技术', '品牌', '认证'],
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      },
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      },
      axisLabel: {
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5'
        }
      }
    },
    series: [
      {
        name: '当前产品',
        type: 'bar',
        data: [75, 92, 88, 95, 82],
        itemStyle: {
          color: '#339999'
        },
        barWidth: '20%'
      },
      {
        name: 'Honeywell',
        type: 'bar',
        data: [80, 88, 85, 90, 85],
        itemStyle: {
          color: '#67c23a'
        },
        barWidth: '20%'
      },
      {
        name: 'Dräger',
        type: 'bar',
        data: [70, 90, 92, 85, 88],
        itemStyle: {
          color: '#e6a23c'
        },
        barWidth: '20%'
      }
    ],
    legend: {
      bottom: 0,
      data: ['当前产品', 'Honeywell', 'Dräger']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    }
  }
  comparisonChartInstance.setOption(option)
}

// 初始化市场份额图
const initMarketShareChart = () => {
  if (!marketShareChart.value) return
  
  marketShareChartInstance = echarts.init(marketShareChart.value)
  const option = {
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: 18.5, name: '3M', itemStyle: { color: '#339999' } },
        { value: 15.2, name: 'Honeywell', itemStyle: { color: '#67c23a' } },
        { value: 12.8, name: 'Dräger', itemStyle: { color: '#409eff' } },
        { value: 9.5, name: 'Moldex', itemStyle: { color: '#e6a23c' } },
        { value: 8.3, name: '金佰利', itemStyle: { color: '#f56c6c' } },
        { value: 6.7, name: 'UVEX', itemStyle: { color: '#9254de' } },
        { value: 29, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }]
  }
  marketShareChartInstance.setOption(option)
}

// 选择目标
const selectTarget = (product: any) => {
  selectedTarget.value = {
    ...product,
    description: '医用级N95防护口罩，符合FDA和NIOSH标准',
    marketShare: 18.5,
    competitorCount: 24,
    score: 87
  }
  showTargetSelector.value = false
  ElMessage.success(`已选择: ${product.name}`)
}

// 查看竞争对手详情
const viewCompetitorDetail = (competitor: any) => {
  ElMessage.info(`查看 ${competitor.name} 详情`)
}

// 对比
const compareWith = (competitor: any) => {
  ElMessage.success(`已添加 ${competitor.name} 到对比`)
}

// 添加竞争对手
const addCompetitor = () => {
  if (!newCompetitor.name) {
    ElMessage.warning('请输入企业名称')
    return
  }
  competitors.value.push({
    id: Date.now().toString(),
    name: newCompetitor.name,
    country: newCompetitor.country || '未知',
    score: 70,
    marketShare: newCompetitor.marketShare,
    priceScore: 3,
    techScore: 3,
    certifications: ['CE']
  })
  showAddCompetitor.value = false
  ElMessage.success('添加成功')
  
  // 重置表单
  newCompetitor.name = ''
  newCompetitor.country = ''
  newCompetitor.marketShare = 0
}

// 编辑SWOT
const editSwot = () => {
  ElMessage.info('SWOT编辑功能开发中')
}

// 导出报告
const exportReport = () => {
  ElMessage.success('报告导出成功')
}

// 窗口大小改变时重新渲染图表
const handleResize = () => {
  radarChartInstance?.resize()
  trendChartInstance?.resize()
  comparisonChartInstance?.resize()
  marketShareChartInstance?.resize()
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    initRadarChart()
    initTrendChart()
    initComparisonChart()
    initMarketShareChart()
  }, 500)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  radarChartInstance?.dispose()
  trendChartInstance?.dispose()
  comparisonChartInstance?.dispose()
  marketShareChartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.competitiveness-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .header-left {
      .page-title {
        font-size: 32px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #303133;
      }

      .page-description {
        color: #606266;
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .analysis-target-card {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }

    .target-info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .target-main {
        display: flex;
        align-items: center;
        gap: 16px;

        .target-avatar {
          background: #339999;
        }

        .target-details {
          .target-name {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .target-desc {
            color: #606266;
            font-size: 13px;
            margin-bottom: 8px;
          }

          .target-tags {
            display: flex;
            gap: 8px;
          }
        }
      }

      .target-stats {
        display: flex;
        gap: 32px;

        .stat-item {
          text-align: center;

          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #339999;
          }

          .stat-label {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .score-cards-row {
    margin-bottom: 24px;

    .score-card {
      .score-content {
        text-align: center;
        padding: 16px 0;

        .score-label {
          font-size: 14px;
          color: #606266;
          margin-top: 12px;
        }

        .score-rank {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }

        .dimension-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .dimension-score {
          font-size: 32px;
          font-weight: 700;
          color: #303133;
          margin-bottom: 4px;
        }

        .dimension-name {
          font-size: 13px;
          color: #606266;
          margin-bottom: 12px;
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 24px;

    .chart-card {
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .chart-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
      }

      .chart-container {
        height: 350px;
      }
    }
  }

  .competitor-card {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }

    .competitor-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .competitor-details {
        .competitor-name {
          font-weight: 500;
          color: #303133;
        }

        .competitor-country {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .cert-tag {
      margin-right: 4px;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
    }
  }

  .swot-card {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }

    .swot-section {
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;

      &.strength {
        background: #f0f9eb;
        border-left: 4px solid #67c23a;
      }

      &.weakness {
        background: #fef0f0;
        border-left: 4px solid #f56c6c;
      }

      &.opportunity {
        background: #ecf5ff;
        border-left: 4px solid #409eff;
      }

      &.threat {
        background: #fdf6ec;
        border-left: 4px solid #e6a23c;
      }

      .swot-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #303133;
      }

      .swot-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 0;
          color: #606266;
          font-size: 14px;

          .el-icon {
            margin-top: 2px;
            flex-shrink: 0;
          }
        }
      }
    }
  }

  .strategy-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }

    .strategy-item {
      .strategy-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .strategy-desc {
        color: #606266;
        line-height: 1.6;
        margin-bottom: 12px;
      }

      .strategy-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
  }
}

.product-select-card {
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: #339999;
  }

  &.selected {
    border: 2px solid #339999;
    background: #f0f9f9;
  }

  .product-select-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .product-select-details {
      .product-select-name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .product-select-meta {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
