<template>
  <div class="page-blog-list">
    <div class="container container-inner">


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
            <span>作者ID：{{ blog.userId || '未知' }}</span>
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

        <!-- 无更多内容提示 -->
        <div v-if="finished" class="no-more-wrapper">
          <div class="divider"></div>
          <div class="no-more-text">没有更多了</div>
        </div>

        <div v-if="!visibleBlogs.length && !loadingMore" style="text-align:center;color:var(--text-light);padding:20px;">
          暂无博客数据
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
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

// blog_type 映射：id -> { id, name, show }
const typeMap = ref({})

// 解析 content 文本摘要
const getExcerpt = (html) => {
  if (!html) return ''
  const plain = html.replace(/<[^>]+>/g, '').trim()
  return plain.length > 80 ? plain.slice(0, 80) + '…' : plain
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

const fetchBlogs = async () => {
  loading.value = true
  try {
    const userId = (userStore.userInfo && userStore.userInfo.id) || 0
    const resp = await request.get('/api/blog/list-by-scope', { userId, scope: 2 })
    if (resp.data && resp.data.code === 200) {
      blogList.value = resp.data.data || []
      visibleCount.value = Math.min(pageSize, blogList.value.length)
      finished.value = visibleCount.value >= blogList.value.length
    } else {
      console.error('列表加载失败', resp.data)
    }
  } catch (err) {
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
  await fetchBlogTypes()
  await fetchBlogs()
})
</script>

<style scoped>
.page-blog-list { padding: 20px 0; }
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
