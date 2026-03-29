<template>
  <div class="page-search">
    <div class="container container-inner">
      <div class="search-panel card">
        <div class="search-header">
          <h2>全站搜索</h2>
          <span class="hint">卡片展示 + 懒加载</span>
        </div>
        <div class="search-controls">
          <el-input
            v-model="searchKeyword"
            placeholder="输入关键词（标题、内容、用户名等）"
            @keyup.enter="doSearch"
            clearable
          />
          <el-button type="primary" @click="doSearch">搜索</el-button>
        </div>
        <el-radio-group v-model="activeType" class="type-radios" @change="onTypeChange">
          <el-radio-button label="post">帖子搜索</el-radio-button>
          <el-radio-button label="category">贴吧搜索</el-radio-button>
          <el-radio-button label="blog">博客搜索</el-radio-button>
          <el-radio-button label="user">用户搜索</el-radio-button>
        </el-radio-group>

        <div
          class="result-list"
          v-infinite-scroll="loadMoreSearch"
          :infinite-scroll-disabled="searchLoading || !hasMoreForActive"
          :infinite-scroll-distance="100"
        >
          <div v-if="searchLoading && !activeList.length" class="state">加载中...</div>
          <div v-else-if="!activeList.length" class="state">暂无结果</div>
          <div v-else>
            <div
              v-for="item in activeList"
              :key="item.id"
              class="card result-card"
              @click="openResult(item)"
            >
              <template v-if="activeType === 'post'">
                <div class="post-card-like">
                  <div class="post-cover" v-if="getCover(item)">
                    <img :src="getCover(item)" alt="cover" />
                  </div>
                  <div class="post-body">
                    <div class="title">{{ item.title }}</div>
                    <div class="meta">
                      作者 {{ item.author_nickname || item.author_username || item.author_id }}
                      <span v-if="item.category_name"> · {{ item.category_name }}</span>
                      · {{ item.create_time }}
                    </div>
                    <div class="desc">{{ getExcerpt(item.content) }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="activeType === 'category'">
                <div class="cat-head">
                  <el-avatar :src="item.icon || defaultBarIcon" :size="46" />
                  <div class="cat-head-info">
                    <div class="title">{{ item.name }}</div>
                    <div class="meta">{{ item.member_count || 0 }} 关注 · {{ item.post_count || 0 }} 帖子</div>
                  </div>
                </div>
                <div class="desc">{{ item.description || '暂无简介' }}</div>
              </template>
              <template v-else-if="activeType === 'blog'">
                <div class="title">{{ item.title }}</div>
                <div class="meta">
                  作者 {{ item.authorNickname || item.authorUsername || item.author_nickname || item.author_username || item.userId || item.user_id }} · 阅读 {{ item.read || 0 }}
                </div>
                <div class="desc">{{ getExcerpt(item.content) }}</div>
              </template>
              <template v-else>
                <div class="user-row">
                  <el-avatar :src="item.avatar || defaultAvatar" :size="40" />
                  <div>
                    <div class="title">{{ item.nickname || item.username }}</div>
                    <div class="meta">@{{ item.username }}</div>
                  </div>
                </div>
                <div class="desc">{{ item.bio || '这个用户很神秘，什么都没写。' }}</div>
              </template>
            </div>
            <div v-if="searchLoading" class="state">正在加载更多...</div>
            <div v-else-if="!hasMoreForActive" class="state">没有更多了</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'

const route = useRoute()
const router = useRouter()
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'
const defaultBarIcon = 'https://via.placeholder.com/80x80.png?text=Bar'
const searchKeyword = ref('')
const activeType = ref('post')
const searchLoading = ref(false)

const TYPE_KEYS = ['post', 'category', 'blog', 'user']
const resultMap = ref({ post: [], category: [], blog: [], user: [] })
const pageMap = ref({ post: 1, category: 1, blog: 1, user: 1 })
const hasMoreMap = ref({ post: false, category: false, blog: false, user: false })

const activeList = computed(() => resultMap.value[activeType.value] || [])
const hasMoreForActive = computed(() => !!hasMoreMap.value[activeType.value])

const getExcerpt = (html) => {
  if (!html) return ''
  const plain = html.replace(/<[^>]+>/g, '').trim()
  return plain.length > 60 ? `${plain.slice(0, 60)}…` : plain
}

const getCover = (item) => {
  if (!item || !item.content) return ''
  const html = String(item.content)
  const m = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
  return m && m[1] ? m[1] : ''
}

const resetSearchState = () => {
  for (const key of TYPE_KEYS) {
    resultMap.value[key] = []
    pageMap.value[key] = 1
    hasMoreMap.value[key] = false
  }
}

const fetchSearch = async (type, append = false) => {
  if (!searchKeyword.value.trim()) return
  searchLoading.value = true
  try {
    const response =
      type === 'blog'
        ? await request.get('/api/blog/public-feed', {
            keyword: searchKeyword.value.trim(),
            page: pageMap.value[type],
            pageSize: 10
          })
        : await request.get('/api/home/search', {
            type,
            keyword: searchKeyword.value.trim(),
            page: pageMap.value[type],
            pageSize: 10
          })
    const res = response.data
    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      resultMap.value[type] = append ? [...resultMap.value[type], ...list] : list
      hasMoreMap.value[type] = !!res.data.hasMore
      pageMap.value[type] += 1
    } else {
      if (!append) resultMap.value[type] = []
      hasMoreMap.value[type] = false
    }
  } catch (e) {
    console.error('搜索失败', e)
  } finally {
    searchLoading.value = false
  }
}

