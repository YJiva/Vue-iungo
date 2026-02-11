import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || ''

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 简单的请求/响应拦截，保留原始 axios response 以兼容现有代码
instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  }
)

export default {
  instance,
  get(url, params) {
    return instance.get(url, { params })
  },
  post(url, data) {
    return instance.post(url, data)
  }
}
