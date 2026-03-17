import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 页面组件
const Home = () => import('../views/home/Home.vue')
const BlogList = () => import('../views/blog/List.vue')
const BlogEdit = () => import('../views/blog/Edit.vue')
const BlogDetail = () => import('../views/blog/Detail.vue')
const BlogMy = () => import('../views/blog/BlogMy.vue')
const UserCenter = () => import('../views/user/Center.vue')
const Collections = () => import('../views/user/Collections.vue')
const Login = () => import('../views/user/login.vue')
const Register = () => import('../views/user/register.vue')
const Invite = () => import('../views/user/Invite.vue')
const Notifications = () => import('../views/user/Notifications.vue')
const Settings = () => import('../views/user/Settings.vue')
const AdminLayout = () => import('../views/admin/Admin.vue')
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const AdminUsers = () => import('../views/admin/AdminUsers.vue')
const AdminRoles = () => import('../views/admin/AdminRoles.vue')
const AdminBlogTypes = () => import('../views/admin/AdminBlogTypes.vue')
const AdminBlogs = () => import('../views/admin/AdminBlogs.vue')
const AdminInvite = () => import('../views/admin/AdminInvite.vue')
const AdminLogin = () => import('../views/admin/AdminLogin.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, roles: ['ADMIN'] },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', component: AdminDashboard },
        { path: 'users', component: AdminUsers },
        { path: 'roles', component: AdminRoles },
        { path: 'blog-types', component: AdminBlogTypes },
        { path: 'blogs', component: AdminBlogs },
        { path: 'invite', component: AdminInvite }
      ]
    },
    {
      path: '/admin/login',
      component: AdminLogin
    },
    {
      path: '/home',
      component: Home
    },
    {
      path: '/blog/list',
      component: BlogList,
      name: 'BlogList'
    },
    {
      path: '/blog/my',
      component: BlogMy,
      meta: { requiresAuth: true }
    },
    {
      path: '/blog/detail/:id',
      component: BlogDetail,
      name: 'BlogDetail'
    },
    {
      path: '/blog/edit',
      component: BlogEdit,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/center',
      component: UserCenter,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/collections',
      component: Collections,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      component: Login
    },
    {
      path: '/register',
      component: Register
    },
    {
      path: '/invite',
      component: Invite,
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      component: Notifications,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      component: Settings,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta && to.meta.requiresAuth
  const roles = (to.meta && to.meta.roles) || null
  const isAdminRoute = typeof to.path === 'string' && to.path.startsWith('/admin')

  // 刷新后，若本地有 token 但 Pinia 还没恢复登录态，先尝试异步校验一次
  if (!userStore.isLoggedIn && userStore.token) {
    try {
      await userStore.checkAuth()
    } catch {
      // ignore，下面逻辑会处理未登录情况
    }
  }

  // 已登录用户访问 /admin/login：直接跳去后台
  if (to.path === '/admin/login' && userStore.isLoggedIn && userStore.userInfo) {
    const isAdmin = userStore.userInfo.roleId === 2
    if (isAdmin) {
      next({ path: '/admin/dashboard' })
      return
    }
  }

  if (requiresAuth && !userStore.isLoggedIn) {
    next({
      path: isAdminRoute ? '/admin/login' : '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if (roles && userStore.userInfo && userStore.userInfo.roleId != null) {
    // 简单约定：roleId === 2 为 ADMIN
    const isAdmin = userStore.userInfo.roleId === 2
    if (roles.includes('ADMIN') && !isAdmin) {
      next({ path: '/' })
      return
    }
  }

  next()
})

export default router
