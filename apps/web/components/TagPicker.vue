<template>
  <div class="relative" ref="containerRef">
    <!-- 已选标签展示 -->
    <div class="flex flex-wrap gap-1.5 mb-2" v-if="selectedTags.length > 0">
      <span
        v-for="tag in selectedTags"
        :key="tag.id"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-600/20 text-green-400"
      >
        {{ tag.name }}
        <button
          @click.stop="removeTag(tag.id)"
          class="hover:text-red-400 transition-colors"
          title="移除标签"
        >
          ×
        </button>
      </span>
    </div>

    <!-- 添加标签按钮 -->
    <button
      @click="open = !open"
      class="text-xs px-2 py-1 bg-gray-600/20 text-gray-400 rounded hover:bg-gray-600/30 transition-colors"
    >
      + 标签
    </button>

    <!-- 下拉面板 -->
    <div
      v-if="open"
      class="absolute z-50 mt-2 w-64 bg-card border rounded-lg shadow-lg p-3"
    >
      <!-- 搜索/新建 -->
      <div class="mb-2">
        <input
          v-model="filterText"
          type="text"
          placeholder="搜索或新建标签..."
          class="w-full px-3 py-1.5 text-sm bg-background border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          @keydown.enter="createIfNotExist"
        />
      </div>

      <!-- 可选标签列表 -->
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          @click="toggleTag(tag)"
          class="flex items-center justify-between px-2 py-1.5 text-sm rounded cursor-pointer transition-colors"
          :class="isSelected(tag.id)
            ? 'bg-green-600/20 text-green-400'
            : 'hover:bg-gray-600/20 text-gray-300'"
        >
          <span>{{ tag.name }}</span>
          <span v-if="isSelected(tag.id)" class="text-green-400">✓</span>
        </div>
        <div v-if="filteredTags.length === 0 && filterText.trim()" class="text-xs text-gray-500 py-2 text-center">
          按回车创建「{{ filterText.trim() }}」
        </div>
      </div>

      <!-- 新建标签 -->
      <div v-if="filterText.trim() && !tags.find(t => t.name === filterText.trim())" class="mt-2 pt-2 border-t">
        <button
          @click="createIfNotExist"
          class="w-full text-xs px-2 py-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
        >
          创建「{{ filterText.trim() }}」
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  entityType: { type: String, required: true }, // 'note' | 'page' | 'task'
  entityId: { type: Number, required: true },
})

const { tags, fetchTags, createTag, fetchEntityTags, linkTag, unlinkTag } = useTags()

const open = ref(false)
const filterText = ref('')
const selectedTags = ref([])
const containerRef = ref(null)

// 加载实体已有标签
const loadEntityTags = async () => {
  selectedTags.value = await fetchEntityTags(props.entityType, props.entityId)
}

// 过滤可选标签（排除已选的）
const filteredTags = computed(() => {
  const text = filterText.value.toLowerCase()
  return tags.value.filter(t => {
    if (selectedTags.value.some(s => s.id === t.id)) return false
    if (text && !t.name.toLowerCase().includes(text)) return false
    return true
  })
})

const isSelected = (tagId) => selectedTags.value.some(t => t.id === tagId)

const toggleTag = async (tag) => {
  if (isSelected(tag.id)) {
    await removeTag(tag.id)
  } else {
    await addTag(tag)
  }
}

const addTag = async (tag) => {
  try {
    await linkTag(props.entityType, props.entityId, tag.id)
    selectedTags.value.push(tag)
  } catch (e) {
    console.error('添加标签失败:', e)
  }
}

const removeTag = async (tagId) => {
  try {
    await unlinkTag(props.entityType, props.entityId, tagId)
    selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
  } catch (e) {
    console.error('移除标签失败:', e)
  }
}

const createIfNotExist = async () => {
  const name = filterText.value.trim()
  if (!name) return
  try {
    const newTag = await createTag(name)
    await addTag(newTag)
    filterText.value = ''
  } catch (e) {
    console.error('创建标签失败:', e)
  }
}

// 点击外部关闭
const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchTags(), loadEntityTags()])
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
