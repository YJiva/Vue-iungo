<template>
  <div class="page-blog-edit">
    <div class="container container-inner">
      <h2>{{ isEdit ? '编辑博客' : '发布博客' }}</h2>
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <QuillEditor
            ref="editorRef"
            v-model:content="form.content"
            content-type="html"
            theme="snow"
            :modules="modules"
            placeholder="请输入正文内容，支持加粗、列表、图片等富文本格式"
            class="rich-editor"
          />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="selectedTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入标签"
            style="width: 100%;"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
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
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const editorRef = ref(null)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', title: '', content: '', tags: '' })
const tagOptions = ref([])
const selectedTags = ref([])

// Quill 富文本配置：完整工具栏 + 自定义图片上传
const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    handlers: {
      image: () => handleInsertImage()
    }
  }
}

onMounted(async () => {
  // support editing if id passed via query or params
  const id = route.query.id || route.params.id
  if (id) {
    isEdit.value = true
    // 编辑模式下可以在这里根据 id 拉取详情并填充表单（留给后续扩展）
    form.value.id = id
  }
  // 加载后台已有标签列表
  try {
    const res = await request.get('/api/blog/tags')
    if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      tagOptions.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
})

// 处理图片插入：本地选择图片 -> 上传到后端 -> 插入到编辑器
const handleInsertImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files && input.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/file/upload-editor-image', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.code === 200 && data.data && data.data.url) {
        const quill = editorRef.value && editorRef.value.getEditor()
        if (!quill) return
        const range = quill.getSelection(true)
        const index = range ? range.index : quill.getLength()
        quill.insertEmbed(index, 'image', data.data.url)
        quill.setSelection(index + 1)
      } else {
        ElMessage.error(data.msg || '图片上传失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('图片上传失败')
    }
  }
  input.click()
}

const saveBlog = async () => {
  if (!formRef.value) return
  formRef.value.validate(async valid => {
    if (!valid) return
    // 简单校验富文本内容是否为空（去掉 HTML 标签后判断）
    const plain = (form.value.content || '').replace(/<[^>]+>/g, '').trim()
    if (!plain) {
      ElMessage.warning('正文内容不能为空')
      return
    }
    saving.value = true
    try {
      // 将多选标签合并为逗号分隔字符串存入后端
      form.value.tags = selectedTags.value.join(',')
      const payload = {
        id: form.value.id,
        title: form.value.title,
        content: form.value.content,
        tags: form.value.tags
      }
      // 使用博客模块的保存接口
      const res = await request.post('/api/blog/save', payload)
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
.page-blog-edit {
  padding: 20px 0;
}

.rich-editor {
  min-height: 320px;
}

/* 让 Quill 编辑区域更明显一些 */
.rich-editor :deep(.ql-container) {
  min-height: 260px;
}
</style>
