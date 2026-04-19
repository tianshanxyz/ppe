<template>
  <div class="report-export-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">报表导出</h1>
        <p class="page-description">将报表导出为多种格式或在线打印</p>
      </div>
      <div class="header-right">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：导出设置 -->
      <el-col :xs="24" :lg="10">
        <el-card class="export-settings" shadow="never">
          <template #header>
            <div class="panel-header">
              <el-icon><Setting /></el-icon>
              <span>导出设置</span>
            </div>
          </template>

          <!-- 选择报表 -->
          <div class="setting-section">
            <h4 class="section-title">选择报表</h4>
            <el-select 
              v-model="selectedReport" 
              placeholder="选择要导出的报表"
              style="width: 100%"
              @change="handleReportChange"
            >
              <el-option-group label="我的报表">
                <el-option 
                  v-for="report in myReports" 
                  :key="report.id"
                  :label="report.name"
                  :value="report.id"
                >
                  <div class="report-option">
                    <span class="report-name">{{ report.name }}</span>
                    <el-tag size="small" :type="getReportTypeType(report.type)">
                      {{ getReportTypeLabel(report.type) }}
                    </el-tag>
                  </div>
                </el-option>
              </el-option-group>
              <el-option-group label="系统模板">
                <el-option 
                  v-for="report in systemTemplates" 
                  :key="report.id"
                  :label="report.name"
                  :value="report.id"
                >
                  <div class="report-option">
                    <span class="report-name">{{ report.name }}</span>
                    <el-tag size="small" type="info">模板</el-tag>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <!-- 导出格式 -->
          <div class="setting-section">
            <h4 class="section-title">导出格式</h4>
            <div class="format-grid">
              <div 
                v-for="format in exportFormats" 
                :key="format.value"
                class="format-card"
                :class="{ active: selectedFormat === format.value }"
                @click="selectedFormat = format.value"
              >
                <div class="format-icon" :style="{ background: format.color + '20', color: format.color }">
                  <el-icon :size="28">
                    <component :is="format.icon" />
                  </el-icon>
                </div>
                <div class="format-info">
                  <span class="format-name">{{ format.label }}</span>
                  <span class="format-desc">{{ format.description }}</span>
                </div>
                <el-radio v-model="selectedFormat" :label="format.value" class="format-radio">
                  {{ '' }}
                </el-radio>
              </div>
            </div>
          </div>

          <!-- 页面范围 -->
          <div class="setting-section">
            <h4 class="section-title">页面范围</h4>
            <el-radio-group v-model="pageRange" class="page-range-group">
              <el-radio label="all">全部页面</el-radio>
              <el-radio label="current">当前页</el-radio>
              <el-radio label="custom">自定义范围</el-radio>
            </el-radio-group>
            <el-input 
              v-if="pageRange === 'custom'"
              v-model="customPageRange"
              placeholder="例如: 1-5, 8, 11-15"
              style="margin-top: 12px;"
            />
          </div>

          <!-- 导出选项 -->
          <div class="setting-section">
            <h4 class="section-title">导出选项</h4>
            <el-checkbox-group v-model="exportOptions" class="export-options">
              <el-checkbox label="header">包含页眉</el-checkbox>
              <el-checkbox label="footer">包含页脚</el-checkbox>
              <el-checkbox label="pageNumber">包含页码</el-checkbox>
              <el-checkbox label="watermark">添加水印</el-checkbox>
              <el-checkbox label="password">设置密码保护</el-checkbox>
              <el-checkbox label="compress">压缩文件</el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- 水印设置 -->
          <div v-if="exportOptions.includes('watermark')" class="setting-section watermark-section">
            <h4 class="section-title">水印设置</h4>
            <el-form label-position="top" size="small">
              <el-form-item label="水印文字">
                <el-input v-model="watermark.text" placeholder="输入水印文字..." />
              </el-form-item>
              <el-form-item label="透明度">
                <el-slider v-model="watermark.opacity" :min="0" :max="100" />
              </el-form-item>
              <el-form-item label="角度">
                <el-radio-group v-model="watermark.angle">
                  <el-radio-button :label="0">水平</el-radio-button>
                  <el-radio-button :label="45">倾斜</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <!-- 密码保护 -->
          <div v-if="exportOptions.includes('password')" class="setting-section password-section">
            <h4 class="section-title">密码保护</h4>
            <el-form label-position="top" size="small">
              <el-form-item label="打开密码">
                <el-input 
                  v-model="password.open" 
                  type="password"
                  placeholder="设置打开文件的密码"
                  show-password
                />
              </el-form-item>
              <el-form-item label="权限密码">
                <el-input 
                  v-model="password.permission" 
                  type="password"
                  placeholder="设置编辑权限密码"
                  show-password
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- 导出按钮 -->
          <div class="export-actions">
            <el-button 
              type="primary" 
              size="large" 
              :loading="isExporting"
              :disabled="!selectedReport"
              @click="handleExport"
              class="export-btn"
            >
              <el-icon><Download /></el-icon>
              {{ isExporting ? '导出中...' : '开始导出' }}
            </el-button>
            <el-button 
              size="large" 
              :disabled="!selectedReport"
              @click="handlePrint"
              class="print-btn"
            >
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
          </div>
        </el-card>

        <!-- 导出历史 -->
        <el-card class="export-history" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="panel-header">
              <el-icon><Clock /></el-icon>
              <span>导出历史</span>
              <el-button link type="primary" @click="clearHistory">清空</el-button>
            </div>
          </template>

          <el-timeline v-if="exportHistory.length > 0">
            <el-timeline-item
              v-for="item in exportHistory"
              :key="item.id"
              :type="item.status === 'success' ? 'success' : 'danger'"
              :timestamp="item.time"
            >
              <div class="history-item">
                <div class="history-info">
                  <span class="history-name">{{ item.reportName }}</span>
                  <el-tag size="small" :type="getFormatType(item.format)">
                    {{ item.format.toUpperCase() }}
                  </el-tag>
                </div>
                <div class="history-actions">
                  <el-button 
                    v-if="item.status === 'success'"
                    link 
                    type="primary" 
                    @click="downloadFile(item)"
                  >
                    下载
                  </el-button>
                  <el-button link type="danger" @click="removeHistory(item.id)">
                    删除
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无导出记录" :image-size="80" />
        </el-card>
      </el-col>

      <!-- 右侧：预览区域 -->
      <el-col :xs="24" :lg="14">
        <el-card class="preview-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <el-icon><View /></el-icon>
              <span>导出预览</span>
              <div class="preview-tools">
                <el-tooltip content="缩小">
                  <el-button link @click="zoomOut">
                    <el-icon><ZoomOut /></el-icon>
                  </el-button>
                </el-tooltip>
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                <el-tooltip content="放大">
                  <el-button link @click="zoomIn">
                    <el-icon><ZoomIn /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-divider direction="vertical" />
                <el-tooltip content="全屏预览">
                  <el-button link @click="toggleFullscreen">
                    <el-icon><FullScreen /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </template>

          <div class="preview-container" :class="{ fullscreen: isFullscreen }">
            <div class="preview-document" :style="previewStyle">
              <!-- 水印层 -->
              <div 
                v-if="exportOptions.includes('watermark')" 
                class="watermark-layer"
                :style="watermarkStyle"
              >
                {{ watermark.text || 'MDLOOKER' }}
              </div>

              <!-- 页眉 -->
              <div v-if="exportOptions.includes('header')" class="preview-header">
                <div class="header-logo">
                  <el-icon :size="24" color="#339999"><Document /></el-icon>
                  <span class="logo-text">MDLOOKER</span>
                </div>
                <div class="header-title">{{ currentReport?.name || '未选择报表' }}</div>
                <div class="header-date">{{ currentDate }}</div>
              </div>

              <!-- 内容区域 -->
              <div class="preview-content">
                <div v-if="!selectedReport" class="empty-preview">
                  <el-empty description="请选择要导出的报表">
                    <template #image>
                      <el-icon :size="64" color="#909399"><Document /></el-icon>
                    </template>
                  </el-empty>
                </div>

                <template v-else>
                  <!-- 报表摘要 -->
                  <div class="content-section">
                    <h2 class="section-title">报表摘要</h2>
                    <p class="section-desc">{{ currentReport?.description || '暂无描述' }}</p>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="报表类型">
                        {{ getReportTypeLabel(currentReport?.type) }}
                      </el-descriptions-item>
                      <el-descriptions-item label="创建时间">
                        {{ currentReport?.createdAt }}
                      </el-descriptions-item>
                      <el-descriptions-item label="数据范围">
                        {{ currentReport?.dataRange || '全部数据' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="记录数量">
                        {{ currentReport?.recordCount || 0 }} 条
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>

                  <!-- 数据表格 -->
                  <div class="content-section">
                    <h3 class="section-title">数据明细</h3>
                    <el-table :data="previewData" border size="small" style="width: 100%">
                      <el-table-column type="index" width="50" />
                      <el-table-column 
                        v-for="col in previewColumns" 
                        :key="col.prop"
                        :prop="col.prop"
                        :label="col.label"
                        :width="col.width"
                      />
                    </el-table>
                  </div>

                  <!-- 统计图表 -->
                  <div class="content-section" v-if="currentReport?.type === 'market'">
                    <h3 class="section-title">趋势分析</h3>
                    <div ref="chartRef" class="preview-chart"></div>
                  </div>

                  <!-- 分页 -->
                  <div class="preview-pagination">
                    <el-pagination
                      v-model:current-page="currentPage"
                      v-model:page-size="pageSize"
                      :total="totalRecords"
                      layout="prev, pager, next"
                      small
                    />
                  </div>
                </template>
              </div>

              <!-- 页脚 -->
              <div v-if="exportOptions.includes('footer')" class="preview-footer">
                <div class="footer-content">
                  <span>© 2026 MDLOOKER PPE Data Platform</span>
                  <span v-if="exportOptions.includes('pageNumber')" class="page-number">
                    第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 导出进度 -->
        <el-card v-if="isExporting" class="export-progress" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="panel-header">
              <el-icon><Loading /></el-icon>
              <span>导出进度</span>
            </div>
          </template>

          <div class="progress-content">
            <el-progress 
              :percentage="exportProgress" 
              :status="exportProgress === 100 ? 'success' : ''"
              :stroke-width="20"
              striped
              striped-flow
            />
            <p class="progress-text">{{ exportStatus }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 打印对话框 -->
    <el-dialog v-model="showPrintDialog" title="打印设置" width="500px">
      <el-form label-width="100px">
        <el-form-item label="打印机">
          <el-select v-model="printSettings.printer" style="width: 100%">
            <el-option label="默认打印机" value="default" />
            <el-option label="Microsoft Print to PDF" value="pdf" />
            <el-option label="HP LaserJet Pro" value="hp1" />
            <el-option label="Canon PIXMA" value="canon1" />
          </el-select>
        </el-form-item>
        <el-form-item label="纸张大小">
          <el-select v-model="printSettings.paperSize" style="width: 100%">
            <el-option label="A4" value="A4" />
            <el-option label="A3" value="A3" />
            <el-option label="Letter" value="Letter" />
            <el-option label="Legal" value="Legal" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-radio-group v-model="printSettings.orientation">
            <el-radio-button label="portrait">纵向</el-radio-button>
            <el-radio-button label="landscape">横向</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="份数">
          <el-input-number v-model="printSettings.copies" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-radio-group v-model="printSettings.color">
            <el-radio-button label="color">彩色</el-radio-button>
            <el-radio-button label="grayscale">灰度</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPrintDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPrint">开始打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  ArrowLeft,
  Setting,
  Download,
  Printer,
  Clock,
  View,
  ZoomOut,
  ZoomIn,
  FullScreen,
  Document,
  DocumentChecked,
  Files,
  Loading,
  Grid,
  List
} from '@element-plus/icons-vue'

const router = useRouter()

// 状态
const selectedReport = ref('')
const selectedFormat = ref('pdf')
const pageRange = ref('all')
const customPageRange = ref('')
const exportOptions = ref(['header', 'footer', 'pageNumber'])
const isExporting = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const zoomLevel = ref(1)
const isFullscreen = ref(false)
const showPrintDialog = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(156)
const chartRef = ref<HTMLElement>()

// 水印设置
const watermark = ref({
  text: 'CONFIDENTIAL',
  opacity: 30,
  angle: 45
})

// 密码设置
const password = ref({
  open: '',
  permission: ''
})

// 打印设置
const printSettings = ref({
  printer: 'default',
  paperSize: 'A4',
  orientation: 'portrait',
  copies: 1,
  color: 'color'
})

// 导出格式选项
const exportFormats = [
  {
    value: 'pdf',
    label: 'PDF',
    description: '适合打印和分享',
    icon: DocumentChecked,
    color: '#F56C6C'
  },
  {
    value: 'excel',
    label: 'Excel',
    description: '适合数据分析',
    icon: Grid,
    color: '#67C23A'
  },
  {
    value: 'word',
    label: 'Word',
    description: '适合编辑修改',
    icon: Files,
    color: '#409EFF'
  },
  {
    value: 'csv',
    label: 'CSV',
    description: '适合数据导入',
    icon: List,
    color: '#E6A23C'
  }
]

// 我的报表列表
const myReports = ref([
  {
    id: '1',
    name: '2026年Q1合规状态报表',
    type: 'compliance',
    description: '展示2026年第一季度PPE产品的合规状态分析',
    createdAt: '2026-04-15',
    dataRange: '2026-01-01 至 2026-03-31',
    recordCount: 156
  },
  {
    id: '2',
    name: '口罩产品市场分析',
    type: 'market',
    description: '口罩类产品市场竞争力和趋势分析',
    createdAt: '2026-04-14',
    dataRange: '全部数据',
    recordCount: 89
  },
  {
    id: '3',
    name: '3M公司合规评估',
    type: 'enterprise',
    description: '3M公司PPE产品线合规状况评估报告',
    createdAt: '2026-04-12',
    dataRange: '全部数据',
    recordCount: 45
  },
  {
    id: '4',
    name: '欧盟法规变更跟踪',
    type: 'regulation',
    description: '近期欧盟PPE相关法规变更汇总',
    createdAt: '2026-04-10',
    dataRange: '2026-01-01 至今',
    recordCount: 23
  }
])

// 系统模板
const systemTemplates = ref([
  {
    id: 'tpl-1',
    name: '标准合规报表模板',
    type: 'compliance',
    description: '标准合规报表模板',
    createdAt: '-',
    dataRange: '全部数据',
    recordCount: 0
  },
  {
    id: 'tpl-2',
    name: '市场分析报表模板',
    type: 'market',
    description: '市场分析报表模板',
    createdAt: '-',
    dataRange: '全部数据',
    recordCount: 0
  },
  {
    id: 'tpl-3',
    name: '企业评估报表模板',
    type: 'enterprise',
    description: '企业评估报表模板',
    createdAt: '-',
    dataRange: '全部数据',
    recordCount: 0
  }
])

// 导出历史
const exportHistory = ref([
  {
    id: 'h1',
    reportName: '2026年Q1合规状态报表',
    format: 'pdf',
    time: '2026-04-18 14:30',
    status: 'success',
    url: '#'
  },
  {
    id: 'h2',
    reportName: '口罩产品市场分析',
    format: 'excel',
    time: '2026-04-18 10:15',
    status: 'success',
    url: '#'
  },
  {
    id: 'h3',
    reportName: '欧盟法规变更跟踪',
    format: 'word',
    time: '2026-04-17 16:45',
    status: 'failed',
    url: '#'
  }
])

// 预览数据
const previewColumns = ref([
  { prop: 'name', label: '产品名称', width: 180 },
  { prop: 'category', label: '类别', width: 120 },
  { prop: 'manufacturer', label: '制造商', width: 150 },
  { prop: 'certNo', label: '认证编号', width: 150 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'expiryDate', label: '到期日期', width: 120 }
])

const previewData = ref([
  {
    name: 'N95防护口罩',
    category: '呼吸防护',
    manufacturer: '3M',
    certNo: 'CE-12345',
    status: '有效',
    expiryDate: '2027-06-30'
  },
  {
    name: '医用防护服',
    category: '身体防护',
    manufacturer: 'DuPont',
    certNo: 'CE-67890',
    status: '有效',
    expiryDate: '2026-12-31'
  },
  {
    name: '防护手套',
    category: '手部防护',
    manufacturer: 'Ansell',
    certNo: 'CE-11111',
    status: '即将到期',
    expiryDate: '2026-05-15'
  },
  {
    name: '安全鞋',
    category: '足部防护',
    manufacturer: 'Honeywell',
    certNo: 'CE-22222',
    status: '有效',
    expiryDate: '2027-03-20'
  },
  {
    name: '防护眼镜',
    category: '眼部防护',
    manufacturer: 'UVEX',
    certNo: 'CE-33333',
    status: '有效',
    expiryDate: '2027-08-10'
  }
])

// 计算属性
const currentReport = computed(() => {
  return [...myReports.value, ...systemTemplates.value].find(r => r.id === selectedReport.value)
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN')
})

const totalPages = computed(() => {
  return Math.ceil(totalRecords.value / pageSize.value)
})

const previewStyle = computed(() => {
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: 'top center'
  }
})

const watermarkStyle = computed(() => {
  return {
    opacity: watermark.value.opacity / 100,
    transform: `rotate(${watermark.value.angle}deg)`
  }
})

// 方法
const getReportTypeLabel = (type?: string) => {
  const map: Record<string, string> = {
    compliance: '合规状态',
    market: '市场分析',
    enterprise: '企业评估',
    product: '产品对比',
    regulation: '法规跟踪',
    custom: '自定义'
  }
  return map[type || ''] || '其他'
}

const getReportTypeType = (type?: string) => {
  const map: Record<string, any> = {
    compliance: 'success',
    market: 'primary',
    enterprise: 'warning',
    product: 'info',
    regulation: 'danger'
  }
  return map[type || '']
}

const getFormatType = (format: string) => {
  const map: Record<string, any> = {
    pdf: 'danger',
    excel: 'success',
    word: 'primary',
    csv: 'warning'
  }
  return map[format] || 'info'
}

const handleReportChange = () => {
  currentPage.value = 1
  nextTick(() => {
    initChart()
  })
}

const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.1
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.1
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleExport = async () => {
  if (!selectedReport.value) {
    ElMessage.warning('请先选择要导出的报表')
    return
  }

  isExporting.value = true
  exportProgress.value = 0
  exportStatus.value = '正在准备导出...'

  // 模拟导出进度
  const steps = [
    { progress: 20, status: '正在收集数据...' },
    { progress: 40, status: '正在生成报表内容...' },
    { progress: 60, status: '正在应用样式和格式...' },
    { progress: 80, status: '正在添加水印和密码保护...' },
    { progress: 95, status: '正在打包文件...' },
    { progress: 100, status: '导出完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 500))
    exportProgress.value = step.progress
    exportStatus.value = step.status
  }

  // 添加到历史记录
  exportHistory.value.unshift({
    id: Date.now().toString(),
    reportName: currentReport.value?.name || '未知报表',
    format: selectedFormat.value,
    time: new Date().toLocaleString('zh-CN'),
    status: 'success',
    url: '#'
  })

  ElMessage.success(`报表已成功导出为 ${selectedFormat.value.toUpperCase()} 格式`)
  isExporting.value = false
}

const handlePrint = () => {
  if (!selectedReport.value) {
    ElMessage.warning('请先选择要打印的报表')
    return
  }
  showPrintDialog.value = true
}

const confirmPrint = () => {
  showPrintDialog.value = false
  window.print()
  ElMessage.success('打印任务已发送到打印机')
}

const downloadFile = (item: any) => {
  ElMessage.success(`开始下载: ${item.reportName}.${item.format}`)
}

const removeHistory = (id: string) => {
  exportHistory.value = exportHistory.value.filter(h => h.id !== id)
}

const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有导出历史吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    exportHistory.value = []
    ElMessage.success('导出历史已清空')
  })
}

