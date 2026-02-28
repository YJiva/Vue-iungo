<template>
	<div class="auth-layout">
		<el-form :model="form" :rules="rules" ref="regForm" label-position="left" label-width="0px">
			<el-form-item prop="username">
				<el-input v-model="form.username" placeholder="用户名"></el-input>
			</el-form-item>

			<el-form-item prop="email">
        <el-input v-model="form.email" placeholder="邮箱"></el-input>
      </el-form-item>

      <el-form-item prop="nickname">
        <el-input v-model="form.nickname" placeholder="昵称（可选）"></el-input>
      </el-form-item>

      <el-form-item prop="inviteCode">
        <el-input v-model="form.inviteCode" placeholder="邀请码"></el-input>
      </el-form-item>

      <el-form-item prop="emailCode">
        <el-input
          v-model="form.emailCode"
          placeholder="验证码"
          style="width: calc(100% - 110px);"
        ></el-input>
        <el-button
          :disabled="sendingCode || !form.email"
          size="small"
          @click="sendRegisterCode"
          style="margin-left: 6px;"
        >
          {{ sendText }}
        </el-button>
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="密码"></el-input>
      </el-form-item>

      <el-form-item prop="confirm">
        <el-input v-model="form.confirm" type="password" placeholder="确认密码"></el-input>
      </el-form-item>
			<el-form-item>
				<el-button type="primary" :loading="loading" size="large" @click="handleRegister" style="width:100%">注册</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

const emit = defineEmits(['success'])

const form = ref({ username: '', email: '', nickname: '', inviteCode: '', emailCode: '', password: '', confirm: '' })
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const regForm = ref(null)
const router = useRouter()
const userStore = useUserStore()

const sendText = computed(() => {
  if (countdown.value > 0) {
    return `重新发送 (${countdown.value}s)`
  }
  return '发送验证码'
})

const rules = {
	username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
	email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
	nickname: [],
	inviteCode: [{ required: true, message: '请输入邀请码', trigger: 'blur' }],
	emailCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
	password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
	confirm: [{ required: true, message: '请确认密码', trigger: 'blur' }]
}

function handleRegister() {
	if (!regForm.value) return
	regForm.value.validate(async (valid) => {
		if (!valid) return
		if (form.value.password !== form.value.confirm) {
			ElMessage.error('两次输入的密码不一致')
			return
		}
		loading.value = true
		try {
			await userStore.register({
				username: form.value.username,
				email: form.value.email,
				emailCode: form.value.emailCode,
				nickname: form.value.nickname,
				inviteCode: form.value.inviteCode,
				password: form.value.password
			})
			ElMessage.success('注册成功')
			emit('success')
			router.push({ path: '/' })
		} catch (err) {
			ElMessage.error('注册失败')
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

async function sendRegisterCode() {
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
    ElMessage.error('发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}
</script>

<style scoped>
.auth-layout {
	padding: 8px 0;
}
</style>