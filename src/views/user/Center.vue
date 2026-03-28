<template>
  <div class="center-page">
    <div class="container container-inner" v-if="user">
      <section class="center-header">
        <el-avatar :src="user.avatar || defaultAvatar" :size="74" class="center-avatar" @click="$router.push(`/user/profile/${user.id}`)" />
        <div class="center-main">
          <h2>{{ user.nickname || user.username }}</h2>
          <p class="center-sub">@{{ user.username }} · {{ displayRole || `ID ${user.roleId ?? '-'}` }}</p>
          <p class="center-bio">{{ user.bio || '这个人很懒，暂未填写简介。' }}</p>
          <div class="center-actions">
            <el-button type="primary" @click="$router.push('/settings')">编辑资料</el-button>
            <el-button type="success" @click="$router.push('/invite')">邀请好友</el-button>
            <el-button @click="$router.push('/user/collections')">我的收藏</el-button>
          </div>
        </div>
      </section>

      <section class="follow-panel">
        <div class="follow-col">
          <div class="col-title">我关注的人</div>
          <div class="follow-toolbar">
            <el-input
              v-model="followingKeyword"
              placeholder="搜索关注的人（昵称/用户名）"
              clearable
              @input="followingPage = 1"
            />
          </div>
          <el-skeleton v-if="loadingFollowing" :rows="4" animated />
          <el-empty v-else-if="!filteredFollowing.length" description="暂无关注" />
          <div v-else>
            <div class="follow-grid">
              <div v-for="u in pagedFollowing" :key="`fg-${u.id}`" class="follow-user-card" @click="goProfile(u.id)">
                <el-avatar :src="u.avatar || defaultAvatar" :size="42" />
                <div class="follow-user-info">
                  <div class="name">{{ u.nickname || u.username }}</div>
                  <div class="sub">@{{ u.username || 'unknown' }}</div>
                  <div class="time">关注于 {{ formatFollowTime(u.followTime) }}</div>
                </div>
                <el-button size="small" @click.stop="toggleFollow(u)">取消关注</el-button>
              </div>
            </div>
            <div class="follow-pagination">
              <el-pagination
                background
                layout="prev, pager, next, total"
                :current-page="followingPage"
                :page-size="pageSize"
                :total="filteredFollowing.length"
                @current-change="handleFollowingPageChange"
              />
            </div>
          </div>
        </div>

        <div class="follow-col">
          <div class="col-title">关注我的人</div>
          <div class="follow-toolbar">
            <el-input
              v-model="followersKeyword"
              placeholder="搜索粉丝（昵称/用户名）"
              clearable
              @input="followersPage = 1"
            />
          </div>
          <el-skeleton v-if="loadingFollowers" :rows="4" animated />
          <el-empty v-else-if="!filteredFollowers.length" description="暂无粉丝" />
          <div v-else>
            <div class="follow-grid">
              <div v-for="u in pagedFollowers" :key="`fr-${u.id}`" class="follow-user-card" @click="goProfile(u.id)">
                <el-avatar :src="u.avatar || defaultAvatar" :size="42" />
                <div class="follow-user-info">
                  <div class="name">{{ u.nickname || u.username }}</div>
                  <div class="sub">@{{ u.username || 'unknown' }}</div>
                  <div class="time">关注于 {{ formatFollowTime(u.followTime) }}</div>
                </div>
                <el-button size="small" type="primary" plain @click.stop="followBack(u)">
                  {{ u.following ? '已关注' : '回关' }}
                </el-button>
              </div>
            </div>
            <div class="follow-pagination">
              <el-pagination
                background
                layout="prev, pager, next, total"
                :current-page="followersPage"
                :page-size="pageSize"
                :total="filteredFollowers.length"
                @current-change="handleFollowersPageChange"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="container container-inner">
      <p>未登录或会话已过期，请先登录。</p>
      <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'

const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.userInfo)
const displayRole = computed(() => {
  return (
    role.value.description ||
    user.value?.roleDescription ||
    role.value.name ||
    user.value?.roleName ||
    ''
  )
})

