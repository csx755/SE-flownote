import type { Page } from '@flownote/shared'

export const usePages = () => {
  const api = useApi()
  const pages = useState<Page[]>('pages', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPages = async (params?: { page?: number; pageSize?: number }) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))
      
      const queryString = query.toString()
      const url = `/api/v1/pages${queryString ? `?${queryString}` : ''}`
      
      const data = await api(url)
      pages.value = data
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取知识页列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const createPage = async (title: string, content: string = '') => {
    loading.value = true
    error.value = null
    try {
      const data = await api('/api/v1/pages', {
        method: 'POST',
        body: { title, content },
      })
      pages.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '创建知识页失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchPage = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/pages/${id}`)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取知识页详情失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updatePage = async (id: number, updates: Partial<Pick<Page, 'title' | 'content' | 'isArchived'>>) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/pages/${id}`, {
        method: 'PATCH',
        body: updates,
      })
      const index = pages.value.findIndex(p => p.id === id)
      if (index !== -1) {
        pages.value[index] = data
      }
      return data
    } catch (e: any) {
      error.value = e.data?.error || '更新知识页失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deletePage = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api(`/api/v1/pages/${id}`, {
        method: 'DELETE',
      })
      pages.value = pages.value.filter(p => p.id !== id)
    } catch (e: any) {
      error.value = e.data?.error || '删除知识页失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    pages,
    loading,
    error,
    fetchPages,
    createPage,
    fetchPage,
    updatePage,
    deletePage,
  }
}