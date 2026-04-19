<template>
  <div class="system-manage-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">系统管理</h1>
        <p class="page-description">管理系统用户、角色权限和系统配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showQuickActions">
          <el-icon><Plus /></el-icon>
          快捷操作
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" v-for="stat in systemStats" :key="stat.label">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
              <el-icon :size="24">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 管理标签页 -->
    <el-card class="manage-tabs-card" shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 用户管理 -->
        <el-tab-pane name="users">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              用户管理
            </span>
          </template>
          
          <div class="tab-content">
            <div class="toolbar">
              <el-input
                v-model="userSearchQuery"
                placeholder="搜索用户姓名、邮箱..."
                style="width: 300px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="userStatusFilter" placeholder="状态" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
              <el-select v-model="userRoleFilter" placeholder="角色" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="系统管理员" value="admin" />
                <el-option label="数据分析师" value="analyst" />
                <el-option label="合规专员" value="compliance" />
                <el-option label="普通用户" value="user" />
              </el-select>
              <el-button type="primary" @click="showAddUserDialog = true">
                <el-icon><Plus /></el-icon>
                添加用户
              </el-button>
            </div>

            <el-table :data="filteredUsers" v-loading="loading" stripe>
              <el-table-column type="selection" width="55" />
              <el-table-column label="用户信息" min-width="200">
                <template #default="{ row }">
                  <div class="user-info-cell">
                    <el-avatar :size="40" :src="row.avatar">
                      {{ row.name.charAt(0) }}
                    </el-avatar>
                    <div class="user-details">
                      <div class="user-name">{{ row.name }}</div>
                      <div class="user-email">{{ row.email }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="角色" width="150">
                <template #default="{ row }">
                  <el-tag :type="getRoleType(row.role)" size="small">
                    {{ getRoleLabel(row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="部门" prop="department" width="150" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    active-value="active"
                    inactive-value="inactive"
                    @change="handleUserStatusChange(row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="最后登录" prop="lastLogin" width="180" />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="editUser(row)">编辑</el-button>
                  <el-button link type="primary" @click="resetPassword(row)">重置密码</el-button>
                  <el-button link type="danger" @click="deleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="userPage"
                v-model:page-size="userPageSize"
                :total="userTotal"
                layout="total, sizes, prev, pager, next"
                :page-sizes="[10, 20, 50, 100]"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 角色权限 -->
        <el-tab-pane name="roles">
          <template #label>
            <span class="tab-label">
              <el-icon><Key /></el-icon>
              角色权限
            </span>
          </template>

          <div class="tab-content">
            <div class="toolbar">
              <el-input
                v-model="roleSearchQuery"
                placeholder="搜索角色名称..."
                style="width: 300px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="showAddRoleDialog = true">
                <el-icon><Plus /></el-icon>
                添加角色
              </el-button>
            </div>

            <el-row :gutter="16">
              <el-col :xs="24" :md="8" v-for="role in filteredRoles" :key="role.id">
                <el-card class="role-card" shadow="hover">
                  <div class="role-header">
                    <div class="role-icon" :style="{ background: role.color + '20', color: role.color }">
                      <el-icon :size="24">
                        <component :is="role.icon" />
                      </el-icon>
                    </div>
                    <div class="role-info">
                      <h4 class="role-name">{{ role.name }}</h4>
                      <p class="role-desc">{{ role.description }}</p>
                    </div>
                  </div>
                  <div class="role-stats">
                    <div class="stat-item">
                      <span class="stat-num">{{ role.userCount }}</span>
                      <span class="stat-text">用户</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-num">{{ role.permissionCount }}</span>
                      <span class="stat-text">权限</span>
                    </div>
                  </div>
                  <div class="role-actions">
                    <el-button type="primary" link @click="editRole(role)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                    <el-button type="primary" link @click="configPermissions(role)">
                      <el-icon><Setting /></el-icon>
                      权限
                    </el-button>
                    <el-button type="danger" link @click="deleteRole(role)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 系统设置 -->
        <el-tab-pane name="settings">
          <template #label>
            <span class="tab-label">
              <el-icon><Setting /></el-icon>
              系统设置
            </span>
          </template>

          <div class="tab-content">
            <el-form :model="systemSettings" label-width="180px" class="settings-form">
              <el-divider>基础设置</el-divider>
              
              <el-form-item label="系统名称">
                <el-input v-model="systemSettings.siteName" style="width: 400px" />
              </el-form-item>
              
              <el-form-item label="系统Logo">
                <el-upload
                  class="logo-uploader"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleLogoChange"
                >
                  <img v-if="systemSettings.logo" :src="systemSettings.logo" class="logo-preview" />
                  <div v-else class="logo-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传Logo</span>
                  </div>
                </el-upload>
              </el-form-item>

              <el-form-item label="默认语言">
                <el-radio-group v-model="systemSettings.language">
                  <el-radio-button label="zh">中文</el-radio-button>
                  <el-radio-button label="en">English</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-divider>安全设置</el-divider>

              <el-form-item label="登录失败锁定">
                <el-switch v-model="systemSettings.loginLockEnabled" />
                <span class="form-hint">连续5次登录失败后锁定账户30分钟</span>
              </el-form-item>

              <el-form-item label="密码复杂度要求">
                <el-checkbox-group v-model="systemSettings.passwordRules">
                  <el-checkbox label="length">至少8位</el-checkbox>
                  <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                  <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                  <el-checkbox label="number">包含数字</el-checkbox>
                  <el-checkbox label="special">包含特殊字符</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="会话超时时间">
                <el-slider v-model="systemSettings.sessionTimeout" :min="15" :max="480" :step="15" show-stops />
                <span class="form-hint">{{ systemSettings.sessionTimeout }} 分钟</span>
              </el-form-item>

              <el-divider>通知设置</el-divider>

              <el-form-item label="邮件通知">
                <el-switch v-model="systemSettings.emailNotification" />
              </el-form-item>

              <el-form-item label="短信通知">
                <el-switch v-model="systemSettings.smsNotification" />
              </el-form-item>

              <el-form-item label="系统公告">
                <el-input
                  v-model="systemSettings.announcement"
                  type="textarea"
                  :rows="3"
                  placeholder="输入系统公告内容..."
                  style="width: 400px"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveSettings">保存设置</el-button>
                <el-button @click="resetSettings">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane name="logs">
          <template #label>
            <span class="tab-label">
              <el-icon><Document /></el-icon>
              操作日志
            </span>
          </template>

          <div class="tab-content">
            <div class="toolbar">
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 260px"
              />
              <el-select v-model="logTypeFilter" placeholder="操作类型" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="登录" value="login" />
                <el-option label="创建" value="create" />
                <el-option label="修改" value="update" />
                <el-option label="删除" value="delete" />
                <el-option label="导出" value="export" />
              </el-select>
              <el-select v-model="logUserFilter" placeholder="操作用户" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option v-for="user in userList" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
              <el-button @click="exportLogs">
                <el-icon><Download /></el-icon>
                导出日志
              </el-button>
            </div>

            <el-timeline>
              <el-timeline-item
                v-for="log in filteredLogs"
                :key="log.id"
                :type="getLogType(log.type)"
                :timestamp="log.time"
                :icon="getLogIcon(log.type)"
              >
                <el-card class="log-card" shadow="hover">
                  <div class="log-header">
                    <div class="log-user">
                      <el-avatar :size="28" :src="log.userAvatar">
                        {{ log.userName.charAt(0) }}
                      </el-avatar>
                      <span class="user-name">{{ log.userName }}</span>
                    </div>
                    <el-tag :type="getLogType(log.type)" size="small">
                      {{ getLogTypeLabel(log.type) }}
                    </el-tag>
                  </div>
                  <div class="log-content">{{ log.content }}</div>
                  <div class="log-meta">
                    <span class="log-ip">IP: {{ log.ip }}</span>
                    <span class="log-browser">{{ log.browser }}</span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>

            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="logPage"
                v-model:page-size="logPageSize"
                :total="logTotal"
                layout="total, prev, pager, next"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 数据备份 -->
        <el-tab-pane name="backup">
          <template #label>
            <span class="tab-label">
              <el-icon><FolderOpened /></el-icon>
              数据备份
            </span>
          </template>

          <div class="tab-content">
            <el-row :gutter="24">
              <el-col :xs="24" :md="12">
                <el-card class="backup-card" shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>自动备份设置</span>
                      <el-switch v-model="backupSettings.autoBackup" />
                    </div>
                  </template>

                  <el-form :model="backupSettings" label-position="top" :disabled="!backupSettings.autoBackup">
                    <el-form-item label="备份频率">
                      <el-radio-group v-model="backupSettings.frequency">
                        <el-radio-button label="daily">每天</el-radio-button>
                        <el-radio-button label="weekly">每周</el-radio-button>
                        <el-radio-button label="monthly">每月</el-radio-button>
                      </el-radio-group>
                    </el-form-item>

                    <el-form-item label="备份时间">
                      <el-time-picker
                        v-model="backupSettings.time"
                        format="HH:mm"
                        placeholder="选择时间"
                        style="width: 100%"
                      />
                    </el-form-item>

                    <el-form-item label="保留份数">
                      <el-slider v-model="backupSettings.keepCount" :min="3" :max="30" show-stops />
                      <span class="form-hint">保留最近 {{ backupSettings.keepCount }} 份备份</span>
                    </el-form-item>

                    <el-form-item label="备份内容">
                      <el-checkbox-group v-model="backupSettings.content">
                        <el-checkbox label="database">数据库</el-checkbox>
                        <el-checkbox label="files">文件附件</el-checkbox>
                        <el-checkbox label="logs">系统日志</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-form>

                  <el-button type="primary" @click="saveBackupSettings" style="width: 100%">
                    保存设置
                  </el-button>
                </el-card>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-card class="backup-list-card" shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>备份历史</span>
                      <el-button type="primary" @click="manualBackup">
                        <el-icon><Plus /></el-icon>
                        立即备份
                      </el-button>
                    </div>
                  </template>

                  <el-scrollbar max-height="400px">
                    <div class="backup-list">
                      <div
                        v-for="backup in backupList"
                        :key="backup.id"
                        class="backup-item"
                      >
                        <div class="backup-info">
                          <div class="backup-name">{{ backup.name }}</div>
                          <div class="backup-meta">
                            <span>{{ backup.time }}</span>
                            <span class="backup-size">{{ backup.size }}</span>
                          </div>
                        </div>
                        <div class="backup-actions">
                          <el-button link type="primary" @click="restoreBackup(backup)">
                            恢复
                          </el-button>
                          <el-button link type="primary" @click="downloadBackup(backup)">
                            下载
                          </el-button>
                          <el-button link type="danger" @click="deleteBackup(backup)">
                            删除
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </el-scrollbar>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加用户对话框 -->
    <el-dialog v-model="showAddUserDialog" title="添加用户" width="600px">
      <el-form :model="newUser" label-width="100px" :rules="userRules" ref="userFormRef">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="newUser.name" placeholder="输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="newUser.email" placeholder="输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="newUser.phone" placeholder="输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="newUser.department" placeholder="选择部门" style="width: 100%">
                <el-option label="技术部" value="tech" />
                <el-option label="产品部" value="product" />
                <el-option label="运营部" value="operation" />
                <el-option label="合规部" value="compliance" />
                <el-option label="市场部" value="marketing" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色" prop="role">
          <el-select v-model="newUser.role" placeholder="选择角色" style="width: 100%">
            <el-option label="系统管理员" value="admin" />
            <el-option label="数据分析师" value="analyst" />
            <el-option label="合规专员" value="compliance" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始密码" prop="password">
          <el-input v-model="newUser.password" type="password" show-password placeholder="设置初始密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddUserDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAddUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog v-model="showPermissionDialog" title="配置权限" width="700px">
      <el-transfer
        v-model="selectedPermissions"
        :data="allPermissions"
        :titles="['可用权限', '已选权限']"
        filterable
        :filter-method="filterPermissions"
        filter-placeholder="搜索权限..."
      />
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Plus,
  User,
  Key,
  Setting,
  Document,
  FolderOpened,
  Search,
  Edit,
  Delete,
  Download,
  UserFilled,
  OfficeBuilding,
  Lock,
  Bell,
  Monitor,
  Check,
  Close,
  CircleCheck,
  CircleClose,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'

// 状态
const activeTab = ref('users')
const loading = ref(false)
const userSearchQuery = ref('')
const userStatusFilter = ref('')
const userRoleFilter = ref('')
const userPage = ref(1)
const userPageSize = ref(10)
const userTotal = ref(156)
const roleSearchQuery = ref('')
const logDateRange = ref([])
const logTypeFilter = ref('')
const logUserFilter = ref('')
const logPage = ref(1)
const logPageSize = ref(20)
const logTotal = ref(523)

// 对话框状态
const showAddUserDialog = ref(false)
const showAddRoleDialog = ref(false)
const showPermissionDialog = ref(false)
const userFormRef = ref<FormInstance>()
const currentRole = ref<any>(null)

// 系统统计
const systemStats = ref([
  { label: '总用户数', value: 156, icon: UserFilled, color: '#339999' },
  { label: '活跃会话', value: 42, icon: Monitor, color: '#67C23A' },
  { label: '今日操作', value: 1, icon: Document, color: '#409EFF' },
  { label: '系统负载', value: '32%', icon: OfficeBuilding, color: '#E6A23C' }
])

// 用户列表
const userList = ref([
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    department: '技术部',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-04-18 14:30:00',
    avatar: ''
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    phone: '13800138002',
    department: '合规部',
    role: 'compliance',
    status: 'active',
    lastLogin: '2026-04-18 10:15:00',
    avatar: ''
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    phone: '13800138003',
    department: '产品部',
    role: 'analyst',
    status: 'active',
    lastLogin: '2026-04-17 16:45:00',
    avatar: ''
  },
  {
    id: '4',
    name: '赵六',
    email: 'zhaoliu@example.com',
    phone: '13800138004',
    department: '运营部',
    role: 'user',
    status: 'inactive',
    lastLogin: '2026-04-15 09:20:00',
    avatar: ''
  }
])

// 角色列表
const roleList = ref([
  {
    id: '1',
    name: '系统管理员',
    description: '拥有系统的所有权限，可以管理用户、角色和系统设置',
    icon: UserFilled,
    color: '#F56C6C',
    userCount: 3,
    permissionCount: 56
  },
  {
    id: '2',
    name: '数据分析师',
    description: '可以访问数据分析功能，生成报表和导出数据',
    icon: Document,
    color: '#409EFF',
    userCount: 12,
    permissionCount: 24
  },
  {
    id: '3',
    name: '合规专员',
    description: '负责合规审查和法规跟踪，管理认证信息',
    icon: Check,
    color: '#67C23A',
    userCount: 8,
    permissionCount: 18
  },
  {
    id: '4',
    name: '普通用户',
    description: '基础访问权限，可以查看公开数据和搜索产品',
    icon: User,
    color: '#909399',
    userCount: 133,
    permissionCount: 8
  }
])

// 系统设置
const systemSettings = reactive({
  siteName: 'MDLOOKER PPE Data Platform',
  logo: '',
  language: 'zh',
  loginLockEnabled: true,
  passwordRules: ['length', 'uppercase', 'lowercase', 'number'],
  sessionTimeout: 120,
  emailNotification: true,
  smsNotification: false,
  announcement: '系统将于本周六凌晨2:00-4:00进行维护升级，请提前保存您的工作。'
})

// 备份设置
const backupSettings = reactive({
  autoBackup: true,
  frequency: 'daily',
  time: new Date(2026, 0, 1, 2, 0),
  keepCount: 7,
  content: ['database', 'files']
})

// 备份列表
const backupList = ref([
  { id: '1', name: '自动备份 2026-04-18', time: '2026-04-18 02:00', size: '2.3 GB' },
  { id: '2', name: '自动备份 2026-04-17', time: '2026-04-17 02:00', size: '2.2 GB' },
  { id: '3', name: '手动备份 2026-04-16', time: '2026-04-16 15:30', size: '2.2 GB' },
  { id: '4', name: '自动备份 2026-04-16', time: '2026-04-16 02:00', size: '2.1 GB' },
  { id: '5', name: '自动备份 2026-04-15', time: '2026-04-15 02:00', size: '2.1 GB' }
])

// 操作日志
const logList = ref([
  {
    id: '1',
    type: 'login',
    userName: '张三',
    userAvatar: '',
    content: '用户登录系统',
    time: '2026-04-18 14:30:00',
    ip: '192.168.1.100',
    browser: 'Chrome 120.0'
  },
  {
    id: '2',
    type: 'create',
    userName: '李四',
    userAvatar: '',
    content: '创建了新用户 "王五"',
    time: '2026-04-18 11:20:00',
    ip: '192.168.1.101',
    browser: 'Firefox 121.0'
  },
  {
    id: '3',
    type: 'update',
    userName: '张三',
    userAvatar: '',
    content: '修改了系统设置：将会话超时时间改为120分钟',
    time: '2026-04-18 10:45:00',
    ip: '192.168.1.100',
    browser: 'Chrome 120.0'
  },
  {
    id: '4',
    type: 'delete',
    userName: '李四',
    userAvatar: '',
    content: '删除了过期的备份文件 "backup-2026-03-01"',
    time: '2026-04-18 09:30:00',
    ip: '192.168.1.101',
    browser: 'Firefox 121.0'
  },
  {
    id: '5',
    type: 'export',
    userName: '王五',
    userAvatar: '',
    content: '导出了 "2026年Q1合规状态报表"',
    time: '2026-04-17 16:45:00',
    ip: '192.168.1.102',
    browser: 'Edge 118.0'
  }
])

// 新用户表单
const newUser = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  password: ''
})

const userRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请设置初始密码', trigger: 'blur' }]
}

