<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-3xl mx-auto px-6 py-8">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center text-red-400 py-8">{{ error }}</div>

      <!-- 任务详情 -->
      <div v-else-if="task">
        <!-- 状态标签 -->
        <div class="mb-6">
          <span :class="statusClass(task.status)" class="px-3 py-1 rounded-full text-sm font-medium">
            {{ statusLabel(task.status) }}
          </span>
        </div>

        <!-- 标题编辑 -->
        <input
          v-model="task.title"
          class="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 focus:ring-0"
          placeholder="任务标题"
        />

        <!-- 描述编辑 -->
        <div class="mb-6">
          <label class="block text-sm text-gray-400 mb-2">描述</label>
          <textarea
            v-model="task.description"
            class="w-full p-4 bg-card border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[200px]"
            placeholder="添加任务描述..."
          />
        </div>

        <!-- 属性编辑 -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm text-gray-400 mb-2">状态</label>
            <select
              v-model="task.status"
              class="w-full p-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="TODO">待办</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="DONE">已完成</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">优先级</label>
            <select
              v-model="task.priority"
              class="w-full p-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">截止日期</label>
            <input
              v-model="dueDateStr"
              type="date"
              class="w-full p-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">来源</label>
            <div class="p-3 bg-card border rounded-lg text-sm text-gray-400">
              {{ task.sourceType ? `${sourceLabel(task.sourceType)} #${task.sourceId}` : '无' }}
            </div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="text-xs text-gray-500 mb-6">
          创建于 {{ formatTime(task.createdAt) }} · 更新于 {{ formatTime(task.updatedAt) }}
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-between pt-4 border-t">
          <button
            @click="deleteTask"
            class="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg"
          >
            删除任务
          </button>
          <button
            @click="saveTask"
            :disabled="saving"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>

        <!-- 保存状态提示 -->
        <div v-if="saveMessage" class="fixed bottom-6 right-6 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg">
          {{ saveMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { user, fetchProfile } = useAuth()
const { fetchTask, updateTask, deleteTask: deleteTaskApi } = useTasks()

const task = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveMessage = ref('')
const dueDateStr = ref('')

// 加载任务
const loadTask = async () => {
  loading.value = true
  error.value = null
  try {
    task.value = await fetchTask(Number(route.params.id))
    if (task.value?.dueDate) {
      dueDateStr.value = new Date(task.value.dueDate).toISOString().split('T')[0]
    }
  } catch (e) {
    error.value = e.data?.error || '加载任务失败'
  } finally {
    loading.value = false
  }
}

// 保存任务
const saveTask = async () => {
  if (!task.value) return
  saving.value = true
  try {
    const updated = await updateTask(task.value.id, {
      title: task.value.title,
      description: task.value.description,
      status: task.value.status,
      priority: task.value.priority,
      dueDate: dueDateStr.value
        ? new Date(dueDateStr.value + 'T00:00:00').toISOString()
        : undefined,
    })
    // 用 API 返回值更新本地状态，确保 updatedAt 等字段刷新
    task.value = { ...task.value, ...updated }
    saveMessage.value = '保存成功！'
    setTimeout(() => { saveMessage.value = '' }, 2000)
  } catch (e) {
    alert(e.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

// 删除任务
const deleteTask = async () => {
  if (!confirm('确定删除这个任务？')) return
  try {
    await deleteTaskApi(task.value.id)
    navigateTo('/tasks')
  } catch (e) {
    alert(e.data?.error || '删除失败')
  }
}

// 状态标签
const statusLabel = (status) => {
  const labels = { TODO: '待办', IN_PROGRESS: '进行中', DONE: '已完成' }
  return labels[status] || status
}

// 状态样式
const statusClass = (status) => {
  const classes = {
    TODO: 'bg-yellow-600/20 text-yellow-400',
    IN_PROGRESS: 'bg-blue-600/20 text-blue-400',
    DONE: 'bg-green-600/20 text-green-400',
  }
  return classes[status] || ''
}

// 来源标签
const sourceLabel = (sourceType) => {
  const labels = { NOTE: '便签', KNOWLEDGE_PAGE: '知识页' }
  return labels[sourceType] || sourceType
}

// 格式化时间
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}

// 页面加载
onMounted(async () => {
  await fetchProfile()
  if (!user.value) {
    navigateTo('/login')
    return
  }
  await loadTask()
})
</script>