const doSearch = async () => {
  resetSearchState()
  if (!searchKeyword.value.trim()) return
  await fetchSearch(activeType.value, false)
}

const loadMoreSearch = async () => {
  const type = activeType.value
  if (searchLoading.value || !hasMoreMap.value[type]) return
  await fetchSearch(type, true)
}

const onTypeChange = async () => {
  if (!searchKeyword.value.trim()) return
  if (resultMap.value[activeType.value].length) return
  await fetchSearch(activeType.value, false)
}

const openResult = (item) => {
  if (activeType.value === 'post') router.push(`/post/detail?id=${item.id}`)
  else if (activeType.value === 'category') router.push(`/post/category/${item.id}`)
  else if (activeType.value === 'blog') router.push(`/blog/detail/${item.id}`)
  else router.push(`/user/profile/${item.id}`)
}

watch(
  () => route.query,
  async (q) => {
    searchKeyword.value = q.keyword ? String(q.keyword) : ''
    activeType.value = q.type && TYPE_KEYS.includes(String(q.type)) ? String(q.type) : 'post'
    await doSearch()
  },
  { immediate: true, deep: true }
)

onMounted(async () => {
  if (route.query.keyword) {
    searchKeyword.value = String(route.query.keyword)
    await doSearch()
  }
})
</script>

<style scoped>
.page-search { padding: 20px 0; }
.search-panel { width: 100%; padding: 16px; }
.search-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.search-header h2 { margin: 0; font-size: 18px; }
.hint { color: var(--text-light); font-size: 12px; }
.search-controls { display: flex; gap: 8px; margin-bottom: 10px; }
.type-radios { margin-bottom: 12px; }
.result-list { min-height: 120px; }
.result-card { margin-bottom: 10px; padding: 12px; cursor: pointer; }
.title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.meta { font-size: 12px; color: var(--text-light); margin-bottom: 6px; }
.desc { color: var(--text-secondary); line-height: 1.5; }
.user-row { display: flex; align-items: center; gap: 8px; }
.post-card-like { display: flex; gap: 12px; }
.post-cover { width: 140px; height: 90px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f6f7f8; }
.post-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.post-body { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.cat-head { display: flex; align-items: center; gap: 10px; }
.cat-head-info { min-width: 0; }
.state { text-align: center; color: var(--text-light); padding: 10px 0; font-size: 12px; }
</style>

