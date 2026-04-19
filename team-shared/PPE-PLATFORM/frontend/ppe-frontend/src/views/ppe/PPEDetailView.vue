<template>
  <div class="ppe-detail-page">
    <!-- 页面头部 -->
    <el-page-header title="返回搜索结果" @back="$router.back()" />
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <!-- 产品详情内容 -->
    <template v-else-if="product">
      <!-- 产品基本信息卡片 -->
      <el-card class="detail-header-card" shadow="never">
        <div class="product-header">
          <div class="product-main-info">
            <h1 class="product-name">{{ product.name }}</h1>
            <p class="product-model" v-if="product.model">型号: {{ product.model }}</p>
            <div class="product-badges">
              <el-tag :type="getStatusType(product.status)" size="large" effect="dark">
                {{ getStatusLabel(product.status) }}
              </el-tag>
              <el-tag v-if="product.jurisdiction" type="info" size="large" effect="plain">
                {{ product.jurisdiction }}
              </el-tag>
              <el-tag v-if="product.riskLevel" type="warning" size="large" effect="plain">
                {{ product.riskLevel }}
              </el-tag>
            </div>
          </div>
          <div class="product-actions">
            <el-button type="primary" :icon="Star" @click="toggleFavorite">
              {{ isFavorite ? '已收藏' : '收藏' }}
            </el-button>
            <el-button :icon="Share" @click="shareProduct">分享</el-button>
            <el-button type="success" :icon="Document" @click="generateReport">生成报告</el-button>
          </div>
        </div>
      </el-card>
      
      <!-- 详细内容标签页 -->
      <el-card class="detail-content-card" shadow="never">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
              <el-descriptions-item label="产品型号">{{ product.model || '-' }}</el-descriptions-item>
              <el-descriptions-item label="产品类别">{{ product.category || '-' }}</el-descriptions-item>
              <el-descriptions-item label="产品描述">{{ product.description || '-' }}</el-descriptions-item>
              <el-descriptions-item label="制造商">{{ product.manufacturer || '-' }}</el-descriptions-item>
              <el-descriptions-item label="品牌">{{ product.brand || '-' }}</el-descriptions-item>
              <el-descriptions-item label="原产国">{{ product.countryOfOrigin || '-' }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">{{ product.riskLevel || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <!-- 认证信息 -->
          <el-tab-pane label="认证信息" name="certification">
            <div v-if="product.certifications && product.certifications.length > 0">
              <el-timeline>
                <el-timeline-item
                  v-for="cert in product.certifications"
                  :key="cert.id"
                  :type="cert.status === 'active' ? 'success' : 'danger'"
                  :timestamp="formatDate(cert.date)"
                >
                  <el-card shadow="hover" class="cert-card">
                    <template #header>
                      <div class="cert-header">
                        <span class="cert-title">{{ cert.name }}</span>
                        <el-tag :type="cert.status === 'active' ? 'success' : 'danger'">
                          {{ cert.status === 'active' ? '有效' : '失效' }}
                        </el-tag>
                      </div>
                    </template>
                    <div class="cert-content">
                      <p><strong>认证编号:</strong> {{ cert.number }}</p>
                      <p><strong>认证机构:</strong> {{ cert.issuer }}</p>
                      <p><strong>有效期至:</strong> {{ formatDate(cert.expiryDate) }}</p>
                      <p v-if="cert.scope"><strong>认证范围:</strong> {{ cert.scope }}</p>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
            <el-empty v-else description="暂无认证信息" />
          </el-tab-pane>
          
          <!-- 技术规格 -->
          <el-tab-pane label="技术规格" name="specifications">
            <el-descriptions :column="1" border>
              <el-descriptions-item 
                v-for="(value, key) in product.specifications" 
                :key="key"
                :label="formatSpecLabel(key as string)"
              >
                {{ value }}
              </el-descriptions-item>
            </el-descriptions>
            <el-empty v-if="!product.specifications" description="暂无技术规格信息" />
          </el-tab-pane>
          
          <!-- 法规标准 -->
          <el-tab-pane label="法规标准" name="regulations">
            <el-table :data="product.regulations || []" style="width: 100%" v-if="product.regulations && product.regulations.length > 0">
              <el-table-column prop="name" label="法规名称" min-width="200" />
              <el-table-column prop="standard" label="标准编号" width="150" />
              <el-table-column prop="version" label="版本" width="100" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                    {{ row.status === 'active' ? '现行' : '废止' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无法规标准信息" />
          </el-tab-pane>
          
          <!-- 关联企业 -->
          <el-tab-pane label="关联企业" name="enterprises">
            <el-row :gutter="20" v-if="product.enterprises && product.enterprises.length > 0">
              <el-col 
                v-for="enterprise in product.enterprises" 
                :key="enterprise.id"
                :xs="24" 
                :sm="12" 
                :md="8"
              >
                <el-card shadow="hover" class="enterprise-card" @click="goToEnterprise(enterprise.id)">
                  <div class="enterprise-header">
                    <el-avatar :size="48" :icon="OfficeBuilding" />
                    <div class="enterprise-info">
                      <h4>{{ enterprise.name }}</h4>
                      <el-tag size="small" :type="enterprise.type === 'manufacturer' ? 'primary' : 'success'">
                        {{ enterprise.type === 'manufacturer' ? '制造商' : '经销商' }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="enterprise-meta">
                    <p><el-icon><Location /></el-icon> {{ enterprise.country || '未知地区' }}</p>
                    <p><el-icon><Phone /></el-icon> {{ enterprise.contact || '暂无联系方式' }}</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-else description="暂无关联企业信息" />
          </el-tab-pane>
          
          <!-- 历史记录 -->
          <el-tab-pane label="历史记录" name="history">
            <el-timeline v-if="product.history && product.history.length > 0">
              <el-timeline-item
                v-for="event in product.history"
                :key="event.id"
                :type="event.type"
                :timestamp="formatDate(event.date)"
              >
                <h4>{{ event.title }}</h4>
                <p>{{ event.description }}</p>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无历史记录" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
      
      <!-- 相关推荐 -->
      <el-card class="related-products-card" shadow="never" v-if="relatedProducts.length > 0">
        <template #header>
          <div class="card-header">
            <span>相关产品</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col 
            v-for="item in relatedProducts" 
            :key="item.id"
            :xs="24" 
            :sm="12" 
            :md="6"
          >
            <el-card shadow="hover" class="related-card" @click="goToDetail(item.id)">
              <h4>{{ item.name }}</h4>
              <p class="related-desc">{{ truncateText(item.description, 60) }}</p>
              <el-tag size="small" :type="getStatusType(item.status)">
                {{ getStatusLabel(item.status) }}
              </el-tag>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </template>
    
    <!-- 错误状态 -->
    <el-empty
      v-else
      description="产品信息加载失败"
      :image-size="200"
    >
      <template #description>
        <p>无法加载产品详情</p>
        <p class="error-message">{{ errorMessage }}</p>
      </template>
      <el-button type="primary" @click="loadProduct">重新加载</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Star, 
  Share, 
  Document, 
  OfficeBuilding, 
  Location, 
  Phone 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const product = ref<any>(null)
const relatedProducts = ref<any[]>([])
const isFavorite = ref(false)
const activeTab = ref('basic')
const errorMessage = ref('')

// 加载产品详情
const loadProduct = async () => {
  const productId = route.params.id as string
  if (!productId) {
    errorMessage.value = '产品ID不存在'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    // TODO: 调用 API 获取产品详情
    // const response = await fetch(`/api/ppe/${productId}`)
    // const data = await response.json()
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 800))
    
    product.value = {
      id: productId,
      name: 'N95 医用防护口罩',
      model: '3M 1860',
      category: '口罩',
      description: 'N95 医用防护口罩，符合 NIOSH N95 标准，过滤效率 ≥95%，适用于医疗机构和工业防护场景。',
      manufacturer: '3M Company',
      brand: '3M',
      countryOfOrigin: '美国',
      riskLevel: 'Class II',
      status: 'certified',
      jurisdiction: 'US (FDA)',
      updatedAt: '2026-04-15',
      certifications: [
        {
          id: '1',
          name: 'FDA 510(k) 认证',
          number: 'K123456',
          issuer: 'FDA',
          date: '2025-01-15',
          expiryDate: '2028-01-14',
          status: 'active',
          scope: '医用防护口罩'
        },
        {
          id: '2',
          name: 'NIOSH N95 认证',
          number: 'TC-84A-1234',
          issuer: 'NIOSH',
          date: '2024-06-20',
          expiryDate: '2027-06-19',
          status: 'active',
          scope: '颗粒物过滤效率 ≥95%'
        }
      ],
      specifications: {
        filtrationEfficiency: '≥95% (0.3μm 颗粒物)',
        breathingResistance: '≤35 mmH2O',
        strapType: '头带式',
        valve: '无阀',
        size: '均码',
        color: '白色',
        material: '聚丙烯熔喷布',
        shelfLife: '5年'
      },
      regulations: [
        { name: '42 CFR Part 84', standard: 'NIOSH N95', version: '2024', status: 'active' },
        { name: '21 CFR Part 878', standard: 'FDA 510(k)', version: '2023', status: 'active' }
      ],
      enterprises: [
        {
          id: '1',
          name: '3M Company',
          type: 'manufacturer',
          country: '美国',
          contact: 'support@3m.com'
        },
        {
          id: '2',
          name: '3M China',
          type: 'distributor',
          country: '中国',
          contact: 'china@3m.com'
        }
      ],
      history: [
        { id: '1', title: '获得 FDA 510(k) 认证', description: '产品通过 FDA 审核，获得市场准入许可', date: '2025-01-15', type: 'success' },
        { id: '2', title: '更新技术规格', description: '优化过滤材料，提升佩戴舒适度', date: '2024-12-10', type: 'primary' },
        { id: '3', title: '获得 NIOSH N95 认证', description: '通过 NIOSH 测试，获得 N95 认证', date: '2024-06-20', type: 'success' }
      ]
    }
    
    // 加载相关产品
    relatedProducts.value = [
      { id: '2', name: '3M 8210 N95 口罩', description: '工业级 N95 防护口罩', status: 'certified' },
      { id: '3', name: '3M 1870+ N95 口罩', description: '医用级 N95 防护口罩，带抗菌涂层', status: 'certified' },
      { id: '4', name: '3M 1860S N95 口罩', description: '小号 N95 医用防护口罩', status: 'certified' }
    ]
    
    // 检查是否已收藏
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    isFavorite.value = favorites.includes(productId)
    
  } catch (error) {
    console.error('加载产品详情失败:', error)
    errorMessage.value = '网络错误或产品不存在'
  } finally {
    loading.value = false
  }
}

// 收藏
const toggleFavorite = () => {
  const productId = route.params.id as string
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  
  if (isFavorite.value) {
    favorites = favorites.filter((id: string) => id !== productId)
    ElMessage.success('已取消收藏')
  } else {
    favorites.push(productId)
    ElMessage.success('已添加到收藏')
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites))
  isFavorite.value = !isFavorite.value
}

// 分享
const shareProduct = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url)
  ElMessage.success('链接已复制到剪贴板')
}

