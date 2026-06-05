import type { Note } from '@flownote/shared'

export const useNotes = () => {
  const api = useApi()
  const notes = useState<Note[]>('notes', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNotes = async (params?: { archived?: boolean; page?: number; pageSize?: number }) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params?.archived !== undefined) query.set('archived', String(params.archived))
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))
      
      const queryString = query.toString()
      const url = `/api/v1/notes${queryString ? `?${queryString}` : ''}`
      
      const data = await api(url)
      notes.value = data
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取笔记列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const createNote = async (content: string, contentType: 'TEXT' | 'MARKDOWN' = 'TEXT') => {
    loading.value = true
    error.value = null
    try {
      const data = await api('/api/v1/notes', {
        method: 'POST',
        body: { content, contentType },
      })
      notes.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '创建笔记失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchNote = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/notes/${id}`)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取笔记详情失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateNote = async (id: number, updates: Partial<Pick<Note, 'content' | 'contentType' | 'isArchived'>>) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/notes/${id}`, {
        method: 'PATCH',
        body: updates,
      })
      const index = notes.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notes.value[index] = data
      }
      return data
    } catch (e: any) {
      error.value = e.data?.error || '更新笔记失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteNote = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api(`/api/v1/notes/${id}`, {
        method: 'DELETE',
      })
      notes.value = notes.value.filter(n => n.id !== id)
    } catch (e: any) {
      error.value = e.data?.error || '删除笔记失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const convertNote = async (id: number, targetType: 'KNOWLEDGE_PAGE' | 'TASK', title?: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/notes/${id}/convert`, {
        method: 'POST',
        body: { targetType, title },
      })
      return data
    } catch (e: any) {
      error.value = e.data?.error || '转换笔记失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    fetchNote,
    updateNote,
    deleteNote,
    convertNote,
  }
}