const role = ref({ name: '', description: '' })
const following = ref([])
const followers = ref([])
const loadingFollowing = ref(false)
const loadingFollowers = ref(false)
const followingKeyword = ref('')
const followersKeyword = ref('')
const followingPage = ref(1)
const followersPage = ref(1)
const pageSize = ref(8)
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'

const fetchFollowing = async () => {
  loadingFollowing.value = true
  try {
    const res = await request.get('/api/follow/following')
    if (res.data && res.data.code === 200) {
      following.value = res.data.data || []
    }
  } finally {
    loadingFollowing.value = false
    followingPage.value = 1
  }
}

const fetchFollowers = async () => {
  loadingFollowers.value = true
  try {
    const res = await request.get('/api/follow/followers')
    if (res.data && res.data.code === 200) {
      followers.value = res.data.data || []
    }
  } finally {
    loadingFollowers.value = false
    followersPage.value = 1
  }
}

const toggleFollow = async (targetUser) => {
  try {
    const res = await request.post('/api/follow/toggle', null, { params: { targetId: targetUser.id } })
    if (res.data && res.data.code === 200) {
      // 取消关注后，从列表中移除
      following.value = following.value.filter((u) => u.id !== targetUser.id)
    }
  } catch (e) {
    console.error(e)
  }
}

const followBack = async (targetUser) => {
  if (!targetUser?.id) return
  try {
    const res = await request.post('/api/follow/toggle', null, { params: { targetId: targetUser.id } })
    if (res.data && res.data.code === 200) {
      targetUser.following = !!res.data.following
      ElMessage.success(res.data.msg || (targetUser.following ? '关注成功' : '已取消关注'))
    }
  } catch (e) {
    console.error(e)
  }
}

const goProfile = (id) => {
  if (!id) return
  router.push(`/user/profile/${id}`)
}

const filteredFollowing = computed(() => {
  if (!followingKeyword.value) return following.value
  const keyword = followingKeyword.value.toLowerCase()
  return following.value.filter((u) => {
    return (
      (u.nickname || '').toLowerCase().includes(keyword) ||
      (u.username || '').toLowerCase().includes(keyword)
    )
  })
})

const filteredFollowers = computed(() => {
  if (!followersKeyword.value) return followers.value
  const keyword = followersKeyword.value.toLowerCase()
  return followers.value.filter((u) => {
    return (
      (u.nickname || '').toLowerCase().includes(keyword) ||
      (u.username || '').toLowerCase().includes(keyword)
    )
  })
})

const pagedFollowing = computed(() => {
  const start = (followingPage.value - 1) * pageSize.value
  return filteredFollowing.value.slice(start, start + pageSize.value)
})

const pagedFollowers = computed(() => {
  const start = (followersPage.value - 1) * pageSize.value
  return filteredFollowers.value.slice(start, start + pageSize.value)
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

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  } else {
    // 加载当前用户角色信息
    request
      .get('/api/user/role-info')
      .then((res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          role.value = res.data.data
        }
      })
      .catch((e) => {
        console.error(e)
      })

    fetchFollowing()
    fetchFollowers()
  }
})
</script>

<style scoped>
.center-page {
  padding: 18px 0 24px;
  background: #f6f7f8;
  min-height: 100vh;
}

.center-header {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.center-avatar {
  cursor: pointer;
}

.center-main {
  flex: 1;
}

.center-main h2 {
  margin: 0;
}

.center-sub {
  margin: 6px 0;
  color: #9499a0;
  font-size: 13px;
}

.center-bio {
  margin: 0;
  color: #61666d;
}

.center-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.follow-panel {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.follow-col {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.col-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.follow-toolbar {
  margin-bottom: 10px;
}

.follow-grid {
  display: grid;
  gap: 10px;
}

.follow-user-card {
  border: 1px solid #eceef1;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.follow-user-card:hover {
  border-color: #d6d9dd;
}

.follow-user-info {
  flex: 1;
  min-width: 0;
}

.name {
  color: #18191c;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  color: #9499a0;
  font-size: 12px;
}

.time {
  color: #9499a0;
  font-size: 12px;
  margin-top: 2px;
}

.follow-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .center-header {
    flex-direction: column;
  }
}
</style>
