<template>
  <div class="enterprise-detail-page">
    <el-page-header title="企业详情" @back="$router.back()" />
    <el-card class="detail-card">
      <template #header>
        <span>企业信息</span>
      </template>
      <p>企业详情页面开发中...</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// EnterpriseDetailView 组件
</script>

<style scoped lang="scss">
.enterprise-detail-page {
  .detail-card {
    margin-top: 24px;
  }
}
</style>
