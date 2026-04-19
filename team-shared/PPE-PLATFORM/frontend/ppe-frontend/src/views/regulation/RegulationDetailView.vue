<template>
  <div class="regulation-detail-page">
    <el-page-header title="法规详情" @back="$router.back()" />
    <el-card class="detail-card">
      <template #header>
        <span>法规内容</span>
      </template>
      <p>法规详情页面开发中...</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// RegulationDetailView 组件
</script>

<style scoped lang="scss">
.regulation-detail-page {
  .detail-card {
    margin-top: 24px;
  }
}
</style>
