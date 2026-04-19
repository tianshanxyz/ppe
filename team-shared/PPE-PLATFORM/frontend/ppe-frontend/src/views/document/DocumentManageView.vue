<template>
  <div class="document-manage-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">文件管理</h1>
        <p class="page-description">管理已生成的文档，支持下载、分享、归档等操作</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="goToGenerate">
          生成新文档
        </el-button>
        <el-button :icon="Upload" @click="showUploadDialog = true">
          上传文件
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">文件总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon><FolderChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.thisMonth }}</div>
              <div class="stat-label">本月生成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon><Download /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.downloads }}</div>
              <div class="stat-label">总下载次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon purple">
              <el-icon><Share /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.shared }}</div>
              <div class="stat-label">已分享</div>
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
          <el-form-item label="搜索">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索文件名..."
              clearable
              :prefix-icon="Search"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="文件类型">
            <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 100%">
              <el-option label="PDF" value="pdf" />
              <el-option label="Word" value="docx" />
              <el-option label="Excel" value="xlsx" />
              <el-option label="图片" value="image" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="文档类别">
            <el-select v-model="filters.category" placeholder="选择类别" clearable style="width: 100%">
              <el-option label="合规报告" value="compliance-report" />
              <el-option label="产品证书" value="product-certificate" />
              <el-option label="企业资质" value="enterprise-qualification" />
              <el-option label="法规摘要" value="regulation-summary" />
              <el-option label="对比分析" value="comparison-analysis" />
              <el-option label="认证申请" value="certification-application" />
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

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 100%">
              <el-option label="正常" value="active">
                <el-tag type="success" size="small">正常</el-tag>
              </el-option>
              <el-option label="已归档" value="archived">
                <el-tag type="info" size="small">已归档</el-tag>
              </el-option>
              <el-option label="已过期" value="expired">
                <el-tag type="danger" size="small">已过期</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-form-item label="排序">
            <el-select v-model="filters.sortBy" style="width: 100%">
              <el-option label="最近生成" value="newest" />
              <el-option label="最早生成" value="oldest" />
              <el-option label="文件名 A-Z" value="name-asc" />
              <el-option label="文件名 Z-A" value="name-desc" />
              <el-option label="下载最多" value="downloads" />
              <el-option label="文件大小" value="size" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- 文件列表 -->
    <el-card class="document-list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <div class="header-left">
            <span class="list-title">
              <el-icon><Folder /></el-icon>
              文件列表
            </span>
            <el-tag v-if="selectedDocuments.length > 0" type="primary" effect="light">
              已选择 {{ selectedDocuments.length }} 项
            </el-tag>
          </div>
          <div class="header-right">
            <el-button-group v-if="selectedDocuments.length > 0">
              <el-button size="small" :icon="Download" @click="batchDownload">
                批量下载
              </el-button>
              <el-button size="small" :icon="Share" @click="batchShare">
                批量分享
              </el-button>
              <el-button size="small" :icon="FolderAdd" @click="batchArchive">
                归档
              </el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="batchDelete">
                删除
              </el-button>
            </el-button-group>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
              <el-radio-button label="grid">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 列表视图 -->
      <div v-else-if="filteredDocuments.length > 0 && viewMode === 'list'">
        <el-table
          :data="filteredDocuments"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="文件名" min-width="250">
            <template #default="{ row }">
              <div class="file-info">
                <div class="file-icon" :class="getFileIconClass(row.type)">
                  <el-icon :size="24">
                    <component :is="getFileIcon(row.type)" />
                  </el-icon>
                </div>
                <div class="file-details">
                  <div class="file-name">{{ row.name }}</div>
                  <div class="file-meta">
                    <el-tag size="small" effect="plain">{{ getCategoryLabel(row.category) }}</el-tag>
                    <span class="file-size">{{ row.size }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生成时间" width="150">
            <template #default="{ row }">
              {{ row.createdAt }}
            </template>
          </el-table-column>
          <el-table-column label="下载次数" width="100" align="center">
            <template #default="{ row }">
              {{ row.downloadCount }}
            </template>
          </el-table-column>
          <el-table-column label="有效期至" width="120">
            <template #default="{ row }">
              <span :class="{ 'text-danger': isExpiringSoon(row.expiresAt) }">
                {{ row.expiresAt }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" :icon="View" @click="previewDocument(row)" />
                <el-button size="small" :icon="Download" @click="downloadDocument(row)" />
                <el-button size="small" :icon="Share" @click="shareDocument(row)" />
                <el-dropdown trigger="click">
                  <el-button size="small">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :icon="Edit" @click="renameDocument(row)">
                        重命名
                      </el-dropdown-item>
                      <el-dropdown-item :icon="FolderAdd" @click="archiveDocument(row)">
                        归档
                      </el-dropdown-item>
                      <el-dropdown-item :icon="CopyDocument" @click="duplicateDocument(row)">
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item divided :icon="Delete" @click="deleteDocument(row)">
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="filteredDocuments.length > 0 && viewMode === 'grid'" class="document-grid">
        <el-checkbox-group v-model="selectedDocuments">
          <el-row :gutter="20">
            <el-col
              v-for="doc in filteredDocuments"
              :key="doc.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
              :xl="4"
            >
              <el-card class="document-card" shadow="hover" :class="{ selected: selectedDocuments.includes(doc.id) }">
                <div class="card-header-row">
                  <el-checkbox :label="doc.id">{{ '' }}</el-checkbox>
                  <el-dropdown trigger="click">
                    <el-button link size="small">
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :icon="View" @click="previewDocument(doc)">预览</el-dropdown-item>
                        <el-dropdown-item :icon="Download" @click="downloadDocument(doc)">下载</el-dropdown-item>
                        <el-dropdown-item :icon="Share" @click="shareDocument(doc)">分享</el-dropdown-item>
                        <el-dropdown-item divided :icon="Edit" @click="renameDocument(doc)">重命名</el-dropdown-item>
                        <el-dropdown-item :icon="FolderAdd" @click="archiveDocument(doc)">归档</el-dropdown-item>
                        <el-dropdown-item :icon="Delete" @click="deleteDocument(doc)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="card-content" @click="previewDocument(doc)">
                  <div class="file-icon-large" :class="getFileIconClass(doc.type)">
                    <el-icon :size="48">
                      <component :is="getFileIcon(doc.type)" />
                    </el-icon>
                  </div>
                  <div class="file-name" :title="doc.name">{{ doc.name }}</div>
                  <div class="file-category">
                    <el-tag size="small" effect="plain">{{ getCategoryLabel(doc.category) }}</el-tag>
                  </div>
                  <div class="file-meta">
                    <span>{{ doc.size }}</span>
                    <el-tag :type="getStatusType(doc.status)" size="small">
                      {{ getStatusLabel(doc.status) }}
                    </el-tag>
                  </div>
                </div>
                <div class="card-footer">
                  <span class="file-date">{{ doc.createdAt }}</span>
                  <div class="file-actions">
                    <el-button link size="small" :icon="Download" @click.stop="downloadDocument(doc)" />
                    <el-button link size="small" :icon="Share" @click.stop="shareDocument(doc)" />
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="暂无文件"
        :image-size="200"
      >
        <template #description>
          <div class="empty-content">
            <p>没有找到符合条件的文件</p>
            <p class="empty-suggestion">您可以生成新文档或上传现有文件</p>
          </div>
        </template>
        <el-button type="primary" :icon="Plus" @click="goToGenerate">
          生成新文档
        </el-button>
      </el-empty>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传文件" width="600px">
      <el-upload
        drag
        action="/api/upload"
        multiple
        :file-list="uploadFileList"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
      >
        <el-icon class="el-icon--upload" :size="64"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF、Word、Excel、图片等格式，单个文件不超过 50MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showUploadDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="showRenameDialog" title="重命名文件" width="400px">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="新文件名">
          <el-input v-model="renameForm.name" placeholder="输入新文件名..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分享对话框 -->
    <el-dialog v-model="showShareDialog" title="分享文档" width="500px">
      <div class="share-content">
        <el-form label-position="top">
          <el-form-item label="分享链接">
            <el-input v-model="shareForm.link" readonly>
              <template #append>
                <el-button :icon="CopyDocument" @click="copyShareLink">复制</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="有效期">
            <el-radio-group v-model="shareForm.expiry">
              <el-radio-button label="1d">1天</el-radio-button>
              <el-radio-button label="7d">7天</el-radio-button>
              <el-radio-button label="30d">30天</el-radio-button>
              <el-radio-button label="never">永久</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="访问密码（可选）">
            <el-input v-model="shareForm.password" placeholder="设置访问密码..." show-password />
          </el-form-item>
          <el-form-item label="权限设置">
            <el-checkbox-group v-model="shareForm.permissions">
              <el-checkbox label="download">允许下载</el-checkbox>
              <el-checkbox label="print">允许打印</el-checkbox>
              <el-checkbox label="copy">允许复制内容</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmShare">生成分享链接</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="文档预览" width="900px" class="preview-dialog">
      <div class="preview-container">
        <div v-if="previewDocumentData" class="preview-content">
          <div class="preview-header">
            <h3>{{ previewDocumentData.name }}</h3>
            <div class="preview-meta">
              <el-tag size="small">{{ getCategoryLabel(previewDocumentData.category) }}</el-tag>
              <span>{{ previewDocumentData.size }}</span>
              <span>生成于 {{ previewDocumentData.createdAt }}</span>
            </div>
          </div>
          <div class="preview-body">
            <div v-if="previewDocumentData.type === 'pdf'" class="pdf-preview">
              <div class="pdf-placeholder">
                <el-icon :size="64"><Document /></el-icon>
                <p>PDF 预览区域</p>
                <p class="placeholder-hint">实际环境中将显示 PDF 内容</p>
              </div>
            </div>
            <div v-else-if="['jpg', 'jpeg', 'png', 'gif'].includes(previewDocumentData.type)" class="image-preview">
              <div class="image-placeholder">
                <el-icon :size="64"><Picture /></el-icon>
                <p>图片预览区域</p>
              </div>
            </div>
            <div v-else class="other-preview">
              <el-result icon="info" title="该文件类型暂不支持预览">
                <template #sub-title>
                  请下载后查看
                </template>
                <template #extra>
                  <el-button type="primary" :icon="Download" @click="downloadDocument(previewDocumentData)">
                    下载文件
                  </el-button>
                </template>
              </el-result>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  FolderChecked,
  Download,
  Share,
  Plus,
  Upload,
  Filter,
  Search,
  Refresh,
  Folder,
  List,
  Grid,
  View,
  More,
  Edit,
  FolderAdd,
  CopyDocument,
  Delete,
  UploadFilled,
  Picture,
  DocumentChecked,
  DocumentCopy,
  TrendCharts,
  EditPen,
  OfficeBuilding,
  Files
} from '@element-plus/icons-vue'

const router = useRouter()

// 统计数据
const stats = reactive({
  total: 156,
  thisMonth: 23,
  downloads: 1289,
  shared: 45
})

// 筛选条件
const filters = reactive({
  keyword: '',
  type: '',
  category: '',
  dateRange: null as any,
  status: '',
  sortBy: 'newest'
})

// 视图模式
const viewMode = ref('list')

// 加载状态
const loading = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 选中的文档
const selectedDocuments = ref<string[]>([])

// 对话框显示状态
const showUploadDialog = ref(false)
const showRenameDialog = ref(false)
const showShareDialog = ref(false)
const showPreviewDialog = ref(false)

// 上传文件列表
const uploadFileList = ref<any[]>([])

// 重命名表单
const renameForm = reactive({
  id: '',
  name: ''
})

// 分享表单
const shareForm = reactive({
  link: '',
  expiry: '7d',
  password: '',
  permissions: ['download']
})

// 预览的文档
const previewDocumentData = ref<any>(null)

// 文档列表
const documents = ref([
  {
    id: '1',
    name: 'N95口罩合规性评估报告.pdf',
    type: 'pdf',
    category: 'compliance-report',
    size: '2.4 MB',
    status: 'active',
    createdAt: '2026-04-18',
    downloadCount: 15,
    expiresAt: '2026-07-18'
  },
  {
    id: '2',
    name: '3M企业资质证明文件.pdf',
    type: 'pdf',
    category: 'enterprise-qualification',
    size: '1.8 MB',
    status: 'active',
    createdAt: '2026-04-17',
    downloadCount: 8,
    expiresAt: '2026-10-17'
  },
  {
    id: '3',
    name: '防护服欧盟CE认证证书.pdf',
    type: 'pdf',
    category: 'product-certificate',
    size: '856 KB',
    status: 'active',
    createdAt: '2026-04-16',
    downloadCount: 23,
    expiresAt: '2027-04-16'
  },
  {
    id: '4',
    name: '中美欧PPE法规对比分析.docx',
    type: 'docx',
    category: 'comparison-analysis',
    size: '3.2 MB',
    status: 'active',
    createdAt: '2026-04-15',
    downloadCount: 42,
    expiresAt: '2026-10-15'
  },
  {
    id: '5',
    name: '医用口罩FDA 510(k)摘要.pdf',
    type: 'pdf',
    category: 'regulation-summary',
    size: '1.2 MB',
    status: 'archived',
    createdAt: '2026-04-14',
    downloadCount: 6,
    expiresAt: '2026-07-14'
  },
  {
    id: '6',
    name: '2026年度合规审查报告.pdf',
    type: 'pdf',
    category: 'compliance-report',
    size: '5.6 MB',
    status: 'active',
    createdAt: '2026-04-13',
    downloadCount: 31,
    expiresAt: '2027-04-13'
  },
  {
    id: '7',
    name: '防护眼镜技术文档.docx',
    type: 'docx',
    category: 'product-certificate',
    size: '4.1 MB',
    status: 'active',
    createdAt: '2026-04-12',
    downloadCount: 12,
    expiresAt: '2026-10-12'
  },
  {
    id: '8',
    name: '呼吸器认证申请表.docx',
    type: 'docx',
    category: 'certification-application',
    size: '890 KB',
    status: 'expired',
    createdAt: '2026-03-20',
    downloadCount: 5,
    expiresAt: '2026-04-20'
  },
  {
    id: '9',
    name: '手套产品测试数据.xlsx',
    type: 'xlsx',
    category: 'compliance-report',
    size: '1.5 MB',
    status: 'active',
    createdAt: '2026-04-10',
    downloadCount: 18,
    expiresAt: '2026-10-10'
  },
  {
    id: '10',
    name: '企业生产能力评估报告.pdf',
    type: 'pdf',
    category: 'enterprise-qualification',
    size: '2.8 MB',
    status: 'active',
    createdAt: '2026-04-09',
    downloadCount: 9,
    expiresAt: '2026-10-09'
  },
  {
    id: '11',
    name: '面罩产品合规证书.pdf',
    type: 'pdf',
    category: 'product-certificate',
    size: '1.1 MB',
    status: 'active',
    createdAt: '2026-04-08',
    downloadCount: 14,
    expiresAt: '2027-04-08'
  },
  {
    id: '12',
    name: '防护用品出口指南.pdf',
    type: 'pdf',
    category: 'regulation-summary',
    size: '6.2 MB',
    status: 'active',
    createdAt: '2026-04-07',
    downloadCount: 67,
    expiresAt: '2026-10-07'
  }
])

// 过滤后的文档
const filteredDocuments = computed(() => {
  let result = documents.value

  // 关键词搜索
  if (filters.keyword) {
    result = result.filter(doc => doc.name.toLowerCase().includes(filters.keyword.toLowerCase()))
  }

  // 文件类型筛选
  if (filters.type) {
    result = result.filter(doc => doc.type === filters.type)
  }

  // 类别筛选
  if (filters.category) {
    result = result.filter(doc => doc.category === filters.category)
  }

  // 状态筛选
  if (filters.status) {
    result = result.filter(doc => doc.status === filters.status)
  }

  // 日期范围筛选
  if (filters.dateRange && filters.dateRange.length === 2) {
    result = result.filter(doc => {
      const docDate = new Date(doc.createdAt)
      return docDate >= new Date(filters.dateRange[0]) && docDate <= new Date(filters.dateRange[1])
    })
  }

  // 排序
  switch (filters.sortBy) {
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'oldest':
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      break
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'name-desc':
      result.sort((a, b) => b.name.localeCompare(a.name))
      break
    case 'downloads':
      result.sort((a, b) => b.downloadCount - a.downloadCount)
      break
  }

  total.value = result.length
  return result
})

// 获取文件图标
const getFileIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'pdf': DocumentChecked,
    'docx': DocumentCopy,
    'xlsx': TrendCharts,
    'image': Picture
  }
  return iconMap[type] || Document
}