// 权限配置
const selectedPermissions = ref<string[]>([])
const allPermissions = ref([
  { key: 'user:view', label: '查看用户' },
  { key: 'user:create', label: '创建用户' },
  { key: 'user:edit', label: '编辑用户' },
  { key: 'user:delete', label: '删除用户' },
  { key: 'role:view', label: '查看角色' },
  { key: 'role:create', label: '创建角色' },
  { key: 'role:edit', label: '编辑角色' },
  { key: 'role:delete', label: '删除角色' },
  { key: 'ppe:view', label: '查看PPE数据' },
  { key: 'ppe:export', label: '导出PPE数据' },
  { key: 'enterprise:view', label: '查看企业数据' },
  { key: 'enterprise:export', label: '导出企业数据' },
  { key: 'regulation:view', label: '查看法规' },
  { key: 'regulation:edit', label: '编辑法规' },
  { key: 'report:view', label: '查看报表' },
  { key: 'report:create', label: '创建报表' },
  { key: 'report:export', label: '导出生成报表' },
  { key: 'system:settings', label: '系统设置' },
  { key: 'system:backup', label: '数据备份' },
  { key: 'system:log', label: '查看日志' }
])

// 计算属性
const filteredUsers = computed(() => {
  let result = userList.value
  
  if (userSearchQuery.value) {
    const query = userSearchQuery.value.toLowerCase()
    result = result.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }
  
  if (userStatusFilter.value) {
    result = result.filter(u => u.status === userStatusFilter.value)
  }
  
  if (userRoleFilter.value) {
    result = result.filter(u => u.role === userRoleFilter.value)
  }
  
  return result
})

