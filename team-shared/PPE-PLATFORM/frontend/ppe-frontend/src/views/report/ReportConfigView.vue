<template>
  <div class="report-config-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">报表配置</h1>
        <p class="page-description">自定义报表内容、样式和定时发送设置</p>
      </div>
      <div class="header-right">
        <el-button @click="loadTemplate">
          <el-icon><Document /></el-icon>
          加载模板
        </el-button>
        <el-button type="primary" @click="saveConfig">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧配置面板 -->
      <el-col :xs="24" :lg="8">
        <el-card class="config-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>报表设置</span>
            </div>
          </template>

          <el-form :model="reportConfig" label-position="top">
            <!-- 基本信息 -->
            <el-divider>基本信息</el-divider>
            
            <el-form-item label="报表名称">
              <el-input 
                v-model="reportConfig.name" 
                placeholder="输入报表名称..."
                maxlength="50"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="报表描述">
              <el-input 
                v-model="reportConfig.description" 
                type="textarea"
                :rows="2"
                placeholder="输入报表描述..."
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="报表类型">
              <el-select v-model="reportConfig.type" style="width: 100%">
                <el-option label="合规状态报表" value="compliance" />
                <el-option label="市场分析报表" value="market" />
                <el-option label="企业评估报表" value="enterprise" />
                <el-option label="产品对比报表" value="product" />
                <el-option label="法规跟踪报表" value="regulation" />
                <el-option label="自定义报表" value="custom" />
              </el-select>
            </el-form-item>

            <!-- 数据字段 -->
            <el-divider>数据字段</el-divider>
            
            <div class="field-section">
              <div class="field-header">
                <span>选择字段</span>
                <el-button link type="primary" @click="selectAllFields">
                  {{ allFieldsSelected ? '取消全选' : '全选' }}
                </el-button>
              </div>
              <el-scrollbar max-height="300px">
                <el-tree
                  ref="fieldTree"
                  :data="availableFields"
                  show-checkbox
                  node-key="id"
                  :default-checked-keys="reportConfig.selectedFields"
                  @check-change="handleFieldChange"
                />
              </el-scrollbar>
            </div>

            <!-- 样式设置 -->
            <el-divider>样式设置</el-divider>

            <el-form-item label="主题颜色">
              <el-color-picker v-model="reportConfig.themeColor" show-alpha />
            </el-form-item>

            <el-form-item label="字体大小">
              <el-radio-group v-model="reportConfig.fontSize">
                <el-radio-button label="small">小</el-radio-button>
                <el-radio-button label="medium">中</el-radio-button>
                <el-radio-button label="large">大</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="页面方向">
              <el-radio-group v-model="reportConfig.orientation">
                <el-radio-button label="portrait">纵向</el-radio-button>
                <el-radio-button label="landscape">横向</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="显示选项">
              <el-checkbox-group v-model="reportConfig.displayOptions">
                <el-checkbox label="header">显示页眉</el-checkbox>
                <el-checkbox label="footer">显示页脚</el-checkbox>
                <el-checkbox label="pageNumber">显示页码</el-checkbox>
                <el-checkbox label="logo">显示Logo</el-checkbox>
                <el-checkbox label="timestamp">显示生成时间</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 定时发送 -->
        <el-card class="schedule-panel" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="panel-header">
              <span>定时发送</span>
              <el-switch v-model="reportConfig.schedule.enabled" />
            </div>
          </template>

          <el-form v-if="reportConfig.schedule.enabled" :model="reportConfig.schedule" label-position="top">
            <el-form-item label="发送频率">
              <el-select v-model="reportConfig.schedule.frequency" style="width: 100%">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
                <el-option label="每季度" value="quarterly" />
              </el-select>
            </el-form-item>

            <el-form-item label="发送时间" v-if="reportConfig.schedule.frequency === 'daily'">
              <el-time-picker 
                v-model="reportConfig.schedule.time" 
                format="HH:mm"
                placeholder="选择时间"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="发送日期" v-if="reportConfig.schedule.frequency === 'weekly'">
              <el-select v-model="reportConfig.schedule.dayOfWeek" style="width: 100%">
                <el-option label="周一" value="1" />
                <el-option label="周二" value="2" />
                <el-option label="周三" value="3" />
                <el-option label="周四" value="4" />
                <el-option label="周五" value="5" />
                <el-option label="周六" value="6" />
                <el-option label="周日" value="0" />
              </el-select>
            </el-form-item>

            <el-form-item label="发送日期" v-if="reportConfig.schedule.frequency === 'monthly'">
              <el-select v-model="reportConfig.schedule.dayOfMonth" style="width: 100%">
                <el-option 
                  v-for="day in 31" 
                  :key="day" 
                  :label="day + '日'" 
                  :value="day" 
                />
              </el-select>
            </el-form-item>

            <el-form-item label="接收邮箱">
              <el-select
                v-model="reportConfig.schedule.recipients"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入邮箱地址..."
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="邮件主题">
              <el-input v-model="reportConfig.schedule.emailSubject" placeholder="输入邮件主题..." />
            </el-form-item>
          </el-form>

          <el-empty v-else description="启用后可配置定时发送" :image-size="100" />
        </el-card>
      </el-col>

      <!-- 右侧预览区域 -->
      <el-col :xs="24" :lg="16">
        <el-card class="preview-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>实时预览</span>
              <div class="preview-actions">
                <el-radio-group v-model="previewMode" size="small">
                  <el-radio-button label="desktop">
                    <el-icon><Monitor /></el-icon>
                  </el-radio-button>
                  <el-radio-button label="mobile">
                    <el-icon><Cellphone /></el-icon>
                  </el-radio-button>
                </el-radio-group>
                <el-button size="small" @click="refreshPreview">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <div class="preview-container" :class="previewMode">
            <div class="preview-document" :style="documentStyle">
              <!-- 页眉 -->
              <div v-if="reportConfig.displayOptions.includes('header')" class="preview-header">
                <div class="header-logo" v-if="reportConfig.displayOptions.includes('logo')">
                  <el-icon :size="32" :color="reportConfig.themeColor"><Document /></el-icon>
                  <span class="logo-text">MDLOOKER</span>
                </div>
                <div class="header-title">{{ reportConfig.name || '未命名报表' }}</div>
                <div class="header-meta" v-if="reportConfig.displayOptions.includes('timestamp')">
                  生成时间: {{ currentTime }}
                </div>
              </div>

              <!-- 内容区域 -->
              <div class="preview-content">
                <div class="content-section">
                  <h3 class="section-title">报表摘要</h3>
                  <p class="section-desc">{{ reportConfig.description || '暂无描述' }}</p>
                </div>

                <div class="content-section">
                  <h3 class="section-title">数据概览</h3>
                  <el-row :gutter="16" class="stat-row">
                    <el-col :span="8" v-for="stat in previewStats" :key="stat.label">
                      <div class="stat-card">
                        <div class="stat-value" :style="{ color: reportConfig.themeColor }">
                          {{ stat.value }}
                        </div>
                        <div class="stat-label">{{ stat.label }}</div>
                      </div>
                    </el-col>
                  </el-row>
                </div>

                <div class="content-section">
                  <h3 class="section-title">详细数据</h3>
                  <el-table :data="previewTableData" border style="width: 100%">
                    <el-table-column 
                      v-for="field in selectedFieldList" 
                      :key="field.id"
                      :prop="field.prop"
                      :label="field.label"
                      min-width="120"
                    />
                  </el-table>
                </div>

                <div class="content-section" v-if="reportConfig.type === 'market'">
                  <h3 class="section-title">趋势分析</h3>
                  <div ref="chartRef" class="preview-chart"></div>
                </div>
              </div>

              <!-- 页脚 -->
              <div v-if="reportConfig.displayOptions.includes('footer')" class="preview-footer">
                <div class="footer-content">
                  <span>© 2026 MDLOOKER PPE Data Platform</span>
                  <span v-if="reportConfig.displayOptions.includes('pageNumber')" class="page-number">
                    第 1 页 / 共 3 页
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card class="quick-actions" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="panel-header">
              <span>快捷操作</span>
            </div>
          </template>

          <div class="action-buttons">
            <el-button type="primary" size="large" @click="generateReport">
              <el-icon><DocumentChecked /></el-icon>
              生成报表
            </el-button>
            <el-button size="large" @click="exportConfig">
              <el-icon><Download /></el-icon>
              导出配置
            </el-button>
            <el-button size="large" @click="shareConfig">
              <el-icon><Share /></el-icon>
              分享配置
            </el-button>
            <el-button size="large" type="danger" plain @click="resetConfig">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模板选择对话框 -->
    <el-dialog v-model="showTemplateDialog" title="选择报表模板" width="700px">
      <el-row :gutter="16">
        <el-col 
          v-for="template in reportTemplates" 
          :key="template.id"
          :xs="24"
          :sm="12"
        >
          <el-card 
            class="template-card" 
            shadow="hover"
            :class="{ selected: selectedTemplate?.id === template.id }"
            @click="selectTemplate(template)"
          >
            <div class="template-icon" :style="{ background: template.color + '20', color: template.color }">
              <el-icon :size="32">
                <component :is="template.icon" />
              </el-icon>
            </div>
            <h4 class="template-name">{{ template.name }}</h4>
            <p class="template-desc">{{ template.description }}</p>
            <div class="template-meta">
              <el-tag size="small" effect="plain">{{ template.fields }} 个字段</el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  Document,
  Check,
  Monitor,
  Cellphone,
  Refresh,
  DocumentChecked,
  Download,
  Share,
  RefreshLeft,
  TrendCharts,
  PieChart,
  Histogram,
  List
} from '@element-plus/icons-vue'