const goBack = () => {
  router.back()
}

const initChart = () => {
  if (!chartRef.value || currentReport.value?.type !== 'market') return

  const chart = echarts.init(chartRef.value)
  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#666' }
    },
    series: [{
      data: [120, 200, 150, 80, 70, 110],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#339999', width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(51, 153, 153, 0.3)' },
            { offset: 1, color: 'rgba(51, 153, 153, 0.05)' }
          ]
        }
      },
      itemStyle: { color: '#339999' }
    }]
  }
  chart.setOption(option)
}

// 监听
watch(selectedReport, () => {
  nextTick(() => initChart())
})

onMounted(() => {
  initChart()
})
</script>

<style scoped lang="scss">
.report-export-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #1f2f3d;
      margin: 0 0 8px;
    }

    .page-description {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  .el-icon {
    color: #339999;
  }
}

// 导出设置
.export-settings {
  .setting-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: #606266;
      margin: 0 0 12px;
    }
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .format-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #339999;
      background: #f5f7fa;
    }

    &.active {
      border-color: #339999;
      background: rgba(51, 153, 153, 0.05);
    }

    .format-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .format-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .format-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }

      .format-desc {
        font-size: 12px;
        color: #909399;
      }
    }

    .format-radio {
      margin: 0;
    }
  }

  .page-range-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .export-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .watermark-section,
  .password-section {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  .export-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;

    .export-btn {
      flex: 1;
    }

    .print-btn {
      flex: 1;
    }
  }
}