const filteredRoles = computed(() => {
  if (!roleSearchQuery.value) return roleList.value
  const query = roleSearchQuery.value.toLowerCase()
  return roleList.value.filter(r => 
    r.name.toLowerCase().includes(query)
  )
})

const filteredLogs = computed(() => {
  let result = logList.value
  
  if (logTypeFilter.value) {
    result = result.filter(l => l.type === logTypeFilter.value)
  }
  
  if (logUserFilter.value) {
    result = result.filter(l => l.userName === logUserFilter.value)
  }
  
  return result
})

// 方法
const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: '系统管理员',
    analyst: '数据分析师',
    compliance: '合规专员',
    user: '普通用户'
  }
  return map[role] || role
}

const getRoleType = (role: string) => {
  const map: Record<string, any> = {
    admin: 'danger',
    analyst: 'primary',
    compliance: 'success',
    user: 'info'
  }
  return map[role] || ''
}

const getLogType = (type: string) => {
  const map: Record<string, any> = {
    login: 'primary',
    create: 'success',
    update: 'warning',
    delete: 'danger',
    export: 'info'
  }
  return map[type] || ''
}

const getLogTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    login: '登录',
    create: '创建',
    update: '修改',
    delete: '删除',
    export: '导出'
  }
  return map[type] || type
}

