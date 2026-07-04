import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LibraryLayout from '@/layouts/LibraryLayout.vue'
import PortalLayout from '@/layouts/PortalLayout.vue'

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
        component: () => import('@/views/UserSettingsView.vue'),
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
        path: ':id/items',
        name: 'LibraryItems',
        component: () => import('@/views/LibraryItemsView.vue'),
      },
      {
        path: ':id/notes',
        name: 'LibraryNotes',
        component: () => import('@/views/LibraryNotesView.vue'),
      },
      {
        path: ':id/characters',
        name: 'LibraryCharacters',
        component: () => import('@/views/LibraryCharactersView.vue'),
      },
      {
        path: ':id/magic-items',
        name: 'LibraryMagicItems',
        component: () => import('@/views/LibraryMagicItemsView.vue'),
      },
      {
        path: ':id/stat-blocks',
        name: 'LibraryStatBlocks',
        component: () => import('@/views/LibraryStatBlocksView.vue'),
      },
      {
        path: ':id/tags',
        name: 'LibraryTags',
        component: () => import('@/views/LibraryTagsView.vue'),
      },
      {
        path: ':id/tags/:tagId/items',
        name: 'TagLibraryItems',
        component: () => import('@/views/TagLibraryItemsView.vue'),
      },
      {
        path: ':libraryId/item/:itemId',
        name: 'ItemDetail',
        component: () => import('@/views/ItemDetailView.vue'),
      },
      {
        path: ':id/json-import',
        name: 'LibraryJsonImport',
        component: () => import('@/views/LibraryJsonImportView.vue'),
      },
      {
        path: ':id/portal-views',
        name: 'LibraryPortalViews',
        component: () => import('@/views/LibraryPortalViewsView.vue'),
      },
      {
        path: ':id/portal-views/:portalViewId',
        name: 'PortalView',
        component: () => import('@/views/PortalViewDetailView.vue'),
      },
      {
        path: ':id/portal-views/:portalViewId/view',
        name: 'PortalViewView',
        component: () => import('@/views/PortalViewView.vue'),
      },
      {
        path: ':id/dm-screens',
        name: 'LibraryDmScreens',
        component: () => import('@/views/LibraryDmScreensView.vue'),
      },
      {
        path: ':id/dm-screens/:dmScreenId',
        name: 'DmScreen',
        component: () => import('@/views/DmScreenView.vue'),
        meta: { noPadding: true },
      },
    ],
  },
  {
    path: '/portal',
    component: PortalLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'library/:id/portalview/:portalViewId',
        name: 'PortalViewDisplay',
        component: () => import('@/views/PortalViewView.vue'),
      },
    ],
  },
  {
    // Invite landing page — no auth requirement: it offers login/register
    // itself and claims the invite once authenticated.
    path: '/invite/:token',
    name: 'Invite',
    component: () => import('@/views/InviteView.vue'),
  },
  {
    path: '/player',
    component: () => import('@/layouts/PlayerLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'PlayerHome',
        component: () => import('@/views/player/PlayerHomeView.vue'),
      },
      {
        path: ':id',
        name: 'PlayerDashboard',
        component: () => import('@/views/player/PlayerDashboardView.vue'),
      },
      {
        path: ':id/portal/:portalViewId',
        name: 'PlayerPortal',
        component: () => import('@/views/PortalViewView.vue'),
      },
      {
        path: ':id/dm-screens/:dmScreenId',
        name: 'PlayerDmScreen',
        component: () => import('@/views/player/PlayerDmScreenView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
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
    return
  }
  if (requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  // Pure players land on the player dashboard instead of the DM dashboard.
  if (to.name === 'Dashboard' && authStore.isAuthenticated) {
    try {
      const { useLibraryStore } = await import('@/stores/library')
      const libraryStore = useLibraryStore()
      if (libraryStore.libraries.length === 0) {
        await libraryStore.fetchLibraries()
      }
      const libs = libraryStore.libraries
      if (libs.length > 0 && libs.every((l) => l.role === 'PLAYER')) {
        next(
          libs.length === 1
            ? { name: 'PlayerDashboard', params: { id: libs[0].id } }
            : { name: 'PlayerHome' }
        )
        return
      }
    } catch {
      // fall through to the normal dashboard on any error
    }
  }

  next()
})

export default router
