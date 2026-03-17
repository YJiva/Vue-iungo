<template>
  <div class="admin-layout">
    <el-container class="admin-container">
      <el-aside width="220px" class="admin-aside">
        <div class="logo">iungo 后台</div>
        <el-menu
          class="admin-menu"
          router
          :default-active="$route.path"
        >
          <el-menu-item index="/admin/dashboard">
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/roles">
            <span>角色管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/blog-types">
            <span>博客分类</span>
          </el-menu-item>
          <el-menu-item index="/admin/blogs">
            <span>博客管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/invite">
            <span>邀请管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="admin-header-title">管理后台</div>
        </el-header>
        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminLayout' })
</script>

<style scoped>
.admin-layout {
  height: calc(100vh - 60px);
}

.admin-container {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color, #ebeef5);
}

.admin-aside {
  background-color: #1f2933;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-menu {
  border-right: none;
  flex: 1;
}

.admin-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.admin-header-title {
  font-size: 18px;
  font-weight: 600;
}

.admin-main {
  padding: 16px 20px;
  background-color: #fafafa;
}
</style>
