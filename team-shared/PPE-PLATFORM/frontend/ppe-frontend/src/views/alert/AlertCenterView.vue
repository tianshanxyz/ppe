<template>
  <div class="alert-center-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">预警中心</h1>
        <p class="page-description">实时监控PPE产品认证状态，及时获取过期、变更等重要提醒</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Setting" @click="showSettings = true">
          预警设置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card danger" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.critical }}</div>
              <div class="stat-label">严重预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card warning" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.warning }}</div>
              <div class="stat-label">即将过期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card info" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.info }}</div>
              <div class="stat-label">信息提醒</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card success" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.resolved }}</div>
              <div class="stat-label">已处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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
          <el-form-item label="预警级别">
            <el-select v-model="filters.level" placeholder="选择级别" clearable style="width: 100%">
              <el-option label="严重" value="critical">
                <el-tag type="danger" size="small">严重</el-tag>
              </el-option>
              <el-option label="警告" value="warning">
                <el-tag type="warning" size="small">警告</el-tag>
              </el-option>
              <el-option label="信息" value="info">
                <el-tag type="info" size="small">信息</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="预警类型">
            <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 100%">
              <el-option label="认证过期" value="cert-expiry" />
              <el-option label="认证变更" value="cert-change" />
              <el-option label="法规更新" value="regulation-update" />
              <el-option label="产品召回" value="product-recall" />
              <el-option label="企业变更" value="enterprise-change" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="处理状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 100%">
              <el-option label="未处理" value="unread">
                <el-tag type="danger" size="small" effect="light">未处理</el-tag>
              </el-option>
              <el-option label="处理中" value="processing">
                <el-tag type="warning" size="small" effect="light">处理中</el-tag>
              </el-option>
              <el-option label="已处理" value="resolved">
                <el-tag type="success" size="small" effect="light">已处理</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="日期范围">
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

    <!-- 预警列表 -->
    <el-card class="alert-list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <div class="header-left">
            <span class="list-title">
              <el-icon><Bell /></el-icon>
              预警列表
            </span>
            <el-tag v-if="hasActiveFilters" type="info" size="small" effect="plain">
              已应用筛选
            </el-tag>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button size="small" @click="markAllAsRead">
                <el-icon><Check /></el-icon>
                全部标记已读
              </el-button>
              <el-button size="small" @click="exportAlerts">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="alerts.length > 0" class="alert-list">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="alert-item"
          :class="{ unread: alert.status === 'unread' }"
          @click="viewAlertDetail(alert)"
        >
          <div class="alert-status" :class="alert.level">
            <el-icon v-if="alert.level === 'critical'"><WarningFilled /></el-icon>
            <el-icon v-else-if="alert.level === 'warning'"><Warning /></el-icon>
            <el-icon v-else><InfoFilled /></el-icon>
          </div>
          
          <div class="alert-content">
            <div class="alert-header">
              <h4 class="alert-title">{{ alert.title }}</h4>
              <div class="alert-tags">
                <el-tag :type="getLevelType(alert.level)" size="small" effect="light">
                  {{ getLevelLabel(alert.level) }}
                </el-tag>
                <el-tag type="info" size="small" effect="plain">
                  {{ getTypeLabel(alert.type) }}
                </el-tag>
                <el-tag v-if="alert.status === 'unread'" type="danger" size="small" effect="light">
                  未读
                </el-tag>
              </div>
            </div>
            
            <p class="alert-description">{{ alert.description }}</p>
            
            <div class="alert-meta">
              <span class="meta-item">
                <el-icon><FirstAidKit /></el-icon>
                {{ alert.productName || '通用' }}
              </span>
              <span class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ alert.enterpriseName || '未知企业' }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ alert.createdAt }}
              </span>
            </div>
          </div>
          
          <div class="alert-actions">
            <el-button
              v-if="alert.status !== 'resolved'"
              type="primary"
              size="small"
              @click.stop="handleAlert(alert)"
            >
              处理
            </el-button>
            <el-button
              v-else
              type="success"
              size="small"
              disabled
            >
              已处理
            </el-button>
            <el-button
              link
              size="small"
              @click.stop="viewAlertDetail(alert)"
            >
              详情
            </el-button>
          </div>
        </div>
      </div>

      <el-empty
        v-else
        description="暂无预警信息"
        :image-size="200"
      >
        <template #description>
          <p>当前没有符合条件的预警</p>
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
    </el-card>

    <!-- 预警设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="预警设置"
      width="600px"
    >
      <el-form :model="alertSettings" label-width="120px">
        <el-form-item label="预警通知方式">
          <el-checkbox-group v-model="alertSettings.notificationMethods">
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="push">推送通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="认证过期提醒">
          <el-slider v-model="alertSettings.expiryReminderDays" :max="90" show-stops :marks="{7: '7天', 30: '30天', 60: '60天', 90: '90天'}" />
          <div class="slider-hint">提前 {{ alertSettings.expiryReminderDays }} 天提醒</div>
        </el-form-item>
        
        <el-form-item label="关注产品预警">
          <el-switch v-model="alertSettings.watchlistAlerts" />
        </el-form-item>
        
        <el-form-item label="法规更新预警">
          <el-switch v-model="alertSettings.regulationAlerts" />
        </el-form-item>
        
        <el-form-item label="企业变更预警">
          <el-switch v-model="alertSettings.enterpriseAlerts" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="showDetail"
      title="预警详情"
      width="700px"
    >
      <div v-if="currentAlert" class="alert-detail">
        <div class="detail-header">
          <el-tag :type="getLevelType(currentAlert.level)" size="large" effect="dark">
            {{ getLevelLabel(currentAlert.level) }}
          </el-tag>
          <span class="detail-time">{{ currentAlert.createdAt }}</span>
        </div>
        
        <h3 class="detail-title">{{ currentAlert.title }}</h3>
        
        <div class="detail-section">
          <h4>预警描述</h4>
          <p>{{ currentAlert.description }}</p>
        </div>
        
        <div class="detail-section">
          <h4>相关产品</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="产品名称">{{ currentAlert.productName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产品型号">{{ currentAlert.productModel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="制造商">{{ currentAlert.enterpriseName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="认证编号">{{ currentAlert.certNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="过期日期">{{ currentAlert.expiryDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="剩余天数">
              <el-tag v-if="currentAlert.daysLeft" :type="getDaysLeftType(currentAlert.daysLeft)">
                {{ currentAlert.daysLeft }} 天
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>建议措施</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(action, index) in currentAlert.suggestedActions"
              :key="index"
              :type="action.urgent ? 'danger' : 'primary'"
            >
              {{ action.text }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentAlert?.status !== 'resolved'" type="primary" @click="handleAlert(currentAlert)">
          标记为已处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  Setting,
  Warning,
  Timer,
  InfoFilled,
  CircleCheck,
  Filter,
  Refresh,
  Bell,
  Check,
  Download,
  WarningFilled,
  FirstAidKit,
  OfficeBuilding,
  Clock
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const stats = reactive({
  critical: 5,
  warning: 12,
  info: 28,
  resolved: 156
})

// 筛选器
const filters = reactive({
  level: '',
  type: '',
  status: '',
  dateRange: null as [Date, Date] | null
})

// 计算是否有激活的筛选
const hasActiveFilters = computed(() => {
  return filters.level || filters.type || filters.status || filters.dateRange
})

// 列表状态
const loading = ref(false)
const alerts = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框状态
const showSettings = ref(false)
const showDetail = ref(false)
const currentAlert = ref<any>(null)

// 预警设置
const alertSettings = reactive({
  notificationMethods: ['email', 'push'],
  expiryReminderDays: 30,
  watchlistAlerts: true,
  regulationAlerts: true,
  enterpriseAlerts: false
})

// 生成模拟数据
const generateMockAlerts = () => {
  return [
    {
      id: '1',
      title: 'N95口罩认证即将过期',
      description: '产品 "N95医用防护口罩" 的NMPA认证将于7天后过期，请及时办理续期手续。',
      level: 'critical',
      type: 'cert-expiry',
      status: 'unread',
      productName: 'N95医用防护口罩',
      productModel: '9501+',
      enterpriseName: '3M中国有限公司',
      certNumber: '国械注准20162640001',
      expiryDate: '2024-01-25',
      daysLeft: 7,
      createdAt: '2024-01-18 09:30:00',
      suggestedActions: [
        { text: '联系认证机构了解续期流程', urgent: true },
        { text: '准备续期所需材料', urgent: false },
        { text: '提交续期申请', urgent: false }
      ]
    },
    {
      id: '2',
      title: '防护服CE认证30天后过期',
      description: '产品 "医用一次性防护服" 的CE认证将于30天后过期，请提前准备续期。',
      level: 'warning',
      type: 'cert-expiry',
      status: 'unread',
      productName: '医用一次性防护服',
      productModel: 'TY127S',
      enterpriseName: 'DuPont',
      certNumber: 'CE 0123',
      expiryDate: '2024-02-15',
      daysLeft: 30,
      createdAt: '2024-01-16 14:20:00',
      suggestedActions: [
        { text: '查看CE认证续期要求', urgent: false },
        { text: '联系欧盟授权代表', urgent: false }
      ]
    },
    {
      id: '3',
      title: 'GB 19083-2010标准更新',
      description: '国家标准 GB 19083-2010《医用防护口罩技术要求》已发布新版本，请关注变更内容。',
      level: 'info',
      type: 'regulation-update',
      status: 'unread',
      productName: null,
      productModel: null,
      enterpriseName: null,
      certNumber: null,
      expiryDate: null,
      daysLeft: null,
      createdAt: '2024-01-15 10:00:00',
      suggestedActions: [
        { text: '下载新版标准文档', urgent: false },
        { text: '对比新旧版本差异', urgent: false },
        { text: '评估对产品的影响', urgent: false }
      ]
    },
    {
      id: '4',
      title: '防护手套产品召回通知',
      description: 'Ansell公司生产的某批次防护手套存在质量问题，已启动召回程序。',
      level: 'critical',
      type: 'product-recall',
      status: 'processing',
      productName: '防化手套',
      productModel: 'Solvex 37-175',
      enterpriseName: 'Ansell',
      certNumber: null,
      expiryDate: null,
      daysLeft: null,
      createdAt: '2024-01-14 16:45:00',
      suggestedActions: [
        { text: '立即停止使用相关产品', urgent: true },
        { text: '联系供应商确认批次', urgent: true },
        { text: '按照召回程序处理库存', urgent: true }
      ]
    },
    {
      id: '5',
      title: 'Honeywell企业信息变更',
      description: 'Honeywell International Inc. 企业注册信息发生变更，请关注。',
      level: 'info',
      type: 'enterprise-change',
      status: 'resolved',
      productName: null,
      productModel: null,
      enterpriseName: 'Honeywell International Inc.',
      certNumber: null,
      expiryDate: null,
      daysLeft: null,
      createdAt: '2024-01-10 11:30:00',
      suggestedActions: [
        { text: '查看企业变更详情', urgent: false },
        { text: '更新企业档案信息', urgent: false }
      ]
    },
    {
      id: '6',
      title: '护目镜FDA认证已过期',
      description: '产品 "安全防护护目镜" 的FDA认证已于昨日过期，请立即处理。',
      level: 'critical',
      type: 'cert-expiry',
      status: 'unread',
      productName: '安全防护护目镜',
      productModel: 'UVEX 9161',
      enterpriseName: 'UVEX Safety',
      certNumber: 'K123456',
      expiryDate: '2024-01-17',
      daysLeft: 0,
      createdAt: '2024-01-18 08:00:00',
      suggestedActions: [
        { text: '立即停止销售相关产品', urgent: true },
        { text: '联系FDA了解续期流程', urgent: true },
        { text: '评估对业务的影响', urgent: true }
      ]
    }
  ]
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    alerts.value = generateMockAlerts()
    total.value = 156
    loading.value = false
  }, 500)
}

// 清除筛选
const clearFilters = () => {
  filters.level = ''
  filters.type = ''
  filters.status = ''
  filters.dateRange = null
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadData()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
  loadData()
}

// 获取级别标签类型
const getLevelType = (level: string) => {
  const types: Record<string, string> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return types[level] || 'info'
}

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '信息'
  }
  return labels[level] || level
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'cert-expiry': '认证过期',
    'cert-change': '认证变更',
    'regulation-update': '法规更新',
    'product-recall': '产品召回',
    'enterprise-change': '企业变更'
  }
  return labels[type] || type
}

