<template>
  <div class="page-blog-detail">
    <div class="container container-inner">
      <h2>{{ blog.title || '博客详情' }}</h2>
      <p>
        作者 {{ getUserName(blog.userId)|| '未知' }}
          阅读次数：{{ blog.read || 0 }}
      </p>
      <div v-if="canEditBlog" style="margin: 8px 0 14px;">
        <el-button size="small" type="primary" plain @click="goEditBlog">重新编辑</el-button>
      </div>
      <div v-if="resolveTags(blog).length" style="margin: 8px 0 16px 0;">
        <el-tag
          v-for="t in resolveTags(blog)"
          :key="t.id"
          :type="t.show === 0 ? 'info' : 'success'"
          :effect="t.show === 0 ? 'plain' : 'light'"
          style="margin-right: 6px; margin-bottom: 4px;"
        >
          {{ t.name }}
        </el-tag>
      </div>
      <div class="content" v-html="blog.content"></div>
      <section style="margin-top:20px;">
        <h3>互动</h3>
        <div style="display:flex;gap:16px;align-items:center;">
          <span>点赞：{{ likeCount }}</span>
          <el-button size="small" :type="liked ? 'primary' : 'default'" @click="toggleLike">
            {{ liked ? '取消点赞' : '点赞' }}
          </el-button>
          <span>收藏：{{ favoriteCount }}</span>
          <el-button size="small" :type="favorited ? 'primary' : 'default'" @click="toggleFavorite">
            {{ favorited ? '取消收藏' : '收藏' }}
          </el-button>
        </div>
      </section>
      <section style="margin-top:20px;position: relative;">
        <h3>评论（{{ commentCount }}）</h3>
        <el-input type="textarea" rows="3" class="commentBig" v-model="newComment" placeholder="写下你的评论"></el-input>
        <div style="margin-top:8px;"><el-button type="primary" class="Bigreply-send-btn"  size="small" @click="addComment()">
          <i class="fa-solid fa-paper-plane" style="color: rgb(255, 255, 255);"></i>
        </el-button></div>
        <div class="comment-tools" v-if="commentRoots.length">
          <el-radio-group v-model="replyOrder" size="small">
            <el-radio-button label="desc">最新在前</el-radio-button>
            <el-radio-button label="asc">最早在前</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="commentRoots.length" style="margin-top:12px;">
          <div v-for="root in visibleTopComments" :key="root.id" class="comment-root">
            <div class="comment-meta-row">
              <el-avatar :src="getUserAvatar(root.userId)" :size="26" class="comment-avatar" @click="goUser(root.userId)" />
              <div class="comment-meta">
                <span class="user-link" @click="goUser(root.userId)">{{ getUserName(root.userId) }}</span>
                · {{ formatTime(root.createTime) }}
              </div>
            </div>
            <div class="comment-content">{{ root.content }}</div>
            <div class="reply-op-row">
              <el-button text size="small" @click="toggleCommentLike(root.id)"><i class="fa-heart" :class="root.liked ? 'fa-solid' : 'fa-regular'" style="color: rgb(239, 39, 21);"></i>{{ root.likeCount || 0 }}</el-button>
              <el-button text size="small" @click="openReplyBox(root.id, root.userId, root.id, root.id)"><i class="fa-solid fa-comment-dots" style="color: rgb(6, 156, 140);"></i></el-button>
              <el-button v-if="canDeleteComment(root.userId)" text size="small" @click="deleteComment(root.id)"><i class="fa-solid fa-trash-can" style="color: rgb(255, 41, 11);"></i></el-button>
            </div>
            <!-- 根评论回复框：改造为内嵌发送按钮 -->
            <div v-if="replyingTo[root.id] && replyingTo[root.id].atCommentId === root.id" class="reply-box">
              <div class="reply-input-wrapper">
                <el-input
                type="text"
                show-word-limit="true"
                  v-model="replyDraft[root.id]"
                  size="small"
                  :placeholder="`回复 ${getUserName(replyingTo[root.id].uid)}`"
                  class="reply-input"
                  @blur="handleReplyBlur(root.id)"
                  @keyup.enter="addComment(replyingTo[root.id].cid, root.id)"
                />
                <el-button

                  size="small"
                  type="primary"
                  class="reply-send-btn"
                  @click="addComment(replyingTo[root.id].cid, root.id)"

                >
              <i class="fa-solid fa-paper-plane" style="color: rgb(255, 255, 255);"></i></el-button>
              </div>
            </div>
            <div v-if="root.allReplies.length" class="reply-list">
              <div
                v-for="r in visibleReplies(root.id)"
                :key="r.id"
                class="reply-item"
              >
                <div class="reply-head">
                  <el-avatar :src="getUserAvatar(r.userId)" :size="22" class="comment-avatar" @click="goUser(r.userId)" />
                  <div class="reply-content">
                    <span class="user-link" @click="goUser(r.userId)">{{ getUserName(r.userId) }}</span>
                    回复
                    <el-avatar :src="getUserAvatar(r.replyToUserId || root.userId)" :size="18" class="reply-to-avatar" @click="goUser(r.replyToUserId || root.userId)" />
                    <span class="user-link" @click="goUser(r.replyToUserId || root.userId)">{{ getUserName(r.replyToUserId || root.userId) }}</span>
                    ：{{ r.content }}
                  </div>
                </div>
                <div class="reply-meta-row">
                  <div class="reply-meta">{{ formatTime(r.createTime) }}</div>
                  <div class="reply-op-row">
                    <el-button text size="small" @click="toggleCommentLike(r.id)"><i class="fa-heart" :class="r.liked ? 'fa-solid' : 'fa-regular'" style="color: rgb(239, 39, 21);"></i>{{ r.likeCount || 0 }}</el-button>
                    <el-button text size="small" @click="openReplyBox(root.id, r.userId, r.id, r.id)"><i class="fa-solid fa-comment-dots" style="color: rgb(6, 156, 140);"></i></el-button>
                    <el-button v-if="canDeleteComment(r.userId)" text size="small" @click="deleteComment(r.id)"><i class="fa-solid fa-trash-can" style="color: rgb(255, 41, 11);"></i></el-button>
                  </div>
                </div>
                <!-- 子评论回复框：改造为内嵌发送按钮 -->
                <div v-if="replyingTo[root.id] && replyingTo[root.id].atCommentId === r.id" class="reply-box">
                  <div class="reply-input-wrapper">
                    <el-input
                      v-model="replyDraft[root.id]"
                      size="small"
                      :placeholder="`回复 ${getUserName(replyingTo[root.id].uid)}`"
                      class="reply-input"
                      @blur="handleReplyBlur(root.id)"
                      @keyup.enter="addComment(replyingTo[root.id].cid, root.id)"
                    />
                    <el-button

                      size="small"
                      type="primary"
                      class="reply-send-btn"
                      @click="addComment(replyingTo[root.id].cid, root.id)"
                    >
                      <i class="fa-solid fa-paper-plane" style=" color: rgb(255, 255, 255);"></i>
                    </el-button>
                  </div>
                </div>
              </div>
              <div class="reply-actions" v-if="root.allReplies.length > 6">
                <el-button text size="small" @click="toggleExpand(root.id)">
                  {{ expandedMap[root.id] ? '收起回复' : `展开全部回复（${root.allReplies.length}）` }}
                </el-button>
                <el-button
                  v-if="expandedMap[root.id] && canLoadMore(root.id)"
                  text
                  size="small"
                  @click="loadMoreReplies(root.id)"
                >
                  更多回复（+5）
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="hasMoreTopComments" class="top-comment-more">
          <el-button text @click="loadMoreTopComments">下拉加载更多评论</el-button>
        </div>
        <div v-else-if="!commentRoots.length" style="color:var(--text-light);margin-top:12px;">暂无评论</div>
      </section>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'BlogDetailPage' })
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { buildBlogTypeMap, resolveBlogTags } from '../../utils/blogTags'
import { useUserStore } from '../../stores/user'
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const blog = ref({})
const blogId = ref(null)
const typeMap = ref({})
const liked = ref(false)
const favorited = ref(false)
const likeCount = ref(0)
const favoriteCount = ref(0)
const commentCount = ref(0)
const commentRoots = ref([])
const topCommentPage = ref(1)
const topCommentPageSize = 10
const newComment = ref('')
const replyDraft = ref({})
const replyingTo = ref({})
const expandedMap = ref({})
const expandedLimitMap = ref({})
const userMap = ref({})
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'
const replyOrder = ref('desc')

