<template>
  <div class="page-post-category-detail">
    <div class="container container-inner">
      <div class="bar-banner" :style="bannerStyle">
        <div class="banner-mask">
          <div class="banner-main">
            <div class="banner-left">
              <el-avatar :src="category.icon || defaultBarIcon" :size="72" class="bar-avatar" />
              <div class="banner-info">
                <h2 class="banner-title">{{ category.name || '贴吧详情' }}</h2>
                <p class="banner-desc">{{ category.description || '暂无简介' }}</p>
                <div class="banner-meta">
                  <span>{{ category.memberCount || 0 }} 关注</span>
                  <span>{{ category.postCount || 0 }} 帖子</span>
                </div>

                <div class="banner-team">
                  <div class="team-row">
                    <span class="team-label">吧主</span>
                    <div class="team-avatars">
                      <el-tooltip
                        v-for="u in ownerUsers"
                        :key="`owner-${u.userId}`"
                        :content="u.nickname || u.username || String(u.userId)"
                        placement="top"
                      >
                        <el-avatar
                          :src="u.avatar || defaultAvatar"
                          :size="30"
                          class="team-avatar clickable"
                          @click="goUser(u.userId)"
                        />
                      </el-tooltip>
                      <span v-if="!ownerUsers.length" class="team-empty">-</span>
                    </div>
                  </div>
                  <div class="team-row">
                    <span class="team-label">吧务</span>
                    <div class="team-avatars">
                      <el-tooltip
                        v-for="u in teamUsers"
                        :key="`team-${u.userId}`"
                        :content="u.nickname || u.username || String(u.userId)"
                        placement="top"
                      >
                        <el-avatar
                          :src="u.avatar || defaultAvatar"
                          :size="30"
                          class="team-avatar clickable"
                          @click="goUser(u.userId)"
                        />
                      </el-tooltip>
                      <span v-if="!teamUsers.length" class="team-empty">-</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="banner-actions">
              <el-button v-if="isLoggedIn" :type="followed ? 'default' : 'primary'" @click="toggleFollow">
                {{ followed ? '已关注' : '关注' }}
              </el-button>
              <el-button v-if="canBarManage" type="warning" plain @click="goManage">吧务工具</el-button>
              <el-button type="primary" @click="goCreatePost">在本吧发帖</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-card>
        <template #header>
          <div class="post-toolbar">
            <span>帖子</span>
            <div class="toolbar-right">
              <el-input
                v-model="keyword"
                placeholder="搜索本吧帖子标题/内容"
                clearable
                style="width: 240px"
                @keyup.enter="applyFilters"
              />
              <el-switch v-model="essenceOnly" active-text="只看精华" @change="applyFilters" />
              <el-button size="small" @click="applyFilters">筛选</el-button>
            </div>
          </div>
        </template>
        <div class="infinite-wrap" v-infinite-scroll="loadMore" :infinite-scroll-distance="30" style="min-height: 240px;">
          <div class="post-card" v-for="p in posts" :key="p.id" @click="goPost(p.id)">
            <div class="post-cover" v-if="getCover(p)" @click.stop="previewImage(getCover(p))">
              <img :src="getCover(p)" alt="cover" />
            </div>
            <div class="post-body">
              <div class="post-title-row">
                <div class="post-title">{{ p.title }}</div>
                <div class="post-flags">
                  <el-tag v-if="p.isTop === 1" type="warning" size="small">置顶</el-tag>
                  <el-tag v-if="p.isEssence === 1" type="success" size="small">精华</el-tag>
                  <div v-if="canManage" class="post-admin-actions" @click.stop>
                    <el-button size="small" @click="toggleTop(p)">{{ p.isTop === 1 ? '取消置顶' : '置顶' }}</el-button>
                    <el-button size="small" type="success" @click="toggleEssence(p)">{{ p.isEssence === 1 ? '取消精华' : '加精' }}</el-button>
                    <el-popconfirm title="确定删除该帖？" @confirm="deletePost(p)">
                      <template #reference>
                        <el-button size="small" type="danger">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
              <div class="post-meta">
                <UserHoverCard :user-id="p.authorId" :avatar-size="18" :category-id="categoryId" :can-mute-in-bar="canManage" />
                · {{ p.createTime }}
              </div>
            </div>
          </div>
          <div class="more-tip">{{ noMore ? '没有更多帖子了' : '下拉加载更多...' }}</div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="previewVisible" title="图片预览" width="760px">
      <div class="viewer-toolbar">
        <el-button size="small" @click="previewPrev" :disabled="!canPreviewPrev">上一张</el-button>
        <span class="viewer-index">{{ previewIndex + 1 }} / {{ previewList.length }}</span>
        <el-button size="small" @click="previewNext" :disabled="!canPreviewNext">下一张</el-button>
      </div>
      <img :src="previewUrl" style="width:100%;max-height:70vh;object-fit:contain;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'
