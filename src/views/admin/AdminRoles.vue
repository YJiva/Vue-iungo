<template>
  <div>
    <div class="roles-header">
      <h2 class="section-title">角色管理</h2>
      <div class="roles-actions">
        <el-input
          v-model="q"
          clearable
          placeholder="搜索：输入ID(纯数字)或关键词(名称/描述)"
          style="width: 320px;"
          @keyup.enter="onSearch"
        />
        <el-button size="small" @click="onSearch">搜索</el-button>
        <el-button type="primary" size="small" @click="openCreateRole">新增角色</el-button>
      </div>
    </div>
    <el-table :data="roles" style="width: 100%;" size="small" v-loading="loadingRoles">
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="160">
        <template #default="scope">
          <el-button size="small" @click="openEditRole(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteRole(scope.row)">删除</el-button>
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

    <el-dialog v-model="roleDialogVisible" :title="roleEditing ? '编辑角色' : '新增角色'" width="400px">
      <el-form :model="roleForm" label-width="70px">
        <el-form-item label="名称">
          <el-input v-model="roleForm.name" placeholder="如 ADMIN / USER" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            rows="3"
            placeholder="角色说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const roles = ref([])
const loadingRoles = ref(false)
const q = ref('')
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const roleDialogVisible = ref(false)
const roleEditing = ref(false)
const roleForm = ref({ id: null, name: '', description: '' })

const fetchRoles = async () => {
  loadingRoles.value = true
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
    const res = await request.get('/api/admin/role/list', params)
    if (res.data && res.data.code === 200) {
      roles.value = res.data.data || []
      total.value = Number(res.data.total || 0)
    } else {
      ElMessage.error(res.data.msg || '加载角色失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loadingRoles.value = false
  }
}

const openCreateRole = () => {
  roleEditing.value = false
  roleForm.value = { id: null, name: '', description: '' }
  roleDialogVisible.value = true
}

const openEditRole = (row) => {
  roleEditing.value = true
  roleForm.value = { id: row.id, name: row.name, description: row.description }
  roleDialogVisible.value = true
}

const submitRole = async () => {
  if (!roleForm.value.name) {
    ElMessage.warning('请填写角色名称')
    return
  }
  try {
    const url = roleEditing.value ? '/api/admin/role/update' : '/api/admin/role/create'
    const res = await request.post(url, roleForm.value)
    if (res.data && res.data.code === 200) {
      ElMessage.success('保存成功')
      roleDialogVisible.value = false
      fetchRoles()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const deleteRole = async (row) => {
  try {
    const res = await request.post('/api/admin/role/delete', null, { params: { id: row.id } })
    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      roles.value = roles.value.filter((r) => r.id !== row.id)
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const onSearch = async () => {
  page.value = 1
  await fetchRoles()
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
  await fetchRoles()
}

const handleSizeChange = async (s) => {
  pageSize.value = s
  page.value = 1
  await fetchRoles()
}

onMounted(fetchRoles)
</script>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
.roles-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.roles-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>

