<template>
	<div class="auth-layout">
		<el-form :model="form" :rules="rules" ref="regForm" label-position="left" label-width="0px">
			<el-form-item prop="username">
				<el-input v-model="form.username" placeholder="用户名"></el-input>
			</el-form-item>

			<el-form-item prop="email">
				<el-input v-model="form.email" placeholder="邮箱"></el-input>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const emit = defineEmits(['success'])

const form = ref({ username: '', email: '', password: '', confirm: '' })
const loading = ref(false)
const regForm = ref(null)
const router = useRouter()

const rules = {
	username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
	email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
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
			await new Promise((r) => setTimeout(r, 700))
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
</script>

<style scoped>
.auth-layout {
	padding: 8px 0;
}
</style>