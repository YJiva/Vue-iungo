<template>
  <div class="admin-post-categories">
    <el-card>
      <template #header>
        <div class="head-row">
          <span>贴吧管理</span>
          <div class="head-actions">
            <el-button type="primary" size="small" @click="openCreateCategory">新建贴吧</el-button>
            <el-button type="primary" size="small" @click="loadData">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rows" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="吧名" min-width="160" />
        <el-table-column prop="description" label="简介" min-width="220" />
        <el-table-column label="数据" width="180">
          <template #default="{ row }">
            <span>{{ row.memberCount || 0 }} 关注 · {{ row.postCount || 0 }} 帖子</span>
          </template>
        </el-table-column>
        <el-table-column label="吧务" min-width="320">
          <template #default="{ row }">
            <div class="admin-tags">
              <el-tag
                v-for="a in (row.admins || [])"
                :key="`${row.id}-${a.userId}-${a.roleCode}`"
                size="small"
                :type="a.roleCode === 'OWNER' ? 'danger' : 'info'"
              >
                {{ a.roleName || a.roleCode }}: {{ a.nickname || a.username || a.userId }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420">
          <template #default="{ row }">
            <el-button size="small" @click="openEditCategory(row)">编辑吧</el-button>
            <el-button size="small" @click="openAddAdmin(row)">添加吧务</el-button>
            <el-button size="small" @click="openRemoveAdmin(row)">移除吧务</el-button>
            <el-button size="small" type="warning" @click="openTransferOwner(row)">转让吧主</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="editCategoryVisible" title="编辑贴吧" width="560px">
      <el-form label-width="90px">
        <el-form-item label="吧ID">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="吧名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="upload-row">
            <el-input v-model="editForm.icon" placeholder="可上传或手动填写" />
            <el-button @click="pickCategoryImage('icon')">上传</el-button>
            <input ref="iconInputRef" type="file" accept="image/*" style="display:none" @change="onPickCategoryImage($event, 'icon')" />
          </div>
        </el-form-item>
        <el-form-item label="封面">
          <div class="upload-row">
            <el-input v-model="editForm.coverUrl" placeholder="可上传或手动填写" />
            <el-button @click="pickCategoryImage('cover')">上传</el-button>
            <input ref="coverInputRef" type="file" accept="image/*" style="display:none" @change="onPickCategoryImage($event, 'cover')" />
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCategoryVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createCategoryVisible" title="新建贴吧" width="560px">
      <el-form label-width="90px">
        <el-form-item label="吧名">
          <el-input v-model="createForm.name" placeholder="请输入吧名" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入简介（可选）" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="upload-row">
            <el-input v-model="createForm.icon" placeholder="可上传或手动填写" />
            <el-button @click="pickCreateCategoryImage('icon')">上传</el-button>
            <input
              ref="createIconInputRef"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onPickCreateCategoryImage($event, 'icon')"
            />
          </div>
        </el-form-item>
        <el-form-item label="封面">
          <div class="upload-row">
            <el-input v-model="createForm.coverUrl" placeholder="可上传或手动填写" />
            <el-button @click="pickCreateCategoryImage('cover')">上传</el-button>
            <input
              ref="createCoverInputRef"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onPickCreateCategoryImage($event, 'cover')"
            />
          </div>
        </el-form-item>
        <el-form-item label="显示">
          <el-select v-model="createForm.show" style="width: 100%">
            <el-option :value="1" label="显示" />
            <el-option :value="0" label="隐藏" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createCategoryVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateCategory">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addAdminVisible" title="添加吧务" width="500px">
      <el-form label-width="100px">
        <el-form-item label="吧ID">
          <el-input v-model="currentCategoryId" disabled />
        </el-form-item>
        <el-form-item label="用户">
          <el-autocomplete
            v-model="addAdminUserText"
            style="width:100%"
            :fetch-suggestions="querySearchUsers"
            placeholder="输入用户名/昵称自动联想"
            @select="onSelectAddUser"
            clearable
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addAdminRoleId" style="width:100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addAdminVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddAdmin">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="removeAdminVisible" title="移除吧务" width="500px">
      <el-form label-width="100px">
        <el-form-item label="吧ID">
          <el-input v-model="currentCategoryId" disabled />
        </el-form-item>
        <el-form-item label="选择吧务">
          <el-select v-model="removeAdminUserId" style="width:100%" placeholder="请选择要移除的吧务">
            <el-option
              v-for="a in currentAdmins"
              :key="a.userId"
              :label="`${a.roleName || a.roleCode} - ${a.nickname || a.username || a.userId}`"
              :value="a.userId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="removeAdminVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRemoveAdmin">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferOwnerVisible" title="转让吧主" width="520px">
      <el-form label-width="110px">
        <el-form-item label="吧ID">
          <el-input v-model="currentCategoryId" disabled />
        </el-form-item>
        <el-form-item label="新吧主">
          <el-autocomplete
            v-model="transferOwnerUserText"
            style="width:100%"
            :fetch-suggestions="querySearchUsers"
            placeholder="输入用户名/昵称自动联想"
            @select="onSelectTransferUser"
            clearable
          />
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
import { ref, onMounted, computed } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const rows = ref([])
const currentCategoryId = ref(null)

const addAdminVisible = ref(false)
const removeAdminVisible = ref(false)
const transferOwnerVisible = ref(false)
const editCategoryVisible = ref(false)
const createCategoryVisible = ref(false)

const addAdminUserId = ref(null)
const addAdminUserText = ref('')
const addAdminRoleId = ref(null)
const removeAdminUserId = ref(null)
const transferOwnerUserId = ref(null)
const transferOwnerUserText = ref('')

const roleOptions = ref([])
const candidateUsers = ref([])

const editForm = ref({
  id: null,
  name: '',
  description: '',
  icon: '',
  coverUrl: '',
  status: 1
})
const createForm = ref({
  name: '',
  description: '',
  icon: '',
  coverUrl: '',
  show: 1
})

const iconInputRef = ref(null)
const coverInputRef = ref(null)
const createIconInputRef = ref(null)
const createCoverInputRef = ref(null)

const currentAdmins = computed(() => {
  const row = rows.value.find((r) => r.id === currentCategoryId.value)
  return row?.admins || []
})

const loadRoles = async () => {
  const res = await request.get('/api/post/category/role/list')
  roleOptions.value = (res.data && res.data.data) || []
  if (!addAdminRoleId.value && roleOptions.value.length) {
    const mod = roleOptions.value.find((r) => (r.code || '').toUpperCase() === 'MODERATOR')
    addAdminRoleId.value = mod ? mod.id : roleOptions.value[0].id
  }
}

const loadCandidateUsers = async (keyword) => {
  const res = await request.get('/api/post/category/candidate-users', {
    keyword: keyword || '',
    limit: 20
  })
  candidateUsers.value = (res.data && res.data.data) || []
  return candidateUsers.value
}

const querySearchUsers = async (queryString, cb) => {
  const list = await loadCandidateUsers(queryString)
  const suggestions = list.map((u) => ({
    value: `${u.nickname || u.username} (${u.username})`,
    id: u.id
  }))
  cb(suggestions)
}

const onSelectAddUser = (item) => {
  addAdminUserId.value = item.id
}

const onSelectTransferUser = (item) => {
  transferOwnerUserId.value = item.id
}

const loadData = async () => {
  const listRes = await request.get('/api/post/category/list')
  const list = (listRes.data && listRes.data.data) || []

  const details = await Promise.all(
    list.map(async (c) => {
      try {
        const d = await request.get('/api/post/category/detail', { id: c.id })
        return {
          ...c,
          ...(d.data?.data?.category || {}),
          admins: d.data?.data?.admins || []
        }
      } catch {
        return { ...c, admins: [] }
      }
    })
  )

  rows.value = details
}

const uploadImage = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  const resp = await fetch('/api/file/upload-editor-image', { method: 'POST', body: fd })
  const data = await resp.json()
  if (!(data && data.code === 200 && data.data?.url)) throw new Error(data?.msg || '图片上传失败')
  return data.data.url
}

