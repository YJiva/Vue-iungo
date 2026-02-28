<template>
  <div class="page-blog-edit">
    <div class="container container-inner">
      <h2>{{ isEdit ? '编辑博客' : '发布博客' }}</h2>
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input type="textarea" rows="10" v-model="form.content"></el-input>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags" placeholder="逗号分隔"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveBlog">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', title: '', content: '', tags: '' })

onMounted(() => {
  // support editing if id passed via query or params
  const id = route.query.id || route.params.id
  if (id) {
    isEdit.value = true
    // fetch blog detail if such API exists (not specified)
    // placeholder: assign id
    form.value.id = id
  }
})

const saveBlog = async () => {
  if (!formRef.value) return
  formRef.value.validate(async valid => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        id: form.value.id,
        title: form.value.title,
        content: form.value.content,
        tags: form.value.tags
      }
      const res = await request.post('/api/post/create', payload)
      if (res.data && res.data.code === 200) {
        ElMessage.success('保存成功')
        router.push('/blog/list')
      } else {
        ElMessage.error(res.data.message || '保存失败')
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('网络错误')
    } finally {
      saving.value = false
    }
  })
}
</script>

<style scoped>
.page-blog-edit { padding: 20px 0; }
</style>