// 报表配置
const reportConfig = reactive({
  name: 'PPE 合规状态月度报表',
  description: '汇总本月所有PPE产品的合规状态、认证到期情况和市场表现',
  type: 'compliance',
  themeColor: '#339999',
  fontSize: 'medium',
  orientation: 'portrait',
  displayOptions: ['header', 'footer', 'pageNumber', 'logo', 'timestamp'],
  selectedFields: ['name', 'category', 'manufacturer', 'certStatus', 'expiryDate'],
  schedule: {
    enabled: false,
    frequency: 'monthly',
    time: new Date(2026, 0, 1, 9, 0),
    dayOfWeek: '1',
    dayOfMonth: 1,
    recipients: [],
    emailSubject: ''
  }
})

// 可用字段
const availableFields = [
  {
    id: 'basic',
    label: '基本信息',
    children: [
      { id: 'name', label: '产品名称', prop: 'name' },
      { id: 'model', label: '产品型号', prop: 'model' },
      { id: 'category', label: '产品类别', prop: 'category' },
      { id: 'manufacturer', label: '制造商', prop: 'manufacturer' }
    ]
  },
  {
    id: 'cert',
    label: '认证信息',
    children: [
      { id: 'certStatus', label: '认证状态', prop: 'certStatus' },
      { id: 'certNumber', label: '证书编号', prop: 'certNumber' },
      { id: 'issueDate', label: '发证日期', prop: 'issueDate' },
      { id: 'expiryDate', label: '到期日期', prop: 'expiryDate' },
      { id: 'certBody', label: '认证机构', prop: 'certBody' }
    ]
  },
  {
    id: 'market',
    label: '市场信息',
    children: [
      { id: 'marketShare', label: '市场份额', prop: 'marketShare' },
      { id: 'salesVolume', label: '销售量', prop: 'salesVolume' },
      { id: 'price', label: '价格', prop: 'price' },
      { id: 'region', label: '销售地区', prop: 'region' }
    ]
  },
  {
    id: 'regulation',
    label: '法规信息',
    children: [
      { id: 'applicableRegs', label: '适用法规', prop: 'applicableRegs' },
      { id: 'complianceLevel', label: '合规等级', prop: 'complianceLevel' },
      { id: 'riskLevel', label: '风险等级', prop: 'riskLevel' }
    ]
  }
]