import UserHoverCard from '../../components/UserHoverCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const category = ref({})
const admins = ref([])
const posts = ref([])
const offset = ref(0)
const limit = 10
const noMore = ref(false)
const loading = ref(false)
const keyword = ref('')
const essenceOnly = ref(false)
const followed = ref(false)
const previewVisible = ref(false)
const previewUrl = ref('')
const previewIndex = ref(-1)
const defaultBanner = 'linear-gradient(120deg, #7cc8ff 0%, #ffb6c1 50%, #ffd27a 100%)'
const defaultBarIcon = 'https://via.placeholder.com/80x80.png?text=Bar'
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'

const categoryId = Number(route.params.id)
const isLoggedIn = computed(() => !!userStore.isLoggedIn)
const canManage = computed(() => {
  const uid = userStore.userInfo?.id
  const roleId = userStore.userInfo?.roleId
  if (!uid) return false
  if (roleId === 2) return true
  return (admins.value || []).some((a) => Number(a.userId) === Number(uid))
})

const canBarManage = computed(() => {
  const uid = userStore.userInfo?.id
  if (!uid) return false
  return (admins.value || []).some((a) => Number(a.userId) === Number(uid))
})

const bannerStyle = computed(() => {
  if (category.value.coverUrl) {
    return {
      backgroundImage: `url(${category.value.coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: defaultBanner }
})

const ownerUsers = computed(() => {
  const owners = (admins.value || []).filter((a) => String(a.roleCode || a.role || '').toUpperCase() === 'OWNER')
  return owners.map((a) => ({
    userId: a.userId,
    nickname: a.nickname,
    username: a.username,
    avatar: a.avatar
  }))
})

const teamUsers = computed(() => {
  const map = new Map()
  ;(admins.value || []).forEach((a) => {
    if (!a?.userId) return
    if (map.has(a.userId)) return
    map.set(a.userId, {
      userId: a.userId,
      nickname: a.nickname,
      username: a.username,
      avatar: a.avatar
    })
  })
  return Array.from(map.values())
})

const loadDetail = async () => {
  const res = await request.get('/api/post/category/detail', { id: categoryId })
  const data = (res.data && res.data.data) || {}
  category.value = data.category || {}
  admins.value = data.admins || []
  await loadFollowStatus()
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
  const res = await request.get('/api/post/list', {
    categoryId,
    offset: offset.value,
    limit,
    keyword: (keyword.value || '').trim() || null,
    essenceOnly: essenceOnly.value ? 1 : null
  })
  const list = (res.data && res.data.data) || []
  if (list.length < limit) {
    noMore.value = true
  }
  posts.value = posts.value.concat(list)
  offset.value += list.length
  loading.value = false
}

const applyFilters = async () => {
  await loadPosts()
}

const goCreatePost = () => {
  router.push({ path: '/post/create', query: { categoryId } })
}

const goManage = () => {
  router.push(`/post/category/${categoryId}/manage`)
}

const loadFollowStatus = async () => {
  if (!userStore.isLoggedIn) {
    followed.value = false
    return
  }
  const res = await request.get('/api/post/category/list')
  const list = (res.data && res.data.data) || []
  const hit = list.find((x) => Number(x.id) === Number(categoryId))
  followed.value = !!hit?.followed
}

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  const res = await request.post('/api/post/category/follow/toggle', null, { params: { categoryId } })
  if (res.data?.code === 200) {
    followed.value = !!res.data.followed
    category.value.memberCount = Number(res.data.memberCount || category.value.memberCount || 0)
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const toggleTop = async (post) => {
  const res = await request.post('/api/post/admin/top/toggle', null, { params: { id: post.id } })
  if (res.data?.code === 200) {
    post.isTop = post.isTop === 1 ? 0 : 1
    ElMessage.success(post.isTop === 1 ? '已置顶' : '已取消置顶')
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const toggleEssence = async (post) => {
  const res = await request.post('/api/post/admin/essence/toggle', null, { params: { id: post.id } })
  if (res.data?.code === 200) {
    post.isEssence = post.isEssence === 1 ? 0 : 1
    ElMessage.success(post.isEssence === 1 ? '已加精' : '已取消精华')
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const deletePost = async (post) => {
  const res = await request.post('/api/post/delete', null, { params: { id: post.id } })
  if (res.data?.code === 200) {
    ElMessage.success('删除成功')
    await loadPosts()
  } else {
    ElMessage.error(res.data?.msg || '删除失败')
  }
}

const getCover = (p) => {
  if (!p || !p.content) return ''
  const html = String(p.content)
  const m = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
  return m && m[1] ? m[1] : ''
}

const previewList = computed(() => {
  return (posts.value || [])
    .map((p) => getCover(p))
    .filter((x) => !!x)
})

const canPreviewPrev = computed(() => previewIndex.value > 0)
const canPreviewNext = computed(() => previewIndex.value >= 0 && previewIndex.value < previewList.value.length - 1)

const previewImage = (url) => {
  if (!url) return
  const idx = previewList.value.findIndex((x) => x === url)
  previewIndex.value = idx >= 0 ? idx : 0
  previewUrl.value = url
  previewVisible.value = true
}

const previewPrev = () => {
  if (!canPreviewPrev.value) return
  previewIndex.value -= 1
  previewUrl.value = previewList.value[previewIndex.value] || ''
}

const previewNext = () => {
  if (!canPreviewNext.value) return
  previewIndex.value += 1
  previewUrl.value = previewList.value[previewIndex.value] || ''
}


const goPost = (id) => {
  router.push({ path: '/post/detail', query: { id } })
}

const goUser = (id) => {
  if (!id) return
  router.push(`/user/profile/${id}`)
}

onMounted(async () => {
  await loadDetail()
  await loadPosts()
})
</script>

<style scoped>
.page-post-category-detail { padding: 20px 0; }
.bar-banner { border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
.banner-mask { background: rgba(20, 24, 30, 0.45); padding: 18px; }
.banner-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.banner-left { display: flex; gap: 14px; align-items: flex-start; }
.bar-avatar { border: 2px solid rgba(255,255,255,.7); }
.banner-info { min-width: 0; }
.banner-title { margin: 0; color: #fff; }
.banner-desc { color: rgba(255,255,255,.88); margin: 6px 0; }
.banner-meta { color: rgba(255,255,255,.88); font-size: 13px; display: flex; gap: 12px; }
.banner-team { color: rgba(255,255,255,.92); font-size: 13px; margin-top: 8px; line-height: 1.5; display: flex; flex-direction: column; gap: 8px; }
.team-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.team-label { width: 42px; color: rgba(255,255,255,.88); font-size: 12px; }
.team-avatars { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.team-avatar { border: 1px solid rgba(255,255,255,.55); }
.team-empty { color: rgba(255,255,255,.75); }
.clickable { cursor: pointer; }
.banner-actions { display: flex; gap: 8px; }
.post-admin-actions { display: flex; gap: 6px; margin-left: 8px; }
.post-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
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
.post-title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.post-title { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.post-flags { display: flex; align-items: center; gap: 6px; }
.post-meta { color: #909399; font-size: 13px; }
.more-tip { text-align:center; color:#909399; padding: 8px 0 4px; }
.viewer-toolbar { display:flex; justify-content:center; align-items:center; gap:12px; margin-bottom:10px; }
.viewer-index { color:#606266; font-size:13px; }
</style>
