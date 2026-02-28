<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTheme, setTheme } from './utils/theme'
import { useUserStore } from './stores/user'
import LoginView from './views/user/login.vue'
import RegisterView from './views/user/register.vue'




const router = useRouter()
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

onMounted(() => {
  theme.value = getTheme()
  window.addEventListener('theme-changed', onThemeChanged)
  userStore.checkAuth() // 检查登录状态
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', onThemeChanged)
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
</script>

<template>
  <div id="app-shell">
    <header :class="['header', theme.value]">
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
        
          <div class="theme-switch">
            <span>主题</span>
            <el-switch v-model="isDark"  @change="toggleTheme" />
            <i :class="themeIcons"></i>
          </div>
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
}

.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
}

.logo p {
  margin: 0;
  font-size: 0.8rem;
}

.header.default .logo h1 {
  color: #d32f2f; /* 深红色logo */
}

.header.default .logo p {
  color: #666;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav-item {
  text-decoration: none;
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
}

.search-box {
  display: flex;
  align-items: center;
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
}

.user-actions {
  display: flex;
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

.avatar-btn {
  padding: 0;
  background: transparent;
  border: none;
}

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
  }

  .nav {
    order: 2;
    justify-content: center;
  }

  .search-box {
    order: 1;
    max-width: 100%;
    margin: 0;
  }

  .user-actions {
    order: 3;
  }
}
</style>