const getLogIcon = (type: string) => {
  const map: Record<string, any> = {
    login: User,
    create: CircleCheck,
    update: Edit,
    delete: CircleClose,
    export: Download
  }
  return map[type] || InfoFilled
}

const handleUserStatusChange = (user: any) => {
  ElMessage.success(`用户 ${user.name} 已${user.status === 'active' ? '启用' : '禁用'}`)
}

const editUser = (user: any) => {
  ElMessage.info(`编辑用户: ${user.name}`)
}

const resetPassword = (user: any) => {
  ElMessageBox.confirm(`确定要重置 ${user.name} 的密码吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('密码重置成功，新密码已发送到用户邮箱')
  })
}

const deleteUser = (user: any) => {
  ElMessageBox.confirm(`确定要删除用户 ${user.name} 吗？此操作不可恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userList.value = userList.value.filter(u => u.id !== user.id)
    ElMessage.success('用户已删除')
  })
}

const submitAddUser = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate((valid) => {
    if (valid) {
      userList.value.unshift({
        id: Date.now().toString(),
        ...newUser,
        status: 'active',
        lastLogin: '-',
        avatar: ''
      })
      showAddUserDialog.value = false
      ElMessage.success('用户添加成功')
      
      // 重置表单
      Object.assign(newUser, {
        name: '',
        email: '',
        phone: '',
        department: '',
        role: '',
        password: ''
      })
    }
  })
}

