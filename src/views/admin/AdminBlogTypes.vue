<template>
  <div>
    <div class="roles-header">
      <h2 class="section-title">博客分类</h2>
      <div class="roles-actions">
        <el-input
          v-model="q"
          clearable
          placeholder="搜索：输入ID(纯数字)或关键词(名称/描述)"
          style="width: 320px;"
          @keyup.enter="onSearch"
        />
        <el-button size="small" @click="onSearch">搜索</el-button>
        <el-button type="primary" size="small" @click="openCreateBlogType">新增分类</el-button>
      </div>
    </div>
    <el-table :data="blogTypes" style="width: 100%;" size="small" v-loading="loadingBlogTypes">
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="name" label="名称" width="200" />
      <el-table-column prop="show" label="显示" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.show === 1 ? 'success' : 'info'">
            {{ scope.row.show === 1 ? '显示' : '隐藏' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-switch
            v-model="scope.row.show"
            :active-value="1"
            :inactive-value="0"
            size="small"
            @change="val => toggleBlogTypeShow(scope.row, val)"
            style="margin-right: 8px;"
          />
          <el-button size="small" @click="openEditBlogType(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteBlogType(scope.row)">删除</el-button>
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

    <el-dialog v-model="blogTypeDialogVisible" :title="blogTypeEditing ? '编辑分类' : '新增分类'" width="400px">
      <el-form :model="blogTypeForm" label-width="70px">
        <el-form-item label="名称">
          <el-input v-model="blogTypeForm.name" placeholder="如 后端开发 / 前端开发" />
        </el-form-item>
        <el-form-item label="显示">
          <el-switch
            v-model="blogTypeForm.show"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="blogTypeForm.description"
            type="textarea"
            rows="3"
            placeholder="分类说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="blogTypeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBlogType">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const blogTypes = ref([])
const loadingBlogTypes = ref(false)
const q = ref('')
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const blogTypeDialogVisible = ref(false)
const blogTypeEditing = ref(false)
const blogTypeForm = ref({ id: null, name: '', show: 1, description: '' })

const fetchBlogTypes = async () => {
  loadingBlogTypes.value = true
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
    const res = await request.get('/api/admin/blog-type/list', params)
    if (res.data && res.data.code === 200) {
      blogTypes.value = res.data.data || []
      total.value = Number(res.data.total || 0)
    } else {
      ElMessage.error(res.data.msg || '加载博客分类失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loadingBlogTypes.value = false
  }
}

const openCreateBlogType = () => {
  blogTypeEditing.value = false
  blogTypeForm.value = { id: null, name: '', show: 1, description: '' }
  blogTypeDialogVisible.value = true
}

const openEditBlogType = (row) => {
  blogTypeEditing.value = true
  blogTypeForm.value = { id: row.id, name: row.name, show: row.show, description: row.description }
  blogTypeDialogVisible.value = true
}

const submitBlogType = async () => {
  if (!blogTypeForm.value.name) {
    ElMessage.warning('请填写分类名称')
    return
  }
  try {
    const url = blogTypeEditing.value ? '/api/admin/blog-type/update' : '/api/admin/blog-type/create'
    const res = await request.post(url, blogTypeForm.value)
    if (res.data && res.data.code === 200) {
      ElMessage.success('保存成功')
      blogTypeDialogVisible.value = false
      fetchBlogTypes()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const deleteBlogType = async (row) => {
  try {
    const res = await request.post('/api/admin/blog-type/delete', null, { params: { id: row.id } })
    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      blogTypes.value = blogTypes.value.filter((t) => t.id !== row.id)
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const toggleBlogTypeShow = async (row, val) => {
  try {
    const payload = { id: row.id, name: row.name, show: val, description: row.description }
    const res = await request.post('/api/admin/blog-type/update', payload)
    if (res.data && res.data.code === 200) {
      ElMessage.success('已更新显示状态')
    } else {
      ElMessage.error(res.data.msg || '更新失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const onSearch = async () => {
  page.value = 1
  await fetchBlogTypes()
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
  await fetchBlogTypes()
}

const handleSizeChange = async (s) => {
  pageSize.value = s
  page.value = 1
  await fetchBlogTypes()
}

onMounted(fetchBlogTypes)
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

