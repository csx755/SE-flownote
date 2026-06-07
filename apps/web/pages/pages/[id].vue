<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center text-red-400 py-8">{{ error }}</div>

      <!-- 编辑器 -->
      <div v-else-if="page">
        <!-- 标题编辑 -->
        <input
          v-model="page.title"
          class="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 focus:ring-0"
          placeholder="页面标题"
          @blur="saveTitle"
        />

        <!-- 内容编辑 -->
        <textarea
          v-model="page.content"
          class="w-full min-h-[60vh] p-4 bg-card border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm leading-relaxed"
          placeholder="开始编写知识内容... (支持 Markdown)"
        />

        <!-- 底部操作栏 -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t">
          <div class="text-xs text-gray-500">
            创建于 {{ formatTime(page.createdAt) }} · 更新于 {{ formatTime(page.updatedAt) }}
          </div>
          <div class="flex gap-3">
            <button
              @click="savePage"
              :disabled="saving"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
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
const { fetchPage, updatePage } = usePages()

const page = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveMessage = ref('')

// 加载页面
const loadPage = async () => {
  loading.value = true
  error.value = null
  try {
    page.value = await fetchPage(Number(route.params.id))
  } catch (e) {
    error.value = e.data?.error || '加载页面失败'
  } finally {
    loading.value = false
  }
}

// 保存标题
const saveTitle = async () => {
  if (!page.value) return
  try {
    await updatePage(page.value.id, { title: page.value.title })
  } catch (e) {
    console.error('保存标题失败:', e)
  }
}

// 保存页面
const savePage = async () => {
  if (!page.value) return
  saving.value = true
  try {
    const updated = await updatePage(page.value.id, {
      title: page.value.title,
      content: page.value.content,
    })
    // 用 API 返回值更新本地状态，确保 updatedAt 等字段刷新
    page.value = { ...page.value, ...updated }
    saveMessage.value = '保存成功！'
    setTimeout(() => { saveMessage.value = '' }, 2000)
  } catch (e) {
    alert(e.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
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
  await loadPage()
})
</script>