const editRole = (role: any) => {
  ElMessage.info(`编辑角色: ${role.name}`)
}

const configPermissions = (role: any) => {
  currentRole.value = role
  selectedPermissions.value = ['user:view', 'ppe:view', 'enterprise:view']
  showPermissionDialog.value = true
}

const savePermissions = () => {
  ElMessage.success(`已为 ${currentRole.value?.name} 保存权限配置`)
  showPermissionDialog.value = false
}

const deleteRole = (role: any) => {
  ElMessageBox.confirm(`确定要删除角色 ${role.name} 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    roleList.value = roleList.value.filter(r => r.id !== role.id)
    ElMessage.success('角色已删除')
  })
}

const filterPermissions = (query: string, item: any) => {
  return item.label.toLowerCase().includes(query.toLowerCase())
}

const handleLogoChange = (file: any) => {
  systemSettings.logo = URL.createObjectURL(file.raw)
}

const saveSettings = () => {
  ElMessage.success('系统设置已保存')
}

const resetSettings = () => {
  ElMessageBox.confirm('确定要重置所有设置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('设置已重置')
  })
}

const exportLogs = () => {
  ElMessage.success('日志导出成功')
}

const saveBackupSettings = () => {
  ElMessage.success('备份设置已保存')
}

const manualBackup = () => {
  ElMessage.success('手动备份已开始，完成后将通知您')
  setTimeout(() => {
    backupList.value.unshift({
      id: Date.now().toString(),
      name: `手动备份 ${new Date().toLocaleDateString('zh-CN')}`,
      time: new Date().toLocaleString('zh-CN'),
      size: '2.3 GB'
    })
    ElMessage.success('手动备份完成')
  }, 2000)
}

const restoreBackup = (backup: any) => {
  ElMessageBox.confirm(`确定要恢复到备份 "${backup.name}" 吗？当前数据将被覆盖。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('数据恢复成功')
  })
}

