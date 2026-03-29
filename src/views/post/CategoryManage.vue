<template>
  <div class="page-category-manage">
    <div class="container container-inner">
      <el-card>
        <template #header>
          <div class="head-row">
            <div class="title">{{ category.name || '本吧管理' }}</div>
            <div class="head-actions">
              <el-button @click="goBack">返回贴吧</el-button>
              <el-button size="small" @click="refreshAll">刷新</el-button>
            </div>
          </div>
        </template>

        <div v-if="!canManage" class="deny">你不是本吧吧务/吧主，无权限访问。</div>
        <div v-else>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="帖子管理" name="post">
              <div class="toolbar">
                <el-input v-model="postKeyword" placeholder="搜索本吧帖子标题/内容" style="width: 260px" @keyup.enter="loadPosts" />
                <el-switch v-model="postEssenceOnly" active-text="只看精华" @change="loadPosts" />
                <el-button type="primary" @click="loadPosts">查询</el-button>
              </div>
              <el-table :data="postRows" border>
                <el-table-column prop="id" label="ID" width="90" />
                <el-table-column label="标题" min-width="260">
                  <template #default="{ row }">
                    <span class="clickable" @click="openPost(row.id)">{{ row.title }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="authorId" label="作者ID" width="100" />
                <el-table-column prop="createTime" label="发布时间" width="180" />
                <el-table-column label="状态" width="140">
                  <template #default="{ row }">
                    <el-tag v-if="row.isTop === 1" type="warning" size="small" style="margin-right:6px;">置顶</el-tag>
                    <el-tag v-if="row.isEssence === 1" type="success" size="small">精华</el-tag>
                    <span v-if="row.isTop !== 1 && row.isEssence !== 1" style="color:#909399;">普通</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="300">
                  <template #default="{ row }">
                    <el-button size="small" @click="toggleTop(row)">{{ row.isTop === 1 ? '取消置顶' : '置顶' }}</el-button>
                    <el-button size="small" type="success" @click="toggleEssence(row)">{{ row.isEssence === 1 ? '取消精华' : '加精' }}</el-button>
                    <el-popconfirm title="确定删除该帖？" @confirm="deletePost(row)">
                      <template #reference>
                        <el-button size="small" type="danger">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="禁言管理" name="mute">
              <el-form label-width="90px" class="mute-form">
                <el-form-item label="禁言用户">
                  <el-autocomplete
                    v-model="muteUserText"
                    style="width: 320px"
                    :fetch-suggestions="querySearchUsers"
                    placeholder="输入用户名/昵称联想"
                    @select="onSelectMuteUser"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="时长(分钟)">
                  <el-input-number v-model="muteMinutes" :min="1" :max="60*24*30" />
                </el-form-item>
                <el-form-item label="原因">
                  <el-input v-model="muteReason" placeholder="可选" style="max-width: 520px" />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" @click="submitMute">确认禁言</el-button>
                </el-form-item>
              </el-form>

              <el-table :data="muteRows" border>
                <el-table-column label="用户" min-width="240">
                  <template #default="{ row }">
                    <div class="mute-user">
                      <el-avatar :src="row.avatar || defaultAvatar" :size="28" />
                      <div>
                        <div>{{ row.nickname || row.username || row.userId }}</div>
                        <div class="sub">@{{ row.username || '-' }} · #{{ row.userId }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="muteUntil" label="禁言到期" width="180" />
                <el-table-column prop="reason" label="原因" min-width="240" />
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button size="small" @click="unsetMute(row)">解除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane v-if="isOwner" label="吧主设置" name="owner">
              <el-form label-width="90px" class="owner-form">
                <el-form-item label="吧名">
                  <el-input v-model="editForm.name" />
                </el-form-item>
                <el-form-item label="简介">
                  <el-input v-model="editForm.description" type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="图标">
                  <div class="upload-line">
                    <el-input v-model="editForm.icon" />
                    <input
                      ref="iconInputRef"
                      type="file"
                      accept="image/*"
                      style="display: none"
                      @change="onPickIcon"
                    />
                    <el-button @click="iconInputRef?.click()">本地上传</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="封面">
                  <div class="upload-line">
                    <el-input v-model="editForm.coverUrl" />
                    <input
                      ref="coverInputRef"
                      type="file"
                      accept="image/*"
                      style="display: none"
                      @change="onPickCover"
                    />
                    <el-button @click="coverInputRef?.click()">本地上传</el-button>
                  </div>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveCategory">保存本吧信息</el-button>
                </el-form-item>
              </el-form>

              <el-divider />

              <el-form label-width="90px">
                <el-form-item label="转让吧主">
                  <el-autocomplete
                    v-model="transferUserText"
                    style="width: 320px"
                    :fetch-suggestions="querySearchUsers"
                    placeholder="输入用户名/昵称联想"
                    @select="onSelectTransferUser"
                    clearable
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="warning" @click="transferOwner">确认转让</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const categoryId = Number(route.params.id)
const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'

const activeTab = ref('post')
const category = ref({})
const admins = ref([])
const postRows = ref([])
const postKeyword = ref('')
const postEssenceOnly = ref(false)

const muteRows = ref([])
const muteUserId = ref(null)
const muteUserText = ref('')
const muteMinutes = ref(60)
const muteReason = ref('')

const editForm = ref({ name: '', description: '', icon: '', coverUrl: '', status: 1 })
const transferUserId = ref(null)
const transferUserText = ref('')
const iconInputRef = ref(null)
const coverInputRef = ref(null)

const canManage = computed(() => {
  const uid = userStore.userInfo?.id
  if (!uid) return false
  if (userStore.userInfo?.roleId === 2) return true
  return (admins.value || []).some((a) => Number(a.userId) === Number(uid))
})

const isOwner = computed(() => {
  const uid = userStore.userInfo?.id
  if (!uid) return false
  if (userStore.userInfo?.roleId === 2) return true
  return (admins.value || []).some((a) => Number(a.userId) === Number(uid) && String(a.roleCode || a.role || '').toUpperCase() === 'OWNER')
})

const loadDetail = async () => {
  const res = await request.get('/api/post/category/detail', { id: categoryId })
  const data = res.data?.data || {}
  category.value = data.category || {}
  admins.value = data.admins || []
  editForm.value = {
    name: category.value.name || '',
    description: category.value.description || '',
    icon: category.value.icon || '',
    coverUrl: category.value.coverUrl || '',
    status: category.value.status == null ? 1 : category.value.status
  }
}

const loadPosts = async () => {
  const res = await request.get('/api/post/list', {
    categoryId,
    offset: 0,
    limit: 200,
    keyword: (postKeyword.value || '').trim() || null,
    essenceOnly: postEssenceOnly.value ? 1 : null
  })
  postRows.value = (res.data && res.data.data) || []
}

const toggleTop = async (row) => {
  const res = await request.post('/api/post/admin/top/toggle', null, { params: { id: row.id } })
  if (res.data?.code === 200) {
    row.isTop = row.isTop === 1 ? 0 : 1
    ElMessage.success(row.isTop === 1 ? '已置顶' : '已取消置顶')
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const toggleEssence = async (row) => {
  const res = await request.post('/api/post/admin/essence/toggle', null, { params: { id: row.id } })
  if (res.data?.code === 200) {
    row.isEssence = row.isEssence === 1 ? 0 : 1
    ElMessage.success(row.isEssence === 1 ? '已加精' : '已取消精华')
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const deletePost = async (row) => {
  const res = await request.post('/api/post/delete', null, { params: { id: row.id } })
  if (res.data?.code === 200) {
    ElMessage.success('删除成功')
    await loadPosts()
  } else {
    ElMessage.error(res.data?.msg || '删除失败')
  }
}

const loadMuteList = async () => {
  const res = await request.get('/api/post/category/mute/list', { categoryId, limit: 50 })
  if (res.data?.code === 200) {
    muteRows.value = res.data.data || []
  }
}

const querySearchUsers = async (queryString, cb) => {
  try {
    const res = await request.get('/api/post/category/candidate-users', { keyword: queryString || '', limit: 20 })
    const list = (res.data && res.data.data) || []
    cb(list.map((u) => ({ value: `${u.nickname || u.username} (${u.username})`, id: u.id })))
  } catch {
    cb([])
  }
}

const onSelectMuteUser = (item) => { muteUserId.value = item.id }
const onSelectTransferUser = (item) => { transferUserId.value = item.id }

const submitMute = async () => {
  if (!muteUserId.value) return ElMessage.warning('请选择要禁言的用户')
  const minutes = Number(muteMinutes.value || 0)
  if (!minutes || minutes <= 0) return ElMessage.warning('禁言时长必须大于 0')
  const res = await request.post('/api/post/category/mute/set', {
    categoryId,
    userId: muteUserId.value,
    minutes,
    reason: (muteReason.value || '').trim()
  })
  if (res.data?.code === 200) {
    ElMessage.success('禁言已生效')
    muteUserId.value = null
    muteUserText.value = ''
    muteReason.value = ''
    await loadMuteList()
  } else {
    ElMessage.error(res.data?.msg || '禁言失败')
  }
}

const unsetMute = async (row) => {
  const res = await request.post('/api/post/category/mute/unset', null, { params: { id: row.id } })
  if (res.data?.code === 200) {
    ElMessage.success('已解除禁言')
    await loadMuteList()
  } else {
    ElMessage.error(res.data?.msg || '解除失败')
  }
}

const saveCategory = async () => {
  if (!isOwner.value) return
  const payload = {
    id: categoryId,
    name: (editForm.value.name || '').trim(),
    description: (editForm.value.description || '').trim(),
    icon: (editForm.value.icon || '').trim(),
    coverUrl: (editForm.value.coverUrl || '').trim(),
    status: editForm.value.status
  }
  const res = await request.post('/api/post/category/update', payload)
  if (res.data?.code === 200) {
    ElMessage.success('保存成功')
    await loadDetail()
  } else {
    ElMessage.error(res.data?.msg || '保存失败')
  }
}

const uploadImage = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  const resp = await fetch('/api/file/upload-editor-image', { method: 'POST', body: fd })
  const data = await resp.json()
  if (!(data && data.code === 200 && data.data?.url)) {
    throw new Error(data?.msg || '图片上传失败')
  }
  return data.data.url
}

const onPickIcon = async (e) => {
  const file = (e.target.files || [])[0]
  if (!file) return
  try {
    editForm.value.icon = await uploadImage(file)
    ElMessage.success('图标上传成功')
  } catch (err) {
    ElMessage.error(err.message || '图标上传失败')
  } finally {
    e.target.value = ''
  }
}

const onPickCover = async (e) => {
  const file = (e.target.files || [])[0]
  if (!file) return
  try {
    editForm.value.coverUrl = await uploadImage(file)
    ElMessage.success('封面上传成功')
  } catch (err) {
    ElMessage.error(err.message || '封面上传失败')
  } finally {
    e.target.value = ''
  }
}

const transferOwner = async () => {
  if (!isOwner.value) return
  if (!transferUserId.value) return ElMessage.warning('请选择新吧主')
  const res = await request.post('/api/post/category/owner/transfer', null, {
    params: { categoryId, toUserId: transferUserId.value }
  })
  if (res.data?.code === 200) {
    ElMessage.success('转让成功')
    transferUserId.value = null
    transferUserText.value = ''
    await loadDetail()
  } else {
    ElMessage.error(res.data?.msg || '转让失败')
  }
}

const goBack = () => router.push(`/post/category/${categoryId}`)
const openPost = (id) => router.push(`/post/detail?id=${id}`)

const refreshAll = async () => {
  await loadDetail()
  if (canManage.value) {
    await Promise.all([loadPosts(), loadMuteList()])
  }
}

onMounted(async () => {
  await loadDetail()
  if (canManage.value) {
    await loadPosts()
    await loadMuteList()
  }
})
</script>

<style scoped>
.page-category-manage { padding: 20px 0; }
.head-row { display: flex; align-items: center; justify-content: space-between; }
.head-actions { display: flex; gap: 8px; }
.title { font-weight: 700; }
.deny { color: #f56c6c; padding: 6px 0; }
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.mute-user { display: flex; align-items: center; gap: 8px; }
.sub { color: #909399; font-size: 12px; }
.clickable { cursor: pointer; color: #409eff; }
.upload-line { display: flex; align-items: center; gap: 8px; width: 100%; }
</style>

