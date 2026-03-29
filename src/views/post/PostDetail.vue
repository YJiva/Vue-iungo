<template>
  <div class="page-post-detail">
    <div class="container container-inner" @click="handleContentImageClick">
      <div v-if="post.id">
        <h2>{{ post.title }}</h2>
        <div class="floor-card floor-main">
          <div class="floor-head-row">
            <div class="floor-head">
              1楼（楼主） ·
              <UserHoverCard :user-id="post.authorId" :avatar-size="20" :category-id="post.categoryId" :can-mute-in-bar="canManageBar" />
              · {{ post.createTime }}
            </div>
          </div>
          <div class="content" v-html="post.content"></div>
          <div class="post-actions">
            <el-button size="small" :type="postLiked ? 'primary' : 'default'" @click="togglePostLike">
              {{ postLiked ? '取消点赞' : '点赞' }}（{{ postLikeCount }}）
            </el-button>
            <el-button v-if="canDeletePost" size="small" type="danger" @click="deletePost">删除帖子</el-button>
          </div>
        </div>
      </div>



          <div class="floor-header">

            <el-switch v-model="onlyAuthor" active-text="只看楼主" />
          </div>


        <div v-for="(c, idx) in filteredComments" :key="c.id" class="floor-card">
          <div class="floor-head-row">
            <div class="floor-head"  style="display: flex;">
              {{ idx + 2 }}楼 ·
              <UserHoverCard :user-id="c.userId" :avatar-size="18" :category-id="post.categoryId" :can-mute-in-bar="canManageBar" />
              · {{ c.createTime }}
            </div>
          </div>
          <div class="floor-content" v-html="c.content"></div>
          <div class="op-row">
            <el-button text size="small" @click="openRootReply(c.id)">回复</el-button>
            <el-button text size="small" @click="toggleCommentLike(c)">点赞（{{ c.likeCount || 0 }}）</el-button>
            <el-button v-if="canDeleteComment(c.userId)" text size="small" type="danger" @click="deleteComment(c.id)">删除</el-button>
          </div>

          <div v-if="rootInlineReplyTargetId === c.id" class="inline-reply-box">
            <el-input
              v-model="rootInlineReplyText"
              type="textarea"
              rows="2"
              placeholder="请输入回复内容（楼中楼仅支持文字）"
              @blur="closeRootInlineReply"
            />
            <div class="inline-reply-actions">
              <el-button size="small" type="primary" @mousedown.prevent @click="submitRootInlineReply">发送</el-button>
              <el-button size="small" @mousedown.prevent @click="closeRootInlineReply">取消</el-button>
            </div>
          </div>

          <div v-if="visibleSubs(c).length" class="sub-list">
            <div v-for="sub in visibleSubs(c)" :key="sub.id" class="sub-item">
              <div class="sub-head-row" >
                <div class="sub-head" style="display: flex;">
                  <UserHoverCard :user-id="sub.userId" :avatar-size="16" :category-id="post.categoryId" :can-mute-in-bar="canManageBar" />
                  回复
                  <UserHoverCard :user-id="sub.replyToUserId || c.userId" :avatar-size="16" :category-id="post.categoryId" :can-mute-in-bar="canManageBar" />
                  · {{ sub.createTime }}
                </div>
              </div>
              <div class="sub-content" v-html="sub.content"></div>
              <div class="op-row">
                <el-button text size="small" @click="openSubReply(sub.id)">回复</el-button>
                <el-button text size="small" @click="toggleCommentLike(sub)">点赞（{{ sub.likeCount || 0 }}）</el-button>
                <el-button v-if="canDeleteComment(sub.userId)" text size="small" type="danger" @click="deleteComment(sub.id)">删除</el-button>
              </div>

              <div v-if="inlineReplyTargetId === sub.id" class="inline-reply-box">
                <el-input
                  v-model="inlineReplyText"
                  type="textarea"
                  rows="2"
                  placeholder="请输入回复内容（楼中楼仅支持文字）"
                  @blur="closeInlineReply"
                />
                <div class="inline-reply-actions">
                  <el-button size="small" type="primary" @mousedown.prevent @click="submitInlineReply">发送</el-button>
                  <el-button size="small" @mousedown.prevent @click="closeInlineReply">取消</el-button>
                </div>
              </div>
            </div>

            <div v-if="(c.children || []).length > 6" class="sub-op">
              <el-button text size="small" @click="toggleExpand(c.id)">
                {{ expanded[c.id] ? '收起回复' : `展开回复（${(c.children || []).length}）` }}
              </el-button>
              <el-button
                v-if="expanded[c.id] && canLoadMore(c)"
                text
                size="small"
                @click="loadMoreSub(c.id)"
              >
                更多回复（+5）
              </el-button>
            </div>
          </div>
        </div>


      <el-card style="margin-top:16px;">
        <template #header>回帖</template>
        <div v-if="replyToId" class="reply-tip">
          正在回复评论 #{{ replyToId }}
          <el-button text size="small" @click="clearReplyTo">取消</el-button>
        </div>

        <el-form label-width="80px">
          <el-form-item label="文字">
            <el-input type="textarea" rows="3" v-model="replyForm.text" placeholder="可选，支持纯文本" />
          </el-form-item>

          <el-form-item label="图片">
            <div class="img-toolbar">
              <input ref="imgInputRef" type="file" accept="image/*" multiple style="display:none" @change="onPickImages" />
              <el-button @click="imgInputRef?.click()" :disabled="replyForm.images.length >= 10">选择图片</el-button>
              <span class="hint">最多 10 张（可拖拽排序）</span>
            </div>

            <div class="img-grid" v-if="replyForm.images.length">
              <div
                class="img-item"
                v-for="(img, index) in replyForm.images"
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
            <div v-if="replyForm.videoUrl" style="margin-top:8px;width:320px;">
              <video :src="replyForm.videoUrl" controls style="width:100%;border-radius:8px;" />
              <div>
                <el-button text type="danger" @click="clearVideo">删除视频</el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>

        <div style="margin-top:8px;">
          <el-button type="primary" @click="submitReply">发送</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="previewVisible" title="图片预览" width="720px">
      <img :src="previewUrl" style="width:100%;max-height:70vh;object-fit:contain;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import UserHoverCard from '../../components/UserHoverCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const post = ref({})
