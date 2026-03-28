<template>
  <div class="bili-profile-page" v-loading="loading">
    <template v-if="profile">
      <div class="container container-inner profile-shell">
        <section class="profile-header-card fused" :style="headerCoverStyle">
          <div class="header-bg" :style="bannerStyle"></div>
          <div class="header-mask" :style="headerMaskStyle"></div>


          <el-avatar :src="profile.avatar || defaultAvatar" :size="96" class="profile-avatar" />
          <div class="profile-core">
            <h1 style="color: white; font-weight: bold;">{{ profile.nickname || profile.username || '用户主页' }}  <span style="font-size: 16px; color: #fce7f3;">@{{ profile.username || '-' }}</span>
             <span v-if="profile.gender==1||profile.gender==2" >

                <i style="font-size: 16px;" :style="profile.gender == '1' ? 'color: #4169e1;' : 'color: #ff69b4;'" class="fa-solid" :class="
                profile.gender == '1' ? 'fa-mars' : 'fa-venus'"></i>

               </span>
              <span v-else>
                 <i class="fa-solid fa-venus-mars" style="margin-left: 5px; font-size: 16px; color: rgb(255, 255, 255);"></i>
              </span>
              </h1>

            <el-input
              v-model="bioDraft"
              type="textarea"
              :rows="2"
              autosize
              class="bio-input"
              placeholder="点击编辑个人简介"
              :readonly="!isSelf"
              @blur="saveBio"
            />
            <div class="profile-meta-row">

              <span>ID:{{ profile.id }}</span>
              <span>

               </span>
              <span>注册于 {{ formatDate(profile.createTime) }}</span>
            </div>
            <div class="profile-stats-row">
              <button class="stat-btn" @click="activeTab = 'following'">
                <strong>{{ profile.followingCount || 0 }}</strong>
                <span>关注</span>
              </button>
              <button class="stat-btn" @click="activeTab = 'followers'">
                <strong>{{ profile.followersCount || 0 }}</strong>
                <span>粉丝</span>
              </button>
              <button class="stat-btn" @click="activeTab = 'blogs'">
                <strong>{{ blogTotal }}</strong>
                <span>公开博客</span>
              </button>
            </div>
          </div>
          <div class="profile-actions profile-actions-bottom">
            <el-button v-if="isSelf" type="primary" plain @click="goCenter">编辑资料</el-button>
            <el-button v-if="isSelf" type="primary" class="cover-mini-btn" @click="coverDrawerVisible = true">背景</el-button>
            <el-button
              v-if="!isSelf"
              :type="isFollowing ? 'default' : 'primary'"
              @click="toggleFollow"
            >
              {{ isFollowing ? '已关注' : (followedBy ? '回关' : '关注') }}
            </el-button>
          </div>
        </section>

        <el-drawer
          v-model="coverDrawerVisible"
          title="背景设置"
          size="320px"
          direction="rtl"
        >
          <div class="cover-drawer">
            <el-upload
              :action="uploadAction"
              :show-file-list="false"
              :headers="uploadHeaders"
              :before-upload="beforeImageUpload"
              :on-success="handleCoverUploadSuccess"
              :on-error="() => ElMessage.error('封面上传失败')"
            >
              <el-button type="primary" plain><i class="fa-solid fa-upload"></i></el-button>
            </el-upload>

            <div class="drawer-item">
              <div class="drawer-label">背景模糊程度</div>
              <el-slider
                v-model="coverBlur"
                :min="0"
                :max="24"
                :step="1"
                :show-tooltip="false"
                @change="saveCoverBlur"
              />
            </div>
          </div>
        </el-drawer>
        <section class="profile-content">
          <div class="tab-bar">
            <button :class="['tab-btn', { active: activeTab === 'blogs' }]" @click="activeTab = 'blogs'">公开博客</button>
            <button :class="['tab-btn', { active: activeTab === 'following' }]" @click="activeTab = 'following'">关注</button>
            <button :class="['tab-btn', { active: activeTab === 'followers' }]" @click="activeTab = 'followers'">粉丝</button>

          </div>

          <div v-if="activeTab === 'blogs'" class="tab-panel">
            <el-skeleton v-if="blogsLoading" :rows="4" animated />
            <el-empty v-else-if="!blogs.length" description="暂无公开博客" />
            <div v-else class="blog-list">
              <el-card v-for="item in blogs" :key="item.id" class="blog-item" shadow="hover">
                <div class="blog-head">
                  <h4 class="blog-title" @click="goBlogDetail(item.id)">{{ item.title || '未命名博客' }}</h4>
                  <span class="blog-time">{{ formatDate(item.createTime) }}</span>
                </div>
                <div class="blog-meta">
                  <el-tag size="small" type="info">阅读 {{ item.read || 0 }}</el-tag>
                  <el-tag size="small">公开</el-tag>
                </div>
              </el-card>

              <div class="blog-pagination">
                <el-pagination
                  background
                  layout="prev, pager, next, total"
                  :current-page="blogPage"
                  :page-size="blogPageSize"
                  :total="blogTotal"
                  @current-change="handleBlogPageChange"
                />
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'following'" class="tab-panel">
            <div class="follow-toolbar">
              <el-input
                v-model="followingKeyword"
                placeholder="搜索关注的人（昵称/用户名）"
                clearable
                @input="followingPage = 1"
              />
            </div>
            <el-skeleton v-if="followingLoading" :rows="4" animated />
            <el-empty v-else-if="!filteredFollowing.length" description="暂无关注" />
            <div v-else>
              <div class="user-grid">
                <div v-for="u in pagedFollowing" :key="`f-${u.id}`" class="user-card" @click="goUser(u.id)">
                  <el-avatar :src="u.avatar || defaultAvatar" :size="44" />
                  <div class="user-info">
                    <div class="user-name">{{ u.nickname || u.username }}</div>
                    <div class="user-sub">@{{ u.username || 'unknown' }}</div>
                    <div class="user-time">关注于 {{ formatFollowTime(u.followTime) }}</div>
                  </div>
                </div>
              </div>
              <div class="follow-pagination">
                <el-pagination
                  background
                  layout="prev, pager, next, total"
                  :current-page="followingPage"
                  :page-size="followPageSize"
                  :total="filteredFollowing.length"
                  @current-change="handleFollowingPageChange"
                />
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'followers'" class="tab-panel">
            <div class="follow-toolbar">
              <el-input
                v-model="followersKeyword"
                placeholder="搜索粉丝（昵称/用户名）"
                clearable
                @input="followersPage = 1"
              />
            </div>
            <el-skeleton v-if="followersLoading" :rows="4" animated />
            <el-empty v-else-if="!filteredFollowers.length" description="暂无粉丝" />
            <div v-else>
              <div class="user-grid">
                <div v-for="u in pagedFollowers" :key="`r-${u.id}`" class="user-card" @click="goUser(u.id)">
                  <el-avatar :src="u.avatar || defaultAvatar" :size="44" />
                  <div class="user-info">
                    <div class="user-name">{{ u.nickname || u.username }}</div>
                    <div class="user-sub">@{{ u.username || 'unknown' }}</div>
                    <div class="user-time">关注于 {{ formatFollowTime(u.followTime) }}</div>
                  </div>
                  <el-button
                    size="small"
                    :type="u.following ? 'default' : 'primary'"
                    @click.stop="toggleFollowUserCard(u)"
                  >
                    {{ u.following ? '已关注' : '回关' }}
                  </el-button>
                </div>
              </div>
              <div class="follow-pagination">
                <el-pagination
                  background
                  layout="prev, pager, next, total"
                  :current-page="followersPage"
                  :page-size="followPageSize"
                  :total="filteredFollowers.length"
                  @current-change="handleFollowersPageChange"
                />
              </div>
            </div>
          </div>


        </section>
      </div>
    </template>

    <div v-else class="container container-inner">
      <el-empty description="用户不存在或已被删除" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const profile = ref(null)
