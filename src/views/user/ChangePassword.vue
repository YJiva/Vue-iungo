<template>
  <div class="page-change-password">
    <div class="container container-inner" v-if="userStore.isLoggedIn">
      <h2>修改密码</h2>
      <el-card class="pwd-card">
        <el-form :model="pwdForm" :rules="pwdRules" ref="pwdRef" label-width="90px">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwdForm.newPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirm">
            <el-input v-model="pwdForm.confirm" type="password" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="savingPwd" @click="submitPassword">修改密码</el-button>
            <el-button @click="router.push('/settings')">返回编辑资料</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <div v-else class="container container-inner">
      <p>未登录或会话已过期，请先登录。</p>
      <el-button type="primary" @click="router.push('/login')">去登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const pwdRef = ref(null)
const savingPwd = ref(false)

const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirm: ''
})

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirm: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }]
}

const submitPassword = () => {
  if (!pwdRef.value) return
  pwdRef.value.validate(async (valid) => {
    if (!valid) return
    if (pwdForm.value.newPassword !== pwdForm.value.confirm) {
      ElMessage.error('两次输入的新密码不一致')
      return
    }
    savingPwd.value = true
    try {
      const res = await userStore.changePassword({
        oldPassword: pwdForm.value.oldPassword,
        newPassword: pwdForm.value.newPassword
      })
      if (res.data && res.data.code === 200) {
        ElMessage.success('密码已修改，请使用新密码重新登录')
        userStore.logout()
        router.push('/login')
      } else if (res.data) {
        ElMessage.error(res.data.msg || '修改失败')
      } else {
        ElMessage.error('修改失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('网络错误')
    } finally {
      savingPwd.value = false
    }
  })
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
})
</script>

<style scoped>
.page-change-password {
  padding: 20px 0;
}

.pwd-card {
  max-width: 560px;
}
</style>