const barAdmins = ref([])
const comments = ref([])
const onlyAuthor = ref(false)
const replyToId = ref(null)
const postLiked = ref(false)
const postLikeCount = ref(0)
const expanded = ref({})
const subLimit = ref({})

const imgInputRef = ref(null)
const videoInputRef = ref(null)
const previewVisible = ref(false)
const previewUrl = ref('')
const dragFromIndex = ref(-1)
const inlineReplyText = ref('')
const inlineReplyTargetId = ref(null)
const rootInlineReplyText = ref('')
const rootInlineReplyTargetId = ref(null)

const replyForm = ref({
  text: '',
  images: [],
  videoUrl: ''
})

const loadPost = async () => {
  const id = Number(route.query.id)
  const res = await request.get('/api/post/detail', { id })
  if (res.data?.code === 200) {
    post.value = res.data.data || {}
  }
}

const loadBarAdmins = async () => {
  if (!post.value?.categoryId) {
    barAdmins.value = []
    return
  }
  try {
    const res = await request.get('/api/post/category/detail', { id: post.value.categoryId })
    const data = res.data?.data || {}
    barAdmins.value = data.admins || []
  } catch {
    barAdmins.value = []
  }
}

const loadPostInteract = async () => {
  const id = Number(route.query.id)
  if (!id) return
  const likeRes = await request.get('/api/post/like/status', { id })
  if (likeRes.data?.code === 200) {
    postLiked.value = !!likeRes.data.liked
    postLikeCount.value = Number(likeRes.data.likeCount || 0)
  }
}

const canDeletePost = computed(() => {
  const uid = userStore.userInfo?.id
  const roleId = userStore.userInfo?.roleId
  return !!uid && !!post.value?.authorId && (uid === post.value.authorId || roleId === 2)
})

const canManageBar = computed(() => {
  const uid = userStore.userInfo?.id
  const roleId = userStore.userInfo?.roleId
  if (!uid) return false
  if (roleId === 2) return true
  return (barAdmins.value || []).some((a) => Number(a.userId) === Number(uid))
})

