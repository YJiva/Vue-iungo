<template>
  <div class="page-blog-list">
    <div class="container container-inner">
      <h2>博客列表</h2>
      <div v-if="loading" style="text-align:center;padding:20px;">
        <el-loading-spinner /> 加载中...
      </div>
      <div v-else>
        <div class="blog-item" v-for="blog in blogList" :key="blog.id">
          <router-link :to="`/blog/detail/${blog.id}`">{{ blog.title }}</router-link>
          <p>作者：{{ blog.authorId || blog.author || '匿名' }} · {{ blog.createTime }}</p>
        </div>
        <div v-if="!blogList.length" style="text-align:center;color:var(--text-light);padding:20px;">
          暂无博客数据
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'

const blogList = ref([])
const loading = ref(false)
const userStore = useUserStore()
const route = useRoute()

const fetchBlogs = async () => {
  loading.value = true
  try {
    const params = { offset: 0, limit: 20 }
    if (route.query.offset) params.offset = Number(route.query.offset)
    if (route.query.limit) params.limit = Number(route.query.limit)
    if (route.query.search) params.search = route.query.search
    const resp = await request.get('/api/post/list', params)
    if (resp.data && resp.data.code === 200) {
      blogList.value = resp.data.data || []
    } else {
      console.error('列表加载失败', resp.data)
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchBlogs)
</script>

<style scoped>
.page-blog-list { padding: 20px 0; }
.blog-item { margin-bottom: 12px; }
</style>
