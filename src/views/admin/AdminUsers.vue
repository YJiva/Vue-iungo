<template>
  <div>
    <h2 class="section-title">用户管理</h2>
    <div class="toolbar">
      <el-input
        v-model="q"
        clearable
        placeholder="搜索：输入ID(纯数字)或关键词(用户名/昵称/邮箱)"
        style="max-width: 420px;"
        @keyup.enter="onSearch"
      />
      <el-button size="small" style="margin-left: 10px;" @click="onSearch">搜索</el-button>
    </div>

    <el-table :data="users" style="width: 100%;" size="small" v-loading="loadingUsers">
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column label="头像" width="72">
        <template #default="scope">
          <el-avatar :src="scope.row.avatar || defaultAvatar" :size="32" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="gender" label="性别" width="90">
        <template #default="scope">
          <el-tag size="small" :type="genderTagType(scope.row.gender)">{{ genderText(scope.row.gender) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建日期" width="180" sortable>
        <template #default="scope">
          <span>{{ formatTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="roleId" label="角色" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.roleId === 2" type="danger">ADMIN</el-tag>
          <el-tag v-else>USER</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '封禁' }}
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
          <el-button size="small" @click="openEdit(scope.row)" style="margin-right: 8px;">编辑</el-button>
          <el-button
            size="small"
            type="primary"
            @click="toggleStatus(scope.row)"
          >
            {{ scope.row.status === 1 ? '封禁' : '解封' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="prev, pager, next, sizes, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        :page-sizes="[5, 10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="editVisible" title="编辑用户" width="520px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" style="width: 100%;">
            <el-option :value="0" label="未知" />
            <el-option :value="1" label="男" />
            <el-option :value="2" label="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="editForm.avatar" placeholder="/upload/avatars/..." />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.bio" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%;">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="封禁" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingEdit" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const users = ref([])
const loadingUsers = ref(false)
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'
const q = ref('')
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const editVisible = ref(false)
const savingEdit = ref(false)
const editForm = ref({
  id: null,
  username: '',
  email: '',
  nickname: '',
  gender: 0,
  avatar: '',
  bio: '',
  status: 1
})

const genderText = (g) => {
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '未知'
}

const genderTagType = (g) => {
  if (g === 1) return 'success'
  if (g === 2) return 'warning'
  return 'info'
}

const formatTime = (t) => {
  if (!t) return '-'
  // t 可能是 "2026-03-17T02:01:07" 或 "2026-03-17 02:01:07"
  return String(t).replace('T', ' ').slice(0, 19)
}

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const query = String(q.value || '').trim()
    const isId = /^\d+$/.test(query)
    const params = {
      page: page.value,
      size: Number(pageSize.value)
    }
    if (query) {
      if (isId) params.id = Number(query)
      else params.keyword = query
    }
    const res = await request.get('/api/admin/user/list', params)
    if (res.data && res.data.code === 200) {
      users.value = res.data.data || []
      total.value = Number(res.data.total || 0)
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

const onSearch = async () => {
  page.value = 1
  await fetchUsers()
}

let debounceTimer = null
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
watch(
  () => q.value,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      onSearch()
    }, 300)
  }
)

const handlePageChange = async (p) => {
  page.value = p
  await fetchUsers()
}

const handleSizeChange = async (s) => {
  pageSize.value = s
  page.value = 1
  await fetchUsers()
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

const openEdit = (row) => {
  editForm.value = {
    id: row.id,
    username: row.username || '',
    email: row.email || '',
    nickname: row.nickname || '',
    gender: row.gender ?? 0,
    avatar: row.avatar || '',
    bio: row.bio || '',
    status: row.status ?? 1
  }
  editVisible.value = true
}

const saveEdit = async () => {
  if (!editForm.value.id) return
  savingEdit.value = true
  try {
    const res = await request.post('/api/admin/user/update', editForm.value)
    if (res.data && res.data.code === 200) {
      const idx = users.value.findIndex((u) => u.id === editForm.value.id)
      if (idx >= 0) {
        users.value[idx] = { ...users.value[idx], ...editForm.value }
      }
      ElMessage.success('更新成功')
      editVisible.value = false
    } else {
      ElMessage.error(res.data.msg || '更新失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    savingEdit.value = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>