const togglePostLike = async () => {
  const id = Number(route.query.id)
  const res = await request.post('/api/post/like', null, { params: { id } })
  if (res.data?.code === 200) {
    postLiked.value = !!res.data.liked
    postLikeCount.value = Number(res.data.likeCount || 0)
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const deletePost = async () => {
  const id = Number(route.query.id)
  const res = await request.post('/api/post/delete', null, { params: { id } })
  if (res.data?.code === 200) {
    ElMessage.success('删除成功')
    router.push(post.value?.categoryId ? `/post/category/${post.value.categoryId}` : '/post/category/list')
  } else {
    ElMessage.error(res.data?.msg || '删除失败')
  }
}

const flattenChildren = (arr, rootUserId) => {
  const out = []
  const walk = (list, replyTo) => {
    ;(list || []).forEach((x) => {
      const node = {
        ...x,
        replyToUserId: replyTo || rootUserId,
        children: x.children || []
      }
      out.push(node)
      walk(node.children, node.userId)
    })
  }
  walk(arr || [], rootUserId)
  return out
}

const loadComments = async () => {
  const id = Number(route.query.id)
  const res = await request.get('/api/post/comment/list', { postId: id })
  if (res.data?.code !== 200) return

  const roots = (res.data.data || []).map((r) => ({
    ...r,
    children: flattenChildren(r.children || [], r.userId)
  }))

  roots.forEach((r) => {
    if (expanded.value[r.id] == null) expanded.value[r.id] = false
    if (subLimit.value[r.id] == null) subLimit.value[r.id] = 6
  })
  comments.value = roots
}

const filteredComments = computed(() => {
  if (!onlyAuthor.value) return comments.value
  const authorId = post.value?.authorId
  return comments.value
    .filter((c) => c.userId === authorId)
    .map((c) => ({
      ...c,
      children: (c.children || []).filter((s) => s.userId === authorId)
    }))
})

const visibleSubs = (root) => {
  const arr = root.children || []
  if (!expanded.value[root.id]) return arr.slice(0, 6)
  return arr.slice(0, subLimit.value[root.id] || 6)
}

const toggleExpand = async (rootId) => {
  expanded.value[rootId] = !expanded.value[rootId]
  if (expanded.value[rootId]) {
    subLimit.value[rootId] = 11
    await loadComments()
    const root = comments.value.find((x) => x.id === rootId)
    const total = (root?.children || []).length
    subLimit.value[rootId] = Math.min(11, total)
  } else {
    subLimit.value[rootId] = 6
  }
}

const canLoadMore = (root) => {
  const left = (root.children || []).length - (subLimit.value[root.id] || 6)
  return left > 5
}

const loadMoreSub = async (rootId) => {
  const current = subLimit.value[rootId] || 6
  await loadComments()
  const root = comments.value.find((x) => x.id === rootId)
  const total = (root?.children || []).length
  const next = current + 5
  const left = total - next
  subLimit.value[rootId] = left > 0 && left <= 5 ? total : Math.min(next, total)
}

const setReplyTo = (cid) => {
  replyToId.value = cid
  // 进入楼中楼回复模式：清空图/视频，仅保留文字
  replyForm.value.images = []
  replyForm.value.videoUrl = ''
}

const openSubReply = (cid) => {
  inlineReplyTargetId.value = cid
  inlineReplyText.value = ''
}

const closeInlineReply = () => {
  inlineReplyTargetId.value = null
  inlineReplyText.value = ''
}

const openRootReply = (cid) => {
  rootInlineReplyTargetId.value = cid
  rootInlineReplyText.value = ''
}

const closeRootInlineReply = () => {
  rootInlineReplyTargetId.value = null
  rootInlineReplyText.value = ''
}

const clearReplyTo = () => {
  replyToId.value = null
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

  const left = 10 - replyForm.value.images.length
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
      replyForm.value.images.push({ uid: `${Date.now()}-${Math.random()}`, url })
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
    replyForm.value.videoUrl = await uploadVideo(file)
  } catch (err) {
    ElMessage.error(err.message || '视频上传失败')
  } finally {
    e.target.value = ''
  }
}

const removeImage = (index) => {
  replyForm.value.images.splice(index, 1)
}

const preview = (url) => {
  previewUrl.value = url
  previewVisible.value = true
}

const handleContentImageClick = (event) => {
  const target = event.target
  if (!target || target.tagName !== 'IMG') return
  const src = target.getAttribute('src')
  if (!src) return
  preview(src)
}

const onDragStart = (index) => {
  dragFromIndex.value = index
}

const onDrop = (toIndex) => {
  const from = dragFromIndex.value
  if (from < 0 || from === toIndex) return
  const arr = replyForm.value.images
  const [moved] = arr.splice(from, 1)
  arr.splice(toIndex, 0, moved)
  dragFromIndex.value = -1
}

const clearVideo = () => {
  replyForm.value.videoUrl = ''
}

const buildReplyContentHtml = () => {
  const text = (replyForm.value.text || '').trim()
  // 楼中楼仅支持文字
  if (replyToId.value) {
    return text ? `<p>${text.replace(/\n/g, '<br>')}</p>` : ''
  }

  const parts = []
  if (text) {
    parts.push(`<p>${text.replace(/\n/g, '<br>')}</p>`)
  }
  replyForm.value.images.forEach((img) => {
    parts.push(`<p><img src="${img.url}" style="max-width:100%;" /></p>`)
  })
  if (replyForm.value.videoUrl) {
    parts.push(`<div><video controls style="max-width:100%;"><source src="${replyForm.value.videoUrl}" type="video/mp4" /></video></div>`)
  }
  return parts.join('')
}

const canDeleteComment = (commentUserId) => {
  const uid = userStore.userInfo?.id
  const roleId = userStore.userInfo?.roleId
  return !!uid && (uid === commentUserId || roleId === 2)
}

const toggleCommentLike = async (comment) => {
  const res = await request.post('/api/post/comment/like/toggle', null, { params: { commentId: comment.id } })
  if (res.data?.code === 200) {
    comment.likeCount = Number(res.data.likeCount || 0)
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const deleteComment = async (commentId) => {
  const res = await request.post('/api/post/comment/delete', null, { params: { commentId } })
  if (res.data?.code === 200) {
    ElMessage.success('删除成功')
    await loadComments()
  } else {
    ElMessage.error(res.data?.msg || '删除失败')
  }
}

const submitReply = async () => {
  const hasText = !!(replyForm.value.text || '').trim()
  const hasImage = replyForm.value.images.length > 0
  const hasVideo = !!replyForm.value.videoUrl
  if (replyToId.value) {
    if (!hasText) {
      ElMessage.warning('楼中楼回复仅支持文字，且内容不能为空')
      return
    }
  } else if (!hasText && !hasImage && !hasVideo) {
    ElMessage.warning('至少发布文本、图片、视频中的一种')
    return
  }

  const payload = {
    postId: Number(route.query.id),
    parentCommentId: replyToId.value,
    content: buildReplyContentHtml()
  }
  const res = await request.post('/api/post/comment/add', payload)
  if (res.data?.code === 200) {
    ElMessage.success('回帖成功')
    replyForm.value.text = ''
    replyForm.value.images = []
    replyForm.value.videoUrl = ''
    replyToId.value = null
    await loadComments()
  } else {
    ElMessage.error(res.data?.msg || '回帖失败')
  }
}

const submitInlineReply = async () => {
  const text = (inlineReplyText.value || '').trim()
  if (!text) {
    ElMessage.warning('请输入回复内容')
    return
  }
  const payload = {
    postId: Number(route.query.id),
    parentCommentId: inlineReplyTargetId.value,
    content: `<p>${text.replace(/\n/g, '<br>')}</p>`
  }
  const res = await request.post('/api/post/comment/add', payload)
  if (res.data?.code === 200) {
    ElMessage.success('回复成功')
    closeInlineReply()
    await loadComments()
  } else {
    ElMessage.error(res.data?.msg || '回复失败')
  }
}

const submitRootInlineReply = async () => {
  const text = (rootInlineReplyText.value || '').trim()
  if (!text) {
    ElMessage.warning('请输入回复内容')
    return
  }
  const payload = {
    postId: Number(route.query.id),
    parentCommentId: rootInlineReplyTargetId.value,
    content: `<p>${text.replace(/\n/g, '<br>')}</p>`
  }
  const res = await request.post('/api/post/comment/add', payload)
  if (res.data?.code === 200) {
    ElMessage.success('回复成功')
    closeRootInlineReply()
    await loadComments()
  } else {
    ElMessage.error(res.data?.msg || '回复失败')
  }
}

onMounted(async () => {
  await loadPost()
  await loadBarAdmins()
  await loadPostInteract()
  await loadComments()
})
</script>

<style scoped>
.page-post-detail { padding: 20px 0; }
.meta { color:#909399; margin-bottom: 8px; }
.content { white-space: pre-wrap; }
.content :deep(img),
.floor-content :deep(img),
.sub-content :deep(img) {
  cursor: zoom-in;
}
.reply-tip { margin-bottom: 6px; color: #909399; }
.floor-header { display:flex; align-items:center; justify-content:space-between; }
.floor-card {
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);
}
.floor-head { color:#909399; font-size: 13px; }
.floor-content { margin: 6px 0; }
.sub-list { margin-top: 6px; padding-left: 12px; border-left: 2px solid #f2f2f2; }
.sub-item { margin-bottom: 8px; }
.sub-head { color:#909399; font-size: 12px; }
.sub-op { display: flex; gap: 8px; }
.img-toolbar { display:flex; align-items:center; gap:10px; }
.hint { color:#909399; font-size:12px; }
.img-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:10px; margin-top:10px; width:100%; }
.img-item { position: relative; border:1px solid #eee; border-radius:8px; padding:6px; background:#fff; }
.thumb { width:100%; height:92px; object-fit:cover; border-radius:6px; cursor:pointer; }
.img-actions { display:flex; justify-content:space-between; margin-top:4px; }
.order-badge { position:absolute; top:8px; left:8px; background:rgba(0,0,0,.55); color:#fff; font-size:11px; padding:1px 6px; border-radius:10px; }
/deep/ .user-inline{
  margin: 0px 5px;

}
</style>