async function fetchDetail(id) {
  try {
    const resp = await request.get(`/api/blog/detail/${id}`)
    if (resp.data && resp.data.code === 200) {
      blog.value = (resp.data.data && (resp.data.data.blog || resp.data.data)) || {}
      ensureUserProfile(blog.value.userId)
    } else {
      ElMessage.error(resp.data?.msg || '获取详情失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('获取详情失败')
  }
}


const fetchBlogTypes = async () => {
  try {
    const resp = await request.get('/api/blog/types')
    if (resp.data && resp.data.code === 200 && Array.isArray(resp.data.data)) {
      typeMap.value = buildBlogTypeMap(resp.data.data)
    }
  } catch (e) {
    console.error('加载博客标签类型失败', e)
  }
}

const resolveTags = (bRef) => {
  const b = bRef && bRef.value ? bRef.value : bRef
  return resolveBlogTags(b && b.tags, typeMap.value)
}

const fetchInteractStatus = async () => {
  if (!blogId.value) return
  const res = await request.get('/api/blog/interact/status', { blogId: blogId.value })
  if (res.data && res.data.code === 200 && res.data.data) {
    liked.value = !!res.data.data.liked
    favorited.value = !!res.data.data.favorited
    likeCount.value = Number(res.data.data.likeCount || 0)
    favoriteCount.value = Number(res.data.data.favoriteCount || 0)
    commentCount.value = Number(res.data.data.commentCount || 0)
  }
}

const buildFlattenReplies = (items, rootUserId) => {
  const list = []
  const walk = (arr, replyToUserId) => {
    ;(arr || []).forEach((it) => {
      const next = {
        id: it.id,
        userId: it.userId,
        content: it.content,
        likeCount: Number(it.likeCount || 0),
        liked: !!it.liked,
        createTime: it.createTime,
        replyToUserId: replyToUserId || rootUserId,
        children: it.children || []
      }
      list.push(next)
      walk(next.children, next.userId)
    })
  }
  walk(items || [], rootUserId)
  return list
}

const normalizeRoots = (rawRoots) => {
  const roots = (rawRoots || []).map((r) => {
    const allReplies = buildFlattenReplies((r.children || []).map((x) => ({ ...x, liked: !!x.liked, likeCount: Number(x.likeCount || 0) })), r.userId)
    return {
      ...r,
      liked: !!r.liked,
      likeCount: Number(r.likeCount || 0),
      allReplies
    }
  })
  roots.forEach((r) => {
    if (expandedMap.value[r.id] == null) expandedMap.value[r.id] = false
    if (expandedLimitMap.value[r.id] == null) expandedLimitMap.value[r.id] = 6
    if (expandedMap.value[r.id]) {
      const current = expandedLimitMap.value[r.id] || 6
      const left = r.allReplies.length - current
      expandedLimitMap.value[r.id] = left > 0 && left <= 5 ? r.allReplies.length : Math.min(current, r.allReplies.length)
    }
    ensureUserProfile(r.userId)
    r.allReplies.forEach((x) => {
      ensureUserProfile(x.userId)
      ensureUserProfile(x.replyToUserId)
    })
  })
  commentRoots.value = roots
}

const fetchComments = async () => {
  if (!blogId.value) return
  const res = await request.get('/api/blog/interact/comments', { blogId: blogId.value })
  if (res.data && res.data.code === 200) {
    normalizeRoots(res.data.data || [])
  }
}

const orderedReplies = (root) => {
  const arr = [...(root?.allReplies || [])]
  arr.sort((a, b) => {
    const ta = new Date(a.createTime).getTime() || 0
    const tb = new Date(b.createTime).getTime() || 0
    return replyOrder.value === 'desc' ? tb - ta : ta - tb
  })
  return arr
}

const visibleReplies = (rootId) => {
  const root = commentRoots.value.find((r) => r.id === rootId)
  if (!root) return []
  const arr = orderedReplies(root)
  if (!expandedMap.value[rootId]) {
    return arr.slice(0, 6)
  }
  return arr.slice(0, expandedLimitMap.value[rootId])
}

const toggleExpand = async (rootId) => {
  expandedMap.value[rootId] = !expandedMap.value[rootId]
  if (expandedMap.value[rootId]) {
    expandedLimitMap.value[rootId] = 6
    await loadMoreReplies(rootId)
  } else {
    expandedLimitMap.value[rootId] = 6
    closeReplyBox(rootId)
  }
}

const canLoadMore = (rootId) => {
  const root = commentRoots.value.find((r) => r.id === rootId)
  if (!root) return false
  const left = root.allReplies.length - (expandedLimitMap.value[rootId] || 6)
  return left > 5
}

const loadMoreReplies = async (rootId) => {
  const current = expandedLimitMap.value[rootId] || 6
  const next = current + 5
  await fetchComments()
  expandedMap.value[rootId] = true
  const root = commentRoots.value.find((r) => r.id === rootId)
  const total = root ? root.allReplies.length : next
  const left = total - next
  expandedLimitMap.value[rootId] = left > 0 && left <= 5 ? total : Math.min(next, total)
}

async function toggleLike() {
  if (!blogId.value) return
  try {
    const res = await request.post('/api/blog/interact/like/toggle', null, { params: { blogId: blogId.value } })
    if (res.data && res.data.code === 200) {
      liked.value = !!res.data.liked
      likeCount.value = Number(res.data.likeCount || 0)
    } else {
      ElMessage.error(res.data?.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

async function toggleFavorite() {
  if (!blogId.value) return
  try {
    const res = await request.post('/api/blog/interact/favorite/toggle', null, { params: { blogId: blogId.value } })
    if (res.data && res.data.code === 200) {
      favorited.value = !!res.data.favorited
      favoriteCount.value = Number(res.data.favoriteCount || 0)
    } else {
      ElMessage.error(res.data?.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

const canDeleteComment = (commentUserId) => {
  const uid = userStore.userInfo?.id
  const roleId = userStore.userInfo?.roleId
  return !!uid && (uid === commentUserId || roleId === 2)
}

async function toggleCommentLike(commentId) {
  try {
    const res = await request.post('/api/blog/interact/comment/like/toggle', null, { params: { commentId } })
    if (!(res.data && res.data.code === 200)) {
      ElMessage.error(res.data?.msg || '操作失败')
      return
    }
    await fetchComments()
  } catch (e) {
    ElMessage.error('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

async function deleteComment(commentId) {
  try {
    const res = await request.post('/api/blog/interact/comment/delete', null, { params: { commentId } })
    if (!(res.data && res.data.code === 200)) {
      ElMessage.error(res.data?.msg || '删除失败')
      return
    }
    ElMessage.success('删除成功')
    await fetchComments()
    await fetchInteractStatus()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const openReplyBox = (rootId, replyToUid, parentCommentId = null, atCommentId = null) => {
  replyingTo.value[rootId] = { uid: replyToUid, cid: parentCommentId, atCommentId: atCommentId || rootId }
}

const closeReplyBox = (rootId) => {
  replyingTo.value[rootId] = null
  replyDraft.value[rootId] = ''
}

// 新增：回复输入框失焦处理，延迟200ms避免点击发送按钮触发失焦
const handleReplyBlur = (rootId) => {
  setTimeout(() => {
    closeReplyBox(rootId)
  }, 200)
}

async function addComment(parentId = null, rootId = null) {
  if (!blogId.value) return
  const content = parentId != null ? (replyDraft.value[rootId] || '').trim() : newComment.value.trim()
  if (!content) return
  try {
    const res = await request.post('/api/blog/interact/comment/add', null, {
      params: { blogId: blogId.value, content, parentCommentId: parentId || undefined }
    })
    if (res.data && res.data.code === 200 && res.data.data) {
      const saved = res.data.data
      ensureUserProfile(saved.userId)
      if (parentId != null) {
        const root = commentRoots.value.find((r) => r.id === rootId)
        if (root) {
          const replyToUid = replyingTo.value[rootId]?.uid || root.userId
          root.allReplies.unshift({
            id: saved.id,
            userId: saved.userId,
            content: saved.content,
            createTime: saved.createTime,
            replyToUserId: replyToUid,
            children: []
          })
        }
        replyDraft.value[rootId] = ''
        replyingTo.value[rootId] = null
      } else {
        const node = {
          ...saved,
          children: [],
          allReplies: []
        }
        commentRoots.value.unshift(node)
        newComment.value = ''
      }
      commentCount.value += 1
    } else {
      ElMessage.error(res.data?.msg || '评论失败')
    }
  } catch (e) {
    ElMessage.error('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
  }
}

const ensureUserProfile = async (uid) => {
  if (!uid || userMap.value[uid]) return
  try {
    const res = await request.get('/api/user/public-profile', { userId: uid })
    if (res.data && res.data.code === 200 && res.data.data) {
      userMap.value[uid] = res.data.data



    }
  } catch {
    // ignore
  }
}

const getUserName = (uid) => {
  const u = userMap.value[uid]
  console.log(u);

  return u?.nickname || u?.username || String(uid)

}



const getUserAvatar = (uid) => {
  const u = userMap.value[uid]
  return u?.avatar || defaultAvatar
}

const canEditBlog = computed(() => {
  const uid = userStore.userInfo?.id
  return !!uid && !!blog.value?.userId && uid === blog.value.userId
})

const goEditBlog = () => {
  if (!blog.value?.id) return
  router.push({ path: '/blog/edit', query: { id: blog.value.id } })
}

const goUser = (uid) => {
  if (!uid) return
  router.push(`/user/profile/${uid}`)
}

const visibleTopComments = computed(() => {
  const count = topCommentPage.value * topCommentPageSize
  return commentRoots.value.slice(0, count)
})

const hasMoreTopComments = computed(() => visibleTopComments.value.length < commentRoots.value.length)

const loadMoreTopComments = () => {
  if (hasMoreTopComments.value) {
    topCommentPage.value += 1
  }
}

watch(replyOrder, () => {
  // 仅触发视图重排，不请求接口
})

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return t
  const now = Date.now()
  const diffMs = Math.max(0, now - d.getTime())
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  if (diffMs < minute) {
    return '1分钟前'
  }
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute)
    return `${Math.max(1, m)}分钟前`
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour)
    return `${Math.max(1, h)}小时前`
  }
  if (diffMs < week) {
    const dd = Math.floor(diffMs / day)
    return `${Math.max(1, dd)}天前`
  }
  const y = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}


onMounted(async () => {
  const id = route.params.id
  if (!id) {
    ElMessage.warning('未指定博客ID')
    router.push('/blog/list')
    return
  }
  blogId.value = Number(id)
  await fetchBlogTypes()
  await fetchDetail(id)
  await fetchInteractStatus()
  await fetchComments()
})
</script>

<style scoped>
.page-blog-detail { padding: 20px 0; }
.content { white-space: pre-wrap; }
.comment-root { padding: 10px 0; border-bottom: 1px solid #eee; }
.comment-meta-row { display: flex; align-items: center; gap: 8px; }
.comment-avatar { cursor: pointer; }
.comment-meta { color: var(--text-light); }
.comment-content { margin-top: 4px; }
.reply-box { margin-top: 8px; }
.reply-box-actions { display: flex; gap: 8px; }
.reply-list { margin-top: 8px; padding-left: 14px; border-left: 2px solid #f0f0f0; }
.reply-item { padding: 6px 0; }
.reply-head { display: flex; align-items: flex-start; gap: 8px; }
.reply-meta-row { display: flex; align-items: center; justify-content: space-between; margin-left: 30px; }
.reply-meta { color: var(--text-light); font-size: 12px; margin-top: 2px; }
.reply-actions { display: flex; gap: 8px; margin-top: 4px; }
.comment-tools { margin-top: 10px; }
.top-comment-more { margin-top: 8px; text-align: center; }
.user-link { color: #303133; cursor: pointer; transition: color 0.2s ease; }
.user-link:hover { color: #409eff; text-decoration: none; }
.reply-to-avatar { margin: 0 4px; vertical-align: middle; cursor: pointer; }

/* 新增：回复输入框样式 - 豆包式圆角+内嵌圆形发送按钮 */
.reply-input-wrapper {
  position: relative;
  width: 100%;
}
.reply-input {
  border-radius: 20px !important;
  padding-right: 50px !important;
  height: 36px !important;
  line-height: 36px !important;
  border: 1px solid #e5e7eb !important;

}

/deep/ .el-input .el-input__wrapper {
position: absolute;
width: 100%;
font-weight: bold;
  padding-right: 50px !important;
  border-radius: 20px !important;
  height: 36px !important;
  line-height: 36px !important;
}


.commentBig :deep(.el-textarea__inner) {
  border-radius: 12px  12px 18px 12px !important;
  border: 1px solid #e5e7eb !important;
  min-height: 45px !important;

}
.Bigreply-send-btn {
        width: 35px;
    height: 35px;
    border-radius: 60px;
    position: relative;
   left: 97.8%;
    /* top: 65px; */
    bottom: 47px;
}
.reply-send-btn {
  position: absolute;
  right: 4px;
  top: 52%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50% !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff !important;
  border: none !important;
}
.reply-send-btn:hover {
  border: none !important;
  background: #337ecc !important;
}
/* 小屏幕适配 */
@media (max-width: 768px) {
  .reply-input-wrapper {
    width: 95%;
  }
}
</style>