// 获取剩余天数标签类型
const getDaysLeftType = (days: number) => {
  if (days <= 7) return 'danger'
  if (days <= 30) return 'warning'
  return 'info'
}

// 查看预警详情
const viewAlertDetail = (alert: any) => {
  currentAlert.value = alert
  showDetail.value = true
}

// 处理预警
const handleAlert = async (alert: any) => {
  try {
    await ElMessageBox.confirm(
      '确认将此预警标记为已处理？',
      '确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟处理
    const index = alerts.value.findIndex(a => a.id === alert.id)
    if (index > -1) {
      alerts.value[index].status = 'resolved'
    }
    
    if (showDetail.value) {
      showDetail.value = false
    }
    
    ElMessage.success('已标记为已处理')
  } catch {
    // 用户取消
  }
}

// 全部标记已读
const markAllAsRead = () => {
  alerts.value.forEach(alert => {
    if (alert.status === 'unread') {
      alert.status = 'processing'
    }
  })
  ElMessage.success('已全部标记为已读')
}

// 导出预警
const exportAlerts = () => {
  ElMessage.success('预警列表导出成功')
}

// 保存设置
const saveSettings = () => {
  showSettings.value = false
  ElMessage.success('设置已保存')
}

// 监听筛选变化
watch(filters, () => {
  loadData()
}, { deep: true })

// 初始加载
loadData()
</script>

<style scoped lang="scss">
.alert-center-page {
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
  }
  
  .stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      margin-bottom: 20px;
      
      &.danger {
        .stat-icon {
          background: linear-gradient(135deg, #f56c6c 0%, #ef5350 100%);
        }
      }
      
      &.warning {
        .stat-icon {
          background: linear-gradient(135deg, #e6a23c 0%, #ffb74d 100%);
        }
      }
      
      &.info {
        .stat-icon {
          background: linear-gradient(135deg, #909399 0%, #bdbdbd 100%);
        }
      }
      
      &.success {
        .stat-icon {
          background: linear-gradient(135deg, #67c23a 0%, #8bc34a 100%);
        }
      }
      
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
          color: white;
        }
        
        .stat-info {
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #303133;
            line-height: 1.2;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
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
  
  .alert-list-card {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .list-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 16px;
        }
      }
    }
    
    .loading-container {
      padding: 40px;
    }
    
    .alert-list {
      .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        border-bottom: 1px solid #ebeef5;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          background: #f5f7fa;
        }
        
        &.unread {
          background: #f0f9ff;
          border-left: 4px solid #409eff;
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .alert-status {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          
          &.critical {
            background: #fef0f0;
            color: #f56c6c;
          }
          
          &.warning {
            background: #fdf6ec;
            color: #e6a23c;
          }
          
          &.info {
            background: #f4f4f5;
            color: #909399;
          }
        }
        
        .alert-content {
          flex: 1;
          min-width: 0;
          
          .alert-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            
            .alert-title {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
              margin: 0;
            }
            
            .alert-tags {
              display: flex;
              gap: 8px;
            }
          }
          
          .alert-description {
            color: #606266;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          
          .alert-meta {
            display: flex;
            gap: 20px;
            
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
        }
        
        .alert-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
      }
    }
    
    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;
    }
  }
  
  .alert-detail {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .detail-time {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .detail-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 24px;
    }
    
    .detail-section {
      margin-bottom: 24px;
      
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
      }
      
      p {
        color: #606266;
        line-height: 1.6;
      }
    }
  }
  
  .slider-hint {
    color: #909399;
    font-size: 13px;
    margin-top: 8px;
  }
}
</style>