// 获取文件图标样式类
const getFileIconClass = (type: string) => {
  const classMap: Record<string, string> = {
    'pdf': 'pdf',
    'docx': 'word',
    'xlsx': 'excel',
    'image': 'image'
  }
  return classMap[type] || 'other'
}

// 获取类别标签
const getCategoryLabel = (category: string) => {
  const labelMap: Record<string, string> = {
    'compliance-report': '合规报告',
    'product-certificate': '产品证书',
    'enterprise-qualification': '企业资质',
    'regulation-summary': '法规摘要',
    'comparison-analysis': '对比分析',
    'certification-application': '认证申请'
  }
  return labelMap[category] || category
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    'active': 'success',
    'archived': 'info',
    'expired': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    'active': '正常',
    'archived': '已归档',
    'expired': '已过期'
  }
  return labelMap[status] || status
}

// 判断是否即将过期
const isExpiringSoon = (expiresAt: string) => {
  const expiry = new Date(expiresAt)
  const now = new Date()
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7 && diffDays > 0
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedDocuments.value = selection.map(item => item.id)
}

// 清除筛选
const clearFilters = () => {
  filters.keyword = ''
  filters.type = ''
  filters.category = ''
  filters.dateRange = null
  filters.status = ''
  filters.sortBy = 'newest'
}

