<template>
  <div class="home-page">
    <main class="main">
      <div class="container container-inner main-wrap">
        <div class="home-top" v-if="siteStore.carousels.length">
          <el-carousel height="260px" class="home-carousel">
            <el-carousel-item v-for="item in siteStore.carousels" :key="item.id || item.sort">
              <div class="carousel-item" @click="goLink(item.linkUrl)">
                <img :src="item.imageUrl" :alt="item.title || 'carousel'" class="carousel-img" />
                <div class="carousel-title" v-if="item.title">{{ item.title }}</div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

        <div class="blog-list card"
             v-infinite-scroll="loadMore"
             :infinite-scroll-disabled="loadingMore || finished || loading"
             :infinite-scroll-distance="80">
          <div class="blog-list-header">
            <h2>精选博客</h2>
          </div>
          <div v-if="loading" class="state">加载中...</div>
          <div v-else>
            <div
              class="blog-item-card"
              v-for="blog in visibleBlogs"
              :key="blog.id"
              @click="$router.push(`/blog/detail/${blog.id}`)"
            >
              <div class="blog-title">{{ blog.title }}</div>
              <div class="blog-meta">
                <span>作者：{{ blog.authorNickname || blog.authorUsername || blog.userId }}</span>
                <span>{{ blog.createTime }}</span>
                <span v-if="blog.read != null">{{ blog.read }} 阅读</span>
              </div>
              <div class="blog-desc">{{ getExcerpt(blog.content) }}</div>
              <div class="blog-tags" v-if="resolveTags(blog).length">
                <el-tag
                  v-for="t in resolveTags(blog)"
                  :key="t.id"
                  :type="t.show === 0 ? 'info' : 'success'"
                  :effect="t.show === 0 ? 'plain' : 'light'"
                  size="small"
                >
                  {{ t.name }}
                </el-tag>
              </div>
            </div>
            <div v-if="visibleBlogs.length === 0" class="state">暂无博客数据</div>
            <div v-if="finished && visibleBlogs.length" class="state">没有更多了</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
defineOptions({ name: 'HomePage' })
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { useSiteStore } from '../../stores/site'
import { buildBlogTypeMap, resolveBlogTags } from '../../utils/blogTags'

const router = useRouter()
const siteStore = useSiteStore()
const blogList = ref([])
const visibleCount = ref(0)
const pageSize = 5
const loadingMore = ref(false)
const finished = ref(false)
const loading = ref(true)
const typeMap = ref({})

const visibleBlogs = computed(() => blogList.value.slice(0, visibleCount.value))

// 内容摘要（去掉 HTML 标签）
const getExcerpt = (html) => {
  if (!html) return ''
  const plain = html.replace(/<[^>]+>/g, '').trim()
  return plain.length > 60 ? plain.slice(0, 60) + '…' : plain
}

const resolveTags = (blog) => resolveBlogTags(blog && blog.tags, typeMap.value)

const fetchBlogTypes = async () => {
  try {
    const response = await request.get('/api/blog/types')
    const res = response.data
    if (res.code === 200 && Array.isArray(res.data)) {
      typeMap.value = buildBlogTypeMap(res.data)
    }
  } catch (e) {
    console.error('加载博客标签类型失败', e)
  }
}

const fetchHomeData = async () => {
  try {
    loading.value = true
    const response = await request.get('/api/blog/public-feed', {
      params: { page: 1, pageSize: 500 }
    })
    const res = response.data
    if (res.code === 200 && res.data) {
      blogList.value = res.data.list || []
      visibleCount.value = Math.min(pageSize, blogList.value.length)
      finished.value = visibleCount.value >= blogList.value.length
    }
  } catch (e) {
    console.error('请求后端接口失败：', e)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || finished.value || loading.value) return
  loadingMore.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const next = visibleCount.value + pageSize
    visibleCount.value = Math.min(next, blogList.value.length)
    if (visibleCount.value >= blogList.value.length) finished.value = true
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  siteStore.loadPublicSiteData().catch((e) => console.error('加载站点配置失败', e))
  fetchBlogTypes()
  fetchHomeData()
})

const goLink = (url) => {
  if (!url) return
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank')
    return
  }
  router.push(url)
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
  padding: 30px 0;
}
.main-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.home-top {
  width: 100%;
}
.home-carousel {
  border-radius: 8px;
  overflow: hidden;
}
.carousel-item {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.carousel-title {
  position: absolute;
  left: 12px;
  bottom: 10px;
  padding: 4px 8px;
  font-size: 13px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 4px;
}
.blog-list {
  width: 100%;
  padding: 16px;
}
.blog-list-header {
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}
.blog-item-card {
  padding: 12px 0;
  border-bottom: 1px dashed var(--border-color);
  cursor: pointer;
}
.blog-title {
  font-size: 16px;
  font-weight: 600;
}
.blog-meta {
  margin: 8px 0;
  font-size: 12px;
  color: var(--text-light);
  display: flex;
  gap: 12px;
}
.blog-desc {
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.blog-tags {
  display: flex;
  gap: 8px;
}
.state { text-align: center; color: var(--text-light); padding: 10px 0; font-size: 12px; }
</style>
