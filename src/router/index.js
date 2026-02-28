import { createRouter, createWebHistory } from 'vue-router'


// 占位页面
const Home = () => import('../views/home/Home.vue') // 假设有一个主页组件
const BlogList = () => import('../views/blog/List.vue')
const BlogEdit = () => import('../views/blog/Edit.vue')
const BlogDetail = () => import('../views/blog/Detail.vue')
const UserCenter = () => import('../views/user/Center.vue')
const Login = () => import('../views/user/login.vue')
const Register = () => import('../views/user/register.vue')
const Invite = () => import('../views/user/Invite.vue') // 假设有邀请页面
const Notifications = () => import('../views/user/Notifications.vue') // 假设有消息页面
const Settings = () => import('../views/user/Settings.vue') // 假设有设置页面

const Admin = () => import('../views/admin/admin.vue') // 假设有管理员页面
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path:'/admin',
      component:Admin
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
      path: '/blog/detail/:id',
      component: BlogDetail,
      name: 'BlogDetail'
    },
    {
      path: '/blog/edit',
      component: BlogEdit
    },
    {
      path: '/user/center',
      component: UserCenter
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
      component: Invite
    },
    {
      path: '/notifications',
      component: Notifications
    },
    {
      path: '/settings',
      component: Settings
    }
  ],
})

export default router
