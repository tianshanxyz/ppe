<template>
  <div class="enterprise-search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <h1 class="page-title">企业检索</h1>
      <p class="page-description">搜索全球PPE制造商和供应商信息，包括企业资质、产品范围、认证状态等</p>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <el-autocomplete
          v-model="searchKeyword"
          :fetch-suggestions="querySearch"
          placeholder="输入企业名称、地区或关键词..."
          size="large"
          class="search-input"
          :trigger-on-focus="false"
          clearable
          @select="handleSelect"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" :loading="loading" @click="handleSearch">
              搜索
            </el-button>
          </template>
          <template #default="{ item }">
            <div class="suggestion-item">
              <span class="suggestion-title">{{ item.value }}</span>
              <span class="suggestion-type">{{ item.type }}</span>
            </div>
          </template>
        </el-autocomplete>
      </div>
      
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="search-history">
        <span class="history-label">最近搜索：</span>
        <el-tag
          v-for="item in searchHistory.slice(0, 5)"
          :key="item"
          class="history-tag"
          size="small"
          closable
          @click="searchKeyword = item; handleSearch()"
          @close="removeHistoryItem(item)"
        >
          {{ item }}
        </el-tag>
        <el-button link size="small" @click="clearHistory">
          清除历史
        </el-button>
      </div>
    </div>
    
    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <template #header>
        <div class="filter-header">
          <span class="filter-title">
            <el-icon><Filter /></el-icon>
            筛选条件
          </span>
          <el-button link type="primary" @click="clearFilters">
            <el-icon><Refresh /></el-icon>
            清除筛选
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="企业类型">
            <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 100%">
              <el-option label="制造商" value="manufacturer" />
              <el-option label="经销商" value="distributor" />
              <el-option label="进口商" value="importer" />
              <el-option label="服务商" value="service" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="所在地区">
            <el-select v-model="filters.region" placeholder="选择地区" clearable style="width: 100%">
              <el-option label="中国" value="CN" />
              <el-option label="美国" value="US" />
              <el-option label="欧盟" value="EU" />
              <el-option label="日本" value="JP" />
              <el-option label="韩国" value="KR" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="认证状态">
            <el-select v-model="filters.certStatus" placeholder="选择状态" clearable style="width: 100%">
              <el-option label="全部认证有效" value="all-active">
                <el-tag type="success" size="small">全部认证有效</el-tag>
              </el-option>
              <el-option label="部分认证过期" value="partial-expired">
                <el-tag type="warning" size="small">部分认证过期</el-tag>
              </el-option>
              <el-option label="无认证信息" value="no-cert">
                <el-tag type="info" size="small">无认证信息</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="产品范围">
            <el-select v-model="filters.productRange" placeholder="选择范围" clearable style="width: 100%">
              <el-option label="口罩类产品" value="masks" />
              <el-option label="防护服装" value="clothing" />
              <el-option label="手部防护" value="gloves" />
              <el-option label="眼部防护" value="eyewear" />
              <el-option label="呼吸防护" value="respiratory" />
              <el-option label="足部防护" value="footwear" />
              <el-option label="全品类" value="all" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="注册资本">
            <el-select v-model="filters.capital" placeholder="选择范围" clearable style="width: 100%">
              <el-option label="100万以下" value="0-100" />
              <el-option label="100-500万" value="100-500" />
              <el-option label="500-1000万" value="500-1000" />
              <el-option label="1000万以上" value="1000+" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="成立时间">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 搜索结果 -->
    <div class="search-results">
      <div class="results-header">
        <div class="results-info">
          <span class="results-count">
            共找到 <strong>{{ total }}</strong> 家企业
          </span>
          <el-tag v-if="hasActiveFilters" type="info" size="small" effect="plain">
            已应用筛选
          </el-tag>
        </div>
        <div class="results-actions">
          <el-radio-group v-model="sortBy" size="small" @change="handleSortChange">
            <el-radio-button label="relevance">相关度</el-radio-button>
            <el-radio-button label="certCount">认证数量</el-radio-button>
            <el-radio-button label="productCount">产品数量</el-radio-button>
            <el-radio-button label="name">名称</el-radio-button>
          </el-radio-group>
          <el-divider direction="vertical" />
          <el-button-group>
            <el-button 
              :type="viewMode === 'list' ? 'primary' : 'default'" 
              size="small"
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : 'default'" 
              size="small"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <!-- 结果列表 - 列表视图 -->
      <div v-else-if="results.length > 0 && viewMode === 'list'" class="results-list">
        <el-card
          v-for="item in results"
          :key="item.id"
          class="result-card"
          shadow="hover"
          @click="goToDetail(item.id)"
        >
          <div class="result-content">
            <div class="result-main">
              <div class="result-header">
                <div class="enterprise-logo">
                  <el-avatar :size="56" :icon="OfficeBuilding" />
                </div>
                <div class="enterprise-info">
                  <h3 class="result-title" v-html="highlightText(item.name, searchKeyword)"></h3>
                  <div class="result-badges">
                    <el-tag :type="getTypeType(item.type)" size="small" effect="light">
                      {{ getTypeLabel(item.type) }}
                    </el-tag>
                    <el-tag v-if="item.region" type="info" size="small" effect="plain">
                      <el-icon><Location /></el-icon>
                      {{ item.region }}
                    </el-tag>
                    <el-tag v-if="item.certCount > 0" type="success" size="small" effect="plain">
                      <el-icon><DocumentChecked /></el-icon>
                      {{ item.certCount }} 项认证
                    </el-tag>
                  </div>
                </div>
              </div>
              <p class="result-description">{{ item.description || '暂无企业简介' }}</p>
              <div class="result-meta">
                <span class="meta-item">
                  <el-icon><FirstAidKit /></el-icon>
                  {{ item.productCount || 0 }} 款产品
                </span>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  成立 {{ item.establishedYear || '未知' }}
                </span>
                <span class="meta-item">
                  <el-icon><Money /></el-icon>
                  注册资本 {{ item.registeredCapital || '未知' }}
                </span>
              </div>
              <div v-if="item.productRanges && item.productRanges.length > 0" class="product-ranges">
                <el-tag 
                  v-for="range in item.productRanges.slice(0, 4)" 
                  :key="range"
                  size="small"
                  effect="plain"
                  class="range-tag"
                >
                  {{ range }}
                </el-tag>
                <el-tag v-if="item.productRanges.length > 4" size="small" effect="plain">
                  +{{ item.productRanges.length - 4 }}
                </el-tag>
              </div>
            </div>
            <div class="result-actions">
              <el-button type="primary" text circle @click.stop="toggleFavorite(item.id)">
                <el-icon><Star /></el-icon>
              </el-button>
              <el-button type="primary" text circle>
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 结果列表 - 网格视图 -->
      <div v-else-if="results.length > 0 && viewMode === 'grid'" class="results-grid">
        <el-row :gutter="20">
          <el-col 
            v-for="item in results" 
            :key="item.id" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6"
          >
            <el-card class="result-grid-card" shadow="hover" @click="goToDetail(item.id)">
              <div class="grid-card-header">
                <el-avatar :size="48" :icon="OfficeBuilding" />
                <el-button type="primary" text circle size="small" @click.stop="toggleFavorite(item.id)">
                  <el-icon><Star /></el-icon>
                </el-button>
              </div>
              <h4 class="grid-card-title" v-html="highlightText(item.name, searchKeyword)"></h4>
              <div class="grid-card-badges">
                <el-tag :type="getTypeType(item.type)" size="small">
                  {{ getTypeLabel(item.type) }}
                </el-tag>
                <el-tag v-if="item.region" type="info" size="small" effect="plain">
                  {{ item.region }}
                </el-tag>
              </div>
              <p class="grid-card-desc">{{ truncateText(item.description, 60) }}</p>
              <div class="grid-card-meta">
                <span><el-icon><FirstAidKit /></el-icon> {{ item.productCount || 0 }} 产品</span>
                <span><el-icon><DocumentChecked /></el-icon> {{ item.certCount || 0 }} 认证</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <el-empty
        v-else-if="!loading && hasSearched"
        description="未找到相关企业"
        :image-size="200"
      >
        <template #description>
          <div class="empty-content">
            <p>未找到与 "<strong>{{ searchKeyword }}</strong>" 相关的企业</p>
            <p class="empty-suggestion">建议：检查拼写、减少筛选条件、使用更通用的关键词</p>
          </div>
        </template>
        <el-button type="primary" @click="clearAll">清除搜索条件</el-button>
      </el-empty>
      
      <!-- 初始状态 -->
      <el-empty
        v-else-if="!loading && !hasSearched"
        description="输入关键词开始搜索"
        :image-size="200"
      >
        <template #description>
          <p>搜索全球 PPE 企业信息</p>
        </template>
      </el-empty>
      
      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Filter,
  Refresh,
  List,
  Grid,
  Star,
  ArrowRight,
  OfficeBuilding,
  Location,
  DocumentChecked,
  FirstAidKit,
  Calendar,
  Money
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 搜索状态
const searchKeyword = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const results = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const sortBy = ref('relevance')
const viewMode = ref<'list' | 'grid'>('list')

