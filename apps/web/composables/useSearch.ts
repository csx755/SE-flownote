export interface SearchResult {
  type: 'note' | 'page' | 'task'
  id: number
  title: string
  snippet: string
  updatedAt: string
}

export const useSearch = () => {
  const api = useApi()
  const results = useState<SearchResult[]>('search-results', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const search = async (q: string, type: 'all' | 'notes' | 'pages' | 'tasks' = 'all') => {
    if (!q.trim()) {
      results.value = []
      return []
    }
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/search?q=${encodeURIComponent(q)}&type=${type}`)
      results.value = data.results
      return data.results
    } catch (e: any) {
      error.value = e.data?.error || '搜索失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const clearResults = () => {
    results.value = []
  }

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  }
}
