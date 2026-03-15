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
const Admin = () => import('../views/admin/admin.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    {
      path: '/admin',
      component: Admin,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
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

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta && to.meta.requiresAuth
  const roles = (to.meta && to.meta.roles) || null

  if (requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
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
