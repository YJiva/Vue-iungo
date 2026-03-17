<template>
  <div class="page-settings">
    <div class="container container-inner" v-if="user">
      <h2>账户设置</h2>
      <div class="settings-grid">
        <el-card class="settings-card">
          <h3>基本资料</h3>
          <el-form :model="profileForm" :rules="profileRules" ref="profileRef" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" disabled />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" placeholder="展示名称" />
            </el-form-item>
             <el-form-item label="性别" prop="gender">
             <el-radio-group v-model="profileForm.gender">
      <el-radio :label="1">男</el-radio>
      <el-radio :label="2">女</el-radio>
      <el-radio :label="0">未知</el-radio>
  </el-radio-group>
            </el-form-item>
            <el-form-item label="头像">
              <div class="avatar-row">
                <el-avatar
                  :src="profileForm.avatar || defaultAvatar"
                  size="large"
                  class="avatar-preview"
                />
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="onAvatarChange"
                >
                  <el-button type="primary" link>上传头像</el-button>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                rows="3"
                placeholder="简单介绍一下自己吧"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingProfile" @click="submitProfile">
                保存资料
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="settings-card">
          <h3>修改密码</h3>
          <el-form :model="pwdForm" :rules="pwdRules" ref="pwdRef" label-width="90px">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirm">
              <el-input v-model="pwdForm.confirm" type="password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingPwd" @click="submitPassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
    <div v-else class="container container-inner">
      <p>未登录或会话已过期，请先登录。</p>
      <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
    </div>

    <el-dialog
      v-model="avatarDialogVisible"
      title="裁剪头像"
      width="400px"
      :close-on-click-modal="false"
    >
      <VuePictureCropper
        v-if="avatarDialogVisible"
        :img="rawAvatar"
        :box-style="{ width: '100%', height: '300px', backgroundColor: '#f5f5f5' }"
        :options="{ viewMode: 1, dragMode: 'move', aspectRatio: 1 }"
      />
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadCroppedAvatar">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'


const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.userInfo)

const profileRef = ref(null)
const pwdRef = ref(null)
const savingProfile = ref(false)
const savingPwd = ref(false)

const profileForm = ref({
  id: '',
  username: '',
  email: '',
  nickname: '',
  avatar: '',
  bio: '',
  gender: ''
})

const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'
const avatarDialogVisible = ref(false)
const rawAvatar = ref('')

const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirm: ''
})

const profileRules = {
  nickname: [{ required: false }]
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirm: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }]
}

const initProfile = () => {
  if (!user.value) return
  profileForm.value = {
    id: user.value.id,
    username: user.value.username,
    email: user.value.email,
    nickname: user.value.nickname || '',
    avatar: user.value.avatar || '',
    bio: user.value.bio || '',
    gender: user.value.gender || 0
  }
}

const onAvatarChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    rawAvatar.value = e.target.result
    avatarDialogVisible.value = true
  }
  reader.readAsDataURL(file)
}

const uploadCroppedAvatar = async () => {
  try {
    const blob = await cropper.getBlob()
    if (!blob) {
      ElMessage.error('请先选择裁剪区域')
      return
    }
    const formData = new FormData()
    formData.append('file', blob, 'avatar.png')
    const res = await fetch('/api/file/upload-avatar', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data && data.data.url) {
      // 1. 更新本地表单中的相对路径
      profileForm.value.avatar = data.data.url
      // 2. 立即调用后端接口，把相对路径写入数据库 user.avatar
      if (user.value) {
        const payload = {
          id: user.value.id,
          username: user.value.username,
          email: user.value.email,
          nickname: profileForm.value.nickname,
          avatar: profileForm.value.avatar,
          bio: profileForm.value.bio,
          gender: profileForm.value.gender
        }
        const resUpdate = await userStore.updateProfile(payload)
        if (!(resUpdate.data && resUpdate.data.code === 200)) {
          ElMessage.error(resUpdate.data?.msg || '同步头像到服务器失败')
          return
        }
      }
      ElMessage.success('头像上传并已保存')
      avatarDialogVisible.value = false
    } else {
      ElMessage.error(data.msg || '上传失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('上传失败')
  }
}

const submitProfile = () => {
  if (!profileRef.value || !user.value) return
  profileRef.value.validate(async (valid) => {
    if (!valid) return
    savingProfile.value = true
    try {
      const payload = {
        id: user.value.id,
        username: profileForm.value.username,
        email: profileForm.value.email,
        nickname: profileForm.value.nickname,
        avatar: profileForm.value.avatar,
        bio: profileForm.value.bio,
        gender: profileForm.value.gender
      }
      const res = await userStore.updateProfile(payload)
      if (res.data && res.data.code === 200) {
        ElMessage.success('资料已更新')
      } else if (res.data) {
        ElMessage.error(res.data.msg || '更新失败')
      } else {
        ElMessage.error('更新失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('网络错误')
    } finally {
      savingProfile.value = false
    }
  })
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
        // 可选：修改密码后强制退出
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
  } else {
    initProfile()
  }
})
</script>

<style scoped>
.page-settings {
  padding: 20px 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 12px;
}

.settings-card {
  min-height: 220px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-preview {
  border: 1px solid var(--border-color);
}

.avatar-uploader {
  margin-left: 8px;
}
</style>
