<template>
  <div class="page-blog-detail">
    <div class="container container-inner">
      <h2>{{ blog.title || '博客详情' }}</h2>
<<<<<<< HEAD
      <p>
        作者ID：{{ blog.userId || '未知' }}
        · 阅读次数：{{ blog.read || 0 }}
      </p>

      <!-- 标签展示：前端根据 blog.tags 自行解析并与 blog_type 关联，灰色表示 show = 0 -->
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

      <!-- 互动区域：先做样子 -->
      <section style="margin-top:20px;">
        <h3>互动</h3>
        <div style="display:flex;gap:16px;align-items:center;">
          <span>点赞：{{ likeCount }}</span>
          <el-button size="small" @click="toggleLike">点赞 / 取消</el-button>
          <span>收藏：{{ favoriteCount }}</span>
          <el-button size="small" @click="toggleFavorite">收藏 / 取消</el-button>
        </div>
=======
      <p>作者：{{ blog.authorId || blog.author || '匿名' }}</p>
      <div class="content" v-html="blog.content"></div>

      

      <section style="margin-top:20px;">
        <h3>互动</h3>
        <div>收藏：{{ blog.favorites || 0 }} <el-button size="small" @click="toggleFavorite">切换收藏</el-button></div>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
      </section>

      <section style="margin-top:20px;">
        <h3>评论</h3>
<<<<<<< HEAD
        <el-input type="textarea" rows="3" v-model="newComment" placeholder="写下你的评论（目前仅前端展示）"></el-input>
        <div style="margin-top:8px;"><el-button type="primary" size="small" @click="addComment">发布评论</el-button></div>
        <div v-if="comments.length" style="margin-top:12px;">
          <div v-for="(c, idx) in comments" :key="idx" style="padding:8px 0;border-bottom:1px solid #eee;">
            <div style="color:var(--text-light)">用户：{{ c.user || '游客' }} · {{ c.time }}</div>
=======
        <el-input type="textarea" rows="3" v-model="newComment" placeholder="写下你的评论"></el-input>
        <div style="margin-top:8px;"><el-button type="primary" size="small" @click="addComment">发布评论</el-button></div>
        <div v-if="comments.length" style="margin-top:12px;">
          <div v-for="c in comments" :key="c.id" style="padding:8px 0;border-bottom:1px solid #eee;">
            <div style="color:var(--text-light)">用户：{{ c.userId }} · {{ c.createTime }}</div>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
            <div>{{ c.content }}</div>
          </div>
        </div>
        <div v-else style="color:var(--text-light);margin-top:12px;">暂无评论</div>
      </section>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'BlogDetailPage' })
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
<<<<<<< HEAD
import { buildBlogTypeMap, resolveBlogTags } from '../../utils/blogTags'
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10

const route = useRoute()
const router = useRouter()
const blog = ref({})
<<<<<<< HEAD

// blog_type 映射：id -> { id, name, show }，由前端自行解析 tags 使用
const typeMap = ref({})

// 简单前端展示用的本地状态
const likeCount = ref(0)
const favoriteCount = ref(0)
=======
// versions removed - backend does not expose version/restore for posts
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
const comments = ref([])
const newComment = ref('')

async function fetchDetail(id) {
  try {
<<<<<<< HEAD
    const resp = await request.get(`/api/blog/detail/${id}`)
    if (resp.data && resp.data.code === 200) {
      // 后端返回的 blog 对象中包含 tags（逗号分隔的 id 字符串），由前端自行解析
      blog.value = (resp.data.data && (resp.data.data.blog || resp.data.data)) || {}
    } else {
      ElMessage.error(resp.data?.msg || '获取详情失败')
=======
    const resp = await request.get(`/api/post/detail`, { id })
    if (resp.data && resp.data.code === 200) {
      blog.value = resp.data.data || {}
      fetchComments(id)
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('获取详情失败')
  }
}

<<<<<<< HEAD
// 加载 blog_type 列表，构建 id -> 类型映射
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

function toggleLike() {
  // 仅前端样式：简单 +1 / -1 切换
  likeCount.value = likeCount.value ? 0 : 1
}

function toggleFavorite() {
  favoriteCount.value = favoriteCount.value ? 0 : 1
}

function addComment() {
  if (!newComment.value.trim()) {
    return
  }
  comments.value.push({
    user: '当前用户',
    time: new Date().toLocaleString(),
    content: newComment.value
  })
  newComment.value = ''
}

onMounted(() => {
  const id = route.params.id
  if (!id) {
    ElMessage.warning('未指定博客ID')
    router.push('/blog/list')
    return
  }
  // 先加载标签类型映射，再加载详情，前端自行解析 tags
  fetchBlogTypes().finally(() => {
    fetchDetail(id)
  })
=======
async function fetchComments(postId) {
  try {
    const r = await request.get('/api/post/comment/list', { postId })
    if (r.data && r.data.code === 200) comments.value = r.data.data || []
  } catch (e) { console.error(e) }
}

async function addComment() {
  if (!newComment.value.trim()) return
  try {
    const r = await request.post('/api/post/comment/add', { postId: blog.value.id, content: newComment.value })
    if (r.data && r.data.code === 200) {
      ElMessage.success('评论已发布')
      newComment.value = ''
      fetchComments(blog.value.id)
    } else ElMessage.error('发布失败')
  } catch (e) { console.error(e); ElMessage.error('网络错误') }
}

async function toggleFavorite() {
  if (!blog.value.id) return
  try {
    const r = await request.post('/api/post/favorite', null, { params: { id: blog.value.id } })
    if (r.data && r.data.code === 200) {
      blog.value.favorites = r.data.count ?? blog.value.favorites
      ElMessage.success(r.data.favorited ? '已收藏' : '已取消收藏')
    }
  } catch (e) { console.error(e); ElMessage.error('操作失败') }
}

// restore removed

onMounted(() => {
  const id = route.params.id
  if (id) {
    fetchDetail(id)
  } else {
    ElMessage.warning('未指定博客ID')
    router.push('/blog/list')
  }
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
})
</script>

<style scoped>
.page-blog-detail { padding: 20px 0; }
.content { white-space: pre-wrap; }
</style>
