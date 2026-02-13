import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import request from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const login = async (credentials) => {
    try {
      const res = await request.post('/auth/login', credentials)
      token.value = res.data.token
      userInfo.value = res.data.user
      isLoggedIn.value = true
      localStorage.setItem('token', token.value)
      return res
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const res = await request.post('/auth/register', userData)
      return res
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
  }

  const checkAuth = async () => {
    if (token.value) {
      try {
        const res = await request.get('/auth/me')
        userInfo.value = res.data
        isLoggedIn.value = true
      } catch (error) {
        logout()
      }
    }
  }

  return { isLoggedIn, userInfo, token, login, register, logout, checkAuth }
})