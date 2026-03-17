<template>
<<<<<<< HEAD
  <div class="admin-layout">
    <el-container class="admin-container">
      <el-aside width="220px" class="admin-aside">
        <div class="logo">iungo 后台</div>
        <el-menu
          class="admin-menu"
          router
          :default-active="$route.path"
        >
          <el-menu-item index="/admin/dashboard">
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/roles">
            <span>角色管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/blog-types">
            <span>博客分类</span>
          </el-menu-item>
          <el-menu-item index="/admin/blogs">
            <span>博客管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/invite">
            <span>邀请管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="admin-header-title">管理后台</div>
        </el-header>
        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
=======
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
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
  </div>
</template>

<script setup>
<<<<<<< HEAD
defineOptions({ name: 'AdminLayout' })
</script>

<style scoped>
.admin-layout {
  height: calc(100vh - 60px);
}

.admin-container {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color, #ebeef5);
}

.admin-aside {
  background-color: #1f2933;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-menu {
  border-right: none;
  flex: 1;
}

.admin-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.admin-header-title {
  font-size: 18px;
  font-weight: 600;
}

.admin-main {
  padding: 16px 20px;
  background-color: #fafafa;
}
=======
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
>>>>>>> a6c072d7ffd6458d3c95abca694bcc854a61da10
</style>
