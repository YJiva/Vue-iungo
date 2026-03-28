<template>
  <section class="invite-tree-section">
    <div v-if="showHeader" class="invite-header">
      <h3>邀请关系</h3>
      <slot name="right"></slot>
    </div>

    <el-tree
      v-if="normalizedTree.length"
      :data="normalizedTree"
      :props="treeProps"
      node-key="id"
      default-expand-all
      class="invite-tree"
    >
      <template #default="{ data }">
        <div class="node-wrap">
          <el-popover
            placement="right"
            :width="280"
            trigger="hover"
            popper-class="invite-user-popover"
            @show="() => handlePopoverShow(data)"
          >
            <template #reference>
              <div class="node-card">
                <el-avatar :src="data.avatar || defaultAvatar" :size="36" class="clickable-avatar" @click.stop="goProfile(data.id)" />
                <div class="node-info">
                  <div class="node-name">{{ data.nickname || data.username || '未命名' }}</div>
                  <div class="node-meta">
                    <span class="node-username">@{{ data.username || 'unknown' }}</span>
                    <span class="node-id">#{{ data.id }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-if="data._hydrating" class="popover-loading">
              <el-skeleton animated :rows="3" />
            </div>
            <div v-else class="popover-card">
              <el-avatar :src="data.avatar || defaultAvatar" :size="48" />
              <div class="popover-body">
                <div class="popover-name">{{ data.nickname || data.username || '未命名' }}</div>
                <div class="popover-username">@{{ data.username || 'unknown' }}</div>
                <div class="popover-bio">{{ data.bio || '暂无简介' }}</div>
                <div class="popover-stats">
                  <span>关注 {{ data.followingCount ?? 0 }}</span>
                  <span>粉丝 {{ data.followersCount ?? 0 }}</span>
                </div>
                <div class="popover-actions">
                  <el-button size="small" class="btn-msg" plain disabled>私信</el-button>
                  <el-button size="small" class="btn-home" @click="goProfile(data.id)">主页</el-button>
                  <el-button
                    size="small"
                    class="btn-follow"
                    :class="{ 'is-following': data.isFollowing }"
                    @click="toggleFollow(data)"
                  >
                    {{ data.isFollowing ? '已关注' : (data.followedBy ? '回关' : '关注') }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-popover>
        </div>
      </template>
    </el-tree>
    <p v-else class="invite-empty-text">暂无邀请记录</p>
  </section>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()

const props = defineProps({
  rawTree: {
    type: Array,
    default: () => []
  },
  showHeader: {
    type: Boolean,
    default: false
  }
})

const defaultAvatar = 'https://via.placeholder.com/80x80.png?text=Avatar'

const treeProps = {
  children: 'children',
  label: 'nickname'
}

// 复用之前在 Invite.vue 里的 normalizeTree 逻辑
const normalizeTree = (input) => {
  const clone = Array.isArray(input) ? JSON.parse(JSON.stringify(input)) : []

  const idToNode = new Map()
  const childIds = new Set()

  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return
    for (const n of nodes) {
      if (!n || n.id == null) continue
      if (!idToNode.has(n.id)) idToNode.set(n.id, n)
      const kids = n.children
      if (Array.isArray(kids)) {
        for (const c of kids) {
          if (c && c.id != null) childIds.add(c.id)
        }
        walk(kids)
      }
    }
  }
  walk(clone)

  const mergeChildren = (nodes) => {
    if (!Array.isArray(nodes)) return
    for (const n of nodes) {
      if (!n || n.id == null) continue
      const canonical = idToNode.get(n.id) || n
      if (canonical !== n) {
        const a = Array.isArray(canonical.children) ? canonical.children : []
        const b = Array.isArray(n.children) ? n.children : []
        const seen = new Set(a.map((x) => x && x.id).filter((x) => x != null))
        for (const child of b) {
          if (child && child.id != null && !seen.has(child.id)) {
            a.push(child)
            seen.add(child.id)
          }
        }
        canonical.children = a
      }
      if (Array.isArray(canonical.children)) mergeChildren(canonical.children)
    }
  }
  mergeChildren(clone)

  const roots = clone.filter((n) => n && n.id != null && !childIds.has(n.id))

  const dedupe = (nodes) => {
    if (!Array.isArray(nodes)) return []
    const seen = new Set()
    const out = []
    for (const n of nodes) {
      if (!n || n.id == null) continue
      if (seen.has(n.id)) continue
      seen.add(n.id)
      n.children = dedupe(n.children)
      out.push(n)
    }
    return out
  }
  return dedupe(roots)
}