// 搜索历史
const searchHistory = ref<string[]>(JSON.parse(localStorage.getItem('enterpriseSearchHistory') || '[]'))

// 筛选器
const filters = reactive({
  type: '',
  region: '',
  certStatus: '',
  productRange: '',
  capital: '',
  dateRange: null as [Date, Date] | null
})

// 计算是否有激活的筛选
const hasActiveFilters = computed(() => {
  return filters.type || filters.region || filters.certStatus || 
         filters.productRange || filters.capital || filters.dateRange
})

// 模拟搜索建议
const querySearch = (queryString: string, cb: any) => {
  const suggestions = [
    { value: '3M Company', type: '企业' },
    { value: 'Honeywell', type: '企业' },
    { value: 'DuPont', type: '企业' },
    { value: 'Ansell', type: '企业' },
    { value: 'Kimberly-Clark', type: '企业' },
    { value: '中国', type: '地区' },
    { value: '美国', type: '地区' },
    { value: '欧盟', type: '地区' }
  ].filter(item => item.value.toLowerCase().includes(queryString.toLowerCase()))
  cb(suggestions)
}

const handleSelect = (item: any) => {
  searchKeyword.value = item.value
  handleSearch()
}

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim() && !hasActiveFilters.value) {
    ElMessage.warning('请输入搜索关键词或选择筛选条件')
    return
  }
  
  loading.value = true
  hasSearched.value = true
  
  // 添加到搜索历史
  if (searchKeyword.value && !searchHistory.value.includes(searchKeyword.value)) {
    searchHistory.value.unshift(searchKeyword.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
    localStorage.setItem('enterpriseSearchHistory', JSON.stringify(searchHistory.value))
  }
  
  // 模拟API调用
  setTimeout(() => {
    results.value = generateMockResults()
    total.value = 156
    loading.value = false
  }, 800)
}