// 预览模式
const previewMode = ref('desktop')

// 当前时间
const currentTime = computed(() => {
  return new Date().toLocaleString('zh-CN')
})

// 预览统计数据
const previewStats = [
  { label: '产品总数', value: '1,234' },
  { label: '合规产品', value: '1,156' },
  { label: '待处理', value: '78' }
]

// 预览表格数据
const previewTableData = [
  { name: 'N95口罩', category: '呼吸防护', manufacturer: '3M', certStatus: '已认证', expiryDate: '2027-06-01' },
  { name: '防护服', category: '身体防护', manufacturer: 'DuPont', certStatus: '已认证', expiryDate: '2026-12-15' },
  { name: '防护手套', category: '手部防护', manufacturer: 'Ansell', certStatus: '即将到期', expiryDate: '2026-05-20' },
  { name: '护目镜', category: '眼部防护', manufacturer: '3M', certStatus: '已认证', expiryDate: '2027-03-10' },
  { name: '防护面罩', category: '面部防护', manufacturer: 'Honeywell', certStatus: '已认证', expiryDate: '2026-11-30' }
]

// 选中的字段列表
const selectedFieldList = computed(() => {
  const fields: any[] = []
  availableFields.forEach(group => {
    group.children?.forEach((field: any) => {
      if (reportConfig.selectedFields.includes(field.id)) {
        fields.push(field)
      }
    })
  })
  return fields
})