const pickCategoryImage = (type) => {
  if (type === 'icon') iconInputRef.value?.click()
  else coverInputRef.value?.click()
}

const onPickCategoryImage = async (e, type) => {
  const file = (e.target.files || [])[0]
  if (!file) return
  try {
    const url = await uploadImage(file)
    if (type === 'icon') editForm.value.icon = url
    else editForm.value.coverUrl = url
    ElMessage.success('上传成功')
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
  } finally {
    e.target.value = ''
  }
}

const pickCreateCategoryImage = (type) => {
  if (type === 'icon') createIconInputRef.value?.click()
  else createCoverInputRef.value?.click()
}

const onPickCreateCategoryImage = async (e, type) => {
  const file = (e.target.files || [])[0]
  if (!file) return
  try {
    const url = await uploadImage(file)
    if (type === 'icon') createForm.value.icon = url
    else createForm.value.coverUrl = url
    ElMessage.success('上传成功')
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
  } finally {
    e.target.value = ''
  }
}

const openEditCategory = (row) => {
  editForm.value = {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    icon: row.icon || '',
    coverUrl: row.coverUrl || '',
    status: row.status == null ? 1 : row.status
  }
  editCategoryVisible.value = true
}

const openCreateCategory = () => {
  createForm.value = {
    name: '',
    description: '',
    icon: '',
    coverUrl: '',
    show: 1
  }
  createCategoryVisible.value = true
}

