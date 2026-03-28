<template>
  <div class="page-post-category-list">
    <div class="container container-inner">
      <div class="head-row">
        <h2>贴吧广场</h2>
        <div class="head-actions">
          <el-input
            v-model="keyword"
            placeholder="搜索贴吧名称/简介"
            clearable
            style="width: 260px"
          />
          <el-button size="small" @click="loadData">刷新</el-button>
        </div>
      </div>

      <div class="filter-row">
        <el-radio-group v-model="tab" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="hot">最热</el-radio-button>
          <el-radio-button label="new">最新</el-radio-button>
          <el-radio-button label="followed">已关注</el-radio-button>
        </el-radio-group>
      </div>

      <el-empty v-if="!visibleCategories.length" description="暂无匹配贴吧" />

      <el-row :gutter="16" v-else>
        <el-col :xs="24" :sm="12" :md="8" v-for="c in visibleCategories" :key="c.id" style="margin-bottom: 16px;">
          <el-card shadow="hover" class="cat-card" @click="goDetail(c.id)">
            <div class="cat-head">
              <el-avatar :src="c.icon || defaultIcon" :size="46" />
              <div class="cat-head-info">
                <div class="cat-name">{{ c.name }}</div>
                <div class="cat-meta">{{ c.memberCount || 0 }} 关注 · {{ c.postCount || 0 }} 帖子</div>
              </div>
            </div>

            <div class="cat-desc">{{ c.description || '暂无简介' }}</div>

            <div class="cat-op" @click.stop>
              <el-button
                size="small"
                :type="c.followed ? 'default' : 'primary'"
                @click="toggleFollow(c)"
              >
                {{ c.followed ? '已关注' : '关注' }}
              </el-button>
              <el-button size="small" text @click="goDetail(c.id)">进入吧</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const categories = ref([])
const defaultIcon = 'https://via.placeholder.com/80x80.png?text=Bar'
const keyword = ref('')
const tab = ref('all')

const loadData = async () => {
  const res = await request.get('/api/post/category/list')
  categories.value = (res.data && res.data.data) || []
}

const visibleCategories = computed(() => {
  let list = [...categories.value]

  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((c) => {
      const name = (c.name || '').toLowerCase()
      const desc = (c.description || '').toLowerCase()
      return name.includes(kw) || desc.includes(kw)
    })
  }

  if (tab.value === 'followed') {
    list = list.filter((c) => !!c.followed)
  }

  if (tab.value === 'hot') {
    list.sort((a, b) => Number(b.memberCount || 0) - Number(a.memberCount || 0))
  } else if (tab.value === 'new') {
    list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
  } else {
    list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
  }

  return list
})

const toggleFollow = async (c) => {
  const res = await request.post('/api/post/category/follow/toggle', null, { params: { categoryId: c.id } })
  if (res.data && res.data.code === 200) {
    c.followed = !!res.data.followed
    c.memberCount = Number(res.data.memberCount || 0)
  } else {
    ElMessage.error(res.data?.msg || '操作失败')
  }
}

const goDetail = (id) => {
  router.push(`/post/category/${id}`)
}

onMounted(loadData)
</script>

<style scoped>
.page-post-category-list { padding: 20px 0; }
.head-row { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
.head-actions { display:flex; align-items:center; gap: 8px; }
.filter-row { margin-bottom: 12px; }
.cat-card { cursor: pointer; border-radius: 10px; }
.cat-head { display:flex; align-items:center; gap: 10px; }
.cat-head-info { min-width: 0; }
.cat-name { font-size: 16px; font-weight: 700; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cat-meta { color:#909399; font-size: 12px; }
.cat-desc { color: #909399; font-size: 13px; margin-top: 8px; min-height: 36px; }
.cat-op { display:flex; align-items:center; gap: 6px; margin-top: 10px; }
</style>
