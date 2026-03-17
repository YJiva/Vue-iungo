<template>
  <div>
    <div class="roles-header">
      <h2 class="section-title">博客管理</h2>
      <el-button type="primary" size="small" @click="openCreateBlog">新增博客</el-button>
    </div>
    <el-table :data="blogs" style="width: 100%;" size="small" v-loading="loadingBlogs">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="userId" label="作者ID" width="80" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="categoryId" label="分类ID" width="90" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '已发布' : '草稿' }}
          </el-tag>
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
          <el-button size="small" @click="openEditBlog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteBlog(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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
          <el-radio-group v-model="blogForm.status">
            <el-radio :label="1">已发布</el-radio>
            <el-radio :label="0">草稿</el-radio>
          </el-radio-group>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const blogs = ref([])
const loadingBlogs = ref(false)
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

const fetchBlogs = async () => {
  loadingBlogs.value = true
  try {
    const res = await request.get('/api/admin/blog/list')
    if (res.data && res.data.code === 200) {
      blogs.value = res.data.data || []
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
    const res = await request.get('/api/admin/blog-type/list')
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
    id: null,
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
      blogs.value = blogs.value.filter((b) => b.id !== row.id)
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

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
</style>

