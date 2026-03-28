<template>
  <div class="auth-layout">
    <el-radio-group v-model="mode" size="small" class="login-mode-selector" style="margin-bottom:20px;">
      <el-radio-button label="password">密码登录</el-radio-button>
      <el-radio-button label="email">邮箱验证码登录</el-radio-button>
    </el-radio-group>

    <el-form :model="form" :rules="currentRules" ref="loginFormRef" label-position="left" label-width="0px">
      <template v-if="mode === 'password'">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名 / 邮箱"></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码"></el-input>
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱"></el-input>
        </el-form-item>

        <el-form-item prop="code">
          <el-input
            v-model="form.code"
            placeholder="验证码"
            style="width: calc(100% - 110px);"
          ></el-input>
          <el-button
            :disabled="sendingCode || !form.email"
            size="small"
            @click="handleSendCode"
            style="margin-left: 6px;"
          >
            {{ sendText }}
          </el-button>
        </el-form-item>
      </template>

      <el-form-item>
        <div class="actions">
          <el-checkbox v-model="form.remember" v-if="mode === 'password'">记住我</el-checkbox>
          <el-button type="text" @click="$emit('open-register')">去注册</el-button>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" size="large" @click="handleLogin" style="width:100%">登录</el-button>
      </el-form-item>
    </el-form>

    <el-tooltip class="admin-entry-tooltip" placement="bottom" content="管理员登录" effect="dark">
      <button class="admin-entry" type="button" @click="goAdminLogin">
        <i class="fa-solid fa-ticket"></i>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup>
defineOptions({ name: 'LoginForm' })
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user'

const emit = defineEmits(['success', 'open-register', 'close-auth'])

const mode = ref('password') // 'password' or 'email'
const form = ref({
  username: '',
  password: '',
  email: '',
  code: '',
  remember: true
})
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const loginFormRef = ref(null)
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const passwordRules = {
  username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}
const emailRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const currentRules = computed(() => (mode.value === 'password' ? passwordRules : emailRules))

const sendText = computed(() => {
  if (countdown.value > 0) {
    return `重新发送 (${countdown.value}s)`
  }
  return '发送验证码'
})

function handleLogin() {
  if (!loginFormRef.value) return
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      let res
      if (mode.value === 'password') {
        res = await userStore.loginPassword({
          username: form.value.username,
          password: form.value.password
        })
      } else {
        res = await userStore.loginEmail({
          email: form.value.email,
          code: form.value.code
        })
      }

      if (res && res.data && res.data.code === 200) {
        ElMessage.success('登录成功')
        emit('success')
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } else if (res && res.data) {
        ElMessage.error(res.data.msg || '登录失败')
      } else {
        ElMessage.error('登录失败')
      }
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.msg || err?.message || '登录失败'
      ElMessage.error(msg)
    } finally {
      loading.value = false
    }
  })
}

function startCountdown() {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

async function handleSendCode() {
  if (!form.value.email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  sendingCode.value = true
  try {
    await userStore.sendEmailCode(form.value.email)
    ElMessage.success('验证码发送成功，请检查邮箱')
    startCountdown()
  } catch (err) {
    console.error(err)
    ElMessage.error(err.msg || '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

function goAdminLogin() {
  emit('close-auth')
  router.push('/admin/login')
}
</script>

<style scoped>
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auth-layout {
  position: relative;
  padding-bottom: 24px;
}

.admin-entry {
  position: absolute;
      right: -17px;
    bottom: -18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.admin-entry:hover {
  transform: translateY(-1px);
  color: rgb(99, 230, 190);
  background: #ecfeff;
}

</style>
