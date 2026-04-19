<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <el-icon size="120" color="#339999"><Warning /></el-icon>
      <h1 class="not-found-title">404</h1>
      <p class="not-found-description">抱歉，您访问的页面不存在</p>
      <el-button type="primary" size="large" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Warning } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  
  .not-found-content {
    text-align: center;
    
    .not-found-title {
      font-size: 72px;
      font-weight: 700;
      color: #303133;
      margin: 24px 0 16px;
    }
    
    .not-found-description {
      font-size: 18px;
      color: #606266;
      margin-bottom: 32px;
    }
  }
}
</style>
