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
      <div v-else-if="notes.length === 0 && !showArchived" class="text-center text-gray-400 py-8">
        还没有便签，开始记录吧！
      </div>
      <div v-else>
        <!-- 切换按钮 -->
        <div class="flex items-center gap-4 mb-4">
          <button
            @click="showArchived = false"
            :class="[
              'px-3 py-1 text-sm rounded-lg transition-colors',
              !showArchived ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            未归档 ({{ activeNotes.length }})
          </button>
          <button
            @click="showArchived = true"
            :class="[
              'px-3 py-1 text-sm rounded-lg transition-colors',
              showArchived ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            已归档 ({{ archivedNotes.length }})
          </button>
        </div>

        <!-- 未归档便签 -->
        <div v-if="!showArchived" class="space-y-6">
          <div v-if="activeNotes.length === 0" class="text-center text-gray-400 py-8">
            还没有便签，开始记录吧！
          </div>
          <div v-for="group in groupedActiveNotes" :key="group.label">
            <h3 class="text-sm font-medium text-gray-400 mb-3">{{ group.label }}</h3>
            <div class="space-y-3">
              <div
                v-for="note in group.notes"
                :key="note.id"
                class="p-4 bg-card border rounded-lg hover:border-green-500/50 transition-colors"
              >
                <!-- 编辑模式 -->
                <div v-if="editingId === note.id">
                  <textarea
                    v-model="editingContent"
                    class="w-full p-3 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    @keydown.ctrl.enter="saveEdit(note.id)"
                    @keydown.escape="cancelEdit"
                  />
                  <div class="flex justify-end gap-2 mt-2">
                    <button
                      @click="cancelEdit"
                      class="px-3 py-1 text-sm text-gray-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      @click="saveEdit(note.id)"
                      :disabled="!editingContent.trim() || saving"
                      class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {{ saving ? '保存中...' : '保存' }}
                    </button>
                  </div>
                </div>

                <!-- 显示模式 -->
                <div v-else class="flex items-start justify-between">
                  <div class="flex-1 cursor-pointer" @click="startEdit(note)">
                    <p class="whitespace-pre-wrap">{{ note.content }}</p>
                    <div class="flex items-center gap-2 mt-2">
                      <p class="text-xs text-gray-500">{{ formatTime(note.updatedAt) }}</p>
                      <span @click.stop>
                        <TagPicker entityType="note" :entityId="note.id" />
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <button
                      @click="startEdit(note)"
                      class="text-xs px-2 py-1 bg-gray-600/20 text-gray-400 rounded hover:bg-gray-600/30"
                      title="编辑"
                    >
                      ✏️
                    </button>
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
                      @click="archiveNote(note.id)"
                      class="text-xs px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/30"
                      title="归档"
                    >
                      📦
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

        <!-- 已归档便签 -->
        <div v-else class="space-y-3">
          <div v-if="archivedNotes.length === 0" class="text-center text-gray-400 py-8">
            没有已归档的便签
          </div>
          <div
            v-for="note in archivedNotes"
            :key="note.id"
            class="p-4 bg-card border rounded-lg opacity-75"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="whitespace-pre-wrap">{{ note.content }}</p>
                <p class="text-xs text-gray-500 mt-2">{{ formatTime(note.updatedAt) }}</p>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button
                  @click="unarchiveNote(note.id)"
                  class="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30"
                  title="恢复"
                >
                  ↩️
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
  </div>
</template>

<script setup>
const { user, fetchProfile } = useAuth()
const { notes, loading, fetchNotes, createNote: createNoteApi, updateNote, deleteNote: deleteNoteApi, convertNote } = useNotes()

const newNote = ref('')
const creating = ref(false)

// 编辑状态
const editingId = ref(null)
const editingContent = ref('')
const saving = ref(false)

// 归档状态
const showArchived = ref(false)

// 分离未归档和已归档便签
const activeNotes = computed(() => notes.value.filter(n => !n.isArchived))
const archivedNotes = computed(() => notes.value.filter(n => n.isArchived))

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

// 开始编辑
const startEdit = (note) => {
  editingId.value = note.id
  editingContent.value = note.content
}

// 取消编辑
const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

// 保存编辑
const saveEdit = async (id) => {
  if (!editingContent.value.trim()) return
  saving.value = true
  try {
    await updateNote(id, { content: editingContent.value.trim() })
    editingId.value = null
    editingContent.value = ''
  } catch (e) {
    alert(e.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

// 归档便签
const archiveNote = async (id) => {
  try {
    await updateNote(id, { isArchived: true })
  } catch (e) {
    alert(e.data?.error || '归档失败')
  }
}

// 恢复归档
const unarchiveNote = async (id) => {
  try {
    await updateNote(id, { isArchived: false })
  } catch (e) {
    alert(e.data?.error || '恢复失败')
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

// 按日期分组未归档便签
const groupedActiveNotes = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups = {
    today: { label: '今天', notes: [] },
    yesterday: { label: '昨天', notes: [] },
    earlier: { label: '更早', notes: [] },
  }

  activeNotes.value.forEach(note => {
    const noteDate = new Date(note.createdAt)
    if (noteDate >= today) {
      groups.today.notes.push(note)
    } else if (noteDate >= yesterday) {
      groups.yesterday.notes.push(note)
    } else {
      groups.earlier.notes.push(note)
    }
  })

  return Object.values(groups).filter(g => g.notes.length > 0)
})

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