const hydrateNode = async (node) => {
  if (!node || !node.id || node._hydrating) return
  node._hydrating = true
  try {
    const [profileRes, statusRes] = await Promise.all([
      request.get('/api/user/public-profile', { userId: node.id }),
      userStore.isLoggedIn ? request.get('/api/follow/status', { targetId: node.id }) : Promise.resolve(null)
    ])

    if (profileRes?.data?.code === 200 && profileRes.data.data) {
      Object.assign(node, profileRes.data.data)
    }

    if (statusRes?.data?.code === 200) {
      node.isFollowing = !!statusRes.data.following
      node.followedBy = !!statusRes.data.followedBy
    }
  } catch {
    // ignore single node hydration errors
  } finally {
    node._hydrating = false
  }
}

const walkHydrate = async (nodes) => {
  if (!Array.isArray(nodes) || !nodes.length) return
  for (const n of nodes) {
    if (!n._hydrated) {
      await hydrateNode(n)
      n._hydrated = true
    }
    if (Array.isArray(n.children) && n.children.length) {
      await walkHydrate(n.children)
    }
  }
}

const handlePopoverShow = (node) => {
  if (!node || node._hydrated) return
  hydrateNode(node)
}

watch(
  () => props.rawTree,
  async (val) => {
    if (!Array.isArray(val) || !val.length) return
    await walkHydrate(val)
  },
  { immediate: true, deep: true }
)

const goProfile = (userId) => {
  if (!userId) return
  router.push(`/user/profile/${userId}`)
}

const toggleFollow = async (node) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再操作')
    return
  }
  if (!node?.id) return
  try {
    const res = await request.post('/api/follow/toggle', null, { params: { targetId: node.id } })
    if (res.data && res.data.code === 200) {
      node.isFollowing = !!res.data.following
      node.followersCount = Math.max(0, (node.followersCount || 0) + (node.isFollowing ? 1 : -1))
      ElMessage.success(res.data.msg || (node.isFollowing ? '关注成功' : '已取消关注'))
    } else {
      ElMessage.error(res?.data?.msg || '操作失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const normalizedTree = computed(() => normalizeTree(props.rawTree))
</script>

<style scoped>
.invite-tree-section {
  max-width: 720px;
  padding: 8px 4px;
  margin-top: 20px;
  min-height: 200px;
}

.invite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.invite-tree {
  max-width: 720px;
  padding: 8px 4px;
}

.invite-empty-text {
  color: #999;
}

::deep(.el-tree) {
  background-color: transparent;
}

::deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}

.node-wrap {
  position: relative;
  display: inline-block;
  padding: 8px 2px;
  margin: 2px 0;
}

.node-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

::deep(.el-avatar) {
  flex: 0 0 auto;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.node-username {
  color: #6b7280;
}

.clickable-avatar {
  cursor: pointer;
}

.node-card:hover {
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
  transform: translateY(-1px);
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.node-id {
  font-size: 12px;
  color: #6b7280;
}

.popover-loading {
  min-width: 220px;
}

.popover-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.popover-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.popover-name {
  font-weight: 600;
  font-size: 14px;
}

.popover-username {
  font-size: 12px;
  color: #6b7280;
}

.popover-bio {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
}

.popover-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.popover-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-msg,
.btn-home,
.btn-follow {
  border-radius: 999px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
}

.btn-msg {
  border-color: #d0d7de;
  color: #8a949e;
}

.btn-home {
  background: #e8f7ff;
  border-color: #b7e9ff;
  color: #00a1d6;
}

.btn-home:hover {
  background: #d9f2ff;
  border-color: #8fdcff;
  color: #0096c7;
}

.btn-follow {
  background: #00aeec;
  border: 1px solid #00aeec;
  color: #fff;
}

.btn-follow:hover {
  background: #00a0dc;
  border-color: #00a0dc;
}

.btn-follow.is-following {
  background: #f4f5f7;
  border-color: #e3e5e7;
  color: #61666d;
}

::deep(.el-tree-node__children) {
  margin-left: 18px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

::deep(.el-tree-node__children .el-tree-node__content) {
  position: relative;
}

::deep(.el-tree-node__children .el-tree-node__content)::before {
  content: '';
  position: absolute;
  left: -13px;
  top: -10px;
  width: 1px;
  height: 16px;
  background: #e5e7eb;
}
</style>

