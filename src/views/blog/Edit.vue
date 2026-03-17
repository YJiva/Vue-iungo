<template>
  <div class="page-blog-edit">
    <div class="container container-inner">
      <h2>{{ isEdit ? '编辑博客' : '发布博客' }}</h2>
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
<<<<<<< HEAD
          <div class="rich-editor">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
              class="rich-editor-toolbar"
            />
            <Editor
              v-model="html"
              :defaultConfig="editorConfig"
              mode="default"
              class="rich-editor-body"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="selectedTagIds"
            multiple
            filterable
            default-first-option
            placeholder="选择标签（保存后会按ID写入 blog.tags）"
            style="width: 100%;"
          >
            <el-option
              v-for="t in tagOptions"
              :key="t.id"
              :label="t.show === 0 ? `${t.name}（隐藏）` : t.name"
              :value="t.id"
            />
          </el-select>
=======
          <el-input type="textarea" rows="10" v-model="form.content"></el-input>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags" placeholder="逗号分隔"></el-input>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveBlog">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
<<<<<<< HEAD
import { ref, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { useUserStore } from '../../stores/user'
import { buildBlogTypeMap } from '../../utils/blogTags'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
// wangEditor 需要 shallowRef 保存 editor 实例
const editorRef = shallowRef(null)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', title: '', content: '', tags: '' })
const tagOptions = ref([]) // [{ id, name, show }]
const selectedTagIds = ref([]) // [id, id...]
const typeMap = ref({})

// 编辑器 HTML 内容
const html = ref('')

const toolbarConfig = {
  // 需要精简/扩展工具栏时可以在这里调整
}

const editorConfig = {
  placeholder: '请输入正文内容，支持排版、图片、链接等富文本格式',
  MENU_CONF: {}
}

// 图片上传：复用后端 /api/file/upload-editor-image
editorConfig.MENU_CONF.uploadImage = {
  async customUpload(file, insertFn) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/file/upload-editor-image', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.code === 200 && data.data && data.data.url) {
        insertFn(data.data.url, file.name, data.data.url)
      } else {
        ElMessage.error(data.msg || '图片上传失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('图片上传失败')
    }
  }
}

onMounted(async () => {
=======
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
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  // support editing if id passed via query or params
  const id = route.query.id || route.params.id
  if (id) {
    isEdit.value = true
<<<<<<< HEAD
    // 编辑模式下可以在这里根据 id 拉取详情并填充表单（留给后续扩展）
    form.value.id = id
  }

  // 加载 blog_type（前端统一用 id/name/show 解析与提交）
  try {
    const res = await request.get('/api/blog/types')
    if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      typeMap.value = buildBlogTypeMap(res.data.data)
      tagOptions.value = Object.values(typeMap.value).filter((t) => t && t.id != null)
    }
  } catch (e) {
    console.error(e)
  }

  // 编辑模式：回填标题/内容/tags
  if (form.value.id) {
    try {
      const detail = await request.get(`/api/blog/detail/${form.value.id}`)
      if (detail.data && detail.data.code === 200) {
        const b = (detail.data.data && (detail.data.data.blog || detail.data.data)) || {}
        form.value.title = b.title || ''
        html.value = b.content || ''
        // tags 是逗号分隔的数字 id
        selectedTagIds.value = String(b.tags || '')
          .split(',')
          .map((s) => Number(String(s).trim()))
          .filter((n) => Number.isFinite(n) && n > 0)
      }
    } catch (e) {
      console.error(e)
    }
  }
})

const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
=======
    // fetch blog detail if such API exists (not specified)
    // placeholder: assign id
    form.value.id = id
  }
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
})

const saveBlog = async () => {
  if (!formRef.value) return
  formRef.value.validate(async valid => {
    if (!valid) return
<<<<<<< HEAD
    // 简单校验富文本内容是否为空（去掉 HTML 标签后判断）
    const plain = (html.value || '').replace(/<[^>]+>/g, '').trim()
    if (!plain) {
      ElMessage.warning('正文内容不能为空')
      return
    }
    saving.value = true
    try {
      const userId = userStore.userInfo && userStore.userInfo.id
      if (!userId) {
        ElMessage.warning('请先登录再发布博客')
        router.push({ path: '/login', query: { redirect: route.fullPath } })
        return
      }
      // 将多选标签合并为逗号分隔字符串存入后端
      form.value.tags = selectedTagIds.value.join(',')
      form.value.content = html.value
      const payload = {
        id: form.value.id,
        userId,
=======
    saving.value = true
    try {
      const payload = {
        id: form.value.id,
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
        title: form.value.title,
        content: form.value.content,
        tags: form.value.tags
      }
<<<<<<< HEAD
      // 使用博客模块的保存接口
      const res = await request.post('/api/blog/save', payload)
=======
      const res = await request.post('/api/post/create', payload)
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
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
<<<<<<< HEAD
.page-blog-edit {
  padding: 20px 0;
}

.rich-editor {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.rich-editor-toolbar {
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.rich-editor-body {
  height: 100%;
  min-height: 320px;
}
=======
.page-blog-edit { padding: 20px 0; }
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
</style>
