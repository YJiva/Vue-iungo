<template>
  <div class="home-page">
    <!-- 原有导航栏、核心内容区、页脚不变 -->


    <main class="main">
      <div class="container container-inner main-wrap">
        <!-- 原有左侧博客列表不变 -->
        <div class="main-left">
          <div class="card blog-list">
            <div class="blog-list-header">
              <h2>圈层优质博客</h2>
              <span>仅邀请用户可见</span>
            </div>
            <div v-if="loading" style="text-align: center; padding: 20px;">
              <el-loading-spinner /> 加载中...
            </div>
            <div v-else class="blog-item" v-for="blog in blogList" :key="blog.id">
              <div class="blog-title">
                <router-link :to="`/blog/detail/${blog.id}`">{{ blog.title }}</router-link>
              </div>
              <div class="blog-meta">
                <span>{{ blog.author }}</span>
                <span>{{ blog.createTime }}</span>
                <span>{{ blog.readCount }}阅读</span>
                <span>{{ blog.inviteCircle }}</span>
              </div>
              <div class="blog-desc">{{ blog.desc }}</div>
              <div class="blog-tags">
                <el-tag v-for="tag in blog.tags" :key="tag" size="small">{{ tag }}</el-tag>
              </div>
            </div>
            <div v-if="!loading && blogList.length === 0" style="text-align: center; padding: 20px; color: var(--text-light);">
              暂无博客数据
            </div>
          </div>

          <!-- 新增：测试用户名展示区域（核心改动） -->
          <div class="card user-test-card" style="margin-top: 20px;">
            <div class="user-test-header">
              <h2>测试用户名列表（数据库直连）</h2>
              <el-button type="primary" size="small" @click="fetchAllUsernames">刷新用户名</el-button>
            </div>
            <!-- 用户名列表 -->
            <div class="username-list" style="padding: 10px 0;">
              <el-tag
                v-for="name in usernameList"
                :key="name"
                size="medium"
                style="margin: 5px;"
                @click="fetchUserDetail(name)"
              >
                {{ name }}
              </el-tag>
            </div>
            <!-- 选中用户的详情 -->
            <div class="user-detail" v-if="currentUser">
              <h4>选中用户详情：</h4>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">{{ JSON.stringify(currentUser, null, 2) }}</pre>
            </div>
            <div v-if="userLoading" style="text-align: center; padding: 10px;">
              <el-loading-spinner size="small" /> 加载用户详情...
            </div>
          </div>
        </div>

        <!-- 原有右侧内容不变 -->
        <div class="main-right">
          <div class="card invite-card">
            <div class="invite-header">
              <el-icon class="invite-icon"><UserFilled /></el-icon>
              <h3>邀请制核心</h3>
            </div>
            <div class="invite-content">
              <p>仅通过邀请码注册，筛选优质创作者</p>
              <div class="invite-stats">
                <div class="stats-item">
                  <span>{{ totalUsers }}</span>
                  <p>邀请用户</p>
                </div>
                <div class="stats-item">
                  <span>{{ totalBlogs }}</span>
                  <p>深度博客</p>
                </div>
                <div class="stats-item">
                  <span>{{ totalInvites }}</span>
                  <p>发出邀请</p>
                </div>
              </div>
              <el-button @click="goToInviteCode" type="primary" class="publish-btn" full-width>
                管理我的邀请码
              </el-button>
            </div>
          </div>
          <div class="card circle-card">
            <div class="circle-header">
              <el-icon class="circle-icon"><Collection /></el-icon>
              <h3>我的邀请圈层</h3>
            </div>
            <div class="circle-list">
              <div class="circle-item" v-for="circle in circleList" :key="circle.id">
                <router-link :to="`/circle/${circle.id}`">
                  <span>{{ circle.name }}</span>
                  <span class="circle-count">{{ circle.memberCount }}人</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container container-inner footer-wrap">
        <p>InviteBlog © 2026 邀请制深度创作社区 - 专注优质内容创作与交流</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
defineOptions({ name: 'HomePage' })
import { ref, getCurrentInstance, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserFilled, Collection } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const { proxy } = getCurrentInstance()
const userStore = useUserStore()

// 原有博客数据相关响应式变量不变
const blogList = ref([])
const totalUsers = ref(0)
const totalBlogs = ref(0)
const totalInvites = ref(0)
const circleList = ref([])
const loading = ref(true)

// 2. 新增：测试用户名相关响应式变量
const usernameList = ref([]) // 所有用户名列表
const currentUser = ref(null) // 选中的用户详情
const userLoading = ref(false) // 用户详情加载状态

// 获取博客列表
const fetchHomeData = async () => {
  try {
    loading.value = true
    // request posts list from backend
    const userId = userStore.userInfo?.id || ''
    const response = await request.get('/api/post/list', { offset: 0, limit: 10, userId, scope: 2 })
    const res = response.data
    if (res.code === 200) {
      blogList.value = res.data || []
    } else {
      proxy.$message.error(res.message || '数据获取失败')
    }
  } catch (error) {
    console.error('请求后端接口失败：', error)
  } finally {
    loading.value = false
  }
}

