<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center text-red-400 py-8">{{ error }}</div>

      <!-- 编辑器 -->
      <div v-else-if="page">
        <!-- 标签 -->
        <div class="mb-4">
          <TagPicker entityType="page" :entityId="page.id" />
        </div>

        <MarkdownEditor
          v-model:title="editTitle"
          v-model:content="editContent"
        />

        <!-- 底部操作栏 -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t">
          <div class="text-xs text-gray-500">
            创建于 {{ formatTime(page.createdAt) }} · 更新于 {{ formatTime(page.updatedAt) }}
          </div>
          <div class="flex gap-3">
            <button
              @click="convertToTask"
              class="px-4 py-2 bg-orange-600/20 text-orange-400 rounded-lg hover:bg-orange-600/30"
            >
              转为任务
            </button>
            <button
              @click="exportPage('md')"
              class="px-3 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 text-sm"
            >
              导出 .md
            </button>
            <button
              @click="exportPage('txt')"
              class="px-3 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 text-sm"
            >
              导出 .txt
            </button>
            <button
              @click="savePage"
              :disabled="saving"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>

        <!-- 反向链接 -->
        <div v-if="backlinks.length > 0" class="mt-8 pt-6 border-t">
          <h3 class="text-sm font-medium text-gray-400 mb-3">被引用 ({{ backlinks.length }})</h3>
          <div class="space-y-2">
            <NuxtLink
              v-for="link in backlinks"
              :key="link.id"
              :to="`/pages/${link.id}`"
              class="block p-3 bg-card border rounded-lg hover:border-green-500/50 transition-colors"
            >
              <div class="font-medium text-sm">{{ link.title }}</div>
              <div class="text-xs text-gray-500 mt-1">更新于 {{ formatTime(link.updatedAt) }}</div>
            </NuxtLink>
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

<script setup lang="ts">
const route = useRoute()
const { user, fetchProfile, token } = useAuth()
const { fetchPage, updatePage } = usePages()
const api = useApi()

const page = ref(null)
const editTitle = ref('')
const editContent = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveMessage = ref('')
const backlinks = ref([])

// 加载页面
const loadPage = async () => {
  loading.value = true
  error.value = null
  try {
    page.value = await fetchPage(Number(route.params.id))
    editTitle.value = page.value.title
    editContent.value = page.value.content
    // 加载反向链接
    await loadBacklinks()
  } catch (e) {
    error.value = e.data?.error || '加载页面失败'
  } finally {
    loading.value = false
  }
}

// 加载反向链接
const loadBacklinks = async () => {
  if (!page.value) return
  try {
    const data = await api(`/api/v1/pages/${page.value.id}/backlinks`)
    backlinks.value = data.backlinks || []
  } catch (e) {
    console.error('加载反向链接失败:', e)
  }
}

// 保存页面
const savePage = async () => {
  if (!page.value) return
  saving.value = true
  try {
    const updated = await updatePage(page.value.id, {
      title: editTitle.value,
      content: editContent.value,
    })
    page.value = { ...page.value, ...updated, title: editTitle.value, content: editContent.value }
    saveMessage.value = '保存成功！'
    setTimeout(() => { saveMessage.value = '' }, 2000)
  } catch (e) {
    alert(e.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

// 导出
const exportPage = async (format: 'md' | 'txt') => {
  if (!page.value || !token.value) return
  const res = await fetch(`http://localhost:3000/api/v1/pages/export/${page.value.id}?format=${format}`, {
    headers: { Authorization: `Bearer ${token.value}` },
  })
  if (!res.ok) { alert('导出失败'); return }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${page.value.title || 'untitled'}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}

// 转为任务
const convertToTask = async () => {
  if (!page.value) return
  if (!confirm('将此知识页面转为任务？转换后可在任务看板中查看。')) return
  try {
    await api(`/api/v1/pages/${page.value.id}/convert-to-task`, { method: 'POST' })
    alert('已转为任务！可在任务看板中查看')
  } catch (e) {
    alert(e.data?.error || '转换失败')
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