const isFollowing = ref(false)
const followedBy = ref(false)
const blogsLoading = ref(false)
const blogs = ref([])
const blogPage = ref(1)
const blogPageSize = ref(5)
const blogTotal = ref(0)
const activeTab = ref('blogs')
const followingLoading = ref(false)
const followersLoading = ref(false)
const followingList = ref([])
const followersList = ref([])
const followingKeyword = ref('')
const followersKeyword = ref('')
const followingPage = ref(1)
const followersPage = ref(1)
const followPageSize = ref(8)
const coverDrawerVisible = ref(false)
const coverBlur = ref(8)
const bioDraft = ref('')
const savingBio = ref(false)
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'
const defaultCover = 'linear-gradient(120deg, #7cc8ff 0%, #ffb6c1 45%, #ffd27a 100%)'

const uploadAction = `${import.meta.env.VITE_API_BASE || ''}/api/file/upload-editor-image`
const uploadHeaders = {
  Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
}

const userId = computed(() => Number(route.params.id))
const isSelf = computed(() => !!userStore.userInfo && userStore.userInfo.id === userId.value)
const parseCoverSetting = (coverSetting) => {
  if (!coverSetting || typeof coverSetting !== 'string') {
    return { url: '', blur: 8 }
  }
  const parts = coverSetting.split('|')
  const url = (parts[0] || '').trim()
  const blurNum = Number(parts[1])
  const blur = Number.isNaN(blurNum) ? 8 : Math.min(24, Math.max(0, blurNum))
  return { url, blur }
}

