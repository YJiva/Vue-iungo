<template>
  <div class="admin-page">
    <h2>管理员工具</h2>
    <el-form :model="form" label-width="100px" style="max-width:400px;">
      <el-form-item label="用户ID">
        <el-input v-model="form.userId" placeholder="输入用户ID"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchTree" :loading="loadingTree">查询邀请树</el-button>
        <el-button type="primary" @click="createCode" :loading="loadingCode">生成邀请码</el-button>
      </el-form-item>
    </el-form>
    <div v-if="inviteTree.length" style="margin-top:20px;">
      <h3>邀请树</h3>
      <el-tree :data="inviteTree" :props="treeProps" node-key="id" default-expand-all />
    </div>
    <div v-if="generatedCode" style="margin-top:20px;">
      <h3>生成的邀请码</h3>
      <el-input v-model="generatedCode" readonly style="width:300px" />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminPage' })
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

const form = ref({ userId: '' })
const inviteTree = ref([])
const generatedCode = ref('')
const loadingTree = ref(false)
const loadingCode = ref(false)
const treeProps = { children: 'children', label: 'username' }
const userStore = useUserStore()

async function fetchTree() {
  if (!form.value.userId) {
    ElMessage.warning('请输入用户ID')
    return
  }
  loadingTree.value = true
  try {
    const res = await userStore.getInviteTree(form.value.userId)
    if (res.data && res.data.tree) {
      inviteTree.value = res.data.tree
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

async function createCode() {
  if (!form.value.userId) {
    ElMessage.warning('请输入用户ID')
    return
  }
  loadingCode.value = true
  try {
    const res = await userStore.generateInviteCode(form.value.userId)
    if (res.data && res.data.code) {
      generatedCode.value = res.data.code
      ElMessage.success('邀请码生成成功')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('生成失败')
  } finally {
    loadingCode.value = false
  }
}
</script>

<style scoped>
.admin-page { padding: 20px; }
</style>
