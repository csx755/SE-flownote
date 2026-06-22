import type { Task } from '@flownote/shared'

export interface TaskStats {
  total: number
  todo: number
  inProgress: number
  done: number
  overdue: number
}

export interface TaskFilters {
  status?: string
  priority?: string
  sortBy?: 'createdAt' | 'dueDate' | 'priority'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export const useTasks = () => {
  const api = useApi()
  const tasks = useState<Task[]>('tasks', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTasks = async (params?: TaskFilters) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.priority) query.set('priority', params.priority)
      if (params?.sortBy) query.set('sortBy', params.sortBy)
      if (params?.order) query.set('order', params.order)
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))

      const queryString = query.toString()
      const url = `/api/v1/tasks${queryString ? `?${queryString}` : ''}`

      const data = await api(url)
      tasks.value = data
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取任务列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async (): Promise<TaskStats | null> => {
    try {
      return await api('/api/v1/tasks/stats')
    } catch (e: any) {
      console.error('获取任务统计失败:', e)
      return null
    }
  }

  const createTask = async (taskData: {
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    dueDate?: string
    sourceType?: 'NOTE' | 'KNOWLEDGE_PAGE'
    sourceId?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      const data = await api('/api/v1/tasks', {
        method: 'POST',
        body: taskData,
      })
      tasks.value.unshift(data)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '创建任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchTask = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/tasks/${id}`)
      return data
    } catch (e: any) {
      error.value = e.data?.error || '获取任务详情失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (id: number, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>>) => {
    loading.value = true
    error.value = null
    try {
      const data = await api(`/api/v1/tasks/${id}`, {
        method: 'PATCH',
        body: updates,
      })
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = data
      }
      return data
    } catch (e: any) {
      error.value = e.data?.error || '更新任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
      })
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (e: any) {
      error.value = e.data?.error || '删除任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 按状态分组任务（用于看板）
  const tasksByStatus = computed(() => {
    const grouped = {
      TODO: [] as Task[],
      IN_PROGRESS: [] as Task[],
      DONE: [] as Task[],
    }
    tasks.value.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    return grouped
  })

  return {
    tasks,
    loading,
    error,
    tasksByStatus,
    fetchTasks,
    fetchStats,
    createTask,
    fetchTask,
    updateTask,
    deleteTask,
  }
}