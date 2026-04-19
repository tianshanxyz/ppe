<template>
  <div class="dashboard-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据看板</h1>
        <p class="page-description">实时监控PPE数据动态，洞察行业趋势</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
          <el-radio-button label="90d">近90天</el-radio-button>
          <el-radio-button label="1y">近1年</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refreshData" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon><FirstAidKit /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalProducts }}</div>
              <div class="stat-label">PPE产品总数</div>
              <div class="stat-change up">
                <el-icon><ArrowUp /></el-icon>
                {{ stats.productGrowth }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalEnterprises }}</div>
              <div class="stat-label">企业总数</div>
              <div class="stat-change up">
                <el-icon><ArrowUp /></el-icon>
                {{ stats.enterpriseGrowth }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon><DocumentChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalCertifications }}</div>
              <div class="stat-label">有效认证</div>
              <div class="stat-change down">
                <el-icon><ArrowDown /></el-icon>
                {{ stats.certChange }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon red">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeAlerts }}</div>
              <div class="stat-label">活跃预警</div>
              <div class="stat-change up">
                <el-icon><ArrowUp /></el-icon>
                {{ stats.alertGrowth }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 产品趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><TrendCharts /></el-icon>
                产品认证趋势
              </span>
              <el-tooltip content="显示指定时间范围内的产品认证数量变化趋势">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="productTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 地区分布图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><PieChart /></el-icon>
                产品地区分布
              </span>
              <el-tooltip content="按地区统计PPE产品数量分布">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="regionChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <!-- 产品类别分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><Histogram /></el-icon>
                产品类别分布
              </span>
              <el-tooltip content="按产品类别统计数量分布">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="categoryChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 认证状态统计 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">
                <el-icon><CircleCheck /></el-icon>
                认证状态分布
              </span>
              <el-tooltip content="按认证状态统计产品数量">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="statusChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-row :gutter="20" class="tables-row">
      <!-- 最新产品 -->
      <el-col :xs="24" :lg="12">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="table-header">
              <span class="table-title">
                <el-icon><Timer /></el-icon>
                最新认证产品
              </span>
              <el-button link type="primary" @click="goToPPEList">
                查看全部
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="latestProducts" style="width: 100%" v-loading="loading">
            <el-table-column prop="name" label="产品名称" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <el-link type="primary" @click="goToProductDetail(row.id)">{{ row.name }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="manufacturer" label="制造商" width="120" show-overflow-tooltip />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="certDate" label="认证日期" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 即将过期认证 -->
      <el-col :xs="24" :lg="12">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="table-header">
              <span class="table-title">
                <el-icon><Warning /></el-icon>
                即将过期认证
              </span>
              <el-button link type="primary" @click="goToAlertCenter">
                查看全部
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="expiringCerts" style="width: 100%" v-loading="loading">
            <el-table-column prop="productName" label="产品名称" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <el-link type="primary" @click="goToProductDetail(row.productId)">{{ row.productName }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="certName" label="认证名称" width="120" show-overflow-tooltip />
            <el-table-column prop="expiryDate" label="过期日期" width="100">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.daysLeft <= 7 }">{{ row.expiryDate }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="daysLeft" label="剩余天数" width="90">
              <template #default="{ row }">
                <el-tag :type="getDaysLeftType(row.daysLeft)" size="small">
                  {{ row.daysLeft }} 天
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门搜索词 -->
    <el-card class="hot-searches-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Search /></el-icon>
            热门搜索
          </span>
        </div>
      </template>
      <div class="hot-tags">
        <el-tag
          v-for="(item, index) in hotSearches"
          :key="index"
          :type="getHotTagType(index)"
          size="large"
          effect="light"
          class="hot-tag"
          @click="searchKeyword(item.keyword)"
        >
          <span class="tag-rank">{{ index + 1 }}</span>
          {{ item.keyword }}
          <span class="tag-count">({{ item.count }})</span>
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Refresh,
  FirstAidKit,
  OfficeBuilding,
  DocumentChecked,
  Bell,
  ArrowUp,
  ArrowDown,
  TrendCharts,
  PieChart,
  Histogram,
  CircleCheck,
  InfoFilled,
  Timer,
  Warning,
  Search,
  ArrowRight
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 时间范围
const timeRange = ref('30d')
const loading = ref(false)

// 统计数据
const stats = reactive({
  totalProducts: 12543,
  productGrowth: 12.5,
  totalEnterprises: 3289,
  enterpriseGrowth: 8.3,
  totalCertifications: 45672,
  certChange: 2.1,
  activeAlerts: 23,
  alertGrowth: 15.6
})

// 图表引用
const productTrendChart = ref<HTMLElement>()
const regionChart = ref<HTMLElement>()
const categoryChart = ref<HTMLElement>()
const statusChart = ref<HTMLElement>()

// 图表实例
let productTrendChartInstance: echarts.ECharts | null = null
let regionChartInstance: echarts.ECharts | null = null
let categoryChartInstance: echarts.ECharts | null = null
let statusChartInstance: echarts.ECharts | null = null

// 最新产品
const latestProducts = ref([
  { id: '1', name: 'N95医用防护口罩', manufacturer: '3M', category: '口罩', certDate: '2024-01-15' },
  { id: '2', name: '医用一次性防护服', manufacturer: 'DuPont', category: '防护服', certDate: '2024-01-14' },
  { id: '3', name: '防化手套', manufacturer: 'Ansell', category: '手套', certDate: '2024-01-13' },
  { id: '4', name: '防护面罩', manufacturer: 'Honeywell', category: '面罩', certDate: '2024-01-12' },
  { id: '5', name: '护目镜', manufacturer: 'UVEX', category: '护目镜', certDate: '2024-01-11' }
])

// 即将过期认证
const expiringCerts = ref([
  { productId: '1', productName: '医用外科口罩', certName: 'NMPA认证', expiryDate: '2024-02-01', daysLeft: 5 },
  { productId: '2', productName: '防护手套', certName: 'CE认证', expiryDate: '2024-02-05', daysLeft: 9 },
  { productId: '3', productName: '呼吸器', certName: 'NIOSH认证', expiryDate: '2024-02-10', daysLeft: 14 },
  { productId: '4', productName: '防护服', certName: 'FDA认证', expiryDate: '2024-02-15', daysLeft: 19 },
  { productId: '5', productName: '安全鞋', certName: 'CE认证', expiryDate: '2024-02-20', daysLeft: 24 }
])

// 热门搜索
const hotSearches = ref([
  { keyword: 'N95口罩', count: 12543 },
  { keyword: '防护服', count: 9876 },
  { keyword: '医用口罩', count: 8654 },
  { keyword: '防护手套', count: 7654 },
  { keyword: '3M', count: 6543 },
  { keyword: 'CE认证', count: 5432 },
  { keyword: 'FDA认证', count: 4321 },
  { keyword: '呼吸器', count: 3210 }
])

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    // 产品趋势图
    if (productTrendChart.value) {
      productTrendChartInstance = echarts.init(productTrendChart.value)
      productTrendChartInstance.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          axisLine: { lineStyle: { color: '#909399' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#909399' } },
          splitLine: { lineStyle: { color: '#ebeef5' } }
        },
        series: [
          {
            name: '新增认证',
            type: 'line',
            smooth: true,
            data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 260, 280],
            itemStyle: { color: '#409eff' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
              ])
            }
          },
          {
            name: '过期认证',
            type: 'line',
            smooth: true,
            data: [20, 32, 11, 34, 20, 30, 21, 22, 19, 24, 26, 28],
            itemStyle: { color: '#f56c6c' }
          }
        ]
      })
    }

    // 地区分布图
    if (regionChart.value) {
      regionChartInstance = echarts.init(regionChart.value)
      regionChartInstance.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center'
        },
        series: [
          {
            name: '地区分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            data: [
              { value: 3548, name: '中国', itemStyle: { color: '#409eff' } },
              { value: 2735, name: '美国', itemStyle: { color: '#67c23a' } },
              { value: 2510, name: '欧盟', itemStyle: { color: '#e6a23c' } },
              { value: 1834, name: '日本', itemStyle: { color: '#f56c6c' } },
              { value: 1256, name: '其他', itemStyle: { color: '#909399' } }
            ]
          }
        ]
      })
    }

    // 产品类别分布
    if (categoryChart.value) {
      categoryChartInstance = echarts.init(categoryChart.value)
      categoryChartInstance.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#909399' } },
          splitLine: { lineStyle: { color: '#ebeef5' } }
        },
        yAxis: {
          type: 'category',
          data: ['防护鞋', '呼吸器', '面罩', '护目镜', '手套', '防护服', '口罩'],
          axisLine: { lineStyle: { color: '#909399' } }
        },
        series: [
          {
            name: '产品数量',
            type: 'bar',
            data: [892, 1234, 1456, 1876, 2345, 2890, 3850],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                { offset: 0, color: '#409eff' },
                { offset: 1, color: '#67c23a' }
              ]),
              borderRadius: [0, 4, 4, 0]
            }
          }
        ]
      })
    }

    // 认证状态分布
    if (statusChart.value) {
      statusChartInstance = echarts.init(statusChart.value)
      statusChartInstance.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          bottom: '5%',
          left: 'center'
        },
        series: [
          {
            name: '认证状态',
            type: 'pie',
            radius: '60%',
            center: ['50%', '45%'],
            data: [
              { value: 38540, name: '已认证', itemStyle: { color: '#67c23a' } },
              { value: 4230, name: '认证中', itemStyle: { color: '#e6a23c' } },
              { value: 1890, name: '已过期', itemStyle: { color: '#f56c6c' } },
              { value: 1012, name: '已撤销', itemStyle: { color: '#909399' } }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      })
    }
  })
}

