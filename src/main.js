import './assets/main.css'
import './assets/css/global.css'


import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

import { setTheme, initTheme, cycleTheme, getTheme } from './utils/theme'

// 暴露到全局，组件可通过 `proxy.$changeTheme(name)` / `proxy.$cycleTheme()` / `proxy.$getTheme()` 调用
app.config.globalProperties.$changeTheme = setTheme
app.config.globalProperties.$cycleTheme = cycleTheme
app.config.globalProperties.$getTheme = getTheme

// 启动时初始化主题（从 localStorage 读取）
initTheme()

app.mount('#app')
