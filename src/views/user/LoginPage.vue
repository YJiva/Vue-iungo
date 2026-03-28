<template>
  <div class="user-login-page">
    <div class="user-login-card">
      <div class="title">
        <div class="brand">Iungo 登录</div>
        <div class="sub">登录后可继续访问当前页面</div>
      </div>

      <LoginForm @success="onSuccess" />
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import LoginForm from './login.vue'

const route = useRoute()
const router = useRouter()

const onSuccess = () => {
  const redirect = route.query.redirect ? String(route.query.redirect) : '/'
  router.replace(redirect)
}
</script>

<style scoped>
.user-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fff1f5;
}

.user-login-card {
  width: 420px;
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
</style>