// 刷新数据
const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

// 时间范围变化
const handleTimeRangeChange = () => {
  refreshData()
}

// 获取剩余天数标签类型
const getDaysLeftType = (days: number) => {
  if (days <= 7) return 'danger'
  if (days <= 14) return 'warning'
  return 'info'
}

// 获取热门标签类型
const getHotTagType = (index: number) => {
  if (index === 0) return 'danger'
  if (index === 1) return 'warning'
  if (index === 2) return 'success'
  return ''
}

// 搜索关键词
const searchKeyword = (keyword: string) => {
  router.push({
    path: '/ppe',
    query: { keyword }
  })
}

// 页面跳转
const goToPPEList = () => {
  router.push('/ppe')
}

const goToAlertCenter = () => {
  router.push('/alert')
}

const goToProductDetail = (id: string) => {
  router.push(`/ppe/${id}`)
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  productTrendChartInstance?.resize()
  regionChartInstance?.resize()
  categoryChartInstance?.resize()
  statusChartInstance?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  productTrendChartInstance?.dispose()
  regionChartInstance?.dispose()
  categoryChartInstance?.dispose()
  statusChartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      .page-title {
        font-size: 28px;
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
      align-items: center;
    }
  }
  
  .stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      margin-bottom: 20px;
      
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          
          &.blue {
            background: linear-gradient(135deg, #409eff 0%, #64b5f6 100%);
            color: white;
          }
          
          &.green {
            background: linear-gradient(135deg, #67c23a 0%, #8bc34a 100%);
            color: white;
          }
          
          &.orange {
            background: linear-gradient(135deg, #e6a23c 0%, #ffb74d 100%);
            color: white;
          }
          
          &.red {
            background: linear-gradient(135deg, #f56c6c 0%, #ef5350 100%);
            color: white;
          }
        }
        
        .stat-info {
          flex: 1;
          
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1.2;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
          
          .stat-change {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            margin-top: 4px;
            
            &.up {
              color: #67c23a;
            }
            
            &.down {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 24px;
    
    .chart-card {
      margin-bottom: 20px;
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .chart-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 16px;
        }
      }
      
      .chart-container {
        height: 300px;
      }
    }
  }
  
  .tables-row {
    margin-bottom: 24px;
    
    .table-card {
      margin-bottom: 20px;
      
      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .table-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 16px;
        }
      }
      
      .text-danger {
        color: #f56c6c;
        font-weight: 500;
      }
    }
  }
  
  .hot-searches-card {
    .card-header {
      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: 16px;
      }
    }
    
    .hot-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      
      .hot-tag {
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          transform: scale(1.05);
        }
        
        .tag-rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          font-size: 12px;
          margin-right: 6px;
        }
        
        .tag-count {
          color: #909399;
          font-size: 12px;
          margin-left: 4px;
        }
      }
    }
  }
}
</style>