// 报表选项样式
.report-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .report-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 导出历史
.export-history {
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .history-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .history-name {
        font-size: 14px;
        color: #303133;
      }
    }

    .history-actions {
      display: flex;
      gap: 8px;
    }
  }
}

// 预览面板
.preview-panel {
  .preview-tools {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;

    .zoom-level {
      font-size: 14px;
      color: #606266;
      min-width: 50px;
      text-align: center;
    }
  }

  .preview-container {
    background: #e8e8e8;
    border-radius: 8px;
    padding: 24px;
    min-height: 600px;
    overflow: auto;

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2000;
      border-radius: 0;
    }
  }

  .preview-document {
    background: white;
    min-height: 800px;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .watermark-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: #999;
    pointer-events: none;
    z-index: 1;
  }

  .preview-header {
    padding: 24px 32px;
    border-bottom: 2px solid #339999;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-logo {
      display: flex;
      align-items: center;
      gap: 8px;

      .logo-text {
        font-size: 18px;
        font-weight: 600;
        color: #339999;
      }
    }

    .header-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2f3d;
    }

    .header-date {
      font-size: 12px;
      color: #909399;
    }
  }

  .preview-content {
    padding: 32px;
    position: relative;
    z-index: 2;

    .empty-preview {
      padding: 60px 0;
    }

    .content-section {
      margin-bottom: 32px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2f3d;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }

      .section-desc {
        font-size: 14px;
        color: #606266;
        margin: 0 0 16px;
        line-height: 1.6;
      }
    }

    .preview-chart {
      height: 250px;
    }
  }

  .preview-pagination {
    padding: 16px 32px;
    display: flex;
    justify-content: center;
    border-top: 1px solid #e4e7ed;
  }

  .preview-footer {
    padding: 16px 32px;
    border-top: 1px solid #e4e7ed;
    background: #f5f7fa;

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #909399;
    }
  }
}

// 导出进度
.export-progress {
  .progress-content {
    padding: 16px;

    .progress-text {
      text-align: center;
      margin: 16px 0 0;
      color: #606266;
    }
  }
}

// 打印样式
@media print {
  .report-export-page {
    padding: 0;
    background: white;
  }

  .page-header,
  .export-settings,
  .export-history,
  .preview-panel :deep(.el-card__header),
  .export-progress {
    display: none !important;
  }

  .preview-panel {
    box-shadow: none;

    .preview-container {
      background: white;
      padding: 0;
      min-height: auto;
    }

    .preview-document {
      box-shadow: none;
      max-width: none;
      transform: none !important;
    }
  }
}
</style>
