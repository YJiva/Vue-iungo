<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="title">
        <div class="brand">Iungo 社区登录</div>
        <div class="sub">登录后可继续访问受保护页面</div>
      </div>

      <LoginView @success="onSuccess" @open-register="goRegister" />

      <div class="tips">
        <span class="muted">没有账号？</span>
        <el-button type="text" @click="goRegister">去注册</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import LoginView from './login.vue'

const route = useRoute()
const router = useRouter()

const onSuccess = () => {
  const redirect = route.query.redirect ? String(route.query.redirect) : '/'
  router.replace(redirect)
}

const goRegister = () => {
  router.push({ path: '/register', query: route.query })
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fff1f5;
}

.auth-card {
  width: 460px;
  max-width: 92vw;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 14px;
  padding: 22px 20px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

.title {
  margin-bottom: 16px;
}

.brand {
  font-size: 18px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.92);
}

.sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.6);
}

.tips {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.muted {
  color: rgba(17, 24, 39, 0.6);
  font-size: 12px;
}
</style>
