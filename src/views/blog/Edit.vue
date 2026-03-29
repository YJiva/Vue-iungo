<template>
  <div class="page-blog-edit">
    <div class="container container-inner">
      <h2>{{ isEdit ? '编辑博客' : '发布博客' }}</h2>
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
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
        </el-form-item>
        <el-form-item label="可见范围">
          <el-select v-model="form.openScope" style="width: 260px;">
            <el-option :value="4" label="全部可见" />
            <el-option :value="2" label="仅粉丝可见" />
            <el-option :value="3" label="仅互关可见" />
            <el-option :value="1" label="仅自己可见" />
          </el-select>
          <span class="scope-hint">仅在你点击「发布」时生效；存草稿不会保存该选项。</span>
        </el-form-item>
        <el-form-item>
          <el-button :loading="draftSaving" @click="saveToDraft">保存到草稿箱</el-button>
          <el-button type="primary" :loading="publishing" @click="publishBlog">发布</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const draftSaving = ref(false)
const publishing = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', title: '', content: '', tags: '', openScope: 4 })
const tagOptions = ref([]) // [{ id, name, show }]
const selectedTagIds = ref([]) // [id, id...]
const typeMap = ref({})
const draftTimer = ref(null)
const lastDraftSignature = ref('')

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

editorConfig.MENU_CONF.uploadVideo = {
  async customUpload(file, insertFn) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/file/upload-editor-video', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.code === 200 && data.data && data.data.url) {
        insertFn(data.data.url)
      } else {
        ElMessage.error(data.msg || '视频上传失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('视频上传失败')
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
        const os = Number(b.openScope)
        form.value.openScope = [1, 2, 3, 4].includes(os) ? os : 4
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
  if (!form.value.id) {
    await checkLatestDraftOnEntry()
    await loadDefaultVisibilityScope()
  }
  startAutoDraftSave()
})

const detectFullscreen = () => {
  const el = document.querySelector('.w-e-full-screen-container')
  const active = !!el
  window.dispatchEvent(new CustomEvent('editor-fullscreen-change', { detail: { fullscreen: active } }))
}

const handleCreated = (editor) => {
  editorRef.value = editor
  editor.on('fullscreenChange', (isFull) => {
    window.dispatchEvent(new CustomEvent('editor-fullscreen-change', { detail: { fullscreen: !!isFull } }))
  })
  setTimeout(detectFullscreen, 60)
}

const onNativeFullscreen = () => {
  detectFullscreen()
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onNativeFullscreen)
})

onBeforeUnmount(() => {
  if (draftTimer.value) {
    clearInterval(draftTimer.value)
    draftTimer.value = null
  }
  document.removeEventListener('fullscreenchange', onNativeFullscreen)
  window.dispatchEvent(new CustomEvent('editor-fullscreen-change', { detail: { fullscreen: false } }))
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})

const buildDraftSignature = () => {
  // 草稿仅存正文相关，可见范围不参与去重（后端草稿 open_scope 恒为 0）
  return JSON.stringify({
    id: form.value.id || null,
    title: (form.value.title || '').trim(),
    content: (html.value || '').trim(),
    tags: selectedTagIds.value.join(',')
  })
}

const saveDraftSilently = async () => {
  const userId = userStore.userInfo && userStore.userInfo.id
  if (!userId) return
  const plain = (html.value || '').replace(/<[^>]+>/g, '').trim()
  const title = (form.value.title || '').trim()
  const hasMeaningful = !!title || !!plain || selectedTagIds.value.length > 0
  if (!hasMeaningful) return
  const signature = buildDraftSignature()
  if (signature === lastDraftSignature.value) return
  const payload = {
    id: form.value.id || null,
    title: form.value.title || '',
    content: html.value || '',
    tags: selectedTagIds.value.join(','),
    openScope: 0
  }
  const res = await request.post('/api/blog/save-draft', payload)
  if (res.data && res.data.code === 200) {
    if (!form.value.id && res.data.id) {
      form.value.id = res.data.id
    }
    lastDraftSignature.value = signature
  }
}

const startAutoDraftSave = () => {
  if (draftTimer.value) clearInterval(draftTimer.value)
  draftTimer.value = setInterval(() => {
    saveDraftSilently().catch(() => {})
  }, 30000)
}