// 文档样式
const documentStyle = computed(() => {
  const fontSizes = {
    small: '12px',
    medium: '14px',
    large: '16px'
  }
  return {
    fontSize: fontSizes[reportConfig.fontSize as keyof typeof fontSizes],
    '--theme-color': reportConfig.themeColor
  }
})

// 是否全选
const allFieldsSelected = computed(() => {
  const allFieldIds: string[] = []
  availableFields.forEach(group => {
    group.children?.forEach((field: any) => {
      allFieldIds.push(field.id)
    })
  })
  return allFieldIds.every(id => reportConfig.selectedFields.includes(id))
})

// 模板对话框
const showTemplateDialog = ref(false)
const selectedTemplate = ref<any>(null)

// 报表模板
const reportTemplates = [
  {
    id: '1',
    name: '合规状态报表',
    description: '展示产品认证状态和到期情况',
    icon: DocumentChecked,
    color: '#339999',
    fields: 8,
    config: {
      type: 'compliance',
      selectedFields: ['name', 'category', 'manufacturer', 'certStatus', 'expiryDate']
    }
  },
  {
    id: '2',
    name: '市场分析报表',
    description: '分析市场份额和销售趋势',
    icon: TrendCharts,
    color: '#67c23a',
    fields: 12,
    config: {
      type: 'market',
      selectedFields: ['name', 'category', 'marketShare', 'salesVolume', 'price', 'region']
    }
  },
  {
    id: '3',
    name: '企业评估报表',
    description: '评估企业资质和合规水平',
    icon: Histogram,
    color: '#e6a23c',
    fields: 10,
    config: {
      type: 'enterprise',
      selectedFields: ['manufacturer', 'certStatus', 'complianceLevel', 'riskLevel']
    }
  },
  {
    id: '4',
    name: '法规跟踪报表',
    description: '跟踪法规变更和合规要求',
    icon: List,
    color: '#f56c6c',
    fields: 6,
    config: {
      type: 'regulation',
      selectedFields: ['name', 'applicableRegs', 'complianceLevel', 'certStatus']
    }
  }
]

// 字段树引用
const fieldTree = ref<any>(null)
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value || reportConfig.type !== 'market') return
  
  chartInstance = echarts.init(chartRef.value)
  const option = {
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' },
      splitLine: { lineStyle: { color: '#ebeef5' } }
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330],
      type: 'line',
      smooth: true,
      lineStyle: { color: reportConfig.themeColor, width: 3 },
      itemStyle: { color: reportConfig.themeColor },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: reportConfig.themeColor + '40' },
            { offset: 1, color: reportConfig.themeColor + '05' }
          ]
        }
      }
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true }
  }
  chartInstance.setOption(option)
}

// 处理字段变化
const handleFieldChange = () => {
  if (fieldTree.value) {
    reportConfig.selectedFields = fieldTree.value.getCheckedKeys()
  }
}

// 全选/取消全选
const selectAllFields = () => {
  if (allFieldsSelected.value) {
    reportConfig.selectedFields = []
    fieldTree.value?.setCheckedKeys([])
  } else {
    const allIds: string[] = []
    availableFields.forEach(group => {
      group.children?.forEach((field: any) => {
        allIds.push(field.id)
      })
    })
    reportConfig.selectedFields = allIds
    fieldTree.value?.setCheckedKeys(allIds)
  }
}

