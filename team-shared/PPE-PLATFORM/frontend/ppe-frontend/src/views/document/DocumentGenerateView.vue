<template>
  <div class="document-generate-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">文件生成</h1>
        <p class="page-description">根据模板快速生成PPE合规文档、报告和证书</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Document" @click="goToManage">
          文件管理
        </el-button>
      </div>
    </div>

    <!-- 步骤条 -->
    <el-card class="steps-card" shadow="never">
      <el-steps :active="currentStep" finish-status="success" simple>
        <el-step title="选择模板" :icon="DocumentCopy" />
        <el-step title="配置数据" :icon="Setting" />
        <el-step title="预览确认" :icon="View" />
        <el-step title="生成下载" :icon="Download" />
      </el-steps>
    </el-card>

    <!-- 步骤1: 选择模板 -->
    <div v-if="currentStep === 0" class="step-content">
      <el-card class="template-filter" shadow="never">
        <template #header>
          <div class="filter-header">
            <span class="filter-title">
              <el-icon><Filter /></el-icon>
              模板筛选
            </span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="文档类型">
              <el-select v-model="templateFilters.type" placeholder="选择类型" clearable style="width: 100%">
                <el-option label="合规报告" value="compliance-report" />
                <el-option label="产品证书" value="product-certificate" />
                <el-option label="企业资质" value="enterprise-qualification" />
                <el-option label="法规摘要" value="regulation-summary" />
                <el-option label="对比分析" value="comparison-analysis" />
                <el-option label="认证申请" value="certification-application" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="适用地区">
              <el-select v-model="templateFilters.region" placeholder="选择地区" clearable style="width: 100%">
                <el-option label="中国" value="CN" />
                <el-option label="欧盟" value="EU" />
                <el-option label="美国" value="US" />
                <el-option label="国际通用" value="INT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="语言">
              <el-select v-model="templateFilters.language" placeholder="选择语言" clearable style="width: 100%">
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
                <el-option label="中英文" value="bilingual" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="搜索">
              <el-input
                v-model="templateFilters.keyword"
                placeholder="搜索模板名称..."
                clearable
                :prefix-icon="Search"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-row :gutter="20" class="template-grid">
        <el-col
          v-for="template in filteredTemplates"
          :key="template.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card
            class="template-card"
            :class="{ selected: selectedTemplate?.id === template.id }"
            shadow="hover"
            @click="selectTemplate(template)"
          >
            <div class="template-icon">
              <el-icon :size="48">
                <component :is="getTemplateIcon(template.type)" />
              </el-icon>
            </div>
            <h4 class="template-name">{{ template.name }}</h4>
            <p class="template-desc">{{ template.description }}</p>
            <div class="template-tags">
              <el-tag size="small" effect="plain">{{ getTypeLabel(template.type) }}</el-tag>
              <el-tag size="small" type="info" effect="plain">{{ template.region }}</el-tag>
            </div>
            <div class="template-meta">
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ template.format.toUpperCase() }}
              </span>
              <span class="meta-item">
                <el-icon><Download /></el-icon>
                {{ template.downloadCount }}次使用
              </span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="step-actions">
        <el-button type="primary" size="large" :disabled="!selectedTemplate" @click="nextStep">
          下一步
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 步骤2: 配置数据 -->
    <div v-if="currentStep === 1" class="step-content">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <el-card class="config-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><Setting /></el-icon>
                  数据源配置
                </span>
                <el-tag type="primary" effect="light">{{ selectedTemplate?.name }}</el-tag>
              </div>
            </template>

            <el-form :model="dataConfig" label-position="top">
              <!-- 产品选择 -->
              <el-form-item v-if="selectedTemplate?.requiresProduct" label="选择产品">
                <el-select-v2
                  v-model="dataConfig.productId"
                  :options="productOptions"
                  placeholder="搜索并选择产品..."
                  clearable
                  filterable
                  remote
                  :remote-method="searchProducts"
                  :loading="productLoading"
                  style="width: 100%"
                />
              </el-form-item>

              <!-- 企业选择 -->
              <el-form-item v-if="selectedTemplate?.requiresEnterprise" label="选择企业">
                <el-select-v2
                  v-model="dataConfig.enterpriseId"
                  :options="enterpriseOptions"
                  placeholder="搜索并选择企业..."
                  clearable
                  filterable
                  remote
                  :remote-method="searchEnterprises"
                  :loading="enterpriseLoading"
                  style="width: 100%"
                />
              </el-form-item>

              <!-- 法规选择 -->
              <el-form-item v-if="selectedTemplate?.requiresRegulation" label="选择法规">
                <el-select-v2
                  v-model="dataConfig.regulationIds"
                  :options="regulationOptions"
                  placeholder="搜索并选择法规..."
                  clearable
                  filterable
                  multiple
                  remote
                  :remote-method="searchRegulations"
                  :loading="regulationLoading"
                  style="width: 100%"
                />
              </el-form-item>

              <!-- 报告标题 -->
              <el-form-item label="文档标题">
                <el-input
                  v-model="dataConfig.title"
                  placeholder="输入文档标题..."
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>

              <!-- 报告日期 -->
              <el-form-item label="报告日期">
                <el-date-picker
                  v-model="dataConfig.reportDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>

              <!-- 自定义字段 -->
              <el-divider>自定义字段</el-divider>

              <el-form-item label="报告编号">
                <el-input v-model="dataConfig.reportNumber" placeholder="输入报告编号..." />
              </el-form-item>

              <el-form-item label="编制人">
                <el-input v-model="dataConfig.author" placeholder="输入编制人姓名..." />
              </el-form-item>

              <el-form-item label="审核人">
                <el-input v-model="dataConfig.reviewer" placeholder="输入审核人姓名..." />
              </el-form-item>

              <el-form-item label="备注">
                <el-input
                  v-model="dataConfig.remarks"
                  type="textarea"
                  :rows="3"
                  placeholder="输入备注信息..."
                />
              </el-form-item>

              <!-- 高级选项 -->
              <el-form-item>
                <el-collapse>
                  <el-collapse-item title="高级选项" name="advanced">
                    <el-form-item label="包含图表">
                      <el-switch v-model="dataConfig.includeCharts" />
                    </el-form-item>
                    <el-form-item label="包含附录">
                      <el-switch v-model="dataConfig.includeAppendix" />
                    </el-form-item>
                    <el-form-item label="水印">
                      <el-input v-model="dataConfig.watermark" placeholder="输入水印文字..." />
                    </el-form-item>
                    <el-form-item label="页眉">
                      <el-input v-model="dataConfig.header" placeholder="输入页眉内容..." />
                    </el-form-item>
                    <el-form-item label="页脚">
                      <el-input v-model="dataConfig.footer" placeholder="输入页脚内容..." />
                    </el-form-item>
                  </el-collapse-item>
                </el-collapse>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card class="preview-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><InfoFilled /></el-icon>
                  模板信息
                </span>
              </div>
            </template>
            <div class="template-info">
              <div class="info-item">
                <span class="info-label">模板名称</span>
                <span class="info-value">{{ selectedTemplate?.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">文档类型</span>
                <span class="info-value">{{ getTypeLabel(selectedTemplate?.type) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">输出格式</span>
                <span class="info-value">{{ selectedTemplate?.format.toUpperCase() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">预计页数</span>
                <span class="info-value">{{ selectedTemplate?.estimatedPages }} 页</span>
              </div>
              <div class="info-item">
                <span class="info-label">适用地区</span>
                <span class="info-value">{{ selectedTemplate?.region }}</span>
              </div>
            </div>
            <el-divider />
            <div class="template-fields">
              <h5>包含字段</h5>
              <el-tag
                v-for="field in selectedTemplate?.fields"
                :key="field"
                size="small"
                effect="plain"
                class="field-tag"
              >
                {{ field }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="step-actions">
        <el-button size="large" @click="prevStep">
          <el-icon class="el-icon--left"><ArrowLeft /></el-icon>
          上一步
        </el-button>
        <el-button type="primary" size="large" @click="nextStep">
          下一步
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 步骤3: 预览确认 -->
    <div v-if="currentStep === 2" class="step-content">
      <el-card class="preview-document" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><View /></el-icon>
              文档预览
            </span>
            <div class="header-actions">
              <el-radio-group v-model="previewMode" size="small">
                <el-radio-button label="desktop">
                  <el-icon><Monitor /></el-icon>
                </el-radio-button>
                <el-radio-button label="mobile">
                  <el-icon><Cellphone /></el-icon>
                </el-radio-button>
              </el-radio-group>
              <el-button :icon="FullScreen" size="small" @click="fullscreenPreview">
                全屏预览
              </el-button>
            </div>
          </div>
        </template>

        <div class="document-preview" :class="previewMode">
          <div class="document-page">
            <div class="document-header">
              <div class="doc-logo">MDLOOKER</div>
              <div class="doc-title">{{ dataConfig.title || '未命名文档' }}</div>
              <div class="doc-meta">
                <span>报告编号: {{ dataConfig.reportNumber || 'N/A' }}</span>
                <span>日期: {{ dataConfig.reportDate }}</span>
              </div>
            </div>

            <div class="document-content">
              <div class="content-section">
                <h3>1. 概述</h3>
                <p>本报告根据 {{ selectedTemplate?.name }} 模板生成，包含以下主要内容：</p>
                <ul>
                  <li>产品基本信息与认证状态</li>
                  <li>适用的法规标准汇总</li>
                  <li>合规性评估结果</li>
                  <li>风险分析与建议</li>
                </ul>
              </div>

              <div class="content-section">
                <h3>2. 基本信息</h3>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="文档类型">{{ getTypeLabel(selectedTemplate?.type) }}</el-descriptions-item>
                  <el-descriptions-item label="生成时间">{{ currentTime }}</el-descriptions-item>
                  <el-descriptions-item label="编制人">{{ dataConfig.author || '未填写' }}</el-descriptions-item>
                  <el-descriptions-item label="审核人">{{ dataConfig.reviewer || '未填写' }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <div v-if="dataConfig.includeCharts" class="content-section">
                <h3>3. 数据图表</h3>
                <div class="chart-placeholder">
                  <el-icon><PieChart /></el-icon>
                  <p>图表区域</p>
                </div>
              </div>

              <div v-if="dataConfig.includeAppendix" class="content-section">
                <h3>4. 附录</h3>
                <p>附录内容将在正式文档中显示...</p>
              </div>
            </div>

            <div class="document-footer">
              <p>{{ dataConfig.footer || 'MDLOOKER PPE Data Platform' }}</p>
              <p class="page-number">第 1 页 / 共 {{ selectedTemplate?.estimatedPages }} 页</p>
            </div>

            <div v-if="dataConfig.watermark" class="watermark">
              {{ dataConfig.watermark }}
            </div>
          </div>
        </div>
      </el-card>

      <div class="step-actions">
        <el-button size="large" @click="prevStep">
          <el-icon class="el-icon--left"><ArrowLeft /></el-icon>
          上一步
        </el-button>
        <el-button type="primary" size="large" @click="nextStep">
          确认生成
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 步骤4: 生成下载 -->
    <div v-if="currentStep === 3" class="step-content">
      <el-card class="generate-result" shadow="never">
        <div class="result-content">
          <el-result
            :icon="generateStatus === 'success' ? 'success' : generateStatus === 'error' ? 'error' : 'info'"
            :title="generateStatus === 'success' ? '文档生成成功' : generateStatus === 'error' ? '生成失败' : '正在生成文档'"
            :sub-title="generateStatus === 'success' ? '您的文档已准备就绪，可以下载或分享' : generateStatus === 'error' ? '请检查配置后重试' : '请稍候，正在处理您的请求'"
          >
            <template #icon>
              <el-icon v-if="generateStatus === 'loading'" class="is-loading" :size="64">
                <Loading />
              </el-icon>
            </template>
            <template #extra>
              <div v-if="generateStatus === 'success'" class="success-actions">
                <el-button type="primary" :icon="Download" size="large" @click="downloadDocument">
                  下载文档
                </el-button>
                <el-button :icon="Share" size="large" @click="shareDocument">
                  分享文档
                </el-button>
                <el-button :icon="Document" size="large" @click="goToManage">
                  查看文件
                </el-button>
              </div>
              <div v-else-if="generateStatus === 'error'" class="error-actions">
                <el-button type="primary" @click="retryGenerate">
                  <el-icon><Refresh /></el-icon>
                  重试
                </el-button>
                <el-button @click="currentStep = 1">
                  修改配置
                </el-button>
              </div>
              <div v-else class="loading-info">
                <el-progress :percentage="generateProgress" :stroke-width="8" striped striped-flow />
                <p class="loading-text">正在生成 {{ selectedTemplate?.name }}...</p>
              </div>
            </template>
          </el-result>

          <div v-if="generateStatus === 'success' && generatedDocument" class="document-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="文档名称">{{ generatedDocument.name }}</el-descriptions-item>
              <el-descriptions-item label="文件格式">{{ generatedDocument.format.toUpperCase() }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ generatedDocument.size }}</el-descriptions-item>
              <el-descriptions-item label="生成时间">{{ generatedDocument.generatedAt }}</el-descriptions-item>
              <el-descriptions-item label="有效期至">{{ generatedDocument.expiresAt }}</el-descriptions-item>
              <el-descriptions-item label="下载次数">{{ generatedDocument.downloadCount }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>

      <div class="step-actions">
        <el-button size="large" @click="resetForm">
          <el-icon class="el-icon--left"><RefreshLeft /></el-icon>
          生成新文档
        </el-button>
      </div>
    </div>

    <!-- 分享对话框 -->
    <el-dialog v-model="showShareDialog" title="分享文档" width="500px">
      <div class="share-content">
        <el-form label-position="top">
          <el-form-item label="分享链接">
            <el-input v-model="shareLink" readonly>
              <template #append>
                <el-button :icon="CopyDocument" @click="copyLink">复制</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="有效期">
            <el-radio-group v-model="shareExpiry">
              <el-radio-button label="1d">1天</el-radio-button>
              <el-radio-button label="7d">7天</el-radio-button>
              <el-radio-button label="30d">30天</el-radio-button>
              <el-radio-button label="never">永久</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="访问密码（可选）">
            <el-input v-model="sharePassword" placeholder="设置访问密码..." show-password />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmShare">生成分享链接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document,
  DocumentCopy,
  Setting,
  View,
  Download,
  Filter,
  Search,
  ArrowRight,
  ArrowLeft,
  InfoFilled,
  Monitor,
  Cellphone,
  FullScreen,
  PieChart,
  Loading,
  Share,
  Refresh,
  RefreshLeft,
  CopyDocument,
  List,
  Files,
  DocumentChecked,
  TrendCharts,
  EditPen,
  OfficeBuilding,
  FirstAidKit,
  Collection
} from '@element-plus/icons-vue'

const router = useRouter()

// 当前步骤
const currentStep = ref(0)

// 模板筛选
const templateFilters = reactive({
  type: '',
  region: '',
  language: '',
  keyword: ''
})

// 选中的模板
const selectedTemplate = ref<any>(null)

// 数据源配置
const dataConfig = reactive({
  productId: null as string | null,
  enterpriseId: null as string | null,
  regulationIds: [] as string[],
  title: '',
  reportDate: new Date().toISOString().split('T')[0],
  reportNumber: '',
  author: '',
  reviewer: '',
  remarks: '',
  includeCharts: true,
  includeAppendix: false,
  watermark: '',
  header: '',
  footer: ''
})

// 预览模式
const previewMode = ref('desktop')

// 生成状态
const generateStatus = ref<'loading' | 'success' | 'error'>('loading')
const generateProgress = ref(0)
const generatedDocument = ref<any>(null)

// 分享相关
const showShareDialog = ref(false)
const shareLink = ref('')
const shareExpiry = ref('7d')
const sharePassword = ref('')

// 加载状态
const productLoading = ref(false)
const enterpriseLoading = ref(false)
const regulationLoading = ref(false)

// 选项数据
const productOptions = ref<any[]>([])
const enterpriseOptions = ref<any[]>([])
const regulationOptions = ref<any[]>([])

// 模板列表
const templates = ref([
  {
    id: '1',
    name: 'PPE产品合规报告',
    description: '全面的产品合规性评估报告，包含认证状态、法规符合性分析',
    type: 'compliance-report',
    region: 'CN',
    language: 'zh',
    format: 'pdf',
    downloadCount: 1256,
    estimatedPages: 8,
    requiresProduct: true,
    requiresEnterprise: false,
    requiresRegulation: true,
    fields: ['产品信息', '认证列表', '法规符合性', '风险评估']
  },
  {
    id: '2',
    name: '欧盟CE认证证书',
    description: '符合欧盟PPE法规(EU)2016/425的CE认证证书模板',
    type: 'product-certificate',
    region: 'EU',
    language: 'en',
    format: 'pdf',
    downloadCount: 892,
    estimatedPages: 2,
    requiresProduct: true,
    requiresEnterprise: true,
    requiresRegulation: false,
    fields: ['产品信息', '制造商信息', '认证机构', '技术标准']
  },
  {
    id: '3',
    name: '企业资质证明',
    description: '企业PPE生产资质和认证汇总证明文档',
    type: 'enterprise-qualification',
    region: 'CN',
    language: 'zh',
    format: 'pdf',
    downloadCount: 756,
    estimatedPages: 4,
    requiresProduct: false,
    requiresEnterprise: true,
    requiresRegulation: false,
    fields: ['企业信息', '资质证书', '产品范围', '生产能力']
  },
  {
    id: '4',
    name: '法规对比分析报告',
    description: '多国PPE法规标准对比分析，助力出口合规',
    type: 'comparison-analysis',
    region: 'INT',
    language: 'bilingual',
    format: 'docx',
    downloadCount: 623,
    estimatedPages: 15,
    requiresProduct: true,
    requiresEnterprise: false,
    requiresRegulation: true,
    fields: ['法规列表', '对比表格', '差异分析', '合规建议']
  },
  {
    id: '5',
    name: 'FDA 510(k)摘要',
    description: '美国FDA医疗器械510(k)申请摘要文档',
    type: 'regulation-summary',
    region: 'US',
    language: 'en',
    format: 'pdf',
    downloadCount: 445,
    estimatedPages: 6,
    requiresProduct: true,
    requiresEnterprise: true,
    requiresRegulation: false,
    fields: ['产品描述', '实质等同', '性能测试', '标签信息']
  },
  {
    id: '6',
    name: '认证申请表',
    description: 'PPE产品认证申请表格，支持多机构申请',
    type: 'certification-application',
    region: 'CN',
    language: 'zh',
    format: 'docx',
    downloadCount: 1123,
    estimatedPages: 3,
    requiresProduct: true,
    requiresEnterprise: true,
    requiresRegulation: false,
    fields: ['申请信息', '产品资料', '技术文档', '联系方式']
  },
  {
    id: '7',
    name: '年度合规审查报告',
    description: '企业年度PPE产品合规性审查综合报告',
    type: 'compliance-report',
    region: 'CN',
    language: 'zh',
    format: 'pdf',
    downloadCount: 334,
    estimatedPages: 20,
    requiresProduct: false,
    requiresEnterprise: true,
    requiresRegulation: true,
    fields: ['审查概述', '产品清单', '认证状态', '改进建议']
  },
  {
    id: '8',
    name: '产品技术文档',
    description: '欧盟PPE技术文档(Technical Documentation)模板',
    type: 'product-certificate',
    region: 'EU',
    language: 'en',
    format: 'docx',
    downloadCount: 567,
    estimatedPages: 25,
    requiresProduct: true,
    requiresEnterprise: true,
    requiresRegulation: true,
    fields: ['产品规格', '设计图纸', '测试报告', '质量控制']
  }
])

// 过滤后的模板
const filteredTemplates = computed(() => {
  return templates.value.filter(template => {
    if (templateFilters.type && template.type !== templateFilters.type) return false
    if (templateFilters.region && template.region !== templateFilters.region) return false
    if (templateFilters.language && template.language !== templateFilters.language) return false
    if (templateFilters.keyword && !template.name.includes(templateFilters.keyword)) return false
    return true
  })
})

// 当前时间
const currentTime = computed(() => {
  return new Date().toLocaleString('zh-CN')
})

// 获取模板图标
const getTemplateIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'compliance-report': TrendCharts,
    'product-certificate': DocumentChecked,
    'enterprise-qualification': OfficeBuilding,
    'regulation-summary': Files,
    'comparison-analysis': PieChart,
    'certification-application': EditPen
  }
  return iconMap[type] || Document
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'compliance-report': '合规报告',
    'product-certificate': '产品证书',
    'enterprise-qualification': '企业资质',
    'regulation-summary': '法规摘要',
    'comparison-analysis': '对比分析',
    'certification-application': '认证申请'
  }
  return typeMap[type] || type
}

// 选择模板
const selectTemplate = (template: any) => {
  selectedTemplate.value = template
}

// 搜索产品
const searchProducts = (query: string) => {
  productLoading.value = true
  // 模拟API调用
  setTimeout(() => {
    productOptions.value = [
      { value: '1', label: 'N95医用防护口罩 - 3M' },
      { value: '2', label: '医用一次性防护服 - 稳健医疗' },
      { value: '3', label: '防护眼镜 - Honeywell' },
      { value: '4', label: '防化手套 - Ansell' },
      { value: '5', label: '正压式呼吸器 - Dräger' }
    ].filter(item => item.label.includes(query) || !query)
    productLoading.value = false
  }, 300)
}

// 搜索企业
const searchEnterprises = (query: string) => {
  enterpriseLoading.value = true
  setTimeout(() => {
    enterpriseOptions.value = [
      { value: '1', label: '3M中国有限公司' },
      { value: '2', label: '稳健医疗用品股份有限公司' },
      { value: '3', label: '霍尼韦尔安全防护设备(上海)有限公司' },
      { value: '4', label: '安思尔(上海)商贸有限公司' },
      { value: '5', label: '德尔格安全设备(中国)有限公司' }
    ].filter(item => item.label.includes(query) || !query)
    enterpriseLoading.value = false
  }, 300)
}

// 搜索法规
const searchRegulations = (query: string) => {
  regulationLoading.value = true
  setTimeout(() => {
    regulationOptions.value = [
      { value: '1', label: 'GB 19083-2010 医用防护口罩技术要求' },
      { value: '2', label: 'GB 19082-2009 医用一次性防护服技术要求' },
      { value: '3', label: 'EU 2016/425 PPE法规' },
      { value: '4', label: 'FDA 21 CFR 878.4040 手术口罩' },
      { value: '5', label: 'EN 149:2001+A1:2009 呼吸防护装置' }
    ].filter(item => item.label.includes(query) || !query)
    regulationLoading.value = false
  }, 300)
}

// 下一步
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
    if (currentStep.value === 3) {
      generateDocument()
    }
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 全屏预览
const fullscreenPreview = () => {
  ElMessage.info('全屏预览功能开发中')
}

// 生成文档
const generateDocument = () => {
  generateStatus.value = 'loading'
  generateProgress.value = 0

  // 模拟生成进度
  const interval = setInterval(() => {
    generateProgress.value += Math.random() * 20
    if (generateProgress.value >= 100) {
      generateProgress.value = 100
      clearInterval(interval)
      
      // 模拟生成成功
      setTimeout(() => {
        generateStatus.value = 'success'
        generatedDocument.value = {
          name: `${dataConfig.title || '未命名文档'}.${selectedTemplate.value?.format || 'pdf'}`,
          format: selectedTemplate.value?.format || 'pdf',
          size: '2.4 MB',
          generatedAt: new Date().toLocaleString('zh-CN'),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
          downloadCount: 0
        }
      }, 500)
    }
  }, 300)
}

// 下载文档
const downloadDocument = () => {
  ElMessage.success('开始下载文档')
  // 模拟下载
  const link = document.createElement('a')
  link.href = '#'
  link.download = generatedDocument.value?.name || 'document.pdf'
  // link.click()
}

// 分享文档
const shareDocument = () => {
  shareLink.value = `https://mdlooker.com/share/doc/${Date.now()}`
  showShareDialog.value = true
}

// 复制链接
const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('链接已复制到剪贴板')
}

// 确认分享
const confirmShare = () => {
  ElMessage.success('分享链接已生成')
  showShareDialog.value = false
}

// 重试生成
const retryGenerate = () => {
  generateDocument()
}

// 重置表单
const resetForm = () => {
  currentStep.value = 0
  selectedTemplate.value = null
  generateStatus.value = 'loading'
  generateProgress.value = 0
  generatedDocument.value = null
  
  // 重置配置
  dataConfig.productId = null
  dataConfig.enterpriseId = null
  dataConfig.regulationIds = []
  dataConfig.title = ''
  dataConfig.reportNumber = ''
  dataConfig.author = ''
  dataConfig.reviewer = ''
  dataConfig.remarks = ''
}

// 跳转到文件管理
const goToManage = () => {
  router.push('/document/manage')
}

onMounted(() => {
  // 初始化数据
  searchProducts('')
  searchEnterprises('')
  searchRegulations('')
})
</script>

<style scoped lang="scss">
.document-generate-page {
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
  }

  .steps-card {
    margin-bottom: 24px;
  }

  .step-content {
    .template-filter {
      margin-bottom: 24px;

      .filter-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
    }

    .template-grid {
      margin-bottom: 24px;

      .template-card {
        cursor: pointer;
        transition: all 0.3s;
        height: 100%;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border: 2px solid #339999;
          background-color: #f0f9f9;
        }

        .template-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
          color: #339999;
        }

        .template-name {
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 8px;
          color: #303133;
        }

        .template-desc {
          font-size: 13px;
          color: #606266;
          text-align: center;
          margin-bottom: 12px;
          line-height: 1.5;
          min-height: 40px;
        }

        .template-tags {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 12px;
        }

        .template-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #909399;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }

    .config-card {
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
    }

    .preview-card {
      .card-header {
        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
      }

      .template-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ebeef5;

          &:last-child {
            border-bottom: none;
          }

          .info-label {
            color: #606266;
            font-size: 13px;
          }

          .info-value {
            color: #303133;
            font-weight: 500;
            font-size: 13px;
          }
        }
      }

      .template-fields {
        h5 {
          margin-bottom: 12px;
          color: #303133;
        }

        .field-tag {
          margin: 4px;
        }
      }
    }

    .preview-document {
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

        .header-actions {
          display: flex;
          gap: 12px;
        }
      }

      .document-preview {
        background-color: #f5f7fa;
        padding: 40px;
        min-height: 600px;

        &.mobile {
          max-width: 375px;
          margin: 0 auto;
        }

        .document-page {
          background: white;
          padding: 60px;
          min-height: 800px;
          position: relative;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

          .document-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #339999;

            .doc-logo {
              font-size: 24px;
              font-weight: 700;
              color: #339999;
              margin-bottom: 16px;
            }

            .doc-title {
              font-size: 28px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 12px;
            }

            .doc-meta {
              display: flex;
              justify-content: center;
              gap: 24px;
              color: #606266;
              font-size: 13px;
            }
          }

          .document-content {
            .content-section {
              margin-bottom: 32px;

              h3 {
                font-size: 18px;
                font-weight: 600;
                color: #303133;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid #ebeef5;
              }

              p {
                color: #606266;
                line-height: 1.8;
                margin-bottom: 12px;
              }

              ul {
                padding-left: 20px;
                color: #606266;
                line-height: 1.8;
              }

              .chart-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                background: #f5f7fa;
                border-radius: 8px;
                color: #909399;

                .el-icon {
                  font-size: 48px;
                  margin-bottom: 8px;
                }
              }
            }
          }

          .document-footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ebeef5;
            text-align: center;
            color: #909399;
            font-size: 12px;

            .page-number {
              margin-top: 8px;
            }
          }

          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(0, 0, 0, 0.05);
            pointer-events: none;
            white-space: nowrap;
          }
        }
      }
    }

    .generate-result {
      .result-content {
        padding: 40px;

        .success-actions,
        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .loading-info {
          max-width: 400px;
          margin: 0 auto;

          .loading-text {
            text-align: center;
            color: #606266;
            margin-top: 16px;
          }
        }

        .document-info {
          max-width: 600px;
          margin: 24px auto 0;
        }
      }
    }
  }

  .step-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #ebeef5;
  }
}

.share-content {
  padding: 20px 0;
}
</style>
