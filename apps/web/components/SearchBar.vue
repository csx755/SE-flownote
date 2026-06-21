<template>
  <div class="relative" ref="containerRef">
    <!-- 搜索输入框 -->
    <div class="relative">
      <input
        v-model="query"
        type="text"
        placeholder="搜索便签、页面、任务..."
        class="w-64 px-3 py-1.5 pl-8 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
        :class="{ 'w-96': focused }"
        @focus="focused = true"
        @input="debouncedSearch"
        @keydown.escape="close"
        @keydown.enter="goToFirstResult"
      />
      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <button
        v-if="query"
        @click="clearSearch"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
      >
        ×
      </button>
    </div>

    <!-- 搜索结果下拉 -->
    <div
      v-if="showResults && (results.length > 0 || loading)"
      class="absolute z-50 mt-2 w-[480px] bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto"
    >
      <!-- 加载中 -->
      <div v-if="loading" class="p-4 text-center text-gray-400 text-sm">搜索中...</div>

      <!-- 结果列表 -->
      <div v-else>
        <div
          v-for="item in results"
          :key="`${item.type}-${item.id}`"
          @click="goToResult(item)"
          class="flex items-start gap-3 px-4 py-3 hover:bg-gray-600/20 cursor-pointer border-b last:border-b-0 transition-colors"
        >
          <!-- 类型图标 -->
          <span class="text-lg mt-0.5">{{ typeIcon(item.type) }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm truncate">{{ item.title }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-gray-600/30 text-gray-400">{{ typeLabel(item.type) }}</span>
            </div>
            <p v-if="item.snippet" class="text-xs text-gray-400 mt-1 line-clamp-2">{{ item.snippet }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 无结果 -->
    <div
      v-if="showResults && !loading && results.length === 0 && query.trim()"
      class="absolute z-50 mt-2 w-[480px] bg-card border rounded-lg shadow-lg p-4 text-center text-gray-400 text-sm"
    >
      没有找到相关结果
    </div>
  </div>
</template>

<script setup>
const { results, loading, search, clearResults } = useSearch()

const query = ref('')
const focused = ref(false)
const showResults = ref(false)
const containerRef = ref(null)

let searchTimer = null

const debouncedSearch = () => {
  clearTimeout(searchTimer)
  if (!query.value.trim()) {
    clearResults()
    showResults.value = false
    return
  }
  searchTimer = setTimeout(async () => {
    showResults.value = true
    await search(query.value)
  }, 300)
}

const clearSearch = () => {
  query.value = ''
  clearResults()
  showResults.value = false
}

const close = () => {
  showResults.value = false
  focused.value = false
}

const typeIcon = (type) => {
  const icons = { note: '📝', page: '📄', task: '✅' }
  return icons[type] || '📄'
}

const typeLabel = (type) => {
  const labels = { note: '便签', page: '知识页', task: '任务' }
  return labels[type] || type
}

const goToResult = (item) => {
  const routes = {
    note: '/notes',
    page: `/pages/${item.id}`,
    task: `/tasks/${item.id}`,
  }
  // 便签没有详情页，跳到列表
  if (item.type === 'note') {
    navigateTo('/notes')
  } else {
    navigateTo(routes[item.type])
  }
  close()
}

const goToFirstResult = () => {
  if (results.value.length > 0) {
    goToResult(results.value[0])
  }
}

// 点击外部关闭
const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(searchTimer)
})
</script>
