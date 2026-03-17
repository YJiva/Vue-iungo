// blog.tags 解析与 blog_type 映射工具（前端统一复用）

/**
 * 将后端返回的 blog_type 列表转换为 id -> type 的映射表
 * @param {Array<{id:number,name:string,show:number}>} types
 */
export function buildBlogTypeMap(types) {
  const map = {}
  if (!Array.isArray(types)) return map
  for (const t of types) {
    if (t && t.id != null) {
      map[t.id] = t
    }
  }
  return map
}

/**
 * 解析 blog.tags（如 "1,2,3"）并与 blog_typeMap 关联，返回用于渲染的 tag 列表
 * - 保留原顺序
 * - 自动去重
 * - 跳过无效 id 或未命中的 type
 *
 * @param {string|null|undefined} tagsStr
 * @param {Record<number, {id:number,name:string,show:number}>} blogTypeMap
 * @returns {Array<{id:number,name:string,show:number}>}
 */
export function resolveBlogTags(tagsStr, blogTypeMap) {
  const out = []
  if (!tagsStr) return out
  const parts = String(tagsStr)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)

  const seen = new Set()
  for (const p of parts) {
    const id = Number(p)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const t = blogTypeMap && blogTypeMap[id]
    if (t) {
      out.push({ id: t.id, name: t.name, show: t.show })
    }
  }
  return out
}

