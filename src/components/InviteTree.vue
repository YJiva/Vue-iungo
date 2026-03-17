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
          <div class="node-card">
            <el-avatar :src="data.avatar || defaultAvatar" :size="28" />
            <div class="node-name">{{ data.nickname || data.username || '未命名' }}</div>
            <div class="node-id">#{{ data.id }}</div>
          </div>
        </div>
      </template>
    </el-tree>
    <p v-else class="invite-empty-text">暂无邀请记录</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'

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

::deep(.el-tree-node__children) {
  margin-left: 14px;
  padding-left: 10px;
  border-left: 1px solid #e5e7eb;
}

::deep(.el-tree-node__children .el-tree-node__content) {
  position: relative;
}

::deep(.el-tree-node__children .el-tree-node__content)::before {
  content: '';
  position: absolute;
  left: -11px;
  top: -8px;
  width: 1px;
  height: 12px;
  background: #e5e7eb;
}
</style>

