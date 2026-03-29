<template>
  <el-popover
    placement="bottom-start"
    :width="300"
    trigger="hover"
    popper-class="user-hover-popper"
    @show="hydrateOnHover"
  >
    <template #reference>
      <span class="user-inline" @click.stop="goProfile">
        <el-avatar :src="profile.avatar || defaultAvatar" :size="avatarSize" class="user-avatar" />
        <span class="user-name">{{ profile.nickname || profile.username || String(userId) }}</span>
      </span>
    </template>

    <div class="card">
      <div class="pop-head">
        <el-avatar :src="profile.avatar || defaultAvatar" :size="48" />
        <div class="pop-info">
          <div class="pop-name">{{ profile.nickname || profile.username || '未命名' }}</div>
          <div class="pop-sub">@{{ profile.username || '-' }} · #{{ userId }}</div>
          <div class="pop-bio">{{ profile.bio || '暂无简介' }}</div>
        </div>
      </div>
      <div class="pop-actions">
        <el-button size="small" plain @click="goDm">私信</el-button>
        <el-button size="small" @click="goProfile">主页</el-button>
        <el-button
          v-if="showFollow"
          size="small"
          :type="following ? 'default' : 'primary'"
          @click="toggleFollow"
        >
          {{ following ? '已关注' : (followedBy ? '回关' : '关注') }}
        </el-button>
        <el-button
          v-if="canMuteInBar"
          size="small"
          type="danger"
          plain
          @click="openMute"
        >
          禁言
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import request from '../utils/request'

const profileCache = new Map()

const props = defineProps({
  userId: { type: [Number, String], required: true },
  avatarSize: { type: Number, default: 20 },
  categoryId: { type: [Number, String], default: null }, // 用于吧内禁言
  canMuteInBar: { type: Boolean, default: false }
})

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'

const profile = ref({ id: null, username: '', nickname: '', avatar: '', bio: '' })
const basicLoaded = ref(false)
const hoverLoaded = ref(false)
const following = ref(false)
const followedBy = ref(false)

const showFollow = computed(() => userStore.isLoggedIn && userStore.userInfo?.id && Number(userStore.userInfo.id) !== Number(props.userId))

const loadBasicProfile = async () => {
  const key = Number(props.userId)
  if (!key) return
  if (profileCache.has(key)) {
    profile.value = profileCache.get(key)
    basicLoaded.value = true
    return
  }
  try {
    const profileRes = await request.get('/api/user/public-profile', { userId: props.userId })
    if (profileRes?.data?.code === 200 && profileRes.data.data) {
      profile.value = profileRes.data.data
      profileCache.set(key, profileRes.data.data)
    }
  } catch {
    // ignore
  } finally {
    basicLoaded.value = true
  }
}

const hydrateOnHover = async () => {
  await loadBasicProfile()
  if (hoverLoaded.value) return
  hoverLoaded.value = true
  try {
    if (userStore.isLoggedIn) {
      const statusRes = await request.get('/api/follow/status', { targetId: props.userId })
      if (statusRes?.data?.code === 200) {
        following.value = !!statusRes.data.following
        followedBy.value = !!statusRes.data.followedBy
      }
    }
  } catch {
    // ignore
  }
}

const goProfile = () => {
  router.push(`/user/profile/${props.userId}`)
}

const goDm = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  router.push({ path: '/messages', query: { peerId: props.userId } })
}

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await request.post('/api/follow/toggle', null, { params: { targetId: props.userId } })
    if (res.data?.code === 200) {
      following.value = !!res.data.following
      ElMessage.success(res.data.msg || (following.value ? '关注成功' : '已取消关注'))
    } else {
      ElMessage.error(res.data?.msg || '操作失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const openMute = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!props.categoryId) {
    ElMessage.error('缺少 categoryId，无法禁言')
    return
  }
  if (Number(props.userId) === Number(userStore.userInfo?.id)) {
    ElMessage.warning('不能禁言自己')
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请输入禁言时长（分钟）', '禁言用户', {
      inputValue: '60',
      inputPattern: /^[1-9]\d{0,4}$/,
      inputErrorMessage: '请输入正整数分钟数'
    })
    const minutes = Number(value)
    const res = await request.post('/api/post/category/mute/set', {
      categoryId: props.categoryId,
      userId: props.userId,
      minutes,
      reason: '吧务操作'
    })
    if (res.data?.code === 200) {
      ElMessage.success('禁言已生效')
    } else {
      ElMessage.error(res.data?.msg || '禁言失败')
    }
  } catch {
    // cancelled
  }
}

onMounted(() => {
  // 让“头像+昵称”在未 hover 时也能显示
  loadBasicProfile()
})
</script>

<style scoped>
.user-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.user-name {
  color: inherit;
}
.pop-head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.pop-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pop-name { font-weight: 600; }
.pop-sub { font-size: 12px; color: var(--text-light); }
.pop-bio { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
.pop-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
</style>

