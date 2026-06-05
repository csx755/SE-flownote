<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- 页面标题和创建按钮 -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold">知识页面</h1>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          新建页面
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>
      
      <!-- 空状态 -->
      <div v-else-if="pages.length === 0" class="text-center text-gray-400 py-8">
        还没有知识页面，开始创建吧！
      </div>

      <!-- 页面卡片网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="page in pages"
          :key="page.id"
          class="p-6 bg-card border rounded-lg hover:border-green-500/50 transition-colors cursor-pointer"
          @click="navigateTo(`/pages/${page.id}`)"
        >
          <h3 class="text-lg font-semibold mb-2 line-clamp-1">{{ page.title }}</h3>
          <p class="text-gray-400 text-sm line-clamp-3 mb-4">{{ page.content || '暂无内容' }}</p>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>{{ formatTime(page.updatedAt) }}</span>
            <div class="flex gap-2">
              <button
                @click.stop="editPage(page)"
                class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30"
              >
                编辑
              </button>
              <button
                @click.stop="deletePage(page.id)"
                class="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建页面模态框 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card border rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">新建知识页面</h2>
        <input
          v-model="newPageTitle"
          type="text"
          placeholder="页面标题"
          class="w-full p-3 bg-background border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          @keydown.enter="createPage"
        />
        <div class="flex justify-end gap-2">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-gray-400 hover:text-white"
          >
            取消
          </button>
          <button
            @click="createPage"
            :disabled="!newPageTitle.trim() || creating"
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
const { pages, loading, fetchPages, createPage: createPageApi, deletePage: deletePageApi } = usePages()

const showCreateModal = ref(false)
const newPageTitle = ref('')
const creating = ref(false)

// 创建页面
const createPage = async () => {
  if (!newPageTitle.value.trim()) return
  creating.value = true
  try {
    await createPageApi(newPageTitle.value.trim())
    newPageTitle.value = ''
    showCreateModal.value = false
  } catch (e) {
    alert(e.data?.error || '创建失败')
  } finally {
    creating.value = false
  }
}

// 编辑页面
const editPage = (page) => {
  navigateTo(`/pages/${page.id}`)
}

// 删除页面
const deletePage = async (id) => {
  if (!confirm('确定删除这个页面？')) return
  try {
    await deletePageApi(id)
  } catch (e) {
    alert(e.data?.error || '删除失败')
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
  await fetchPages()
})
</script>