// 加载模板
const loadTemplate = () => {
  showTemplateDialog.value = true
}

// 选择模板
const selectTemplate = (template: any) => {
  selectedTemplate.value = template
  reportConfig.type = template.config.type
  reportConfig.selectedFields = template.config.selectedFields
  fieldTree.value?.setCheckedKeys(template.config.selectedFields)
  showTemplateDialog.value = false
  ElMessage.success(`已加载模板: ${template.name}`)
  
  nextTick(() => {
    initChart()
  })
}

// 保存配置
const saveConfig = () => {
  if (!reportConfig.name) {
    ElMessage.warning('请输入报表名称')
    return
  }
  // 模拟保存
  ElMessage.success('配置保存成功')
}

// 刷新预览
const refreshPreview = () => {
  ElMessage.success('预览已刷新')
  nextTick(() => {
    initChart()
  })
}

// 生成报表
const generateReport = () => {
  ElMessage.success('报表生成中，请稍候...')
  setTimeout(() => {
    ElMessage.success('报表生成完成')
  }, 1500)
}

// 导出配置
const exportConfig = () => {
  const configJson = JSON.stringify(reportConfig, null, 2)
  const blob = new Blob([configJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置已导出')
}

// 分享配置
const shareConfig = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

// 重置配置
const resetConfig = () => {
  reportConfig.name = ''
  reportConfig.description = ''
  reportConfig.type = 'custom'
  reportConfig.themeColor = '#339999'
  reportConfig.fontSize = 'medium'
  reportConfig.orientation = 'portrait'
  reportConfig.displayOptions = ['header', 'footer', 'pageNumber', 'logo', 'timestamp']
  reportConfig.selectedFields = []
  reportConfig.schedule.enabled = false
  fieldTree.value?.setCheckedKeys([])
  ElMessage.success('配置已重置')
}

// 监听类型变化
watch(() => reportConfig.type, () => {
  nextTick(() => {
    initChart()
  })
})

onMounted(() => {
  initChart()
})
</script>

<style scoped lang="scss">
.report-config-page {
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

  .config-panel,
  .schedule-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .field-section {
      .field-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .preview-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;

      .preview-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }

    .preview-container {
      background: #f5f7fa;
      padding: 24px;
      border-radius: 8px;
      min-height: 600px;

      &.mobile {
        max-width: 375px;
        margin: 0 auto;
      }

      .preview-document {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        min-height: 800px;
        padding: 40px;

        .preview-header {
          border-bottom: 2px solid var(--theme-color, #339999);
          padding-bottom: 20px;
          margin-bottom: 30px;

          .header-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;

            .logo-text {
              font-size: 20px;
              font-weight: 700;
              color: var(--theme-color, #339999);
            }
          }

          .header-title {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 8px;
          }

          .header-meta {
            font-size: 12px;
            color: #909399;
          }
        }

        .preview-content {
          .content-section {
            margin-bottom: 30px;

            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 16px;
              padding-left: 12px;
              border-left: 4px solid var(--theme-color, #339999);
            }

            .section-desc {
              color: #606266;
              line-height: 1.6;
            }

            .stat-row {
              .stat-card {
                text-align: center;
                padding: 20px;
                background: #f5f7fa;
                border-radius: 8px;

                .stat-value {
                  font-size: 28px;
                  font-weight: 700;
                  margin-bottom: 8px;
                }

                .stat-label {
                  font-size: 14px;
                  color: #606266;
                }
              }
            }

            .preview-chart {
              height: 300px;
            }
          }
        }

        .preview-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ebeef5;

          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .quick-actions {
    .panel-header {
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .el-button {
        flex: 1;
        min-width: 120px;
      }
    }
  }
}

.template-card {
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    border-color: #339999;
    transform: translateY(-2px);
  }

  &.selected {
    border: 2px solid #339999;
    background: #f0f9f9;
  }

  .template-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .template-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .template-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .template-meta {
    display: flex;
    gap: 8px;
  }
}
</style>
