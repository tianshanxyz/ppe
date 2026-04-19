<template>
  <div class="ppe-search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <h1 class="page-title">PPE 产品检索</h1>
      <p class="page-description">搜索全球个人防护装备产品信息，包括认证状态、技术规格等</p>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <el-autocomplete
          v-model="searchKeyword"
          :fetch-suggestions="querySearch"
          placeholder="输入产品名称、型号或关键词..."
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
            <el-button type="primary" :loading="searchStore.loading" @click="handleSearch">
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
      <div v-if="searchStore.searchHistory.length > 0" class="search-history">
        <span class="history-label">最近搜索：</span>
        <el-tag
          v-for="item in searchStore.searchHistory.slice(0, 5)"
          :key="item"
          class="history-tag"
          size="small"
          closable
          @click="searchKeyword = item; handleSearch()"
          @close="removeHistoryItem(item)"
        >
          {{ item }}
        </el-tag>
        <el-button link size="small" @click="searchStore.clearHistory()">
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
          <el-form-item label="产品类别">
            <el-select v-model="filters.category" placeholder="选择类别" clearable style="width: 100%">
              <el-option label="口罩" value="mask" />
              <el-option label="防护服" value="protective-clothing" />
              <el-option label="手套" value="gloves" />
              <el-option label="护目镜" value="goggles" />
              <el-option label="面罩" value="face-shield" />
              <el-option label="呼吸器" value="respirator" />
              <el-option label="防护鞋" value="protective-footwear" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="认证地区">
            <el-select v-model="filters.jurisdiction" placeholder="选择地区" clearable style="width: 100%">
              <el-option label="中国 (NMPA)" value="CN" />
              <el-option label="美国 (FDA)" value="US" />
              <el-option label="欧盟 (CE)" value="EU" />
              <el-option label="日本 (PMDA)" value="JP" />
              <el-option label="澳大利亚 (TGA)" value="AU" />
              <el-option label="加拿大 (Health Canada)" value="CA" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="认证状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 100%">
              <el-option label="已认证" value="certified">
                <el-tag type="success" size="small">已认证</el-tag>
              </el-option>
              <el-option label="认证中" value="pending">
                <el-tag type="warning" size="small">认证中</el-tag>
              </el-option>
              <el-option label="已过期" value="expired">
                <el-tag type="danger" size="small">已过期</el-tag>
              </el-option>
              <el-option label="已撤销" value="revoked">
                <el-tag type="info" size="small">已撤销</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="风险等级">
            <el-select v-model="filters.riskLevel" placeholder="选择等级" clearable style="width: 100%">
              <el-option label="Class I" value="class-i" />
              <el-option label="Class II" value="class-ii" />
              <el-option label="Class III" value="class-iii" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="更新日期">
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
          <el-form-item label="数据来源">
            <el-select v-model="filters.dataSource" placeholder="选择来源" clearable style="width: 100%">
              <el-option label="MedPlum" value="medplum" />
              <el-option label="FDA" value="fda" />
              <el-option label="本地数据库" value="local" />
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
            共找到 <strong>{{ searchStore.total }}</strong> 条结果
          </span>
          <el-tag v-if="hasActiveFilters" type="info" size="small" effect="plain">
            已应用筛选
          </el-tag>
        </div>
        <div class="results-actions">
          <el-radio-group v-model="sortBy" size="small" @change="handleSortChange">
            <el-radio-button label="relevance">相关度</el-radio-button>
            <el-radio-button label="date">更新时间</el-radio-button>
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
      <div v-if="searchStore.loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <!-- 结果列表 - 列表视图 -->
      <div v-else-if="searchStore.results.length > 0 && viewMode === 'list'" class="results-list">
        <el-card
          v-for="item in searchStore.results"
          :key="item.id"
          class="result-card"
          shadow="hover"
          @click="goToDetail(item.id)"
        >
          <div class="result-content">
            <div class="result-main">
              <div class="result-header">
                <h3 class="result-title" v-html="highlightText(item.title, searchKeyword)"></h3>
                <div class="result-badges">
                  <el-tag :type="getStatusType(item.status)" size="small" effect="light">
                    {{ getStatusLabel(item.status) }}
                  </el-tag>
                  <el-tag v-if="item.jurisdiction" type="info" size="small" effect="plain">
                    {{ item.jurisdiction }}
                  </el-tag>
                </div>
              </div>
              <p class="result-description" v-html="highlightText(item.description, searchKeyword)"></p>
              <div class="result-meta">
                <span class="meta-item">
                  <el-icon><OfficeBuilding /></el-icon>
                  {{ item.manufacturer || '未知制造商' }}
                </span>
                <span class="meta-item">
                  <el-icon><FirstAidKit /></el-icon>
                  {{ item.category || '未分类' }}
                </span>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  更新于 {{ formatDate(item.updatedAt) }}
                </span>
                <el-tag v-if="item.dataSource" size="small" type="info" effect="plain">
                  {{ item.dataSource }}
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
      <div v-else-if="searchStore.results.length > 0 && viewMode === 'grid'" class="results-grid">
        <el-row :gutter="20">
          <el-col 
            v-for="item in searchStore.results" 
            :key="item.id" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6"
          >
            <el-card class="result-grid-card" shadow="hover" @click="goToDetail(item.id)">
              <div class="grid-card-header">
                <el-tag :type="getStatusType(item.status)" size="small">
                  {{ getStatusLabel(item.status) }}
                </el-tag>
                <el-button type="primary" text circle size="small" @click.stop="toggleFavorite(item.id)">
                  <el-icon><Star /></el-icon>
                </el-button>
              </div>
              <h4 class="grid-card-title" v-html="highlightText(item.title, searchKeyword)"></h4>
              <p class="grid-card-desc">{{ truncateText(item.description, 80) }}</p>
              <div class="grid-card-meta">
                <span><el-icon><OfficeBuilding /></el-icon> {{ item.manufacturer || '未知' }}</span>
                <span><el-icon><Calendar /></el-icon> {{ formatDate(item.updatedAt) }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <el-empty
        v-else-if="!searchStore.loading && hasSearched"
        description="未找到相关结果"
        :image-size="200"
      >
        <template #description>
          <div class="empty-content">
            <p>未找到与 "<strong>{{ searchKeyword }}</strong>" 相关的结果</p>
            <p class="empty-suggestion">建议：检查拼写、减少筛选条件、使用更通用的关键词</p>
          </div>
        </template>
        <el-button type="primary" @click="clearAll">清除搜索条件</el-button>
      </el-empty>
      
      <!-- 初始状态 -->
      <el-empty
        v-else-if="!searchStore.loading && !hasSearched"
        description="输入关键词开始搜索"
        :image-size="200"
      >
        <template #description>
          <p>搜索全球 PPE 产品信息</p>
        </template>
      </el-empty>
      
      <!-- 分页 -->
      <div v-if="searchStore.total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="searchStore.currentPage"
          v-model:page-size="searchStore.pageSize"
          :total="searchStore.total"
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
import { ref, reactive, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Search, 
  ArrowRight, 
  Star, 
  Filter, 
  Refresh,
  List,
  Grid,
  OfficeBuilding,
  FirstAidKit,
  Calendar
} from '@element-plus/icons-vue'
import { useSearchStore } from '@/stores/search'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const searchStore = useSearchStore()

// 搜索状态
const searchKeyword = ref('')
const sortBy = ref('relevance')
const viewMode = ref<'list' | 'grid'>('list')
const hasSearched = ref(false)

// 筛选器
const filters = reactive({
  category: '',
  jurisdiction: '',
  status: '',
  riskLevel: '',
  dateRange: null as [string, string] | null,
  dataSource: ''
})

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.category || filters.jurisdiction || filters.status || 
         filters.riskLevel || filters.dateRange || filters.dataSource
})