// 首页右侧统计
const fetchStats = async () => {
  try {
    const response = await request.get('/api/home/stats')
    const res = response.data
    if (res.code === 200 && res.data) {
      totalUsers.value = res.data.totalUsers || 0
      totalBlogs.value = res.data.totalBlogs || 0
      // 这里用总邀请关系数近似“发出邀请”
      totalInvites.value = res.data.totalPosts || 0
    }
  } catch (e) {
    console.error('获取首页统计失败', e)
  }
}

// 3. 新增：获取所有用户名的函数（调用后端测试接口）
const fetchAllUsernames = async () => {
  try {
    // 调用后端：http://localhost:8080/api/test/usernames
    const response = await request.get('/api/home/usernames')
    const res = response.data
    if (res.code === 200) {
      usernameList.value = res.data || []
      proxy.$message.success('用户名列表加载成功！')
    } else {
      proxy.$message.error(res.message || '用户名列表加载失败')
    }
  } catch (error) {
    console.error('获取用户名失败：', error)
    proxy.$message.error('网络错误，无法获取用户名')
  }
}

// 4. 新增：获取单个用户详情的函数（调用后端测试接口）
const fetchUserDetail = async (username) => {
  try {
    userLoading.value = true
    currentUser.value = null // 清空之前的详情
    // 调用后端：http://localhost:8080/api/test/user?username=xxx
    const response = await request.get(`/api/home/user?username=${username}`)
    const res = response.data
    if (res.code === 200) {
      currentUser.value = res.data // 赋值选中的用户详情
    } else {
      proxy.$message.error(res.message || '用户详情加载失败')
    }
  } catch (error) {
    console.error('获取用户详情失败：', error)
    proxy.$message.error('网络错误，无法获取用户详情')
  } finally {
    userLoading.value = false
  }
}

// 5. 页面挂载时：同时加载博客数据 + 用户名列表
onMounted(() => {
  fetchHomeData()
  fetchStats()
  fetchAllUsernames() // 新增逻辑
})

// 原有跳转逻辑不变
const goToInviteCode = () => {
  router.push('/invite')
}
</script>

<style scoped>
/* 原有样式不变，新增少量样式适配测试区域 */
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo h1 {
  color: var(--primary-color);
  font-size: 24px;
  margin: 0;
}
.logo p {
  color: var(--text-light);
  font-size: 12px;
  margin: 0;
}
.nav {
  display: flex;
  align-items: center;
  gap: 20px;
}
.nav-item {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}
.nav-item.active, .nav-item:hover {
  color: var(--primary-color);
  background-color: rgba(var(--primary-color-rgb), 0.1);
}
.publish-btn {
  background-color: var(--primary-color);
  color: #fff !important;
}
.publish-btn:hover {
  background-color: var(--primary-light);
}
.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.main {
  flex: 1;
  padding: 30px 0;
}
.main-wrap {
  display: flex;
  gap: 20px;
}
.main-left {
  width: 70%;
}
.main-right {
  width: 30%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.blog-list {
  padding: 20px;
}
.blog-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}
.blog-list-header h2 {
  color: var(--text-primary);
  font-size: 18px;
  margin: 0;
}
.blog-list-header span {
  color: var(--text-light);
  font-size: 12px;
}
.blog-item {
  padding: 15px 0;
  border-bottom: 1px dashed var(--border-color);
}
.blog-item:last-child {
  border-bottom: none;
}
.blog-title a {
  color: var(--text-primary);
  font-size: 16px;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}
.blog-title a:hover {
  color: var(--primary-color);
}
.blog-meta {
  display: flex;
  gap: 15px;
  margin: 8px 0;
  font-size: 12px;
  color: var(--text-light);
}
.blog-desc {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 8px;
}
.blog-tags {
  display: flex;
  gap: 8px;
}
.invite-card, .circle-card {
  padding: 20px;
}
.invite-header, .circle-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}
.invite-icon, .circle-icon {
  color: var(--primary-color);
  font-size: 18px;
}
.invite-header h3, .circle-header h3 {
  color: var(--text-primary);
  font-size: 16px;
  margin: 0;
}
.invite-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 15px;
}
.invite-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}
.stats-item {
  text-align: center;
}
.stats-item span {
  color: var(--primary-color);
  font-size: 20px;
  font-weight: 600;
  display: block;
}
.stats-item p {
  color: var(--text-light);
  font-size: 12px;
  margin: 5px 0 0 0;
}
.invite-btn {
  background-color: var(--primary-color);
  border: none;
}
.invite-btn:hover {
  background-color: var(--primary-light);
}
.circle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.circle-item a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
}
.circle-item a:hover {
  background-color: rgba(var(--primary-color-rgb), 0.1);
  color: var(--primary-color);
}
.circle-count {
  color: var(--text-light);
  font-size: 12px;
}
.footer {
  background-color: var(--bg-footer);
  color: var(--text-light);
  padding: 20px 0;
  margin-top: auto;
}
.footer-wrap {
  text-align: center;
}
.footer-wrap p {
  margin: 0;
  font-size: 12px;
}
/* 新增：测试用户名区域样式 */
.user-test-card {
  padding: 20px;
}
.user-test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}
.user-test-header h2 {
  font-size: 18px;
  margin: 0;
  color: var(--text-primary);
}
.username-list .el-tag {
  cursor: pointer;
}
.user-detail h4 {
  margin: 10px 0;
  color: var(--text-primary);
}
</style>
