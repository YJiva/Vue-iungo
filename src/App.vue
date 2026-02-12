<script setup>
import { RouterView } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { cycleTheme, getTheme } from './utils/theme'
import LoginView from './views/user/login.vue'
import RegisterView from './views/user/register.vue'

const loginTitle = '登录'
const registerTitle = '注册'
const theme = ref(getTheme())
const themeLabel = computed(() => theme.value)

const onThemeChanged = (e) => {
  try {
    theme.value = e && e.detail && e.detail.theme ? e.detail.theme : getTheme()
  } catch (err) {
    theme.value = getTheme()
  }
}

onMounted(() => {
  theme.value = getTheme()
  window.addEventListener('theme-changed', onThemeChanged)
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
</script>


<template>
  <div id="app-shell">
  <header class="header">
      <div class="container container-inner header-wrap">
        <div class="logo">
          <h1>Iungo</h1>
          <p>邀请制深度创作社区</p>
        </div>
        <div class="nav">
          <router-link to="/home" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/blog/list" class="nav-item" active-class="active">圈层博客</router-link>
          <router-link to="/user/center" class="nav-item" active-class="active">个人中心</router-link>
          <router-link to="/blog/edit" class="nav-item publish-btn" active-class="active">发布博客</router-link>
          
        </div>
        <div class="user-actions">
          <el-button type="primary" @click="openLogin">登录</el-button>
          <el-button class="nav-item publish-btn" type="button"  @click="cycleTheme">主题：{{ themeLabel }}</el-button>
          <el-button class="nav-item publish-btn" @click="goToInvite" type="primary" size="small">邀请好友</el-button>
        </div>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  

    <el-dialog v-model="showAuth" :draggable="true" :close-on-click-modal="false" :title="authMode === 'login' ? loginTitle : registerTitle" width="520px">
      <component :is="authMode === 'login' ? LoginView : RegisterView" @success="showAuth = false" @open-register="openRegister" />
    </el-dialog>
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 0 0.5rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

.nav-item.active, .nav-item:hover {
  color: var(--primary-color);
  background-color: rgba(var(--primary-color-rgb), 0.08);
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.app-title {
  font-weight: 600;
}

.theme-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}

.app-main {
  padding: 1rem;
}

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 8px 0;
}
.tabbar-inner {
  display: flex;
  justify-content: center;
}


.nav-item, .theme-btn, .user-actions .el-button, .el-button {
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