// 搜索建议
const querySearch = (queryString: string, cb: any) => {
  const suggestions = [
    { value: 'N95 口罩', type: '产品' },
    { value: '医用防护服', type: '产品' },
    { value: '3M', type: '品牌' },
    { value: 'KN95', type: '标准' },
    { value: 'FDA 认证', type: '认证' },
    { value: 'CE 标志', type: '认证' }
  ].filter(item => 
    item.value.toLowerCase().includes(queryString.toLowerCase())
  )
  cb(suggestions)
}

const handleSelect = (item: any) => {
  searchKeyword.value = item.value
  handleSearch()
}

// 搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim() && !hasActiveFilters.value) {
    ElMessage.warning('请输入搜索关键词或选择筛选条件')
    return
  }
  
  hasSearched.value = true
  searchStore.setFilters({
    keyword: searchKeyword.value,
    ...filters
  })
  
  try {
    await searchStore.search()
    // 更新 URL 参数
    router.replace({
      query: {
        q: searchKeyword.value || undefined,
        category: filters.category || undefined,
        jurisdiction: filters.jurisdiction || undefined,
        status: filters.status || undefined,
        page: searchStore.currentPage > 1 ? searchStore.currentPage : undefined
      }
    })
  } catch (error) {
    ElMessage.error('搜索失败，请稍后重试')
  }
}

// 排序
const handleSortChange = () => {
  handleSearch()
}

// 清除筛选
const clearFilters = () => {
  filters.category = ''
  filters.jurisdiction = ''
  filters.status = ''
  filters.riskLevel = ''
  filters.dateRange = null
  filters.dataSource = ''
  searchStore.clearFilters()
}

// 清除所有
const clearAll = () => {
  searchKeyword.value = ''
  clearFilters()
  hasSearched.value = false
  searchStore.results = []
  searchStore.total = 0
}

