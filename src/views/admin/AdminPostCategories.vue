<template>
  <div class="admin-post-categories">
    <el-card>
      <template #header>
        <div class="head-row">
          <span>贴吧管理</span>
          <el-button type="primary" size="small" @click="loadData">刷新</el-button>
        </div>
      </template>

      <el-table :data="rows" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="吧名" min-width="160" />
        <el-table-column prop="description" label="简介" min-width="220" />
        <el-table-column label="吧务" min-width="260">
          <template #default="{ row }">
            <div class="admin-tags">
              <el-tag
                v-for="a in (row.admins || [])"
                :key="`${row.id}-${a.userId}-${a.role}`"
                size="small"
                :type="a.role === 'OWNER' ? 'danger' : 'info'"
              >
                {{ a.role }}: {{ a.userId }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360">
          <template #default="{ row }">
            <el-button size="small" @click="openAddAdmin(row)">添加吧务</el-button>
            <el-button size="small" @click="openRemoveAdmin(row)">移除吧务</el-button>
            <el-button size="small" type="warning" @click="openTransferOwner(row)">转让吧主</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addAdminVisible" title="添加吧务" width="420px">
      <el-form label-width="100px">
        <el-form-item label="吧ID">
          <el-input v-model="currentCategoryId" disabled />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model.number="addAdminUserId" type="number" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addAdminRole" style="width:100%">
            <el-option label="MODERATOR" value="MODERATOR" />
            <el-option label="OWNER" value="OWNER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addAdminVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddAdmin">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="removeAdminVisible" title="移除吧务" width="420px">
      <el-form label-width="100px">
        <el-form-item label="吧ID">
          <el-input v-model="currentCategoryId" disabled />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model.number="removeAdminUserId" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="removeAdminVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRemoveAdmin">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferOwnerVisible" title="转让吧主" width="420px">
      <el-form label-width="100px">
        <el-form-item label="吧ID">
          <el-input v-model="currentCategoryId" disabled />
        </el-form-item>
        <el-form-item label="新吧主ID">
          <el-input v-model.number="transferOwnerUserId" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferOwnerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTransferOwner">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const rows = ref([])
const currentCategoryId = ref(null)

const addAdminVisible = ref(false)
const removeAdminVisible = ref(false)
const transferOwnerVisible = ref(false)

const addAdminUserId = ref(null)
const addAdminRole = ref('MODERATOR')
const removeAdminUserId = ref(null)
const transferOwnerUserId = ref(null)

const loadData = async () => {
  const listRes = await request.get('/api/post/category/list')
  const list = (listRes.data && listRes.data.data) || []

  const details = await Promise.all(
    list.map(async (c) => {
      try {
        const d = await request.get('/api/post/category/detail', { id: c.id })
        return {
          ...c,
          admins: d.data?.data?.admins || []
        }
      } catch {
        return { ...c, admins: [] }
      }
    })
  )

  rows.value = details
}

const openAddAdmin = (row) => {
  currentCategoryId.value = row.id
  addAdminUserId.value = null
  addAdminRole.value = 'MODERATOR'
  addAdminVisible.value = true
}

const openRemoveAdmin = (row) => {
  currentCategoryId.value = row.id
  removeAdminUserId.value = null
  removeAdminVisible.value = true
}

const openTransferOwner = (row) => {
  currentCategoryId.value = row.id
  transferOwnerUserId.value = null
  transferOwnerVisible.value = true
}

const submitAddAdmin = async () => {
  if (!currentCategoryId.value || !addAdminUserId.value) {
    ElMessage.warning('请填写完整参数')
    return
  }
  const res = await request.post('/api/post/category/admin/add', null, {
    params: {
      categoryId: currentCategoryId.value,
      userId: addAdminUserId.value,
      role: addAdminRole.value
    }
  })
  if (res.data?.code === 200) {
    ElMessage.success('添加成功')
    addAdminVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.data?.msg || '添加失败')
  }
}

const submitRemoveAdmin = async () => {
  if (!currentCategoryId.value || !removeAdminUserId.value) {
    ElMessage.warning('请填写完整参数')
    return
  }
  const res = await request.post('/api/post/category/admin/remove', null, {
    params: {
      categoryId: currentCategoryId.value,
      userId: removeAdminUserId.value
    }
  })
  if (res.data?.code === 200) {
    ElMessage.success('移除成功')
    removeAdminVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.data?.msg || '移除失败')
  }
}

const submitTransferOwner = async () => {
  if (!currentCategoryId.value || !transferOwnerUserId.value) {
    ElMessage.warning('请填写完整参数')
    return
  }
  const res = await request.post('/api/post/category/owner/transfer', null, {
    params: {
      categoryId: currentCategoryId.value,
      toUserId: transferOwnerUserId.value
    }
  })
  if (res.data?.code === 200) {
    ElMessage.success('转让成功')
    transferOwnerVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.data?.msg || '转让失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
