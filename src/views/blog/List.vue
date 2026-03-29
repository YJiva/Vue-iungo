<template>
  <div class="page-blog-list">
    <div class="container container-inner">
      <div class="mode-tabs">
        <el-radio-group v-model="activeMode" size="small">
          <el-radio-button label="circle">圈层</el-radio-button>
          <el-radio-button label="close">密友</el-radio-button>
        </el-radio-group>
        <p v-if="mode === 'circle'" class="mode-desc">仅展示「粉丝可见」的博客（open_scope=2）；你需要已关注作者；仅 status=1 的帖子会显示。</p>
        <p v-if="mode === 'close'" class="mode-desc">仅展示「仅互关可见」的博客（open_scope=3）；你与作者需互相关注，或为你本人发布；仅 status=1。</p>
      </div>


      <!-- 初次加载骨架屏，防止布局抖动 -->
      <el-skeleton v-if="loading" animated>
        <template #template>
          <div v-for="n in 3" :key="n" class="blog-item">
            <el-skeleton-item variant="h3" style="width: 60%; margin-bottom: 8px;" />
            <el-skeleton-item variant="text" style="width: 40%; margin-bottom: 4px;" />
            <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 4px;" />
            <div style="margin-top: 6px;">
              <el-skeleton-item
                v-for="m in 3"
                :key="m"
                variant="text"
                style="display:inline-block;width:60px;height:20px;margin-right:6px;border-radius:10px;"
              />
            </div>
          </div>
        </template>
      </el-skeleton>

      <!-- 列表 + 无限滚动 -->
      <div
        v-else
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loadingMore || finished"
        :infinite-scroll-distance="80"
      >
        <div class="card blog-item" v-for="blog in visibleBlogs" :key="blog.id"   @click="$router.push(`/blog/detail/${blog.id}`)  "
          style="cursor:pointer;">

            {{ blog.title }}

          <p class="blog-meta">
            <span>作者：{{ blog.authorNickname || blog.authorUsername || getUserName(blog.userId) || '未知' }}</span>
            <span>{{ blog.createTime }}</span>
            <span v-if="blog.read != null">{{ blog.read }} 阅读</span>
          </p>
          <!-- 简短内容摘要（去掉 HTML 标签后截取） -->
          <p class="blog-desc">{{ getExcerpt(blog.content) }}</p>
          <!-- 标签小卡片：根据 blog.tags 与 blog_type 关联展示 -->
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

        <!-- 加载更多骨架屏 -->
        <div v-if="loadingMore" class="load-more-skeleton">
          <el-skeleton animated>
            <template #template>
              <div class="blog-item">
                <el-skeleton-item variant="h3" style="width: 50%; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 35%; margin-bottom: 4px;" />
                <el-skeleton-item variant="text" style="width: 70%; margin-bottom: 4px;" />
              </div>
            </template>
          </el-skeleton>
        </div>

        <!-- 无更多内容提示（有数据且已滑到底时） -->
        <div v-if="finished && blogList.length" class="no-more-wrapper">
          <div class="divider"></div>
          <div class="no-more-text">没有更多了</div>
        </div>

        <div v-if="!visibleBlogs.length && !loadingMore" class="list-empty">
          <template v-if="needsLoginForCurrentMode">
            <p class="empty-text">请先登录后查看{{ mode === 'close' ? '密友' : '圈层' }}博客。</p>
            <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
          </template>
          <p v-else class="empty-text">暂无博客数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'
import { buildBlogTypeMap, resolveBlogTags } from '../../utils/blogTags'

const blogList = ref([]) // 后端返回的全部数据
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const visibleCount = ref(0)
const pageSize = 3
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const userMap = ref({})
const mode = computed(() => (route.query.mode === 'close' ? 'close' : 'circle'))
const activeMode = computed({
  get: () => mode.value,
  set: (val) => {
    router.replace({ path: '/blog/list', query: { mode: val } })
  }
})

/** 圈层 / 密友均需登录 */
const needsLoginForCurrentMode = computed(() => !userStore.token)

// blog_type 映射：id -> { id, name, show }
const typeMap = ref({})

// 解析 content 文本摘要
const getExcerpt = (html) => {
  if (!html) return ''
  const plain = html.replace(/<[^>]+>/g, '').trim()
  return plain.length > 80 ? plain.slice(0, 80) + '…' : plain
}


const getUserName = (uid) => {
  const u = userMap.value[uid]
  return u?.nickname || u?.username || String(uid)
}

const resolveTags = (blog) => resolveBlogTags(blog && blog.tags, typeMap.value)

const visibleBlogs = computed(() => {
  return blogList.value.slice(0, visibleCount.value)
})

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

const fetchBlogs = async () => {
  loading.value = true
  if (needsLoginForCurrentMode.value) {
    blogList.value = []
    visibleCount.value = 0
    finished.value = false
    loading.value = false
    return
  }
  try {
    const url = mode.value === 'close' ? '/api/blog/close-friends' : '/api/blog/circle'
    const resp = await request.get(url)
    if (resp.data && resp.data.code === 200) {
      blogList.value = Array.isArray(resp.data.data) ? resp.data.data : []
      visibleCount.value = Math.min(pageSize, blogList.value.length)
      finished.value = visibleCount.value >= blogList.value.length
      ;[...new Set(blogList.value.map((b) => b.userId).filter(Boolean))].forEach((uid) => {
        ensureUserProfile(uid)
      })
    } else {
      console.error('列表加载失败', resp.data)
      blogList.value = []
      finished.value = true
    }
  } catch (err) {
    blogList.value = []
    finished.value = true
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || finished.value) return
  loadingMore.value = true
  try {
    // 模拟异步加载时间，让骨架屏有显示效果
    await new Promise((resolve) => setTimeout(resolve, 500))
    const next = visibleCount.value + pageSize
    visibleCount.value = Math.min(next, blogList.value.length)
    if (visibleCount.value >= blogList.value.length) {
      finished.value = true
    }
  } finally {
    loadingMore.value = false
  }
}

onMounted(async () => {
  if (route.query.mode === 'public') {
    router.replace('/home')
    return
  }
  await fetchBlogTypes()
  await fetchBlogs()
})

watch(
  () => route.query.mode,
  async (m) => {
    if (m === 'public') {
      router.replace('/home')
      return
    }
    visibleCount.value = 0
    finished.value = false
    await fetchBlogs()
  }
)
</script>

<style scoped>
.page-blog-list { padding: 20px 0; }
.mode-tabs { margin-bottom: 12px; }
.mode-desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-light, #909399);
}
.list-empty {
  text-align: center;
  color: var(--text-light);
  padding: 20px;
}
.list-empty .empty-text {
  margin: 0 0 12px;
}
.blog-item {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border-color, #e5e7eb);
}
.blog-title-link {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
}
.blog-title-link:hover {
  color: var(--primary-color);
}
.blog-meta {
  margin: 4px 0;
  font-size: 12px;
  color: var(--text-light);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.blog-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 6px 0;
}
.blog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.load-more-skeleton {
  padding: 10px 0;
}
.no-more-wrapper {
  text-align: center;
  padding: 12px 0 4px 0;
}
.divider {
  height: 1px;
  margin: 8px 0;
  background: linear-gradient(to right, transparent, #e5e7eb, transparent);
}
.no-more-text {
  font-size: 12px;
  color: var(--text-light);
}
</style>
