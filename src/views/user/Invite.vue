<template>
  <div class="invite-page">
    <h2>我的邀请码</h2>
    <div class="code-area" v-if="inviteCode">
<<<<<<< HEAD

      <el-card shadow="hover">
      {{inviteCode}}
    </el-card>
    </div>

    <section>
      <InviteTree :raw-tree="treeData" :show-header="true">
        <template #right>
          <el-switch
            v-model="showAll"
            active-text="全部关系"
            inactive-text="与我相关"
            inline-prompt
            @change="loadTree"
          />
        </template>
      </InviteTree>
=======
      <el-input v-model="inviteCode" readonly style="width:300px" />
      <el-button type="primary" size="small" @click="copyCode">复制链接</el-button>
    </div>
    <el-button type="primary" v-if="!inviteCode" @click="createCode" :loading="generating">生成邀请码</el-button>

    <section style="margin-top:20px;">
      <h3>邀请树</h3>
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="id"
        default-expand-all
        class="invite-tree"
      ></el-tree>
      <p v-if="!treeData.length" style="color:#999">暂无邀请记录</p>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'
<<<<<<< HEAD
import InviteTree from '../../components/InviteTree.vue'
=======
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10

const userStore = useUserStore()
const inviteCode = ref('')
const treeData = ref([])
<<<<<<< HEAD
const showAll = ref(true)
=======
const generating = ref(false)

const treeProps = {
  children: 'children',
  label: 'username'
}
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10

async function loadTree() {
  if (!userStore.userInfo || !userStore.userInfo.id) return
  try {
<<<<<<< HEAD
    const api = showAll.value ? userStore.getInviteTree : userStore.getInviteTreeClose
    const res = await api(userStore.userInfo.id)
    if (res.data && res.data.data && res.data.data.tree) {
      treeData.value = res.data.data.tree
=======
    const res = await userStore.getInviteTree(userStore.userInfo.id)
    if (res.data && res.data.tree) {
      treeData.value = res.data.tree
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('无法加载邀请树')
  }
}

<<<<<<< HEAD
=======
async function createCode() {
  if (!userStore.userInfo || !userStore.userInfo.id) return
  generating.value = true
  try {
    const res = await userStore.generateInviteCode(userStore.userInfo.id)
    if (res.data && res.data.code) {
      inviteCode.value = res.data.code
      ElMessage.success('邀请码已生成')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('生成邀请码失败')
  } finally {
    generating.value = false
  }
}

>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
function copyCode() {
  const url = `${window.location.origin}/invite?code=${inviteCode.value}`
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制链接到剪贴板')
}

onMounted(() => {
<<<<<<< HEAD
  if (!userStore.userInfo || !userStore.userInfo.id) return

  // 1) 始终从后端获取当前用户的固定邀请码（idempotent）
  userStore
    .generateInviteCode(userStore.userInfo.id)
    .then((res) => {
      if (res.data && res.data.data && res.data.data.code) {
        inviteCode.value = res.data.data.code
      }
    })
    .catch((err) => {
      console.error(err)
      ElMessage.error('无法获取邀请码')
    })

  // 2) 加载当前用户的邀请关系树（基于 invite_relation）
=======
  if (userStore.userInfo && userStore.userInfo.inviteCode) {
    inviteCode.value = userStore.userInfo.inviteCode
  }
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  loadTree()
})
</script>

<style scoped>
.invite-page { padding: 20px; }
.code-area { display: flex; align-items: center; gap: 8px; }
<<<<<<< HEAD
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
</style>
=======
.invite-tree { max-width: 400px; }
</style>
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
