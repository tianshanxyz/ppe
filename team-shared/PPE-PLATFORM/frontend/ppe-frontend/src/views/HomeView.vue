<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">全球 PPE 数据平台</h1>
        <p class="hero-description">
          一站式个人防护装备合规数据检索平台，覆盖全球主要市场监管数据
        </p>
        <div class="hero-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索产品、企业或法规..."
            size="large"
            class="hero-search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" @click="handleSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">100K+</span>
            <span class="stat-label">产品数据</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">50K+</span>
            <span class="stat-label">企业信息</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">10K+</span>
            <span class="stat-label">法规标准</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">200+</span>
            <span class="stat-label">国家/地区</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <h2 class="section-title">核心功能</h2>
      <el-row :gutter="24">
        <el-col :span="6">
          <el-card class="feature-card" shadow="hover">
            <el-icon size="48" color="#339999"><FirstAidKit /></el-icon>
            <h3 class="feature-title">PPE 产品检索</h3>
            <p class="feature-desc">搜索全球个人防护装备产品信息，包括认证状态、技术规格等</p>
            <el-button type="primary" text @click="$router.push('/ppe')">
              立即使用 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="feature-card" shadow="hover">
            <el-icon size="48" color="#339999"><OfficeBuilding /></el-icon>
            <h3 class="feature-title">企业检索</h3>
            <p class="feature-desc">查询 PPE 制造商和供应商的详细信息和合规状态</p>
            <el-button type="primary" text @click="$router.push('/enterprise')">
              立即使用 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="feature-card" shadow="hover">
            <el-icon size="48" color="#339999"><DocumentChecked /></el-icon>
            <h3 class="feature-title">法规检索</h3>
            <p class="feature-desc">获取全球 PPE 相关法规、标准和合规要求</p>
            <el-button type="primary" text @click="$router.push('/regulation')">
              立即使用 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="feature-card" shadow="hover">
            <el-icon size="48" color="#339999"><Bell /></el-icon>
            <h3 class="feature-title">预警中心</h3>
            <p class="feature-desc">实时获取产品预警、召回和安全通知信息</p>
            <el-button type="primary" text @click="$router.push('/alert')">
              立即使用 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- Quick Actions Section -->
    <section class="quick-actions-section">
      <h2 class="section-title">快捷操作</h2>
      <el-row :gutter="24">
        <el-col :span="8">
          <el-card class="action-card" shadow="hover" @click="$router.push('/document')">
            <div class="action-content">
              <el-icon size="32" color="#339999"><Document /></el-icon>
              <div class="action-info">
                <h4>生成合规文档</h4>
                <p>快速生成 PPE 合规报告和证书</p>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" shadow="hover" @click="$router.push('/dashboard')">
            <div class="action-content">
              <el-icon size="32" color="#339999"><DataLine /></el-icon>
              <div class="action-info">
                <h4>数据看板</h4>
                <p>查看 PPE 市场数据分析和趋势</p>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" shadow="hover" @click="$router.push('/document/manage')">
            <div class="action-content">
              <el-icon size="32" color="#339999"><Folder /></el-icon>
              <div class="action-info">
                <h4>文件管理</h4>
                <p>管理已生成的文档和报告</p>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- Data Sources Section -->
    <section class="data-sources-section">
      <h2 class="section-title">数据来源</h2>
      <p class="section-desc">整合全球权威数据源，确保信息准确可靠</p>
      <div class="data-sources-list">
        <el-tag size="large" effect="plain">FDA</el-tag>
        <el-tag size="large" effect="plain">CE</el-tag>
        <el-tag size="large" effect="plain">NMPA</el-tag>
        <el-tag size="large" effect="plain">TGA</el-tag>
        <el-tag size="large" effect="plain">Health Canada</el-tag>
        <el-tag size="large" effect="plain">PMDA</el-tag>
        <el-tag size="large" effect="plain">MedPlum</el-tag>
        <el-tag size="large" effect="plain">更多...</el-tag>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  FirstAidKit,
  OfficeBuilding,
  DocumentChecked,
  Bell,
  Document,
  DataLine,
  Folder,
  ArrowRight
} from '@element-plus/icons-vue'

const router = useRouter()
const searchQuery = ref('')

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/ppe',
      query: { q: searchQuery.value }
    })
  }
}
</script>

<style scoped lang="scss">
.home-page {
  .hero-section {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
    padding: 80px 20px;
    text-align: center;
    margin: -20px -20px 60px;

    .hero-content {
      max-width: 800px;
      margin: 0 auto;

      .hero-title {
        font-size: 48px;
        font-weight: 700;
        color: #303133;
        margin-bottom: 20px;
      }

      .hero-description {
        font-size: 20px;
        color: #606266;
        margin-bottom: 40px;
      }

      .hero-search {
        max-width: 600px;
        margin: 0 auto 40px;

        .hero-search-input {
          :deep(.el-input__wrapper) {
            padding-left: 16px;
          }

          :deep(.el-input-group__append) {
            background-color: #339999;
            border-color: #339999;
            color: #fff;
          }
        }
      }

      .hero-stats {
        display: flex;
        justify-content: center;
        gap: 60px;

        .stat-item {
          text-align: center;

          .stat-number {
            display: block;
            font-size: 36px;
            font-weight: 700;
            color: #339999;
          }

          .stat-label {
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }
  }

  .section-title {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    text-align: center;
    margin-bottom: 40px;
  }

  .features-section {
    margin-bottom: 60px;

    .feature-card {
      text-align: center;
      padding: 32px 24px;
      height: 100%;

      .feature-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 20px 0 12px;
      }

      .feature-desc {
        font-size: 14px;
        color: #606266;
        margin-bottom: 20px;
        line-height: 1.6;
      }
    }
  }

  .quick-actions-section {
    margin-bottom: 60px;

    .action-card {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #339999;
        transform: translateY(-2px);
      }

      .action-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .action-info {
          flex: 1;

          h4 {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          p {
            font-size: 13px;
            color: #606266;
          }
        }

        .action-arrow {
          color: #909399;
        }
      }
    }
  }

  .data-sources-section {
    text-align: center;
    padding: 40px 0;

    .section-desc {
      font-size: 16px;
      color: #606266;
      margin-bottom: 24px;
    }

    .data-sources-list {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }
  }
}
</style>
