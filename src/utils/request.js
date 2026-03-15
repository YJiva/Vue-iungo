import axios from 'axios'
import router from '../router'
import { useUserStore } from '../stores/user'

const baseURL = import.meta.env.VITE_API_BASE || ''

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截：附带 token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：统一处理 401
instance.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && data.code === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push({ path: '/login' })
    }
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push({ path: '/login' })
    }
    return Promise.reject(error)
  }
)

export default {
  instance,
  get(url, params) {
    return instance.get(url, { params })
  },
  post(url, data, config) {
    return instance.post(url, data, config)
  }
}
