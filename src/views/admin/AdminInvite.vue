<template>
  <div>
    <h2 class="section-title">邀请管理</h2>
    <el-form :model="form" label-width="100px" class="invite-form">
      <el-form-item label="用户ID">
        <el-input v-model="form.userId" placeholder="输入用户ID"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchTree" :loading="loadingTree">查询邀请树</el-button>
      </el-form-item>
    </el-form>
    <InviteTree v-if="inviteTree.length" :raw-tree="inviteTree" :show-header="true" class="invite-tree">
      <template #right>
        <el-switch
          v-model="showAll"
          active-text="全部关系"
          inactive-text="与他相关"
          inline-prompt
          @change="loadTree"
        />
      </template>
    </InviteTree>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import InviteTree from '../../components/InviteTree.vue'

const userStore = useUserStore()

const form = ref({ userId: '' })
const inviteTree = ref([])
const loadingTree = ref(false)
const showAll = ref(false)

const getCurrentUserId = () => {
  // 输入为空时默认按 1 处理
  return form.value.userId || 1
}

const loadTree = async () => {
  loadingTree.value = true
  try {
    const userId = getCurrentUserId()
    // showAll=true: 全部关系；false: 与“他”相关
    const api = showAll.value ? userStore.getInviteTree : userStore.getInviteTreeClose
    const res = await api(userId)
    if (res.data && res.data.data && res.data.data.tree) {
      inviteTree.value = res.data.data.tree
    } else {
      inviteTree.value = []
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('查询失败')
  } finally {
    loadingTree.value = false
  }
}

// 点击“查询邀请树”：切到“与他相关”，并按当前（或默认 1）用户加载
const fetchTree = async () => {
  showAll.value = false
  await loadTree()
}

// 初次进入页面时：默认按 userId=1 显示“全部关系”
onMounted(async () => {
  showAll.value = true
  await loadTree()
})

</script>

<style scoped>
.invite-tree {
  max-width: 720px;
  padding: 8px 4px;
}

/* 去掉 Element Plus Tree 自带背景，让卡片不被遮挡 */
:deep(.el-tree) {
  background-color: transparent;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}
.invite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

/* 卡片节点样式 */
.node-wrap {
  position: relative;
  display: inline-block;
  padding: 8px 2px;
  margin: 2px 0;
}

.node-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.node-card:hover {
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
  transform: translateY(-1px);
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.node-id {
  font-size: 12px;
  color: #6b7280;
}

/* 竖线连接：让每个子节点上方有一段短竖线 */
:deep(.el-tree-node__children) {
  margin-left: 14px;
  padding-left: 10px;
  border-left: 1px solid #e5e7eb;
}

:deep(.el-tree-node__children .el-tree-node__content) {
  position: relative;
}

:deep(.el-tree-node__children .el-tree-node__content)::before {
  content: '';
  position: absolute;
  left: -11px;
  top: -8px;
  width: 1px;
  height: 12px; /* 短竖线 */
  background: #e5e7eb;
}
.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
.invite-form {
  max-width: 480px;
}
.invite-tree,
.invite-code {
  margin-top: 20px;
}
</style>

