<template>
  <div class="page-collections">
    <div class="container container-inner">
      <h2>我的收藏</h2>
      <div v-if="loading" class="loading-text">
        <el-loading-spinner /> 加载中...
      </div>
      <div v-else>
        <div v-if="!items.length" class="empty-text">
          暂无收藏内容
        </div>
        <ul v-else class="collection-list">
          <li v-for="item in items" :key="item.id" class="collection-item">
            <div class="title">
              <router-link
                v-if="item.targetType === 'post'"
                :to="`/blog/detail/${item.targetId}`"
              >
                {{ item.title || `帖子 #${item.targetId}` }}
              </router-link>
              <span v-else>
                {{ item.title || `${item.targetType} #${item.targetId}` }}
              </span>
            </div>
            <div class="meta">
              <span>类型：{{ item.targetType }}</span>
              <span>收藏时间：{{ item.createTime }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const items = ref([])
const loading = ref(false)

const fetchCollections = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/collection/list')
    if (res.data && res.data.code === 200) {
      items.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '加载收藏失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  } else {
    fetchCollections()
  }
})
</script>

<style scoped>
.page-collections {
  padding: 20px 0;
}
.collection-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 800px;
}
.collection-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.title a,
.title span {
  font-weight: 500;
}
.meta {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
  display: flex;
  gap: 16px;
}
.empty-text,
.loading-text {
  color: var(--text-light);
  font-size: 13px;
  padding: 16px 0;
}
</style>