const downloadBackup = (backup: any) => {
  ElMessage.success(`开始下载: ${backup.name}`)
}

const deleteBackup = (backup: any) => {
  ElMessageBox.confirm(`确定要删除备份 "${backup.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    backupList.value = backupList.value.filter(b => b.id !== backup.id)
    ElMessage.success('备份已删除')
  })
}

const showQuickActions = () => {
  ElMessage.info('快捷操作菜单')
}
</script>

<style scoped lang="scss">
.system-manage-page {
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

// 统计卡片
.stat-cards {
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
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #1f2f3d;
          line-height: 1;
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

// 管理标签页
.manage-tabs-card {
  :deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;

    .el-tabs__header {
      background: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;

      .el-tabs__item {
        height: 48px;
        line-height: 48px;
        font-size: 14px;

        &.is-active {
          background: white;
          border-bottom-color: white;
        }
      }
    }

    .el-tabs__content {
      padding: 0;
    }
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tab-content {
    padding: 24px;

    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}

// 用户信息单元格
.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-details {
    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }

    .user-email {
      font-size: 12px;
      color: #909399;
    }
  }
}

// 角色卡片
.role-card {
  margin-bottom: 16px;

  .role-header {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    .role-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .role-info {
      flex: 1;

      .role-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 4px;
      }

      .role-desc {
        font-size: 13px;
        color: #909399;
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .role-stats {
    display: flex;
    gap: 24px;
    padding: 12px 0;
    border-top: 1px solid #e4e7ed;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 12px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .stat-num {
        font-size: 20px;
        font-weight: 600;
        color: #339999;
      }

      .stat-text {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .role-actions {
    display: flex;
    justify-content: space-around;
  }
}

// 设置表单
.settings-form {
  max-width: 800px;

  .form-hint {
    margin-left: 12px;
    font-size: 13px;
    color: #909399;
  }

  .logo-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: #339999;
      }
    }

    .logo-preview {
      width: 200px;
      height: 60px;
      object-fit: contain;
    }

    .logo-placeholder {
      width: 200px;
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #8c939d;

      .el-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }
    }
  }
}

// 日志卡片
.log-card {
  margin-bottom: 8px;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .log-user {
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }
    }
  }

  .log-content {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
  }

  .log-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #909399;
  }
}

// 备份卡片
.backup-card,
.backup-list-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }

  .form-hint {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.backup-list {
  .backup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e4e7ed;

    &:last-child {
      border-bottom: none;
    }

    .backup-info {
      .backup-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .backup-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #909399;

        .backup-size {
          color: #339999;
        }
      }
    }

    .backup-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
