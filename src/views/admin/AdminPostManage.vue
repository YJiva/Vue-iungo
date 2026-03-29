<template>
  <div class="admin-post-manage">
    <el-card>
      <template #header>
        <div class="head-row">
          <span>帖子治理</span>
          <div class="filters">
            <el-select v-model="query.categoryId" placeholder="筛选吧" style="width: 180px" @change="loadPosts">
              <el-option label="全部贴吧" :value="null" />
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-input v-model="query.keyword" placeholder="标题关键词" style="width: 200px" @keyup.enter="loadPosts" />
            <el-button type="primary" @click="loadPosts">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="postRows" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="标题" min-width="220">
          <template #default="{ row }">
            <span class="post-title">{{ row.title }}</span>
            <el-button text size="small" @click="openPost(row)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="所属贴吧" min-width="140">
          <template #default="{ row }">
            <span>{{ categoryName(row.categoryId) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryId" label="吧ID" width="90" />
        <el-table-column prop="authorId" label="作者ID" width="100" />
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.isTop === 1" type="warning" size="small" style="margin-right:4px;">置顶</el-tag>
            <el-tag v-if="row.isEssence === 1" type="success" size="small">精华</el-tag>
            <span v-if="row.isTop !== 1 && row.isEssence !== 1" style="color:#909399;">普通</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="260">
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()

const categories = ref([])
const postRows = ref([])
const query = ref({
  categoryId: null,
  keyword: ''
})

const categoryMap = ref({})

const loadCategories = async () => {
  const res = await request.get('/api/post/category/list')
  categories.value = (res.data && res.data.data) || []
  const map = {}
  categories.value.forEach((c) => {
    map[c.id] = c.name
  })
  categoryMap.value = map
}

const categoryName = (id) => categoryMap.value[id] || `贴吧#${id}`

const loadPosts = async () => {
  if (query.value.categoryId == null) {
    const res = await request.get('/api/post/list', { offset: 0, limit: 200 })
    postRows.value = filterByKeyword((res.data && res.data.data) || [])
  } else {
    const res = await request.get('/api/post/list', {
      categoryId: query.value.categoryId,
      offset: 0,
      limit: 200
    })
    postRows.value = filterByKeyword((res.data && res.data.data) || [])
  }
}

const filterByKeyword = (list) => {
  const kw = (query.value.keyword || '').trim().toLowerCase()
  if (!kw) return list
  return list.filter((p) => (p.title || '').toLowerCase().includes(kw))
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
    ElMessage.success(row.isEssence === 1 ? '已加精' : '已取消加精')
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const deletePost = async (row) => {
  const res = await request.post('/api/post/admin/delete', null, { params: { id: row.id } })
  if (res.data?.code === 200) {
    ElMessage.success('删除成功')
    await loadPosts()
  } else {
    ElMessage.error(res.data?.msg || '删除失败')
  }
}

const openPost = (row) => {
  router.push(`/post/detail?id=${row.id}`)
}

onMounted(async () => {
  await loadCategories()
  await loadPosts()
})
</script>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
