import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LibraryLayout from '@/layouts/LibraryLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'google/callback',
        name: 'GoogleCallback',
        component: () => import('@/views/auth/GoogleCallbackView.vue'),
      },
    ],
  },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
      },
    ],
  },
  {
    path: '/library',
    component: LibraryLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: ':id',
        name: 'Library',
        component: () => import('@/views/LibraryView.vue'),
      },
      {
        path: ':id/settings',
        name: 'LibrarySettings',
        component: () => import('@/views/LibrarySettingsView.vue'),
      },
      {
        path: ':id/tags',
        name: 'LibraryTags',
        component: () => import('@/views/LibraryTagsView.vue'),
      },
      {
        path: ':libraryId/item/:itemId',
        name: 'ItemDetail',
        component: () => import('@/views/ItemDetailView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth on first load
  if (authStore.accessToken && !authStore.user) {
    try {
      await authStore.getCurrentUser()
    } catch (error) {
      // Token invalid, will be cleared by store
    }
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