// 生成报告
const generateReport = () => {
  ElMessage.info('报告生成功能开发中...')
}

// 跳转到企业详情
const goToEnterprise = (id: string) => {
  router.push(`/enterprise/${id}`)
}

// 跳转到产品详情
const goToDetail = (id: string) => {
  router.push(`/ppe/${id}`)
  // 重新加载页面数据
  loadProduct()
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 截断文本
const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// 格式化规格标签
const formatSpecLabel = (key: string) => {
  const labels: Record<string, string> = {
    filtrationEfficiency: '过滤效率',
    breathingResistance: '呼吸阻力',
    strapType: '佩戴方式',
    valve: '阀门',
    size: '尺寸',
    color: '颜色',
    material: '材质',
    shelfLife: '保质期'
  }
  return labels[key] || key
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

onMounted(() => {
  loadProduct()
})
</script>

<style scoped lang="scss">
.ppe-detail-page {
  .loading-container {
    padding: 40px;
  }
  
  .detail-header-card {
    margin-top: 20px;
    margin-bottom: 20px;
    
    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
      
      .product-main-info {
        flex: 1;
        min-width: 0;
        
        .product-name {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 8px 0;
        }
        
        .product-model {
          font-size: 14px;
          color: #606266;
          margin-bottom: 16px;
        }
        
        .product-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
      }
      
      .product-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
  }
  
  .detail-content-card {
    margin-bottom: 20px;
    
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
    
    .cert-card {
      margin-bottom: 16px;
      
      .cert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .cert-title {
          font-weight: 500;
        }
      }
      
      .cert-content {
        p {
          margin: 8px 0;
          color: #606266;
        }
      }
    }
    
    .enterprise-card {
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 16px;
      
      &:hover {
        border-color: #339999;
      }
      
      .enterprise-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        
        .enterprise-info {
          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
          }
        }
      }
      
      .enterprise-meta {
        p {
          margin: 4px 0;
          font-size: 13px;
          color: #606266;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
  
  .related-products-card {
    .card-header {
      font-weight: 600;
    }
    
    .related-card {
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 16px;
      
      &:hover {
        border-color: #339999;
      }
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
      }
      
      .related-desc {
        font-size: 12px;
        color: #606266;
        margin-bottom: 12px;
        height: 36px;
        overflow: hidden;
      }
    }
  }
  
  .error-message {
    color: #f56c6c;
    font-size: 13px;
    margin-top: 8px;
  }
}

@media (max-width: 768px) {
  .ppe-detail-page {
    .detail-header-card {
      .product-header {
        flex-direction: column;
        
        .product-actions {
          width: 100%;
          justify-content: flex-start;
        }
      }
    }
  }
}
</style>
