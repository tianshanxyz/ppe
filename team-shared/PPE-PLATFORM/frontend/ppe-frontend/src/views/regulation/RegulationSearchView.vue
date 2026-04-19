<template>
  <div class="regulation-search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <h1 class="page-title">法规检索</h1>
      <p class="page-description">搜索全球PPE相关法规、标准和监管要求，支持多维度筛选</p>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <el-autocomplete
          v-model="searchKeyword"
          :fetch-suggestions="querySearch"
          placeholder="输入法规名称、标准号或关键词..."
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
          <el-form-item label="法规类型">
            <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 100%">
              <el-option label="国家标准" value="national-standard" />
              <el-option label="行业标准" value="industry-standard" />
              <el-option label="地方法规" value="local-regulation" />
              <el-option label="国际标准" value="international-standard" />
              <el-option label="欧盟法规" value="eu-regulation" />
              <el-option label="美国法规" value="us-regulation" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="适用地区">
            <el-select v-model="filters.jurisdiction" placeholder="选择地区" clearable style="width: 100%">
              <el-option label="中国" value="CN" />
              <el-option label="美国" value="US" />
              <el-option label="欧盟" value="EU" />
              <el-option label="日本" value="JP" />
              <el-option label="澳大利亚" value="AU" />
              <el-option label="加拿大" value="CA" />
              <el-option label="国际通用" value="INT" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="法规状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 100%">
              <el-option label="现行有效" value="active">
                <el-tag type="success" size="small">现行有效</el-tag>
              </el-option>
              <el-option label="即将实施" value="pending">
                <el-tag type="warning" size="small">即将实施</el-tag>
              </el-option>
              <el-option label="已废止" value="repealed">
                <el-tag type="info" size="small">已废止</el-tag>
              </el-option>
              <el-option label="草案阶段" value="draft">
                <el-tag type="" size="small">草案阶段</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="产品类别">
            <el-select v-model="filters.category" placeholder="选择类别" clearable style="width: 100%">
              <el-option label="口罩" value="mask" />
              <el-option label="防护服" value="protective-clothing" />
              <el-option label="手套" value="gloves" />
              <el-option label="护目镜" value="goggles" />
              <el-option label="面罩" value="face-shield" />
              <el-option label="呼吸器" value="respirator" />
              <el-option label="防护鞋" value="protective-footwear" />
              <el-option label="通用要求" value="general" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="发布日期">
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
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="效力级别">
            <el-select v-model="filters.level" placeholder="选择级别" clearable style="width: 100%">
              <el-option label="强制性" value="mandatory" />
              <el-option label="推荐性" value="recommended" />
              <el-option label="指导性" value="guidance" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 搜索结果 -->
    <div class="search-results">
      <div class="results-header">
        <div class="results-info">
          <span class="results-count">
            共找到 <strong>{{ total }}</strong> 条法规
          </span>
          <el-tag v-if="hasActiveFilters" type="info" size="small" effect="plain">
            已应用筛选
          </el-tag>
        </div>
        <div class="results-actions">
          <el-radio-group v-model="sortBy" size="small" @change="handleSortChange">
            <el-radio-button label="relevance">相关度</el-radio-button>
            <el-radio-button label="date">发布日期</el-radio-button>
            <el-radio-button label="effective">生效日期</el-radio-button>
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
                <div class="regulation-icon">
                  <el-avatar :size="48" :icon="Document" />
                </div>
                <div class="regulation-info">
                  <h3 class="result-title" v-html="highlightText(item.title, searchKeyword)"></h3>
                  <div class="result-badges">
                    <el-tag :type="getStatusType(item.status)" size="small" effect="light">
                      {{ getStatusLabel(item.status) }}
                    </el-tag>
                    <el-tag v-if="item.jurisdiction" type="info" size="small" effect="plain">
                      <el-icon><Location /></el-icon>
                      {{ item.jurisdiction }}
                    </el-tag>
                    <el-tag v-if="item.level" :type="getLevelType(item.level)" size="small" effect="plain">
                      {{ getLevelLabel(item.level) }}
                    </el-tag>
                  </div>
                </div>
              </div>
              
              <div class="regulation-meta">
                <span class="meta-item">
                  <el-icon><DocumentChecked /></el-icon>
                  <strong>标准号：</strong>{{ item.standardNumber || '暂无' }}
                </span>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  <strong>发布日期：</strong>{{ item.publishDate || '暂无' }}
                </span>
                <span class="meta-item">
                  <el-icon><Timer /></el-icon>
                  <strong>生效日期：</strong>{{ item.effectiveDate || '暂无' }}
                </span>
              </div>
              
              <p class="result-description">{{ item.description || '暂无法规简介' }}</p>
              
              <div v-if="item.categories && item.categories.length > 0" class="categories">
                <el-tag 
                  v-for="category in item.categories" 
                  :key="category"
                  size="small"
                  effect="plain"
                  class="category-tag"
                >
                  {{ category }}
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
                <el-avatar :size="40" :icon="Document" />
                <el-button type="primary" text circle size="small" @click.stop="toggleFavorite(item.id)">
                  <el-icon><Star /></el-icon>
                </el-button>
              </div>
              <h4 class="grid-card-title" v-html="highlightText(item.title, searchKeyword)"></h4>
              <div class="grid-card-badges">
                <el-tag :type="getStatusType(item.status)" size="small">
                  {{ getStatusLabel(item.status) }}
                </el-tag>
                <el-tag v-if="item.jurisdiction" type="info" size="small" effect="plain">
                  {{ item.jurisdiction }}
                </el-tag>
              </div>
              <p class="grid-card-desc">{{ truncateText(item.description, 80) }}</p>
              <div class="grid-card-meta">
                <span><el-icon><DocumentChecked /></el-icon> {{ item.standardNumber || '暂无标准号' }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <el-empty
        v-else-if="!loading && hasSearched"
        description="未找到相关法规"
        :image-size="200"
      >
        <template #description>
          <div class="empty-content">
            <p>未找到与 "<strong>{{ searchKeyword }}</strong>" 相关的法规</p>
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
          <p>搜索全球 PPE 法规标准</p>
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
  Document,
  Location,
  DocumentChecked,
  Calendar,
  Timer
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
const searchHistory = ref<string[]>(JSON.parse(localStorage.getItem('regulationSearchHistory') || '[]'))

// 筛选器
const filters = reactive({
  type: '',
  jurisdiction: '',
  status: '',
  category: '',
  level: '',
  dateRange: null as [Date, Date] | null
})

// 计算是否有激活的筛选
const hasActiveFilters = computed(() => {
  return filters.type || filters.jurisdiction || filters.status || 
         filters.category || filters.level || filters.dateRange
})

// 模拟搜索建议
const querySearch = (queryString: string, cb: any) => {
  const suggestions = [
    { value: 'GB 19083-2010', type: '标准号' },
    { value: 'EN 149', type: '标准号' },
    { value: '42 CFR Part 84', type: '法规' },
    { value: '医疗器械监督管理条例', type: '法规' },
    { value: 'PPE Regulation (EU) 2016/425', type: '法规' },
    { value: '呼吸防护', type: '关键词' },
    { value: '防护服', type: '关键词' }
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
    localStorage.setItem('regulationSearchHistory', JSON.stringify(searchHistory.value))
  }
  
  // 模拟API调用
  setTimeout(() => {
    results.value = generateMockResults()
    total.value = 243
    loading.value = false
  }, 800)
}

// 生成模拟数据
const generateMockResults = () => {
  const regulations = [
    {
      id: '1',
      title: 'GB 19083-2010 医用防护口罩技术要求',
      standardNumber: 'GB 19083-2010',
      type: 'national-standard',
      jurisdiction: '中国',
      status: 'active',
      level: 'mandatory',
      publishDate: '2010-09-02',
      effectiveDate: '2011-08-01',
      description: '本标准规定了医用防护口罩的技术要求、试验方法、标志与使用说明及包装、运输和贮存。适用于医疗工作环境下，过滤空气中的颗粒物，阻隔飞沫、血液、体液、分泌物等的自吸过滤式医用防护口罩。',
      categories: ['口罩', '医疗防护']
    },
    {
      id: '2',
      title: 'EN 149:2001+A1:2009 呼吸防护装置 - 过滤半面罩',
      standardNumber: 'EN 149:2001+A1:2009',
      type: 'international-standard',
      jurisdiction: '欧盟',
      status: 'active',
      level: 'mandatory',
      publishDate: '2009-07-01',
      effectiveDate: '2009-07-01',
      description: '本欧洲标准规定了用于防护颗粒物的过滤半面罩的最低要求，包括用于逃生目的的过滤半面罩。',
      categories: ['呼吸防护', '颗粒物防护']
    },
    {
      id: '3',
      title: '42 CFR Part 84 呼吸防护装置批准',
      standardNumber: '42 CFR Part 84',
      type: 'us-regulation',
      jurisdiction: '美国',
      status: 'active',
      level: 'mandatory',
      publishDate: '1995-06-08',
      effectiveDate: '1998-07-10',
      description: '美国联邦法规，规定了呼吸防护装置的测试和认证要求，由NIOSH负责执行。',
      categories: ['呼吸防护']
    },
    {
      id: '4',
      title: 'PPE Regulation (EU) 2016/425',
      standardNumber: 'Regulation (EU) 2016/425',
      type: 'eu-regulation',
      jurisdiction: '欧盟',
      status: 'active',
      level: 'mandatory',
      publishDate: '2016-03-09',
      effectiveDate: '2018-04-21',
      description: '欧盟个人防护设备法规，取代了原有的PPE指令89/686/EEC，规定了PPE产品在欧盟市场投放的要求。',
      categories: ['通用要求', 'PPE全品类']
    },
    {
      id: '5',
      title: 'GB 24539-2021 防护服装 化学防护服',
      standardNumber: 'GB 24539-2021',
      type: 'national-standard',
      jurisdiction: '中国',
      status: 'active',
      level: 'mandatory',
      publishDate: '2021-08-10',
      effectiveDate: '2022-09-01',
      description: '本标准规定了化学防护服的分类、技术要求、试验方法、检验规则及标志、包装、运输和贮存。',
      categories: ['防护服', '化学防护']
    },
    {
      id: '6',
      title: 'ASTM F2100-21 医用口罩材料性能标准规范',
      standardNumber: 'ASTM F2100-21',
      type: 'us-regulation',
      jurisdiction: '美国',
      status: 'active',
      level: 'recommended',
      publishDate: '2021-05-01',
      effectiveDate: '2021-05-01',
      description: '美国材料与试验协会标准，规定了医用口罩材料的性能要求，包括细菌过滤效率、压差、颗粒过滤效率等。',
      categories: ['口罩', '医疗防护']
    },
    {
      id: '7',
      title: 'EN 166:2001 个人眼部防护 - 规范',
      standardNumber: 'EN 166:2001',
      type: 'international-standard',
      jurisdiction: '欧盟',
      status: 'active',
      level: 'mandatory',
      publishDate: '2001-12-01',
      effectiveDate: '2002-01-01',
      description: '本欧洲标准规定了各种类型的用于个人防护的眼部护具的要求和测试方法。',
      categories: ['眼部防护']
    },
    {
      id: '8',
      title: '医疗器械监督管理条例',
      standardNumber: '国务院令第739号',
      type: 'national-standard',
      jurisdiction: '中国',
      status: 'active',
      level: 'mandatory',
      publishDate: '2021-02-09',
      effectiveDate: '2021-06-01',
      description: '中华人民共和国国务院颁布的行政法规，规范医疗器械的研制、生产、经营、使用活动及其监督管理。',
      categories: ['通用要求', '医疗防护']
    }
  ]
  
  return regulations
}

// 清除筛选
const clearFilters = () => {
  filters.type = ''
  filters.jurisdiction = ''
  filters.status = ''
  filters.category = ''
  filters.level = ''
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
    localStorage.setItem('regulationSearchHistory', JSON.stringify(searchHistory.value))
  }
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('regulationSearchHistory')
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
  router.push(`/regulation/${id}`)
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

// 获取状态标签
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    repealed: 'info',
    draft: ''
  }
  return types[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '现行有效',
    pending: '即将实施',
    repealed: '已废止',
    draft: '草案阶段'
  }
  return labels[status] || status
}

