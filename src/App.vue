<script setup>
<<<<<<< HEAD
import { RouterView, useRouter, useRoute } from 'vue-router'
=======
import { RouterView, useRouter } from 'vue-router'
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTheme, setTheme } from './utils/theme'
import { useUserStore } from './stores/user'
import LoginView from './views/user/login.vue'
import RegisterView from './views/user/register.vue'




const router = useRouter()
<<<<<<< HEAD
const route = useRoute()
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
const userStore = useUserStore()

const loginTitle = '登录'
const registerTitle = '注册'
const theme = ref(getTheme())
const isDark = computed({
  get: () => theme.value === 'dark',
  set: (val) => {
    setTheme(val ? 'dark' : 'default')
  }
})

const onThemeChanged = (e) => {
  try {
    theme.value = e && e.detail && e.detail.theme ? e.detail.theme : getTheme()
  } catch {
    theme.value = getTheme()
  }
}

<<<<<<< HEAD
const lastScrollY = ref(window.scrollY || 0)
const hideHeader = ref(false)

const handleScroll = () => {
  const currentY = window.scrollY || 0
  const delta = currentY - lastScrollY.value

  if (delta > 0) {
    // 向下滚动：隐藏 header
    hideHeader.value = true
  } else if (delta < 0) {
    // 向上滚动：显示 header
    hideHeader.value = false
  }

  lastScrollY.value = currentY
}

onMounted(() => {
  theme.value = getTheme()
  window.addEventListener('theme-changed', onThemeChanged)
  window.addEventListener('scroll', handleScroll, { passive: true })
=======
onMounted(() => {
  theme.value = getTheme()
  window.addEventListener('theme-changed', onThemeChanged)
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  userStore.checkAuth() // 检查登录状态
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', onThemeChanged)
<<<<<<< HEAD
  window.removeEventListener('scroll', handleScroll)
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
})

const showAuth = ref(false)
const authMode = ref('login') // 'login' or 'register'

function openLogin() {
  authMode.value = 'login'
  showAuth.value = true
}

function openRegister() {
  authMode.value = 'register'
  showAuth.value = true
}

// 添加搜索功能（模仿Bilibili）
const searchQuery = ref('')
function performSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'BlogList', query: { search: searchQuery.value } })
  }
}

// 主题切换
function toggleTheme(value) {
  setTheme(value ? 'dark' : 'default')
}



// 消息通知
function openNotifications() {
  router.push('/notifications')
}

// 用户下拉菜单
function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
  } else if (command === 'profile') {
    router.push('/user/center')
  } else if (command === 'settings') {
    router.push('/settings')
  }
}
<<<<<<< HEAD

// 仅在前台页面显示头部导航，在 /admin 等后台页面隐藏
const showHeader = computed(() => {
  const path = route.path || ''
  // 以 /admin 开头的路由认为是后台管理，不显示前台导航
  if (path.startsWith('/admin')) {
    return false
  }
  return true
})

const headerClasses = computed(() => {
  return {
    header: true,
    'header-hidden': hideHeader.value
  }
})
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
</script>

<template>
  <div id="app-shell">
<<<<<<< HEAD
    <header v-if="showHeader" :class="headerClasses">
=======
    <header :class="['header', theme.value]">
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
      <div class="container container-inner header-wrap">
        <div class="logo">
          <h1>Iungo</h1>
          <p>邀请制深度创作社区</p>
        </div>
        <div class="nav">
          <router-link to="/home" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/blog/list" class="nav-item" active-class="active">圈层博客</router-link>
          <router-link to="/invite" class="nav-item" active-class="active">我的邀请</router-link>
          <router-link to="/user/center" class="nav-item" active-class="active">个人中心</router-link>
          <router-link to="/blog/edit" class="nav-item publish-btn" active-class="active">发布博客</router-link>
        </div>
        <div class="search-box">
          <el-input v-model="searchQuery" placeholder="搜索内容" @keyup.enter="performSearch" />
          <el-button @click="performSearch" icon="Search" />
        </div>
        <div class="user-actions">
          <template v-if="!userStore.isLoggedIn">
            <el-button type="primary" @click="openLogin">登录</el-button>
            <el-button @click="openRegister">注册</el-button>
          </template>
          <template v-else>
            <el-button icon="Bell" class="nav-item" @click="openNotifications">消息</el-button>
            <el-dropdown @command="handleCommand">
              <el-button class="avatar-btn">
                <el-avatar :src="userStore.userInfo?.avatar || 'https://example.com/default-avatar.jpg'" size="small" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>登出</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        
