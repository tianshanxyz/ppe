<template>
  <el-container class="main-layout">
    <!-- 顶部导航 -->
    <el-header class="main-header">
      <div class="header-content">
        <!-- Logo -->
        <div class="logo">
          <el-icon size="28" color="#339999"><Shield /></el-icon>
          <span class="logo-text">PPE Data Platform</span>
        </div>
        
        <!-- 导航菜单 -->
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          class="main-menu"
          router
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/ppe">
            <el-icon><FirstAidKit /></el-icon>
            <span>PPE 检索</span>
          </el-menu-item>
          <el-menu-item index="/enterprise">
            <el-icon><OfficeBuilding /></el-icon>
            <span>企业检索</span>
          </el-menu-item>
          <el-menu-item index="/regulation">
            <el-icon><DocumentChecked /></el-icon>
            <span>法规检索</span>
          </el-menu-item>
          <el-menu-item index="/alert">
            <el-icon><Bell /></el-icon>
            <span>预警中心</span>
          </el-menu-item>
          <el-menu-item index="/document">
            <el-icon><Document /></el-icon>
            <span>文件生成</span>
          </el-menu-item>
          <el-menu-item index="/competitiveness">
            <el-icon><TrendCharts /></el-icon>
            <span>竞争力评估</span>
          </el-menu-item>
          <el-menu-item index="/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
        </el-menu>
        
        <!-- 右侧操作区 -->
        <div class="header-actions">
          <el-button type="primary" text>
            <el-icon><Search /></el-icon>
          </el-button>
          <el-button type="primary" text>
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-dropdown>
            <el-button type="primary" text>
              <el-icon><User /></el-icon>
              <span>用户</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item>设置</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    
    <!-- 主内容区 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
    
    <!-- 底部 -->
    <el-footer class="main-footer">
      <div class="footer-content">
        <p>&copy; 2026 PPE Data Platform. All rights reserved.</p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  FirstAidKit,
  OfficeBuilding,
  DocumentChecked,
  Bell,
  Document,
  DataLine,
  Search,
  User,
  TrendCharts,
  FirstAidKit as Shield
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 64px;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 24px;
    max-width: 1440px;
    margin: 0 auto;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .logo-text {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .main-menu {
    flex: 1;
    margin: 0 48px;
    border-bottom: none;
    
    :deep(.el-menu-item) {
      font-size: 15px;
      
      &.is-active {
        color: #339999;
        border-bottom-color: #339999;
      }
      
      &:hover {
        color: #339999;
      }
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.main-content {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.main-footer {
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 20px 24px;
  
  .footer-content {
    text-align: center;
    color: #909399;
    font-size: 14px;
  }
}
</style>
