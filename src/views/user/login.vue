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
  </div>
</template>

<script setup>
defineOptions({ name: 'LoginForm' })
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
<<<<<<< HEAD
import { useRouter, useRoute } from 'vue-router'
=======
import { useRouter } from 'vue-router'
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
import { useUserStore } from '../../stores/user'

const emit = defineEmits(['success', 'open-register'])

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
<<<<<<< HEAD
const route = useRoute()
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
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

<<<<<<< HEAD
// 重构后的 handleLogin 方法
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
function handleLogin() {
  if (!loginFormRef.value) return
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
<<<<<<< HEAD
      let res
      if (mode.value === 'password') {
        res = await userStore.loginPassword({
=======
      if (mode.value === 'password') {
        await userStore.loginPassword({
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
          username: form.value.username,
          password: form.value.password
        })
      } else {
<<<<<<< HEAD
        res = await userStore.loginEmail({
=======
        await userStore.loginEmail({
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
          email: form.value.email,
          code: form.value.code
        })
      }
<<<<<<< HEAD


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
      // 可根据错误类型自定义提示
      const msg = err?.response?.data?.msg || err?.message || '登录失败'
      ElMessage.error(msg)
=======
      ElMessage.success('登录成功')
      emit('success')
      router.push({ path: '/' })
    } catch (err) {
      console.error(err)
      ElMessage.error('登录失败')
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
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

<<<<<<< HEAD
// 重构后的发送验证码方法
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
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
<<<<<<< HEAD
    ElMessage.error(err.msg || '发送验证码失败')
=======
    ElMessage.error('发送验证码失败')
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  } finally {
    sendingCode.value = false
  }
}
</script>

<<<<<<< HEAD

=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
<style scoped>
.actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>
