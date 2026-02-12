import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/home/Home.vue'
// 占位页面
const BlogList = () => import('../views/blog/List.vue')
const BlogEdit = () => import('../views/blog/Edit.vue')
const UserCenter = () => import('../views/user/Center.vue')
const Login = () => import('../views/user/login.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    {
      path: '/home',
      component: Home
    },
    {
      path: '/blog/list',
      component: BlogList
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
    }
  ],
})

export default router