<<<<<<< HEAD
          <!-- 极简浅色风格，暂时隐藏主题切换 -->
=======
          <div class="theme-switch">
            <span>主题</span>
            <el-switch v-model="isDark"  @change="toggleTheme" />
            <i :class="themeIcons"></i>
          </div>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
        </div>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>

    <el-dialog v-model="showAuth" :draggable="true" :close-on-click-modal="false" :title="authMode === 'login' ? loginTitle : registerTitle" width="520px">
      <el-container>
        <el-main><component :is="authMode === 'login' ? LoginView : RegisterView" @success="showAuth = false" @open-register="openRegister" /></el-main>
      </el-container>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
<<<<<<< HEAD
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.header-hidden {
  transform: translateY(-100%);
=======
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header.dark {
  background: rgba(0, 0, 0, 0.8); /* 模仿Bilibili的半透明黑色背景 */
  color: white;
}

.header.default {
  background: rgba(255, 255, 255, 0.8); /* 默认浅色主题背景 */
  color: black;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
<<<<<<< HEAD
  gap: 16px;
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.logo h1 {
  margin: 0;
<<<<<<< HEAD
  font-size: 1.35rem;
  letter-spacing: 0.06em;
=======
  font-size: 1.5rem;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.logo p {
  margin: 0;
  font-size: 0.8rem;
<<<<<<< HEAD
  color: var(--text-light);
=======
}

.header.default .logo h1 {
  color: #d32f2f; /* 深红色logo */
}

.header.default .logo p {
  color: #666;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.nav {
  display: flex;
<<<<<<< HEAD
  gap: 0.5rem;
=======
  gap: 1rem;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.nav-item {
  text-decoration: none;
<<<<<<< HEAD
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.nav-item.active,
.nav-item:hover {
  background-color: rgba(var(--primary-color-rgb), 0.08);
  color: var(--primary-color);
}

.publish-btn {
  background-color: var(--primary-color);
  color: #fff !important;
=======
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.header.default .nav-item {
  color: black;
}

.nav-item:hover, .nav-item.active {
  background-color: rgba(255, 255, 255, 0.1);
}

.header.default .nav-item:hover, .header.default .nav-item.active {
  background-color: rgba(0, 0, 0, 0.1);
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.search-box {
  display: flex;
  align-items: center;
<<<<<<< HEAD
  gap: 6px;
  max-width: 260px;
  flex: 1;
}

.search-box .el-input {
  --el-input-bg-color: #f3f4f6;
  --el-input-border-color: transparent;
=======
  border-radius: 20px;
  padding: 0.25rem 0.5rem;
  flex: 1;
  max-width: 300px;
  margin: 0 1rem;
}

.header.dark .search-box {
  background: rgba(255, 255, 255, 0.1);
}

.header.default .search-box {
  background: rgba(0, 0, 0, 0.1);
}

.search-box .el-input {
  --el-input-bg-color: transparent;
  --el-input-border-color: transparent;
  --el-input-focus-border-color: transparent;
}

.header.dark .search-box .el-input {
  color: white;
}

.header.default .search-box .el-input {
  color: black;
}

.search-box .el-input__inner::placeholder {
  color: #ccc;
}

.header.default .search-box .el-input__inner::placeholder {
  color: #666;
}

.search-box .el-button {
  background: transparent;
  border: none;
}

.header.dark .search-box .el-button {
  color: white;
}

.header.default .search-box .el-button {
  color: black;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
}

.user-actions {
  display: flex;
<<<<<<< HEAD
  align-items: center;
  gap: 0.5rem;
}

=======
  gap: 0.5rem;
}

.user-actions .el-button {
  border: none;
}

.header.dark .user-actions .el-button {
  background: #ff6b6b;
  color: white;
}

.header.default .user-actions .el-button {
  background: #d32f2f;
  color: white;
}

>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
.avatar-btn {
  padding: 0;
  background: transparent;
  border: none;
}

<<<<<<< HEAD
@media (max-width: 768px) {
  .header-wrap {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-box {
    max-width: 100%;
    width: 100%;
    order: 3;
=======
.theme-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-wrap {
    flex-direction: column;
    gap: 0.5rem;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  }

  .nav {
    order: 2;
<<<<<<< HEAD
    flex-wrap: wrap;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-end;
    order: 1;
=======
    justify-content: center;
  }

  .search-box {
    order: 1;
    max-width: 100%;
    margin: 0;
  }

  .user-actions {
    order: 3;
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  }
}
</style>