// 生成模拟数据
const generateMockResults = () => {
  const enterprises = [
    {
      id: '1',
      name: '3M Company',
      type: 'manufacturer',
      region: '美国',
      description: '全球领先的多元化科技企业，在职业安全、医疗保健等领域提供创新解决方案。PPE产品线涵盖呼吸防护、听力防护、眼部防护等多个品类。',
      certCount: 12,
      productCount: 156,
      establishedYear: '1902',
      registeredCapital: '50亿美元',
      productRanges: ['呼吸防护', '听力防护', '眼部防护', '防护服装']
    },
    {
      id: '2',
      name: 'Honeywell International Inc.',
      type: 'manufacturer',
      region: '美国',
      description: '财富100强多元化技术和制造企业，个人防护设备业务包括安全帽、安全鞋、防护服、气体检测等。',
      certCount: 8,
      productCount: 89,
      establishedYear: '1906',
      registeredCapital: '120亿美元',
      productRanges: ['头部防护', '足部防护', '气体检测', '防护服装']
    },
    {
      id: '3',
      name: 'DuPont de Nemours, Inc.',
      type: 'manufacturer',
      region: '美国',
      description: '全球领先的科技创新企业，Tyvek防护服、Kevlar防护材料享誉全球，专注于高性能防护材料研发。',
      certCount: 15,
      productCount: 67,
      establishedYear: '1802',
      registeredCapital: '200亿美元',
      productRanges: ['防护服装', '材料供应', '化学防护']
    },
    {
      id: '4',
      name: 'Ansell Limited',
      type: 'manufacturer',
      region: '澳大利亚',
      description: '全球领先的手部和身体防护解决方案提供商，专注于工业和医疗防护用品。',
      certCount: 6,
      productCount: 234,
      establishedYear: '1929',
      registeredCapital: '15亿美元',
      productRanges: ['手部防护', '身体防护', '医疗防护']
    },
    {
      id: '5',
      name: ' Kimberly-Clark Corporation',
      type: 'manufacturer',
      region: '美国',
      description: '全球个人护理和防护用品领导者，KleenGuard品牌工业防护产品广受欢迎。',
      certCount: 9,
      productCount: 178,
      establishedYear: '1872',
      registeredCapital: '180亿美元',
      productRanges: ['防护服装', '手部防护', '眼部防护']
    },
    {
      id: '6',
      name: '迈迪康医疗用品(上海)有限公司',
      type: 'distributor',
      region: '中国',
      description: '专业医疗器械和防护用品经销商，代理多个国际知名品牌产品。',
      certCount: 3,
      productCount: 45,
      establishedYear: '2008',
      registeredCapital: '5000万人民币',
      productRanges: ['医疗防护', '手术用品', '检测设备']
    },
    {
      id: '7',
      name: 'UVEX Safety Group',
      type: 'manufacturer',
      region: '德国',
      description: '德国知名安全防护品牌，产品涵盖头部、眼部、听力、呼吸等全方位防护。',
      certCount: 11,
      productCount: 312,
      establishedYear: '1926',
      registeredCapital: '8亿欧元',
      productRanges: ['头部防护', '眼部防护', '听力防护', '呼吸防护']
    },
    {
      id: '8',
      name: 'Moldex-Metric, Inc.',
      type: 'manufacturer',
      region: '美国',
      description: '专注于呼吸防护和听力防护产品，以创新设计和舒适性著称。',
      certCount: 5,
      productCount: 56,
      establishedYear: '1980',
      registeredCapital: '2亿美元',
      productRanges: ['呼吸防护', '听力防护']
    }
  ]
  
  return enterprises
}

