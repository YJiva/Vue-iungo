<template>
  <div class="page-post-create">
    <div class="container container-inner">
      <h2>发帖</h2>

      <el-form :model="form" label-width="80px">
        <el-form-item label="吧">
          <el-select v-model="form.categoryId" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="可选，不填会自动命名" />
        </el-form-item>

        <el-form-item label="正文">
          <el-input
            type="textarea"
            rows="4"
            v-model="form.textContent"
            placeholder="可选，支持纯文本"
          />
        </el-form-item>

        <el-form-item label="图片">
          <div class="img-toolbar">
            <input
              ref="imgInputRef"
              type="file"
              accept="image/*"
              multiple
              style="display:none"
              @change="onPickImages"
            />
            <el-button @click="imgInputRef?.click()" :disabled="form.images.length >= 10">选择图片</el-button>
            <span class="hint">最多 10 张（可拖拽排序）</span>
          </div>

          <div class="img-grid" v-if="form.images.length">
            <div
              class="img-item"
              v-for="(img, index) in form.images"
              :key="img.uid"
              draggable="true"
              @dragstart="onDragStart(index)"
              @dragover.prevent
              @drop="onDrop(index)"
            >
              <img :src="img.url" class="thumb" @click="preview(img.url)" />
              <div class="img-actions">
                <el-button text size="small" @click="preview(img.url)">预览</el-button>
                <el-button text size="small" type="danger" @click="removeImage(index)">删除</el-button>
              </div>
              <div class="order-badge">#{{ index + 1 }}</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="视频">
          <input ref="videoInputRef" type="file" accept="video/*" style="display:none" @change="onPickVideo" />
          <el-button @click="videoInputRef?.click()">选择视频</el-button>
          <div v-if="form.videoUrl" style="margin-top:8px;width:320px;">
            <video :src="form.videoUrl" controls style="width:100%;border-radius:8px;" />
            <div>
              <el-button text type="danger" @click="clearVideo">删除视频</el-button>
            </div>
          </div>
        </el-form-item>

        <el-button type="primary" @click="submit">发布</el-button>
      </el-form>
    </div>

    <el-dialog v-model="previewVisible" title="图片预览" width="720px">
      <img :src="previewUrl" style="width:100%;max-height:70vh;object-fit:contain;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const categories = ref([])
const imgInputRef = ref(null)
const videoInputRef = ref(null)
const previewVisible = ref(false)
const previewUrl = ref('')
const dragFromIndex = ref(-1)

const form = ref({
  categoryId: null,
  title: '',
  textContent: '',
  images: [], // [{uid,url}]
  videoUrl: ''
})

const loadCategories = async () => {
  const res = await request.get('/api/post/category/list')
  categories.value = (res.data && res.data.data) || []
}

const uploadImage = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  const resp = await fetch('/api/file/upload-editor-image', { method: 'POST', body: fd })
  const data = await resp.json()
  if (!(data && data.code === 200 && data.data?.url)) {
    throw new Error(data?.msg || '图片上传失败')
  }
  return data.data.url
}

const uploadVideo = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  const resp = await fetch('/api/file/upload-editor-video', { method: 'POST', body: fd })
  const data = await resp.json()
  if (!(data && data.code === 200 && data.data?.url)) {
    throw new Error(data?.msg || '视频上传失败')
  }
  return data.data.url
}

const onPickImages = async (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return

  const left = 10 - form.value.images.length
  if (left <= 0) {
    ElMessage.warning('最多上传 10 张图片')
    e.target.value = ''
    return
  }
  const picked = files.slice(0, left)
  if (files.length > left) {
    ElMessage.warning(`最多 10 张，已截取前 ${left} 张`)
  }

  try {
    for (const f of picked) {
      const url = await uploadImage(f)
      form.value.images.push({ uid: `${Date.now()}-${Math.random()}`, url })
    }
  } catch (err) {
    ElMessage.error(err.message || '图片上传失败')
  } finally {
    e.target.value = ''
  }
}

const onPickVideo = async (e) => {
  const file = (e.target.files || [])[0]
  if (!file) return
  try {
    form.value.videoUrl = await uploadVideo(file)
  } catch (err) {
    ElMessage.error(err.message || '视频上传失败')
  } finally {
    e.target.value = ''
  }
}

const removeImage = (index) => {
  form.value.images.splice(index, 1)
}

const preview = (url) => {
  previewUrl.value = url
  previewVisible.value = true
}

const onDragStart = (index) => {
  dragFromIndex.value = index
}

const onDrop = (toIndex) => {
  const from = dragFromIndex.value
  if (from < 0 || from === toIndex) return
  const arr = form.value.images
  const [moved] = arr.splice(from, 1)
  arr.splice(toIndex, 0, moved)
  dragFromIndex.value = -1
}

const clearVideo = () => {
  form.value.videoUrl = ''
}

const buildPostContentHtml = () => {
  const parts = []
  const text = (form.value.textContent || '').trim()
  if (text) {
    parts.push(`<p>${text.replace(/\n/g, '<br>')}</p>`)
  }
  form.value.images.forEach((img) => {
    parts.push(`<p><img src="${img.url}" style="max-width:100%;" /></p>`)
  })
  if (form.value.videoUrl) {
    parts.push(`<div><video controls style="max-width:100%;"><source src="${form.value.videoUrl}" type="video/mp4" /></video></div>`)
  }
  return parts.join('')
}

const submit = async () => {
  if (!form.value.categoryId) {
    ElMessage.warning('请选择所属吧')
    return
  }

  const hasText = !!(form.value.textContent || '').trim()
  const hasImage = form.value.images.length > 0
  const hasVideo = !!form.value.videoUrl
  if (!hasText && !hasImage && !hasVideo) {
    ElMessage.warning('至少发布文本、图片、视频中的一种')
    return
  }

  const autoTitle = hasImage ? '图片帖' : (hasVideo ? '视频帖' : '新帖')
  const payload = {
    categoryId: form.value.categoryId,
    title: (form.value.title || '').trim() || autoTitle,
    content: buildPostContentHtml()
  }

  const res = await request.post('/api/post/create', payload)
  if (res.data && res.data.code === 200) {
    ElMessage.success('发布成功')
    router.push(`/post/category/${form.value.categoryId}`)
  } else {
    ElMessage.error(res.data?.msg || '发布失败')
  }
}

onMounted(async () => {
  await loadCategories()
  if (route.query.categoryId) {
    form.value.categoryId = Number(route.query.categoryId)
  }
})
</script>

<style scoped>
.page-post-create { padding: 20px 0; }
.img-toolbar { display:flex; align-items:center; gap:10px; }
.hint { color:#909399; font-size:12px; }
.img-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:10px; margin-top:10px; width:100%; }
.img-item { position: relative; border:1px solid #eee; border-radius:8px; padding:6px; background:#fff; }
.thumb { width:100%; height:92px; object-fit:cover; border-radius:6px; cursor:pointer; }
.img-actions { display:flex; justify-content:space-between; margin-top:4px; }
.order-badge { position:absolute; top:8px; left:8px; background:rgba(0,0,0,.55); color:#fff; font-size:11px; padding:1px 6px; border-radius:10px; }
</style>
