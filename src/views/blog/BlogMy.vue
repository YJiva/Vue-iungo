<template>
  <div class="page-blog-my">
    <div class="container container-inner">
      <h2>我的博客</h2>

      <el-card class="editor-card">
        <h3>新建博客</h3>
        <el-form :model="form" ref="formRef" label-width="80px">
          <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入标题', trigger: 'blur' }]">
            <el-input v-model="form.title" />
          </el-form-item>
          <el-form-item label="内容" prop="content" :rules="[{ required: true, message: '请输入内容', trigger: 'blur' }]">
            <el-input type="textarea" rows="8" v-model="form.content" />
          </el-form-item>
          <el-form-item label="标签">
            <el-input v-model="form.tags" placeholder="以逗号分隔，如：Vue3,SpringBoot" />
          </el-form-item>
          <el-form-item label="可见范围">
            <el-select v-model="form.openScope">
              <el-option :value="0" label="仅自己可见" />
              <el-option :value="1" label="自己 + 公共" />
              <el-option :value="2" label="公开" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveBlog">保存</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="list-card" style="margin-top: 20px;">
        <h3>我的博客列表</h3>
        <div v-if="loading" style="text-align: center; padding: 16px;">
          <el-loading-spinner /> 加载中...
        </div>
        <div v-else>
          <div v-if="!blogs.length" style="color: var(--text-light); padding: 16px;">
            暂无博客，先写一篇吧。
          </div>
          <div
            v-for="b in blogs"
            :key="b.id"
            class="blog-row"
          >
            <div class="title">{{ b.title }}</div>
            <div class="meta">
              <span>创建时间：{{ b.createTime }}</span>
              <span>可见范围：{{ scopeLabel(b.openScope) }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const saving = ref(false)
const loading = ref(false)
const blogs = ref([])

const form = ref({
  title: '',
  content: '',
  tags: '',
  openScope: 2
})

const scopeLabel = (scope) => {
  if (scope === 0) return '仅自己'
  if (scope === 1) return '自己 + 公共'
  return '公开'
}

const fetchMyBlogs = async () => {
  if (!userStore.userInfo || !userStore.userInfo.id) return
  loading.value = true
  try {
    const res = await request.get('/api/blog/list-by-scope', {
      userId: userStore.userInfo.id,
      scope: 0
    })
    if (res.data && res.data.code === 200) {
      blogs.value = res.data.data || []
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载博客列表失败')
  } finally {
    loading.value = false
  }
}

const saveBlog = async () => {
  if (!userStore.userInfo || !userStore.userInfo.id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        ...form.value,
        userId: userStore.userInfo.id
      }
      const res = await request.post('/api/blog/save', payload)
      if (res.data && res.data.code === 200) {
        ElMessage.success('保存成功')
        form.value.title = ''
        form.value.content = ''
        form.value.tags = ''
        form.value.openScope = 2
        fetchMyBlogs()
      } else {
        ElMessage.error(res.data.msg || '保存失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('网络错误')
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  } else {
    fetchMyBlogs()
  }
})
</script>

<style scoped>
.page-blog-my {
  padding: 20px 0;
}
.editor-card,
.list-card {
  max-width: 800px;
  margin: 0 auto;
}
.blog-row {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.blog-row:last-child {
  border-bottom: none;
}
.title {
  font-weight: 500;
}
.meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}
</style>