// 跳转到生成页面
const goToGenerate = () => {
  router.push('/document')
}

// 预览文档
const previewDocument = (doc: any) => {
  previewDocumentData.value = doc
  showPreviewDialog.value = true
}

// 下载文档
const downloadDocument = (doc: any) => {
  ElMessage.success(`开始下载: ${doc.name}`)
  // 模拟下载
  doc.downloadCount++
}

// 分享文档
const shareDocument = (doc: any) => {
  shareForm.link = `https://mdlooker.com/share/doc/${doc.id}`
  shareForm.expiry = '7d'
  shareForm.password = ''
  shareForm.permissions = ['download']
  showShareDialog.value = true
}

// 复制分享链接
const copyShareLink = () => {
  navigator.clipboard.writeText(shareForm.link)
  ElMessage.success('链接已复制到剪贴板')
}

// 确认分享
const confirmShare = () => {
  ElMessage.success('分享链接已生成')
  showShareDialog.value = false
  stats.shared++
}

// 重命名文档
const renameDocument = (doc: any) => {
  renameForm.id = doc.id
  renameForm.name = doc.name
  showRenameDialog.value = true
}

// 确认重命名
const confirmRename = () => {
  const doc = documents.value.find(d => d.id === renameForm.id)
  if (doc) {
    doc.name = renameForm.name
    ElMessage.success('重命名成功')
  }
  showRenameDialog.value = false
}

