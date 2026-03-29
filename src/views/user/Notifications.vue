<template>
  <div class="page-notifications">
    <div class="container container-inner">
      <h2>消息通知</h2>
      <div class="actions">
        <el-button type="primary" size="small" @click="markAll" :disabled="!list.length">全部标记为已读</el-button>
        <el-button type="danger" plain size="small" @click="deleteRead" :disabled="!hasRead">删除全部已读</el-button>
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
            :class="{ unread: item.read === 0, clickable: !!item.jumpUrl }"
            @click="handleJump(item)"
          >
            <div class="message">{{ item.message }}</div>
            <div v-if="item.sourceTitle || item.sourceCategory" class="source">
              <span v-if="item.sourceCategory" class="source-tag">#{{ item.sourceCategory }}</span>
              <span v-if="item.sourceTitle">{{ item.sourceTitle }}</span>
            </div>
            <div class="meta">
              <span>{{ item.createTime }}</span>
              <div class="meta-actions">
                <el-button
                  v-if="item.read === 0"
                  type="text"
                  size="small"
                  @click.stop="markOne(item)"
                >
                  标记已读
                </el-button>
                <el-button
                  type="text"
                  size="small"
                  @click.stop="deleteOne(item)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-list>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const hasRead = computed(() => list.value.some((x) => x.read === 1))

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

const deleteOne = async (item) => {
  try {
    const res = await request.post('/api/sub/delete', null, { params: { id: item.id } })
    if (res.data && res.data.code === 200) {
      list.value = list.value.filter((x) => x.id !== item.id)
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const deleteRead = async () => {
  try {
    const res = await request.post('/api/sub/delete-read')
    if (res.data && res.data.code === 200) {
      list.value = list.value.filter((x) => x.read !== 1)
      ElMessage.success('已删除全部已读通知')
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const handleJump = async (item) => {
  if (item.read === 0) {
    await markOne(item)
  }
  if (item.jumpUrl) {
    router.push(item.jumpUrl)
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
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
.meta-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