const checkLatestDraftOnEntry = async () => {
  try {
    const res = await request.get('/api/blog/draft/latest')
    const draft = res.data?.data
    if (!draft || !draft.id) return
    await ElMessageBox.confirm(
      '检测到你有未发布草稿。点击“继续编辑”将恢复草稿；点击“清空草稿”将删除草稿并新建博客。',
      '发现草稿',
      {
        confirmButtonText: '继续编辑',
        cancelButtonText: '清空草稿',
        distinguishCancelAndClose: true,
        type: 'warning'
      }
    )
    form.value.id = draft.id
    form.value.title = draft.title || ''
    html.value = draft.content || ''
    const dOs = Number(draft.openScope)
    if ([1, 2, 3, 4].includes(dOs)) {
      form.value.openScope = dOs
    } else {
      await loadDefaultVisibilityScope()
    }
    selectedTagIds.value = String(draft.tags || '')
      .split(',')
      .map((s) => Number(String(s).trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  } catch (e) {
    if (e === 'cancel') {
      await request.post('/api/blog/draft/clear')
      form.value.id = ''
      form.value.title = ''
      html.value = ''
      selectedTagIds.value = []
      form.value.openScope = 4
      ElMessage.success('草稿已清空')
    }
  }
}

const loadDefaultVisibilityScope = async () => {
  try {
    const res = await request.get('/api/blog/visibility/my')
    if (res.data?.code === 200) {
      const scope = Number(res.data.data?.visibilityScope || 4)
      if ([1, 2, 3, 4].includes(scope)) {
        form.value.openScope = scope
      }
    }
  } catch {
    form.value.openScope = 4
  }
}

/** 手动保存草稿（与自动保存同一接口） */
const saveToDraft = async () => {
  const userId = userStore.userInfo && userStore.userInfo.id
  if (!userId) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  const plain = (html.value || '').replace(/<[^>]+>/g, '').trim()
  const title = (form.value.title || '').trim()
  if (!title && !plain && !selectedTagIds.value.length) {
    ElMessage.warning('请至少填写标题、正文或标签后再存草稿')
    return
  }
  draftSaving.value = true
  try {
    const payload = {
      id: form.value.id || null,
      title: form.value.title || '',
      content: html.value || '',
      tags: selectedTagIds.value.join(','),
      openScope: 0
    }
    const res = await request.post('/api/blog/save-draft', payload)
    if (res.data?.code === 200) {
      if (!form.value.id && res.data.id) {
        form.value.id = res.data.id
      }
      lastDraftSignature.value = buildDraftSignature()
      ElMessage.success('已保存到草稿箱')
    } else {
      ElMessage.error(res.data?.msg || '保存草稿失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  } finally {
    draftSaving.value = false
  }
}

const publishBlog = async () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const title = (form.value.title || '').trim()
    if (!title) {
      ElMessage.warning('发布前请填写标题')
      return
    }
    const plain = (html.value || '').replace(/<[^>]+>/g, '').trim()
    if (!plain) {
      ElMessage.warning('发布前请填写正文内容')
      return
    }
    const scope = Number(form.value.openScope)
    if (![1, 2, 3, 4].includes(scope)) {
      ElMessage.warning('请选择可见范围')
      return
    }
    publishing.value = true
    try {
      const userId = userStore.userInfo && userStore.userInfo.id
      if (!userId) {
        ElMessage.warning('请先登录再发布博客')
        router.push({ path: '/login', query: { redirect: route.fullPath } })
        return
      }
      form.value.tags = selectedTagIds.value.join(',')
      form.value.content = html.value
      const payload = {
        id: form.value.id,
        userId,
        title: form.value.title,
        content: form.value.content,
        tags: form.value.tags,
        status: 1,
        openScope: scope
      }
      const res = await request.post('/api/blog/save', payload)
      if (res.data && res.data.code === 200) {
        await request.post('/api/blog/draft/clear').catch(() => {})
        ElMessage.success('发布成功')
        router.push('/blog/list?mode=circle')
      } else {
        ElMessage.error(res.data?.msg || res.data?.message || '发布失败')
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('网络错误')
    } finally {
      publishing.value = false
    }
  })
}
</script>

<style scoped>
.page-blog-edit {
  padding: 20px 0;
}

:deep(.w-e-full-screen-container) {
  z-index: 9999 !important;
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
  min-height: 50vh;
}

.rich-editor-body :deep(.w-e-text-container) {
  min-height: 50vh !important;
}

.rich-editor-body :deep(.w-e-text-placeholder) {
  top: 14px;
}

.page-blog-edit { padding: 20px 0; }

.scope-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
