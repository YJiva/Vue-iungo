<template>
  <div class="dashboard">
    <h2 class="section-title">概览</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-label">用户数</div>
          <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-label">帖子数</div>
          <div class="stat-value">{{ stats.totalPosts || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-label">博客数</div>
          <div class="stat-value">{{ stats.totalBlogs || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-label">评论数</div>
          <div class="stat-value">{{ stats.totalComments || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'

const stats = ref({ totalUsers: 0, totalPosts: 0, totalBlogs: 0, totalComments: 0 })

const fetchStats = async () => {
  try {
    const res = await request.get('/api/home/stats')
    if (res.data && res.data.code === 200 && res.data.data) {
      stats.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchStats)
</script>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
.stat-row {
  margin-top: 8px;
}
.stat-card {
  text-align: left;
}
.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
}
</style>

