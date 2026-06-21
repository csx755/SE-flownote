<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- 页面标题和创建按钮 -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold">任务看板</h1>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          新建任务
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>

      <!-- 看板三列 -->
      <div v-else-if="tasksByStatus" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- TODO 列 -->
        <div class="bg-card border rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-yellow-400">待办 ({{ tasksByStatus.TODO.length }})</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="task in tasksByStatus.TODO"
              :key="task.id"
              class="p-4 bg-background border rounded-lg hover:border-yellow-500/50 transition-colors cursor-pointer"
              @click="navigateTo(`/tasks/${task.id}`)"
            >
              <h3 class="font-medium mb-2">{{ task.title }}</h3>
              <p v-if="task.description" class="text-sm text-gray-400 line-clamp-2 mb-2">{{ task.description }}</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span :class="priorityClass(task.priority)">{{ priorityLabel(task.priority) }}</span>
                <div class="flex gap-2">
                  <button
                    @click.stop="moveTask(task.id, 'IN_PROGRESS')"
                    class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30"
                  >
                    开始
                  </button>
                  <button
                    @click.stop="deleteTask(task.id)"
                    class="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- IN_PROGRESS 列 -->
        <div class="bg-card border rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-blue-400">进行中 ({{ tasksByStatus.IN_PROGRESS.length }})</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="task in tasksByStatus.IN_PROGRESS"
              :key="task.id"
              class="p-4 bg-background border rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer"
              @click="navigateTo(`/tasks/${task.id}`)"
            >
              <h3 class="font-medium mb-2">{{ task.title }}</h3>
              <p v-if="task.description" class="text-sm text-gray-400 line-clamp-2 mb-2">{{ task.description }}</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span :class="priorityClass(task.priority)">{{ priorityLabel(task.priority) }}</span>
                <div class="flex gap-2">
                  <button
                    @click.stop="moveTask(task.id, 'DONE')"
                    class="px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30"
                  >
                    完成
                  </button>
                  <button
                    @click.stop="moveTask(task.id, 'TODO')"
                    class="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/30"
                  >
                    回退
                  </button>
                  <button
                    @click.stop="deleteTask(task.id)"
                    class="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DONE 列 -->
        <div class="bg-card border rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-green-400">已完成 ({{ tasksByStatus.DONE.length }})</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="task in tasksByStatus.DONE"
              :key="task.id"
              class="p-4 bg-background border rounded-lg hover:border-green-500/50 transition-colors cursor-pointer"
              @click="navigateTo(`/tasks/${task.id}`)"
            >
              <h3 class="font-medium mb-2 line-through text-gray-500">{{ task.title }}</h3>
              <p v-if="task.description" class="text-sm text-gray-500 line-clamp-2 mb-2">{{ task.description }}</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span :class="priorityClass(task.priority)">{{ priorityLabel(task.priority) }}</span>
                <div class="flex gap-2">
                  <button
                    @click.stop="moveTask(task.id, 'IN_PROGRESS')"
                    class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30"
                  >
                    重开
                  </button>
                  <button
                    @click.stop="deleteTask(task.id)"
                    class="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建任务模态框 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card border rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">新建任务</h2>
        <input
          v-model="newTask.title"
          type="text"
          placeholder="任务标题"
          class="w-full p-3 bg-background border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <textarea
          v-model="newTask.description"
          placeholder="任务描述（可选）"
          class="w-full p-3 bg-background border rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          rows="3"
        />
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">优先级</label>
            <select
              v-model="newTask.priority"
              class="w-full p-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">截止日期（可选）</label>
            <input
              v-model="newTask.dueDate"
              type="date"
              class="w-full p-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-gray-400 hover:text-white"
          >
            取消
          </button>
          <button
            @click="createTask"
            :disabled="!newTask.title.trim() || creating"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { user, fetchProfile } = useAuth()
const { tasks, loading, tasksByStatus, fetchTasks, createTask: createTaskApi, updateTask, deleteTask: deleteTaskApi } = useTasks()

const showCreateModal = ref(false)
const newTask = ref({
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
})
const creating = ref(false)

// 创建任务
const createTask = async () => {
  if (!newTask.value.title.trim()) return
  creating.value = true
  try {
    await createTaskApi({
      title: newTask.value.title.trim(),
      description: newTask.value.description.trim() || undefined,
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate ? new Date(newTask.value.dueDate).toISOString() : undefined,
    })
    newTask.value = { title: '', description: '', priority: 'MEDIUM', dueDate: '' }
    showCreateModal.value = false
  } catch (e) {
    alert(e.data?.error || '创建失败')
  } finally {
    creating.value = false
  }
}

// 移动任务状态
const moveTask = async (id, status) => {
  try {
    await updateTask(id, { status })
  } catch (e) {
    alert(e.data?.error || '更新失败')
  }
}

// 删除任务
const deleteTask = async (id) => {
  if (!confirm('确定删除这个任务？')) return
  try {
    await deleteTaskApi(id)
  } catch (e) {
    alert(e.data?.error || '删除失败')
  }
}

// 优先级标签
const priorityLabel = (priority) => {
  const labels = { LOW: '低', MEDIUM: '中', HIGH: '高', URGENT: '紧急' }
  return labels[priority] || priority
}

// 优先级样式
const priorityClass = (priority) => {
  const classes = {
    LOW: 'text-gray-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    URGENT: 'text-red-400',
  }
  return classes[priority] || ''
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchProfile()
  if (!user.value) {
    navigateTo('/login')
    return
  }
  await fetchTasks()
})
</script>