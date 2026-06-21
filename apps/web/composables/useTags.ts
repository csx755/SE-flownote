import type { Tag } from '@flownote/shared'

export const useTags = () => {
  const api = useApi()
  const tags = useState<Tag[]>('tags', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取用户所有标签
  const fetchTags = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await api('/api/v1/tags')
      tags.value = data
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取标签失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 创建标签
  const createTag = async (name: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await api('/api/v1/tags', {
        method: 'POST',
        body: { name },
      })
      tags.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '创建标签失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 重命名标签
  const updateTag = async (id: number, name: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/tags/${id}`, {
        method: 'PATCH',
        body: { name },
      })
      const index = tags.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tags.value[index] = data
      }
      return data
    } catch (e: any) {
      error.value = e.data?.error || '更新标签失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 删除标签
  const deleteTag = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api(`/api/v1/tags/${id}`, { method: 'DELETE' })
      tags.value = tags.value.filter(t => t.id !== id)
    } catch (e: any) {
      error.value = e.data?.error || '删除标签失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 获取某个实体的标签
  const fetchEntityTags = async (entityType: 'note' | 'page' | 'task', entityId: number) => {
    try {
      const data = await api(`/api/v1/tags/entity/${entityType}/${entityId}`)
      return data as Tag[]
    } catch (e: any) {
      return []
    }
  }

  // 给实体打标签
  const linkTag = async (entityType: 'note' | 'page' | 'task', entityId: number, tagId: number) => {
    try {
      await api('/api/v1/tags/link', {
        method: 'POST',
        body: { entityType, entityId, tagId },
      })
    } catch (e: any) {
      if (e.data?.error === '关联已存在') return // 已关联，忽略
      throw e
    }
  }

  // 移除实体标签
  const unlinkTag = async (entityType: 'note' | 'page' | 'task', entityId: number, tagId: number) => {
    try {
      await api('/api/v1/tags/link', {
        method: 'DELETE',
        body: { entityType, entityId, tagId },
      })
    } catch (e: any) {
      throw e
    }
  }

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchEntityTags,
    linkTag,
    unlinkTag,
  }
}
