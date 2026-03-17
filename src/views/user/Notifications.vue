<template>
<<<<<<< HEAD
  <div class="page-notifications">
    <div class="container container-inner">
      <h2>消息通知</h2>
      <div class="actions">
        <el-button type="primary" size="small" @click="markAll" :disabled="!list.length">全部标记为已读</el-button>
      </div>
      <div v-if="loading" style="text-align: center; padding: 16px;">
        <el-loading-spinner /> 加载中...
      </div>
      <div v-else>
        <div v-if="!list.length" style="color: var(--text-light); padding: 16px;">
          暂无新消息
        </div>
        <el-list v-else class="notify-list">
          <div
            v-for="item in list"
            :key="item.id"
            class="notify-item"
            :class="{ unread: item.read === 0 }"
          >
            <div class="message">{{ item.message }}</div>
            <div class="meta">
              <span>{{ item.createTime }}</span>
              <el-button
                v-if="item.read === 0"
                type="text"
                size="small"
                @click="markOne(item)"
              >
                标记已读
              </el-button>
            </div>
          </div>
        </el-list>
      </div>
    </div>
=======
  <div>
    <h1>消息通知</h1>
    <p>暂无新消息</p>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  </div>
</template>

<script setup>
<<<<<<< HEAD
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const list = ref([])
const loading = ref(false)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/sub/list')
    if (res.data && res.data.code === 200) {
      list.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '加载消息失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const markOne = async (item) => {
  try {
    const res = await request.post('/api/sub/read', null, { params: { id: item.id } })
    if (res.data && res.data.code === 200) {
      item.read = 1
    } else {
      ElMessage.error(res.data.msg || '标记失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const markAll = async () => {
  try {
    const res = await request.post('/api/sub/read-all')
    if (res.data && res.data.code === 200) {
      list.value = list.value.map((x) => ({ ...x, read: 1 }))
      ElMessage.success('已全部标记为已读')
    } else {
      ElMessage.error(res.data.msg || '标记失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page-notifications {
  padding: 20px 0;
}
.actions {
  margin-bottom: 12px;
  text-align: right;
}
.notify-list {
  max-width: 800px;
}
.notify-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.notify-item.unread .message {
  font-weight: 600;
}
.message {
  margin-bottom: 4px;
}
.meta {
  font-size: 12px;
  color: var(--text-light);
  display: flex;
  justify-content: space-between;
}
</style>
=======
// 消息页面逻辑
</script>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
