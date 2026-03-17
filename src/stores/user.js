import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import request from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  // helper to persist token
  function saveToken(t) {
    token.value = t || ''
    if (t) {
      localStorage.setItem('token', t)
      isLoggedIn.value = true
    } else {
      localStorage.removeItem('token')
      isLoggedIn.value = false
    }
  }

  // password login
  const loginPassword = async ({ username, password }) => {
    try {
      const res = await request.post('/api/user/login/password', { username, password })
      // backend returns { code, msg, data: { token, user } }
      const payload = res.data && res.data.data ? res.data.data : {}
      if (payload.token) {
        saveToken(payload.token)
      }
      userInfo.value = payload.user || null
      return res
    } catch (error) {
      throw error
    }
  }

  // email code login
  const loginEmail = async ({ email, code }) => {
    try {
      const res = await request.post('/api/user/login/email', { email, code })
      const payload = res.data && res.data.data ? res.data.data : {}
      if (payload.token) {
        saveToken(payload.token)
      }
      userInfo.value = payload.user || null
      return res
    } catch (error) {
      throw error
    }
  }

  // send verification code to email (for login/register)
  const sendEmailCode = async (email) => {
    try {
      // the API is defined as POST /api/user/send-email-code?email=
      const res = await request.post(`/api/user/send-email-code?email=${encodeURIComponent(email)}`)
      return res
    } catch (error) {
      throw error
    }
  }

  // registration with invite code
  const register = async ({ username, password, email, emailCode, nickname, inviteCode }) => {
    try {
      const res = await request.post('/api/user/register', { username, password, email, emailCode, nickname, inviteCode })
      return res
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    saveToken('')
    userInfo.value = null
  }

  const checkAuth = async () => {
    if (token.value) {
      try {
        const res = await request.get('/api/user/me')
        if (res.data && res.data.code === 200) {
          userInfo.value = res.data.data || null
          isLoggedIn.value = true
        } else {
          logout()
        }
      } catch (error) {
        logout()
      }
    }
  }

  // invitation-related operations
  const getInviteTree = async (userId) => {
    try {
      const res = await request.get('/api/user/invite-tree', { userId })
      return res
    } catch (error) {
      throw error
    }
  }

  const getInviteTreeClose = async (userId) => {
    try {
      const res = await request.get('/api/user/invite-tree/close', { userId })
      return res
    } catch (error) {
      throw error
    }
  }

  const generateInviteCode = async (userId) => {
    try {
      const res = await request.post(`/api/user/generate-invite-code?userId=${userId}`)
      return res
    } catch (error) {
      throw error
    }
  }

  const updateProfile = async (payload) => {
    try {
      const res = await request.post('/api/user/update', payload)
      if (res.data && res.data.code === 200) {
        userInfo.value = { ...(userInfo.value || {}), ...payload }
      }
      return res
    } catch (error) {
      throw error
    }
  }

  const changePassword = async ({ oldPassword, newPassword }) => {
    try {
      const res = await request.post('/api/user/change-password', { oldPassword, newPassword })
      return res
    } catch (error) {
      throw error
    }
  }

  return {
    isLoggedIn,
    userInfo,
    token,
    loginPassword,
    loginEmail,
    sendEmailCode,
    register,
    logout,
    checkAuth,
    getInviteTree,
    getInviteTreeClose,
    generateInviteCode,
    updateProfile,
    changePassword
  }
})
