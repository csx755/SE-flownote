<template>
  <div>
    <button
      @click="onSelect"
      :class="[
        'w-full text-left px-2 py-1 text-sm rounded flex items-center gap-1',
        activeFolder === node.path ? 'text-green-400 bg-green-600/10' : 'text-gray-400 hover:text-white'
      ]"
      :style="{ paddingLeft: `${8 + depth * 16}px` }"
    >
      <!-- 展开/折叠箭头 -->
      <span
        v-if="node.children.length > 0"
        @click.stop="toggleExpand"
        class="inline-block w-4 text-center text-xs cursor-pointer hover:text-white shrink-0"
      >{{ isExpanded ? '▼' : '▶' }}</span>
      <span v-else class="inline-block w-4 shrink-0"></span>
      <span class="truncate flex-1">📁 {{ node.name }}</span>
      <span class="text-xs text-gray-500 shrink-0">{{ node.count }}</span>
    </button>
    <!-- 子节点 -->
    <FolderTreeNode
      v-if="isExpanded"
      v-for="child in node.children"
      :key="child.path"
      :node="child"
      :active-folder="activeFolder"
      :depth="depth + 1"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup lang="ts">
interface FolderNode {
  name: string
  path: string
  count: number
  children: FolderNode[]
}

const props = defineProps<{
  node: FolderNode
  activeFolder: string
  depth: number
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

// 判断当前 activeFolder 是否在这个节点的子树中
const isActiveInSubtree = computed(() =>
  props.activeFolder === props.node.path ||
  props.activeFolder.startsWith(props.node.path + '/')
)

// 展开状态：手动切换过就用手动值，否则自动跟随 activeFolder
const manualExpanded = ref<boolean | null>(null)

const isExpanded = computed(() => {
  if (manualExpanded.value !== null) return manualExpanded.value
  return isActiveInSubtree.value
})

// 当 activeFolder 变化时，自动同步展开（不清除手动设置，但让 auto 逻辑生效）
watch(() => props.activeFolder, () => {
  // 当 activeFolder 进入子树时自动展开
  if (isActiveInSubtree.value && manualExpanded.value === null) {
    // 保持自动
  }
})

const toggleExpand = () => {
  manualExpanded.value = !isExpanded.value
}

const onSelect = () => {
  // 如果点击的是有子节点的文件夹，同时展开
  if (props.node.children.length > 0 && !isExpanded.value) {
    manualExpanded.value = true
  }
  emit('select', props.node.path)
}
</script>
