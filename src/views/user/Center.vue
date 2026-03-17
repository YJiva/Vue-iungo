<template>
  <div class="page-user-center">
    <div class="container container-inner" v-if="user">
      <h2>个人中心</h2>
      <el-card class="user-card">
        <p><strong>用户名：</strong>{{ user.username }}</p>
        <p><strong>昵称：</strong>{{ user.nickname }}</p>
        <p><strong>邮箱：</strong>{{ user.email }}</p>
        <p>
          <strong>角色：</strong>
          <el-tooltip
            v-if="role.name || role.description"
            :content="role.description || '无角色描述'"
            placement="top"
          >
            <span>{{ role.name || ('ID ' + (user.roleId ?? '-')) }}</span>
          </el-tooltip>
          <span v-else>ID {{ user.roleId ?? '-' }}</span>
        </p>
        <p><strong>性别：</strong>{{ user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知' }}</p>
      </el-card>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/settings')">编辑资料 / 修改密码</el-button>
        <el-button type="success" @click="$router.push('/invite')">邀请好友</el-button>
        <el-button @click="$router.push('/user/collections')">我的收藏</el-button>
      </div>

      <div class="follow-section">
        <el-card class="follow-card">
          <h3>我关注的人</h3>
          <div v-if="loadingFollowing" class="loading-text">加载中...</div>
          <div v-else-if="!following.length" class="empty-text">暂无关注</div>
          <ul v-else class="follow-list">
            <li v-for="u in following" :key="u.id">
              <span>{{ u.nickname || u.username }}</span>
              <el-button type="text" size="small" @click="toggleFollow(u)">取消关注</el-button>
            </li>
          </ul>
        </el-card>

        <el-card class="follow-card">
          <h3>关注我的人</h3>
          <div v-if="loadingFollowers" class="loading-text">加载中...</div>
          <div v-else-if="!followers.length" class="empty-text">暂无粉丝</div>
          <ul v-else class="follow-list">
            <li v-for="u in followers" :key="u.id">
              <span>{{ u.nickname || u.username }}</span>
            </li>
          </ul>
        </el-card>
      </div>
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
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'

const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.userInfo)

const role = ref({ name: '', description: '' })
const following = ref([])
const followers = ref([])
const loadingFollowing = ref(false)
const loadingFollowers = ref(false)

const fetchFollowing = async () => {
  loadingFollowing.value = true
  try {
    const res = await request.get('/api/follow/following')
    if (res.data && res.data.code === 200) {
      following.value = res.data.data || []
    }
  } finally {
    loadingFollowing.value = false
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
.page-user-center { padding: 20px 0; }
.user-card { margin-bottom: 16px; max-width: 400px; }
.actions { display: flex; gap: 12px; }
.follow-section {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.follow-card {
  min-height: 120px;
}
.follow-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.follow-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}
.follow-list li:last-child {
  border-bottom: none;
}
.empty-text,
.loading-text {
  color: var(--text-light);
  font-size: 13px;
}
</style>