// 移除历史记录项
const removeHistoryItem = (item: string) => {
  const index = searchStore.searchHistory.indexOf(item)
  if (index > -1) {
    searchStore.searchHistory.splice(index, 1)
    localStorage.setItem('searchHistory', JSON.stringify(searchStore.searchHistory))
  }
}

// 分页
const handleSizeChange = (size: number) => {
  searchStore.setPageSize(size)
  handleSearch()
}

const handlePageChange = (page: number) => {
  searchStore.setPage(page)
  handleSearch()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转到详情
const goToDetail = (id: string) => {
  router.push(`/ppe/${id}`)
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

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 获取状态类型
const getStatusType = (status?: string) => {
  const types: Record<string, any> = {
    'certified': 'success',
    'pending': 'warning',
    'expired': 'danger',
    'revoked': 'info'
  }
  return types[status || ''] || 'info'
}

// 获取状态标签
const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    'certified': '已认证',
    'pending': '认证中',
    'expired': '已过期',
    'revoked': '已撤销'
  }
  return labels[status || ''] || status || '未知'
}

// 监听筛选变化
watch(filters, () => {
  if (hasSearched.value) {
    handleSearch()
  }
}, { deep: true })

// 初始化 - 从 URL 参数恢复搜索
const initFromQuery = () => {
  const { q, category, jurisdiction, status, page } = route.query
  if (q) searchKeyword.value = q as string
  if (category) filters.category = category as string
  if (jurisdiction) filters.jurisdiction = jurisdiction as string
  if (status) filters.status = status as string
  if (page) searchStore.currentPage = parseInt(page as string)
  
  if (q || category || jurisdiction || status) {
    handleSearch()
  }
}

initFromQuery()
</script>

<style scoped lang="scss">
.ppe-search-page {
  .search-header {
    text-align: center;
    margin-bottom: 32px;
    
    .page-title {
      font-size: 32px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }
    
    .page-description {
      font-size: 16px;
      color: #606266;
      margin-bottom: 24px;
    }
    
    .search-box {
      max-width: 640px;
      margin: 0 auto 16px;
      
      .search-input {
        width: 100%;
        
        :deep(.el-input__wrapper) {
          padding-left: 16px;
        }
        
        :deep(.el-input-group__append) {
          background-color: #339999;
          border-color: #339999;
          color: #fff;
          padding: 0 24px;
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
        font-size: 14px;
        color: #909399;
      }
      
      .history-tag {
        cursor: pointer;
      }
    }
  }
  
  .suggestion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .suggestion-type {
      font-size: 12px;
      color: #909399;
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
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
      
      .results-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .results-count {
          font-size: 14px;
          color: #606266;
          
          strong {
            color: #339999;
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
      .result-card {
        margin-bottom: 16px;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          border-color: #339999;
          box-shadow: 0 4px 12px rgba(51, 153, 153, 0.1);
        }
        
        .result-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          
          .result-main {
            flex: 1;
            min-width: 0;
            
            .result-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 8px;
              
              .result-title {
                font-size: 16px;
                font-weight: 500;
                color: #303133;
                margin: 0;
                line-height: 1.4;
                
                :deep(mark) {
                  background-color: #fff3cd;
                  color: #856404;
                  padding: 0 2px;
                }
              }
              
              .result-badges {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
              }
            }
            
            .result-description {
              font-size: 14px;
              color: #606266;
              margin-bottom: 12px;
              line-height: 1.5;
              
              :deep(mark) {
                background-color: #fff3cd;
                color: #856404;
                padding: 0 2px;
              }
            }
            
            .result-meta {
              display: flex;
              align-items: center;
              gap: 16px;
              flex-wrap: wrap;
              
              .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
                color: #909399;
              }
            }
          }
          
          .result-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }
        }
      }
    }
    
    .results-grid {
      .result-grid-card {
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.3s;
        height: 100%;
        
        &:hover {
          border-color: #339999;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(51, 153, 153, 0.1);
        }
        
        .grid-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .grid-card-title {
          font-size: 15px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 8px;
          line-height: 1.4;
          
          :deep(mark) {
            background-color: #fff3cd;
            color: #856404;
            padding: 0 2px;
          }
        }
        
        .grid-card-desc {
          font-size: 13px;
          color: #606266;
          margin-bottom: 12px;
          line-height: 1.5;
          height: 40px;
          overflow: hidden;
        }
        
        .grid-card-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
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
      p {
        margin: 8px 0;
      }
      
      .empty-suggestion {
        font-size: 13px;
        color: #909399;
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

@media (max-width: 768px) {
  .ppe-search-page {
    .search-header {
      .page-title {
        font-size: 24px;
      }
    }
    
    .search-results {
      .results-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .result-card {
        .result-content {
          flex-direction: column;
          
          .result-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      }
    }
  }
}
</style>
