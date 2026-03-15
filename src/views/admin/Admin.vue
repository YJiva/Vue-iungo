<template>
  <div class="admin-layout">
    <el-container class="admin-container">
      <el-aside width="220px" class="admin-aside">
        <div class="logo">iungo 后台</div>
        <el-menu
          class="admin-menu"
          :default-active="activeMenu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="users">
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="invite">
            <span>邀请管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="admin-header-title">管理后台</div>
        </el-header>
        <el-main class="admin-main">
          <!-- 仪表盘 -->
          <div v-if="activeMenu === 'dashboard'" class="dashboard">
            <h2 class="section-title">概览</h2>
            <el-row :gutter="16" class="stat-row">
              <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stat-card">
                  <div class="stat-label">用户数</div>
                  <div class="stat-value">{{ stats.users || 0 }}</div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stat-card">
                  <div class="stat-label">帖子数</div>
                  <div class="stat-value">{{ stats.posts || 0 }}</div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stat-card">
                  <div class="stat-label">博客数</div>
                  <div class="stat-value">{{ stats.blogs || 0 }}</div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stat-card">
                  <div class="stat-label">评论数</div>
                  <div class="stat-value">{{ stats.comments || 0 }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 用户管理 -->
          <div v-else-if="activeMenu === 'users'">
            <h2 class="section-title">用户管理</h2>
            <el-table :data="users" style="width: 100%;" size="small" v-loading="loadingUsers">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="username" label="用户名" width="120" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="nickname" label="昵称" width="120" />
              <el-table-column prop="roleId" label="角色" width="120">
                <template #default="scope">
                  <el-tag v-if="scope.row.roleId === 2" type="danger">ADMIN</el-tag>
                  <el-tag v-else>USER</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                    {{ scope.row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220">
                <template #default="scope">
                  <el-select
                    v-model="scope.row.roleId"
                    size="small"
                    style="width: 90px; margin-right: 8px;"
                    @change="val => updateRole(scope.row, val)"
                  >
                    <el-option :value="1" label="USER" />
                    <el-option :value="2" label="ADMIN" />
                  </el-select>
                  <el-button
                    size="small"
                    type="primary"
                    @click="toggleStatus(scope.row)"
                  >
                    {{ scope.row.status === 1 ? '禁用' : '启用' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 邀请管理 -->
          <div v-else-if="activeMenu === 'invite'">
            <h2 class="section-title">邀请管理</h2>
            <el-form :model="form" label-width="100px" class="invite-form">
              <el-form-item label="用户ID">
                <el-input v-model="form.userId" placeholder="输入用户ID"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="fetchTree" :loading="loadingTree">查询邀请树</el-button>
                <el-button type="primary" @click="createCode" :loading="loadingCode">生成邀请码</el-button>
              </el-form-item>
            </el-form>
            <div v-if="inviteTree.length" class="invite-tree">
              <h3>邀请树</h3>
              <el-tree :data="inviteTree" :props="treeProps" node-key="id" default-expand-all />
            </div>
            <div v-if="generatedCode" class="invite-code">
              <h3>生成的邀请码</h3>
              <el-input v-model="generatedCode" readonly style="width:300px" />
            </div>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminPage' })
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'

const activeMenu = ref('dashboard')

const stats = ref({ users: 0, posts: 0, blogs: 0, comments: 0 })

const form = ref({ userId: '' })
const inviteTree = ref([])
const generatedCode = ref('')
const loadingTree = ref(false)
const loadingCode = ref(false)
const treeProps = { children: 'children', label: 'username' }
const userStore = useUserStore()

const users = ref([])
const loadingUsers = ref(false)

const handleMenuSelect = (index) => {
  activeMenu.value = index
  if (index === 'users' && !users.value.length) {
    fetchUsers()
  }
}

const fetchStats = async () => {
  try {
    const res = await request.get('/api/home/stats')
    if (res.data && res.data.code === 200 && res.data.data) {
      stats.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

async function fetchTree() {
  if (!form.value.userId) {
    ElMessage.warning('请输入用户ID')
    return
  }
  loadingTree.value = true
  try {
    const res = await userStore.getInviteTree(form.value.userId)
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

async function createCode() {
  if (!form.value.userId) {
    ElMessage.warning('请输入用户ID')
    return
  }
  loadingCode.value = true
  try {
    const res = await userStore.generateInviteCode(form.value.userId)
    if (res.data && res.data.data && res.data.data.code) {
      generatedCode.value = res.data.data.code
      ElMessage.success('邀请码生成成功')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('生成失败')
  } finally {
    loadingCode.value = false
  }
}

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await request.get('/api/admin/user/list')
    if (res.data && res.data.code === 200) {
      users.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '加载用户失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loadingUsers.value = false
  }
}

const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    const res = await request.post('/api/admin/user/update-status', null, {
      params: { userId: row.id, status: newStatus }
    })
    if (res.data && res.data.code === 200) {
      row.status = newStatus
      ElMessage.success('状态已更新')
    } else {
      ElMessage.error(res.data.msg || '更新失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const updateRole = async (row, val) => {
  try {
    const res = await request.post('/api/admin/user/update-role', null, {
      params: { userId: row.id, roleId: val }
    })
    if (res.data && res.data.code === 200) {
      ElMessage.success('角色已更新')
    } else {
      ElMessage.error(res.data.msg || '更新失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

onMounted(() => {
  fetchStats()
  fetchUsers()
})
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

.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.stat-row {
  margin-top: 8px;
}

.stat-card {
  text-align: left;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
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