const submitCreateCategory = async () => {
  if (!createForm.value.name || !createForm.value.name.trim()) {
    ElMessage.warning('吧名不能为空')
    return
  }
  const payload = {
    name: createForm.value.name.trim(),
    description: (createForm.value.description || '').trim(),
    icon: (createForm.value.icon || '').trim(),
    coverUrl: (createForm.value.coverUrl || '').trim(),
    show: createForm.value.show
  }
  const res = await request.post('/api/post/category/create', payload)
  if (res.data?.code === 200) {
    ElMessage.success('新建成功')
    createCategoryVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.data?.msg || '新建失败')
  }
}

const submitEditCategory = async () => {
  const res = await request.post('/api/post/category/update', editForm.value)
  if (res.data?.code === 200) {
    ElMessage.success('保存成功')
    editCategoryVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.data?.msg || '保存失败')
  }
}

const openAddAdmin = async (row) => {
  currentCategoryId.value = row.id
  addAdminUserId.value = null
  addAdminUserText.value = ''
  await loadCandidateUsers('')
  addAdminVisible.value = true
}

const openRemoveAdmin = (row) => {
  currentCategoryId.value = row.id
  removeAdminUserId.value = null
  removeAdminVisible.value = true
}

const openTransferOwner = async (row) => {
  currentCategoryId.value = row.id
  transferOwnerUserId.value = null
  transferOwnerUserText.value = ''
  await loadCandidateUsers('')
  transferOwnerVisible.value = true
}

const submitAddAdmin = async () => {
  if (!currentCategoryId.value || !addAdminUserId.value || !addAdminRoleId.value) {
    ElMessage.warning('请填写完整参数')
    return
  }
  const res = await request.post('/api/post/category/admin/add', null, {
    params: {
      categoryId: currentCategoryId.value,
      userId: addAdminUserId.value,
      roleId: addAdminRoleId.value
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
    ElMessage.warning('请选择要移除的吧务')
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
    ElMessage.warning('请选择新吧主')
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

onMounted(async () => {
  await loadRoles()
  await loadData()
})
</script>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.upload-row {
  width: 100%;
  display: flex;
  gap: 8px;
}
</style>
