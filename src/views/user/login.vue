<template>
	<div class="auth-layout">
		<el-form :model="form" :rules="rules" ref="loginFormRef" label-position="left" label-width="0px">
			<el-form-item prop="username">
				<el-input v-model="form.username" placeholder="用户名 / 邮箱"></el-input>
			</el-form-item>

			<el-form-item prop="password">
				<el-input v-model="form.password" type="password" placeholder="密码"></el-input>
			</el-form-item>

			<el-form-item>
				<div class="actions">
					<el-checkbox v-model="form.remember">记住我</el-checkbox>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const emit = defineEmits(['success', 'open-register'])

const form = ref({ username: '', password: '', remember: true })
const loading = ref(false)
const loginFormRef = ref(null)
const router = useRouter()

const rules = {
	username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
	password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function handleLogin() {
	if (!loginFormRef.value) return
	loginFormRef.value.validate(async (valid) => {
		if (!valid) return
		loading.value = true
		try {
			await new Promise((r) => setTimeout(r, 700))
			ElMessage.success('登录成功')
			emit('success')
			router.push({ path: '/' })
		} catch (err) {
			ElMessage.error('登录失败')
		} finally {
			loading.value = false
		}
	})
}
</script>

<style scoped>
.actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>
