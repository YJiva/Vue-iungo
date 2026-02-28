<template>
  <div class="invite-page">
    <h2>我的邀请码</h2>
    <div class="code-area" v-if="inviteCode">
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
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const inviteCode = ref('')
const treeData = ref([])
const generating = ref(false)

const treeProps = {
  children: 'children',
  label: 'username'
}

async function loadTree() {
  if (!userStore.userInfo || !userStore.userInfo.id) return
  try {
    const res = await userStore.getInviteTree(userStore.userInfo.id)
    if (res.data && res.data.tree) {
      treeData.value = res.data.tree
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('无法加载邀请树')
  }
}

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

function copyCode() {
  const url = `${window.location.origin}/invite?code=${inviteCode.value}`
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制链接到剪贴板')
}

onMounted(() => {
  if (userStore.userInfo && userStore.userInfo.inviteCode) {
    inviteCode.value = userStore.userInfo.inviteCode
  }
  loadTree()
})
</script>

<style scoped>
.invite-page { padding: 20px; }
.code-area { display: flex; align-items: center; gap: 8px; }
.invite-tree { max-width: 400px; }
</style>