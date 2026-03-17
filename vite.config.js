import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
<<<<<<< HEAD
    // 本地开发时把 /api 和 /upload 转发到后端，避免浏览器 CORS 拦截
=======
    // 本地开发时把 /api 转发到后端，避免浏览器 CORS 拦截
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
<<<<<<< HEAD
      },
      '/upload': {
        target: 'http://localhost:8080',
        changeOrigin: true
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
      }
    }
  },
})
