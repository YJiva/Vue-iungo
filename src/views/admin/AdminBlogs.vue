<template>
  <div>
    <div class="roles-header">
      <h2 class="section-title">博客管理</h2>
      <div class="roles-actions">
        <el-input
          v-model="q"
          clearable
          placeholder="搜索：输入ID(纯数字)或关键词(标题/内容/作者ID)"
          style="width: 360px;"
          @keyup.enter="onSearch"
        />
        <el-button size="small" @click="onSearch">搜索</el-button>
        <el-button type="primary" size="small" @click="openCreateBlog">新增博客</el-button>
      </div>
    </div>
    <el-table :data="blogs" style="width: 100%;" size="small" v-loading="loadingBlogs" :default-sort = "{prop: 'read', order: 'ascending'}">
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="userId" label="作者ID" width="90" sortable />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="categoryId" label="分类ID" width="90" />
      <el-table-column prop="createTime" label="发布时间" width="180" sortable>
        <template #default="scope">
          <span>{{ formatTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime"  label="修改时间" width="180" sortable>
        <template #default="scope">
          <span>{{ formatTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="前台展示" width="110">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            size="small"
            @change="val => toggleBlogStatus(scope.row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="top" label="置顶" width="70">
        <template #default="scope">
          <el-tag :type="scope.row.top === 1 ? 'warning' : 'info'">
            {{ scope.row.top === 1 ? '置顶' : '普通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="openScope" label="可见范围" width="90">
        <template #default="scope">
          <span v-if="scope.row.openScope === 2">公开</span>
          <span v-else-if="scope.row.openScope === 1">自己+公开</span>
          <span v-else>仅自己</span>
        </template>
      </el-table-column>
      <el-table-column prop="read" label="阅读" width="90" sortable />
      <el-table-column label="标签" min-width="160">
        <template #default="scope">
          <el-tag
            v-for="tag in resolveTagNames(scope.row)"
            :key="tag.name"
            size="small"
            :type="tag.show === 0 ? 'info' : 'primary'"
            style="margin-right: 4px; margin-bottom: 2px;"
          >
            {{ tag.name }}
          </el-tag>
          <span v-if="!resolveTagNames(scope.row).length" style="color:#999;">无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="viewBlog(scope.row)">查看</el-button>
          <el-button size="small" type="danger" @click="deleteBlog(scope.row)">删除</el-button>
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
        :page-sizes="[5, 10, 20, 50,100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="blogDialogVisible" :title="blogEditing ? '编辑博客' : '新增博客'" width="720px">
      <el-form :model="blogForm" label-width="90px">
        <el-form-item label="作者ID">
          <el-input v-model="blogForm.userId" placeholder="用户ID" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="blogForm.title" placeholder="博客标题" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="blogTagNames"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入标签（对应 blog_type.name）"
            style="width: 100%;"
          >
            <el-option
              v-for="t in blogTypes"
              :key="t.id"
              :label="t.name"
              :value="t.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="blogForm.content"
            type="textarea"
            :rows="6"
            placeholder="博客内容（简版编辑）"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="blogForm.status" :active-value="1" :inactive-value="0" />
          <span style="margin-left: 8px; color: #999;">status=1 前台展示；status=0 隐藏</span>
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch
            v-model="blogForm.top"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="可见范围">
          <el-radio-group v-model="blogForm.openScope">
            <el-radio :label="2">公开</el-radio>
            <el-radio :label="1">自己+公开</el-radio>
            <el-radio :label="0">仅自己</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="blogDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBlog">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const router = useRouter()

const blogs = ref([])
const loadingBlogs = ref(false)
const q = ref('')
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const blogDialogVisible = ref(false)
const blogEditing = ref(false)
const blogForm = ref({
  id: null,
  userId: '',
  title: '',
  content: '',
  categoryId: null,
  status: 1,
  top: 0,
  openScope: 2
})
const blogTagNames = ref([])

const blogTypes = ref([])

const formatTime = (t) => {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

let debounceTimer = null
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

const fetchBlogs = async () => {
  loadingBlogs.value = true
  try {
    const query = String(q.value || '').trim()
    const isId = /^\d+$/.test(query)
    const params = {
  page: page.value,
  size: Number(pageSize.value)  // 强制数字类型
}
    if (query) {
      if (isId) params.id = Number(query)
      else params.keyword = query
    }
    const res = await request.get('/api/admin/blog/list', params)
    if (res.data && res.data.code === 200) {
      blogs.value = res.data.data || []
      total.value = Number(res.data.total || 0)
    } else {
      ElMessage.error(res.data.msg || '加载博客失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    loadingBlogs.value = false
  }
}

const fetchBlogTypes = async () => {
  try {
    const res = await request.get('/api/admin/blog-type/list', { page: 1, size: 200 })
    if (res.data && res.data.code === 200) {
      blogTypes.value = res.data.data || []
    }
  } catch (e) {
    console.error(e)
  }
}

const resolveTagNames = (row) => {
  if (!row || !row.tags || !blogTypes.value.length) return []
  const idStrs = String(row.tags)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const idSet = new Set(idStrs.map((s) => Number(s)))
  return blogTypes.value
    .filter((t) => idSet.has(Number(t.id)))
    .map((t) => ({ name: t.name, show: t.show }))
}

const openCreateBlog = () => {
  blogEditing.value = false
  blogForm.value = {
    // 新增博客：使用时间戳作为ID
    id: Date.now(),
    userId: '',
    title: '',
    content: '',
    categoryId: null,
    status: 1,
    top: 0,
    openScope: 2
  }
  blogTagNames.value = []
  blogDialogVisible.value = true
}

const openEditBlog = (row) => {
  blogEditing.value = true
  blogForm.value = {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: row.content,
    categoryId: row.categoryId,
    status: row.status,
    top: row.top,
    openScope: row.openScope
  }
  blogTagNames.value = resolveTagNames(row).map((t) => t.name)
  blogDialogVisible.value = true
}

const viewBlog = (row) => {
  if (!row || !row.id) return
  router.push(`/blog/detail/${row.id}`)
}

const submitBlog = async () => {
  if (!blogForm.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!blogForm.value.userId) {
    ElMessage.warning('请填写作者ID')
    return
  }
  try {
    const payload = { ...blogForm.value, tagNames: blogTagNames.value }
    const res = await request.post('/api/admin/blog/save', payload)
    if (res.data && res.data.code === 200) {
      ElMessage.success('保存成功')
      blogDialogVisible.value = false
      await fetchBlogTypes()
      await fetchBlogs()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const deleteBlog = async (row) => {
  try {
    const res = await request.post('/api/admin/blog/delete', null, { params: { id: row.id } })
    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      await fetchBlogs()
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const toggleBlogStatus = async (row, val) => {
  try {
    const payload = {
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      categoryId: row.categoryId,
      status: val,
      top: row.top,
      openScope: row.openScope,
      tagNames: resolveTagNames(row).map((t) => t.name)
    }
    const res = await request.post('/api/admin/blog/save', payload)
    if (res.data && res.data.code === 200) {
      ElMessage.success('已更新前台展示状态')
      await fetchBlogs()
    } else {
      ElMessage.error(res.data.msg || '更新失败')
      await fetchBlogs()
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
    await fetchBlogs()
  }
}

const onSearch = async () => {
  page.value = 1
  await fetchBlogs()
}

const handlePageChange = async (p) => {
  page.value = p
  await fetchBlogs()
}

const handleSizeChange = async (s) => {
  pageSize.value = s
  page.value = 1
  await fetchBlogs()
}

watch(
  () => q.value,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      onSearch()
    }, 300)
  }
)

onMounted(async () => {
  await fetchBlogTypes()
  await fetchBlogs()
})
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