// 清除筛选
const clearFilters = () => {
  filters.type = ''
  filters.region = ''
  filters.certStatus = ''
  filters.productRange = ''
  filters.capital = ''
  filters.dateRange = null
}

// 清除所有
const clearAll = () => {
  searchKeyword.value = ''
  clearFilters()
  hasSearched.value = false
  results.value = []
  total.value = 0
}

// 搜索历史操作
const removeHistoryItem = (item: string) => {
  const index = searchHistory.value.indexOf(item)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
    localStorage.setItem('enterpriseSearchHistory', JSON.stringify(searchHistory.value))
  }
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('enterpriseSearchHistory')
}

// 排序处理
const handleSortChange = () => {
  if (hasSearched.value) {
    handleSearch()
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  handleSearch()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
  handleSearch()
}

// 跳转详情
const goToDetail = (id: string) => {
  router.push(`/enterprise/${id}`)
}

// 收藏
const toggleFavorite = (id: string) => {
  ElMessage.success('已添加到收藏')
}

// 高亮文本
const highlightText = (text: string, keyword: string) => {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 截断文本
const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// 获取类型标签
const getTypeType = (type: string) => {
  const types: Record<string, string> = {
    manufacturer: 'primary',
    distributor: 'success',
    importer: 'warning',
    service: 'info'
  }
  return types[type] || 'info'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    manufacturer: '制造商',
    distributor: '经销商',
    importer: '进口商',
    service: '服务商'
  }
  return labels[type] || type
}

// 监听筛选变化
watch(filters, () => {
  if (hasSearched.value) {
    handleSearch()
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.enterprise-search-page {
  .search-header {
    text-align: center;
    padding: 40px 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
    border-radius: 8px;
    margin-bottom: 24px;
    
    .page-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
    }
    
    .page-description {
      color: #606266;
      margin-bottom: 24px;
      font-size: 16px;
    }
    
    .search-box {
      max-width: 700px;
      margin: 0 auto 16px;
      
      .search-input {
        width: 100%;
        
        :deep(.el-input__wrapper) {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }
      }
    }
    
    .search-history {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      
      .history-label {
        color: #909399;
        font-size: 14px;
      }
      
      .history-tag {
        cursor: pointer;
        
        &:hover {
          color: #409eff;
        }
      }
    }
  }
  
  .filter-card {
    margin-bottom: 24px;
    
    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .filter-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }
  }
  
  .search-results {
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .results-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .results-count {
          color: #606266;
          
          strong {
            color: #409eff;
            font-size: 18px;
          }
        }
      }
      
      .results-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
    
    .loading-container {
      padding: 40px;
    }
    
    .results-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .result-card {
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .result-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          
          .result-main {
            flex: 1;
            
            .result-header {
              display: flex;
              align-items: flex-start;
              gap: 16px;
              margin-bottom: 12px;
              
              .enterprise-logo {
                flex-shrink: 0;
              }
              
              .enterprise-info {
                flex: 1;
                
                .result-title {
                  font-size: 18px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #303133;
                  
                  :deep(mark) {
                    background: #ffd04b;
                    color: #303133;
                    padding: 0 2px;
                  }
                }
                
                .result-badges {
                  display: flex;
                  gap: 8px;
                  flex-wrap: wrap;
                }
              }
            }
            
            .result-description {
              color: #606266;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 12px;
            }
            
            .result-meta {
              display: flex;
              gap: 20px;
              margin-bottom: 12px;
              
              .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #909399;
                font-size: 13px;
                
                .el-icon {
                  font-size: 14px;
                }
              }
            }
            
            .product-ranges {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              
              .range-tag {
                background: #f5f7fa;
              }
            }
          }
          
          .result-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
        }
      }
    }
    
    .results-grid {
      .result-grid-card {
        cursor: pointer;
        margin-bottom: 20px;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .grid-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .grid-card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #303133;
          
          :deep(mark) {
            background: #ffd04b;
            color: #303133;
            padding: 0 2px;
          }
        }
        
        .grid-card-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .grid-card-desc {
          color: #606266;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
          height: 40px;
          overflow: hidden;
        }
        
        .grid-card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #909399;
          
          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
    
    .empty-content {
      text-align: center;
      
      .empty-suggestion {
        color: #909399;
        font-size: 14px;
        margin-top: 8px;
      }
    }
    
    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;
    }
  }
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .suggestion-type {
    color: #909399;
    font-size: 12px;
  }
}
</style>
