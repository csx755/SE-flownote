<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-3xl mx-auto px-6 py-8">
      <!-- 快速输入 -->
      <div class="mb-8">
        <textarea
          v-model="newNote"
          class="w-full p-4 bg-card border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          rows="3"
          placeholder="记录一条便签... (Ctrl+Enter 提交)"
          @keydown.ctrl.enter="createNote"
        />
        <div class="flex justify-end mt-2">
          <button
            @click="createNote"
            :disabled="!newNote.trim() || creating"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {{ creating ? '创建中...' : '创建便签' }}
          </button>
        </div>
      </div>

      <!-- 便签时间线 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>
      <div v-else-if="notes.length === 0" class="text-center text-gray-400 py-8">
        还没有便签，开始记录吧！
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="note in notes"
          :key="note.id"
          class="p-4 bg-card border rounded-lg hover:border-green-500/50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="whitespace-pre-wrap">{{ note.content }}</p>
              <p class="text-xs text-gray-500 mt-2">{{ formatTime(note.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button
                @click="convertToPage(note)"
                class="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30"
                title="转为知识页面"
              >
                📄
              </button>
              <button
                @click="convertToTask(note)"
                class="text-xs px-2 py-1 bg-orange-600/20 text-orange-400 rounded hover:bg-orange-600/30"
                title="转为任务"
              >
                ✅
              </button>
              <button
                @click="deleteNote(note.id)"
                class="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { user, fetchProfile } = useAuth()
const { notes, loading, fetchNotes, createNote: createNoteApi, deleteNote: deleteNoteApi, convertNote } = useNotes()

const newNote = ref('')
const creating = ref(false)

// 创建便签
const createNote = async () => {
  if (!newNote.value.trim()) return
  creating.value = true
  try {
    await createNoteApi(newNote.value.trim(), 'TEXT')
    newNote.value = ''
  } catch (e) {
    alert(e.data?.error || '创建失败')
  } finally {
    creating.value = false
  }
}

// 删除便签
const deleteNote = async (id) => {
  if (!confirm('确定删除这条便签？')) return
  try {
    await deleteNoteApi(id)
  } catch (e) {
    alert(e.data?.error || '删除失败')
  }
}

// 转为知识页面
const convertToPage = async (note) => {
  try {
    await convertNote(note.id, 'KNOWLEDGE_PAGE')
    alert('已转为知识页面！可在"知识页面"中查看')
  } catch (e) {
    alert(e.data?.error || '转换失败')
  }
}

// 转为任务
const convertToTask = async (note) => {
  try {
    await convertNote(note.id, 'TASK')
    alert('已转为任务！可在"任务"看板中查看')
  } catch (e) {
    alert(e.data?.error || '转换失败')
  }
}

// 格式化时间
const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchProfile()
  if (!user.value) {
    navigateTo('/login')
    return
  }
  await fetchNotes()
})
</script>
