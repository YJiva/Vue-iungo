<template>
  <div class="page-blog-detail">
    <div class="container container-inner">
      <h2>{{ blog.title || '博客详情' }}</h2>
      <p>作者：{{ blog.authorId || blog.author || '匿名' }}</p>
      <div class="content" v-html="blog.content"></div>

      

      <section style="margin-top:20px;">
        <h3>互动</h3>
        <div>收藏：{{ blog.favorites || 0 }} <el-button size="small" @click="toggleFavorite">切换收藏</el-button></div>
      </section>

      <section style="margin-top:20px;">
        <h3>评论</h3>
        <el-input type="textarea" rows="3" v-model="newComment" placeholder="写下你的评论"></el-input>
        <div style="margin-top:8px;"><el-button type="primary" size="small" @click="addComment">发布评论</el-button></div>
        <div v-if="comments.length" style="margin-top:12px;">
          <div v-for="c in comments" :key="c.id" style="padding:8px 0;border-bottom:1px solid #eee;">
            <div style="color:var(--text-light)">用户：{{ c.userId }} · {{ c.createTime }}</div>
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

const route = useRoute()
const router = useRouter()
const blog = ref({})
// versions removed - backend does not expose version/restore for posts
const comments = ref([])
const newComment = ref('')

async function fetchDetail(id) {
  try {
    const resp = await request.get(`/api/post/detail`, { id })
    if (resp.data && resp.data.code === 200) {
      blog.value = resp.data.data || {}
      fetchComments(id)
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('获取详情失败')
  }
}

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
})
</script>

<style scoped>
.page-blog-detail { padding: 20px 0; }
.content { white-space: pre-wrap; }
</style>
