<template>
  <div class="invite-page">
    <h2>我的邀请码</h2>
    <div class="code-area" v-if="inviteCode">
      <el-card shadow="hover">{{ inviteCode }}</el-card>
      <el-input v-model="inviteCode" readonly style="width: 300px" />
      <el-button type="primary" size="small" @click="copyCode">复制链接</el-button>
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
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'
import InviteTree from '../../components/InviteTree.vue'

const userStore = useUserStore()
const inviteCode = ref('')
const treeData = ref([])
const showAll = ref(true)

async function loadTree() {
  if (!userStore.userInfo || !userStore.userInfo.id) return
  try {
    const api = showAll.value ? userStore.getInviteTree : userStore.getInviteTreeClose
    const res = await api(userStore.userInfo.id)
    if (res.data && res.data.data && res.data.data.tree) {
      treeData.value = res.data.data.tree
    } else {
      treeData.value = []
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('无法加载邀请树')
  }
}

function copyCode() {
  const url = `${window.location.origin}/invite?code=${inviteCode.value}`
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制链接到剪贴板')
}

onMounted(() => {
  if (!userStore.userInfo || !userStore.userInfo.id) return

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

  loadTree()
})
</script>

<style scoped>

.invite-page {
  padding: 20px;
}
.code-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