// 获取效力级别标签
const getLevelType = (level: string) => {
  const types: Record<string, string> = {
    mandatory: 'danger',
    recommended: 'success',
    guidance: 'info'
  }
  return types[level] || 'info'
}

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    mandatory: '强制性',
    recommended: '推荐性',
    guidance: '指导性'
  }
  return labels[level] || level
}

// 监听筛选变化
watch(filters, () => {
  if (hasSearched.value) {
    handleSearch()
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.regulation-search-page {
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
              
              .regulation-icon {
                flex-shrink: 0;
              }
              
              .regulation-info {
                flex: 1;
                
                .result-title {
                  font-size: 17px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #303133;
                  line-height: 1.4;
                  
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
            
            .regulation-meta {
              display: flex;
              gap: 24px;
              margin-bottom: 12px;
              padding: 8px 0;
              border-bottom: 1px dashed #ebeef5;
              
              .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #606266;
                font-size: 13px;
                
                .el-icon {
                  font-size: 14px;
                  color: #909399;
                }
              }
            }
            
            .result-description {
              color: #606266;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 12px;
            }
            
            .categories {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              
              .category-tag {
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
        height: 100%;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        :deep(.el-card__body) {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .grid-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .grid-card-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #303133;
          line-height: 1.4;
          
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
          flex-wrap: wrap;
        }
        
        .grid-card-desc {
          color: #606266;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
          flex: 1;
        }
        
        .grid-card-meta {
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
