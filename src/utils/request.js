import axios from 'axios'
<<<<<<< HEAD
import router from '../router'
import { useUserStore } from '../stores/user'
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10

const baseURL = import.meta.env.VITE_API_BASE || ''

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

<<<<<<< HEAD
// 请求拦截：附带 token
=======
// 简单的请求/响应拦截，保留原始 axios response 以兼容现有代码
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
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

<<<<<<< HEAD
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
=======
instance.interceptors.response.use(
  (response) => response,
  (error) => {
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
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