const stringifyCoverSetting = (url, blur) => {
  const safeUrl = (url || '').trim()
  const safeBlur = Math.min(24, Math.max(0, Number(blur) || 0))
  return `${safeUrl}|${safeBlur}`
}

const bannerStyle = computed(() => {
  const parsed = parseCoverSetting(profile.value?.coverUrl)
  if (parsed.url) {
    return {
      backgroundImage: `url(${parsed.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: defaultCover }
})

const headerCoverStyle = computed(() => ({
  '--header-blur': `${coverBlur.value}px`
}))

const headerMaskStyle = computed(() => {
  const alpha = Math.min(0.62, 0.28 + coverBlur.value * 0.01)
  return { background: `rgba(14, 18, 22, ${alpha})` }
})

const formatGender = (gender) => {
  if (gender === 1) return '男'
  if (gender === 2) return '女'
  return '未知'
}

const formatDate = (val) => {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return val
  return d.toLocaleDateString()
}

const loadProfile = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    const [profileRes, followRes] = await Promise.all([
      request.get('/api/user/public-profile', { userId: userId.value }),
      userStore.isLoggedIn ? request.get('/api/follow/status', { targetId: userId.value }) : Promise.resolve(null)
    ])

    if (profileRes.data && profileRes.data.code === 200) {
      profile.value = profileRes.data.data
      const parsed = parseCoverSetting(profile.value?.coverUrl)
      coverBlur.value = parsed.blur
      bioDraft.value = profile.value?.bio || ''
    } else {
      profile.value = null
      ElMessage.error(profileRes?.data?.msg || '加载用户信息失败')
    }

    if (followRes?.data?.code === 200) {
      isFollowing.value = !!followRes.data.following
      followedBy.value = !!followRes.data.followedBy
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const loadPublicBlogs = async () => {
  if (!userId.value) return
  blogsLoading.value = true
  try {
    const res = await request.get('/api/blog/public-by-user', {
      userId: userId.value,
      page: blogPage.value,
      pageSize: blogPageSize.value
    })
    if (res.data && res.data.code === 200 && res.data.data) {
      blogs.value = res.data.data.list || []
      blogTotal.value = Number(res.data.data.total || 0)
    } else {
      blogs.value = []
      blogTotal.value = 0
    }
  } finally {
    blogsLoading.value = false
  }
}

const loadFollows = async () => {
  if (!userId.value) return
  followingLoading.value = true
  followersLoading.value = true
  try {
    const [followingRes, followersRes] = await Promise.all([
      request.get('/api/follow/following', { userId: userId.value }),
      request.get('/api/follow/followers', { userId: userId.value })
    ])
    followingList.value = followingRes?.data?.code === 200 ? (followingRes.data.data || []) : []
    followersList.value = followersRes?.data?.code === 200 ? (followersRes.data.data || []) : []

    if (userStore.isLoggedIn && followersList.value.length) {
      const checks = await Promise.all(
        followersList.value.map((u) => request.get('/api/follow/status', { targetId: u.id }).catch(() => null))
      )
      followersList.value.forEach((u, idx) => {
        const r = checks[idx]
        u.following = !!(r?.data?.code === 200 && r.data.following)
      })
    }
  } finally {
    followingLoading.value = false
    followersLoading.value = false
  }
}

const handleBlogPageChange = (page) => {
  blogPage.value = page
  loadPublicBlogs()
}

const goBlogDetail = (id) => {
  if (!id) return
  router.push(`/blog/detail/${id}`)
}

const goUser = (id) => {
  if (!id) return
  router.push(`/user/profile/${id}`)
}

const filteredFollowing = computed(() => {
  if (!followingKeyword.value) return followingList.value
  const keyword = followingKeyword.value.toLowerCase()
  return followingList.value.filter((u) => {
    return (
      (u.nickname || '').toLowerCase().includes(keyword) ||
      (u.username || '').toLowerCase().includes(keyword)
    )
  })
})

const filteredFollowers = computed(() => {
  if (!followersKeyword.value) return followersList.value
  const keyword = followersKeyword.value.toLowerCase()
  return followersList.value.filter((u) => {
    return (
      (u.nickname || '').toLowerCase().includes(keyword) ||
      (u.username || '').toLowerCase().includes(keyword)
    )
  })
})

const pagedFollowing = computed(() => {
  const start = (followingPage.value - 1) * followPageSize.value
  return filteredFollowing.value.slice(start, start + followPageSize.value)
})

const pagedFollowers = computed(() => {
  const start = (followersPage.value - 1) * followPageSize.value
  return filteredFollowers.value.slice(start, start + followPageSize.value)
})

const handleFollowingPageChange = (page) => {
  followingPage.value = page
}

const handleFollowersPageChange = (page) => {
  followersPage.value = page
}

const formatFollowTime = (val) => {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return val
  return d.toLocaleDateString()
}

const resetFollowPaging = () => {
  followingPage.value = 1
  followersPage.value = 1
}

const toggleFollow = async () => {
  if (!userStore.isLoggedIn || !profile.value?.id) return
  const res = await request.post('/api/follow/toggle', null, { params: { targetId: profile.value.id } })
  if (res.data && res.data.code === 200) {
    isFollowing.value = !!res.data.following
    profile.value.followersCount = Math.max(0, (profile.value.followersCount || 0) + (isFollowing.value ? 1 : -1))
    ElMessage.success(res.data.msg || (isFollowing.value ? '关注成功' : '已取消关注'))
  }
}

const toggleFollowUserCard = async (u) => {
  if (!userStore.isLoggedIn || !u?.id) return
  const res = await request.post('/api/follow/toggle', null, { params: { targetId: u.id } })
  if (res.data && res.data.code === 200) {
    u.following = !!res.data.following
  }
}

const beforeImageUpload = (file) => {
  const isImage = file.type && file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('仅支持上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const handleCoverUploadSuccess = async (res) => {
  if (!(res && res.code === 200 && res.data && res.data.url)) {
    ElMessage.error((res && res.msg) || '上传失败')
    return
  }
  if (!userStore.userInfo?.id) return
  const coverSetting = stringifyCoverSetting(res.data.url, coverBlur.value)
  const payload = {
    ...(userStore.userInfo || {}),
    id: userStore.userInfo.id,
    coverUrl: coverSetting
  }
  const updateRes = await userStore.updateProfile(payload)
  if (updateRes?.data?.code === 200) {
    if (profile.value && isSelf.value) {
      profile.value.coverUrl = coverSetting
    }
    ElMessage.success('主页背景已更新')
  } else {
    ElMessage.error(updateRes?.data?.msg || '保存背景失败')
  }
}

const saveCoverBlur = async () => {
  if (!isSelf.value || !userStore.userInfo?.id || !profile.value) return
  const parsed = parseCoverSetting(profile.value.coverUrl)
  const coverSetting = stringifyCoverSetting(parsed.url, coverBlur.value)
  const payload = {
    ...(userStore.userInfo || {}),
    id: userStore.userInfo.id,
    coverUrl: coverSetting
  }
  const updateRes = await userStore.updateProfile(payload)
  if (updateRes?.data?.code === 200) {
    profile.value.coverUrl = coverSetting
    ElMessage.success('模糊程度已保存')
  } else {
    ElMessage.error(updateRes?.data?.msg || '保存失败')
  }
}

const saveBio = async () => {
  if (!isSelf.value || !profile.value || savingBio.value) return
  const nextBio = (bioDraft.value || '').trim()
  const oldBio = (profile.value.bio || '').trim()
  if (nextBio === oldBio) return
  savingBio.value = true
  try {
    const payload = {
      ...(userStore.userInfo || {}),
      id: userStore.userInfo?.id,
      bio: nextBio
    }
    const updateRes = await userStore.updateProfile(payload)
    if (updateRes?.data?.code === 200) {
      profile.value.bio = nextBio
      bioDraft.value = nextBio
      ElMessage.success('简介已保存')
    } else {
      ElMessage.error(updateRes?.data?.msg || '简介保存失败')
      bioDraft.value = oldBio
    }
  } finally {
    savingBio.value = false
  }
}

const goCenter = () => {
  router.push('/settings')
}

const loadAll = async () => {
  blogPage.value = 1
  resetFollowPaging()
  await Promise.all([loadProfile(), loadPublicBlogs(), loadFollows()])
}

onMounted(async () => {
  await loadAll()
})
watch(() => route.params.id, async () => {
  await loadAll()
})
</script>

<style scoped>
.bili-profile-page {
  min-height: 100vh;
  background: #f6f7f8;
}

.top-banner {
  height: 290px;
  position: relative;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.banner-inner {
  position: relative;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding-bottom: 16px;
  z-index: 2;
}

.banner-tools {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 3;
}

.banner-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(14, 18, 22, 0.12), rgba(14, 18, 22, 0.36));
  z-index: 1;
}

.profile-shell {
  margin-top: 12px;
  padding-bottom: 24px;
}

.profile-header-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  border: 1px solid #e7eaee;
  box-shadow: none;
}

.profile-header-card.fused {
  width: 100%;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(231, 234, 238, 0.8);
  backdrop-filter: blur(6px);
  box-shadow: none;
  position: relative;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  inset: 0;
  filter: blur(var(--header-blur, 8px));
  transform: scale(1.06);
}

.header-mask {
  position: absolute;
  inset: 0;
}

.cover-mini-btn {


  z-index: 2;
  border-radius: 999px;

  height: 28px;
  font-size: 12px;
}

.profile-header-card .profile-avatar,
.profile-header-card .profile-core,
.profile-header-card .profile-actions {
  position: relative;
  z-index: 2;
}

.profile-avatar {
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.profile-core {
  flex: 1;
}

.profile-core h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.bio-input {
  margin: 8px 0;
}

.bio-input :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.32);
  color: #ffffff;
  border-radius: 10px;
  transition: all 0.18s ease;
}

.bio-input :deep(.el-textarea__inner):hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.18);
}

.bio-input :deep(.el-textarea__inner):focus {
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.profile-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
}

.profile-stats-row {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.stat-btn {
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.stat-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.75);
}

.stat-btn strong {
  font-size: 16px;
  color: #ffffff;
}

.stat-btn span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.profile-actions {
  display: flex;


}

.profile-content {
  margin-top: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0 18px 18px;
}

.tab-bar {
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #eceef1;
  padding: 12px 0;
  margin-bottom: 12px;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #61666d;
  font-size: 15px;
  padding: 8px 6px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #00aeec;
  border-bottom-color: #00aeec;
}

.tab-panel {
  min-height: 140px;
}

.blog-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.blog-item {
  border-radius: 10px;
}

.blog-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.blog-title {
  margin: 0;
  font-size: 16px;
  cursor: pointer;
  color: #18191c;
}

.blog-title:hover {
  color: #00aeec;
}

.blog-time {
  font-size: 12px;
  color: #9499a0;
}

.blog-meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.blog-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.follow-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.follow-toolbar :deep(.el-input) {
  max-width: 320px;
}

.user-card {
  border: 1px solid #eceef1;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  background: #fff;
}

.user-card:hover {
  border-color: #c9ccd0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  color: #18191c;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-sub {
  color: #9499a0;
  font-size: 12px;
}

.user-time {
  color: #9499a0;
  font-size: 12px;
  margin-top: 4px;
}

.follow-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.about-panel {
  padding: 4px 0;
}

@media (max-width: 768px) {
  .profile-header-card {
    flex-direction: column;
  }

  .profile-actions {
    width: 100%;

  }

  .blog-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .pink{
  color: #ff69b4 !important;
  }
  .blue{
  color: #1e90ff !important;}
}
</style>