// 归档文档
const archiveDocument = (doc: any) => {
  doc.status = 'archived'
  ElMessage.success('文档已归档')
}

// 复制文档
const duplicateDocument = (doc: any) => {
  const newDoc = { ...doc, id: Date.now().toString(), name: `${doc.name} (副本)`, createdAt: new Date().toISOString().split('T')[0] }
  documents.value.unshift(newDoc)
  ElMessage.success('文档已复制')
}

// 删除文档
const deleteDocument = (doc: any) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${doc.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = documents.value.findIndex(d => d.id === doc.id)
    if (index > -1) {
      documents.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 批量下载
const batchDownload = () => {
  ElMessage.success(`开始批量下载 ${selectedDocuments.value.length} 个文件`)
  selectedDocuments.value = []
}

// 批量分享
const batchShare = () => {
  ElMessage.success(`已生成 ${selectedDocuments.value.length} 个文件的分享链接`)
  selectedDocuments.value = []
  stats.shared += selectedDocuments.value.length
}

// 批量归档
const batchArchive = () => {
  selectedDocuments.value.forEach(id => {
    const doc = documents.value.find(d => d.id === id)
    if (doc) doc.status = 'archived'
  })
  ElMessage.success(`已归档 ${selectedDocuments.value.length} 个文件`)
  selectedDocuments.value = []
}

// 批量删除
const batchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedDocuments.value.length} 个文件吗？`,
    '批量删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    documents.value = documents.value.filter(d => !selectedDocuments.value.includes(d.id))
    ElMessage.success(`已删除 ${selectedDocuments.value.length} 个文件`)
    selectedDocuments.value = []
  })
}

// 上传相关
const beforeUpload = (file: File) => {
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB')
  }
  return isLt50M
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success(`${file.name} 上传成功`)
  // 添加到文档列表
  const newDoc = {
    id: Date.now().toString(),
    name: file.name,
    type: (file.name.split('.').pop() || 'other') as string,
    category: 'other',
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0] as string,
    downloadCount: 0,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string
  }
  documents.value.unshift(newDoc)
  stats.total++
  stats.thisMonth++
}

const handleUploadError = (error: any, file: any) => {
  ElMessage.error(`${file.name} 上传失败`)
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handlePageChange = (val: number) => {
  currentPage.value = val
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style scoped lang="scss">
.document-manage-page {
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

  .stats-row {
    margin-bottom: 24px;

    .stat-card {
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
            background: #ecf5ff;
            color: #409eff;
          }

          &.green {
            background: #f0f9eb;
            color: #67c23a;
          }

          &.orange {
            background: #fdf6ec;
            color: #e6a23c;
          }

          &.purple {
            background: #f5f0ff;
            color: #9254de;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1;
          }

          .stat-label {
            font-size: 13px;
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

  .document-list-card {
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
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .loading-container {
      padding: 40px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .file-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.pdf {
          background: #fff1f0;
          color: #ff4d4f;
        }

        &.word {
          background: #e6f7ff;
          color: #1890ff;
        }

        &.excel {
          background: #f6ffed;
          color: #52c41a;
        }

        &.image {
          background: #f9f0ff;
          color: #722ed1;
        }

        &.other {
          background: #f5f5f5;
          color: #8c8c8c;
        }
      }

      .file-details {
        .file-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .file-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .document-grid {
      .document-card {
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border: 2px solid #339999;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-content {
          text-align: center;
          padding: 16px 0;

          .file-icon-large {
            width: 80px;
            height: 80px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;

            &.pdf {
              background: #fff1f0;
              color: #ff4d4f;
            }

            &.word {
              background: #e6f7ff;
              color: #1890ff;
            }

            &.excel {
              background: #f6ffed;
              color: #52c41a;
            }

            &.image {
              background: #f9f0ff;
              color: #722ed1;
            }

            &.other {
              background: #f5f5f5;
              color: #8c8c8c;
            }
          }

          .file-name {
            font-weight: 500;
            color: #303133;
            margin-bottom: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .file-category {
            margin-bottom: 12px;
          }

          .file-meta {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: #909399;
          }
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #ebeef5;
          font-size: 12px;
          color: #909399;

          .file-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;
    }
  }
}

.share-content {
  padding: 20px 0;
}

.preview-dialog {
  .preview-container {
    .preview-content {
      .preview-header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #ebeef5;

        h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .preview-meta {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          color: #909399;
          font-size: 13px;
        }
      }

      .preview-body {
        min-height: 400px;
        background: #f5f7fa;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        .pdf-placeholder,
        .image-placeholder {
          text-align: center;
          color: #909399;

          .placeholder-hint {
            font-size: 12px;
            margin-top: 8px;
          }
        }
      }
    }
  }
}

.text-danger {
  color: #f56c6c;
}

.empty-content {
  text-align: center;

  .empty-suggestion {
    color: #909399;
    font-size: 13px;
    margin-top: 8px;
  }
}
</style>
