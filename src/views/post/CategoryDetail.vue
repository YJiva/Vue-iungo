<template>
  <div class="page-post-category-detail">
    <div class="container container-inner">
      <div class="head-row">
        <div>
          <h2>{{ category.name || '贴吧详情' }}</h2>
          <p style="color:#909399">{{ category.description || '暂无简介' }}</p>
        </div>
        <el-button type="primary" @click="goCreatePost">在本吧发帖</el-button>
      </div>

      <el-card style="margin-bottom: 12px;">
        <template #header>吧务</template>
        <el-tag v-for="a in admins" :key="`${a.userId}-${a.role}`" :type="a.role==='OWNER'?'danger':'info'" style="margin-right:6px;">
          {{ a.role }}: {{ a.userId }}
        </el-tag>
      </el-card>

      <el-card>
        <template #header>帖子</template>
        <div class="infinite-wrap" v-infinite-scroll="loadMore" :infinite-scroll-distance="30" style="min-height: 240px;">
          <div class="post-card" v-for="p in posts" :key="p.id" @click="goPost(p.id)">
            <div class="post-cover" v-if="getCover(p)">
              <img :src="getCover(p)" alt="cover" />
            </div>
            <div class="post-body">
              <div class="post-title">{{ p.title }}</div>
              <div class="post-meta">作者{{ p.authorId }} · {{ p.createTime }}</div>
            </div>
          </div>
          <div class="more-tip">{{ noMore ? '没有更多帖子了' : '下拉加载更多...' }}</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'

const route = useRoute()
const router = useRouter()
const category = ref({})
const admins = ref([])
const posts = ref([])
const offset = ref(0)
const limit = 10
const noMore = ref(false)
const loading = ref(false)

const categoryId = Number(route.params.id)

const loadDetail = async () => {
  const res = await request.get('/api/post/category/detail', { id: categoryId })
  const data = (res.data && res.data.data) || {}
  category.value = data.category || {}
  admins.value = data.admins || []
}

const loadPosts = async () => {
  offset.value = 0
  noMore.value = false
  posts.value = []
  await loadMore()
}

const loadMore = async () => {
  if (loading.value || noMore.value) return
  loading.value = true
  const res = await request.get('/api/post/list', { categoryId, offset: offset.value, limit })
  const list = (res.data && res.data.data) || []
  if (list.length < limit) {
    noMore.value = true
  }
  posts.value = posts.value.concat(list)
  offset.value += list.length
  loading.value = false
}

const goCreatePost = () => {
  router.push({ path: '/post/create', query: { categoryId } })
}

const getCover = (p) => {
  if (!p || !p.content) return ''
  const html = String(p.content)
  const m = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
  return m && m[1] ? m[1] : ''
}

const goPost = (id) => {
  router.push({ path: '/post/detail', query: { id } })
}

onMounted(async () => {
  await loadDetail()
  await loadPosts()
})
</script>

<style scoped>
.page-post-category-detail { padding: 20px 0; }
.head-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.post-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: box-shadow .2s ease;
  background: #fff;
}
.post-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,.08); }
.post-cover {
  width: 140px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f6f7f8;
}
.post-cover img { width: 100%; height: 100%; object-fit: cover; display:block; }
.post-body { min-width: 0; display:flex; flex-direction:column; justify-content:center; }
.post-title { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.post-meta { color: #909399; font-size: 13px; }
.more-tip { text-align:center; color:#909399; padding: 8px 0 4px; }
</style>
