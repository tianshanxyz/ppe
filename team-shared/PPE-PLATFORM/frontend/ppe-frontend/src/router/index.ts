import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
          meta: { title: '首页' }
        },
        {
          path: 'ppe',
          name: 'ppe-search',
          component: () => import('../views/ppe/PPESearchView.vue'),
          meta: { title: 'PPE 检索' }
        },
        {
          path: 'ppe/:id',
          name: 'ppe-detail',
          component: () => import('../views/ppe/PPEDetailView.vue'),
          meta: { title: 'PPE 详情' }
        },
        {
          path: 'enterprise',
          name: 'enterprise-search',
          component: () => import('../views/enterprise/EnterpriseSearchView.vue'),
          meta: { title: '企业检索' }
        },
        {
          path: 'enterprise/:id',
          name: 'enterprise-detail',
          component: () => import('../views/enterprise/EnterpriseDetailView.vue'),
          meta: { title: '企业详情' }
        },
        {
          path: 'regulation',
          name: 'regulation-search',
          component: () => import('../views/regulation/RegulationSearchView.vue'),
          meta: { title: '法规检索' }
        },
        {
          path: 'regulation/:id',
          name: 'regulation-detail',
          component: () => import('../views/regulation/RegulationDetailView.vue'),
          meta: { title: '法规详情' }
        },
        {
          path: 'alert',
          name: 'alert-center',
          component: () => import('../views/alert/AlertCenterView.vue'),
          meta: { title: '预警中心' }
        },
        {
          path: 'document',
          name: 'document-generate',
          component: () => import('../views/document/DocumentGenerateView.vue'),
          meta: { title: '文件生成' }
        },
        {
          path: 'document/manage',
          name: 'document-manage',
          component: () => import('../views/document/DocumentManageView.vue'),
          meta: { title: '文件管理' }
        },
        {
          path: 'competitiveness',
          name: 'competitiveness',
          component: () => import('../views/competitiveness/CompetitivenessView.vue'),
          meta: { title: '竞争力评估' }
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/dashboard/DashboardView.vue'),
          meta: { title: '数据看板' }
        },
        {
          path: 'user',
          name: 'user-center',
          component: () => import('../views/user/UserCenterView.vue'),
          meta: { title: '用户中心' }
        },
        {
          path: 'report/config',
          name: 'report-config',
          component: () => import('../views/report/ReportConfigView.vue'),
          meta: { title: '报表配置' }
        },
        {
          path: 'report/export',
          name: 'report-export',
          component: () => import('../views/report/ReportExportView.vue'),
          meta: { title: '报表导出' }
        },
        {
          path: 'system',
          name: 'system-manage',
          component: () => import('../views/system/SystemManageView.vue'),
          meta: { title: '系统管理' }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/user/LoginView.vue'),
      meta: { title: '登录', public: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: '页面未找到' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - PPE Data Platform` : 'PPE Data Platform'
  
  // 检查是否需要登录
  const isPublic = to.meta.public
  const isLoggedIn = localStorage.getItem('token')
  
  if (!isPublic && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
