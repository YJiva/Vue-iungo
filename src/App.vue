<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getTheme, setTheme } from './utils/theme'
import { useUserStore } from './stores/user'
import { useSiteStore } from './stores/site'
import LoginView from './views/user/login.vue'
import RegisterView from './views/user/register.vue'




const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const siteStore = useSiteStore()
const editorFullscreen = ref(false)
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

const onEditorFullscreenChange = (e) => {
  const full = !!(e && e.detail && e.detail.fullscreen)
  editorFullscreen.value = full
  if (full) {
    hideHeader.value = true
  }
}

const lastScrollY = ref(window.scrollY || 0)
const hideHeader = ref(false)


const handleScroll = () => {
  if (editorFullscreen.value) {
    hideHeader.value = true
    return
  }
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
  window.addEventListener('editor-fullscreen-change', onEditorFullscreenChange)
  userStore.checkAuth() // 检查登录状态
  siteStore.loadPublicSiteData().catch((e) => console.error('加载站点配置失败', e))
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', onThemeChanged)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('editor-fullscreen-change', onEditorFullscreenChange)
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
  } else if (command === 'profile' || command === 'settings') {
    const uid = userStore.userInfo?.id
    if (uid) {
      router.push(`/user/profile/${uid}`)
    }
  }
}

// 仅在前台页面显示头部导航，在 /admin 等后台页面隐藏


const showHeader = computed(() => {
  const path = route.path || ''
  if (path.startsWith('/admin') || path === '/login' || path === '/register') {
    return false
  }
  if (editorFullscreen.value) {
    return false
  }
  return true
})

const headerClasses = computed(() => {
  return {
    header: true,
    'header-hidden': hideHeader.value,
    'header-blocked': editorFullscreen.value
  }
})

const siteTitle = computed(() => siteStore.config.title || 'Iungo')
const siteSubtitle = computed(() => siteStore.config.subtitle || '邀请制深度创作社区')
const siteLogo = computed(() => siteStore.config.logoUrl || '')

const applyFavicon = (href) => {
  if (!href) return
  let link = document.querySelector("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'icon')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

watch(
  () => siteStore.config,
  (cfg) => {
    document.title = cfg.title || 'Iungo'
    applyFavicon(cfg.faviconUrl)
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div id="app-shell">
    <header v-if="showHeader" :class="headerClasses">
      <div class="container container-inner header-wrap">
        <div class="logo">
          <img v-if="siteLogo" :src="siteLogo" alt="logo" class="logo-img" />
          <h1>{{ siteTitle }}</h1>
          <p>{{ siteSubtitle }}</p>
        </div>
        <div class="nav">
          <router-link to="/home" class="nav-item" active-class="active">{{ siteStore.config.navHomeText || '首页' }}</router-link>
          <router-link to="/blog/list" class="nav-item" active-class="active">{{ siteStore.config.navBlogText || '圈层博客' }}</router-link>
          <router-link to="/post/category/list" class="nav-item" active-class="active">贴吧</router-link>
          <router-link to="/invite" class="nav-item" active-class="active">{{ siteStore.config.navInviteText || '我的邀请' }}</router-link>
          <router-link to="/blog/edit" class="nav-item publish-btn" active-class="active">{{ siteStore.config.navPublishText || '发布博客' }}</router-link>
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
                  <el-dropdown-item command="profile">主页  </el-dropdown-item>

                  <el-dropdown-item command="logout" divided>登出</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <!-- 极简浅色风格，暂时隐藏主题切换 -->
        </div>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>

    <el-dialog v-model="showAuth" :draggable="true" :close-on-click-modal="false" :title="authMode === 'login' ? loginTitle : registerTitle" width="520px">
      <el-container>
        <el-main>
          <component
            :is="authMode === 'login' ? LoginView : RegisterView"
            @success="showAuth = false"
            @open-register="openRegister"
            @open-login="openLogin"
            @close-auth="showAuth = false"
          />
        </el-main>
      </el-container>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, opacity 0.2s ease-out;
}

.header-blocked {
  opacity: 0;
  pointer-events: none;
  z-index: 0 !important;
}

.header-hidden {
  transform: translateY(-100%);
}

.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.logo h1 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: 0.06em;
}

.logo-img {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 8px;
}

.logo p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-light);
}

.nav {
  display: flex;
  gap: 0.5rem;
}

.nav-item {
  text-decoration: none;
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
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 260px;
  flex: 1;
}

.search-box .el-input {
  --el-input-bg-color: #f3f4f6;
  --el-input-border-color: transparent;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-btn {
  padding: 0;
  background: transparent;
  border: none;
}

@media (max-width: 768px) {
  .header-wrap {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-box {
    max-width: 100%;
    width: 100%;
    order: 3;
  }

  .nav {
    order: 2;
    flex-wrap: wrap;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-end;
    order: 1;
  }
}
</style>
