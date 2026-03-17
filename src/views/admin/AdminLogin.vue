<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="title">
        <div class="brand">Iungo后台管理系统</div>
        <div class="sub">仅管理员账号可登录</div>
      </div>

      <el-form :model="form" label-position="top" class="form" @keyup.enter="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-button type="primary" class="btn" :loading="loading" @click="onSubmit">登录</el-button>
      </el-form>

      <div class="tips">
        <span class="muted">提示：登录成功后将进入后台管理。</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminLoginPage' })
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

const onSubmit = async () => {
  if (loading.value) return
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await userStore.loginPassword({
      username: form.value.username,
      password: form.value.password
    })

    if (!res.data || res.data.code !== 200) {
      ElMessage.error(res.data?.msg || '登录失败')
      return
    }

    const roleId = userStore.userInfo && userStore.userInfo.roleId
    if (roleId !== 2) {
      // 非管理员：清理登录态，提示无权限
      userStore.logout()
      ElMessage.error('您不是管理员')
      return
    }

    ElMessage.success('登录成功')
    const redirect = route.query.redirect ? String(route.query.redirect) : '/admin/dashboard'
    router.replace(redirect)
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: calc(100vh - 0px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fff1f5;
}

.admin-login-card {
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

.form {
  margin-top: 10px;
}

.btn {
  width: 100%;
  margin-top: 6px;
}

.tips {
  margin-top: 12px;
}

.muted {
  color: rgba(17, 24, 39, 0.6);
  font-size: 12px;
}
</style>

