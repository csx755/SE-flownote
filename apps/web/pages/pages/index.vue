<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">知识页面</h1>
        <div class="flex gap-2">
          <input ref="fileInput" type="file" accept=".md,.txt" multiple class="hidden" @change="importFiles">
          <button @click="fileInput?.click()" class="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30">导入</button>
          <button @click="showCreateModal = true" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">新建页面</button>
        </div>
      </div>

      <div class="flex gap-6">
        <!-- 文件夹侧栏 -->
        <aside class="w-56 shrink-0">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-400">文件夹</h3>
          </div>
          <ul class="space-y-0.5">
            <li>
              <button @click="activeFolder = ''; loadPages()"
                :class="!activeFolder ? 'text-green-400 bg-green-600/10' : 'text-gray-400 hover:text-white'"
                class="w-full text-left px-2 py-1 text-sm rounded">
                全部 ({{ totalCount }})
              </button>
            </li>
            <!-- 树形文件夹 -->
            <li v-for="node in folderTree" :key="node.path">
              <FolderTreeNode
                :node="node"
                :active-folder="activeFolder"
                :depth="0"
                @select="onFolderSelect"
              />
            </li>
            <li v-if="folderTree.length === 0" class="text-xs text-gray-500 px-2 py-1">暂无文件夹</li>
          </ul>
        </aside>

        <!-- 主内容区 -->
        <div class="flex-1 min-w-0">
          <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>
          <div v-else-if="pages.length === 0" class="text-center text-gray-400 py-8">
            {{ activeFolder ? `文件夹 "${activeFolder}" 为空` : '还没有知识页面，开始创建吧！' }}
          </div>
          <div v-else class="space-y-3">
            <div v-for="page in pages" :key="page.id"
              class="p-4 bg-card border rounded-lg hover:border-green-500/50 transition-colors cursor-pointer"
              @click="navigateTo(`/pages/${page.id}`)">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold mb-1 line-clamp-1">{{ page.title }}</h3>
                  <div class="text-gray-400 text-xs line-clamp-2 mb-2 markdown-preview" v-html="previewMarkdown(page.content)" />
                  <span class="text-xs text-gray-500">{{ formatTime(page.updatedAt) }}</span>
                </div>
                <div class="flex items-center gap-2 ml-4 shrink-0" @click.stop>
                  <!-- 移动到文件夹 -->
                  <select
                    :value="page.folder || ''"
                    @change="moveToFolder(page.id, ($event.target as HTMLSelectElement).value)"
                    class="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300"
                  >
                    <option value="">(无文件夹)</option>
                    <option v-for="f in allFolderPaths" :key="f" :value="f">{{ f }}</option>
                    <option value="__new__">+ 新建文件夹...</option>
                  </select>
                  <button @click.stop="editPage(page)" class="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30">编辑</button>
                  <button @click.stop="deletePage(page.id)" class="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建页面模态框 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card border rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">新建知识页面</h2>
        <input v-model="newPageTitle" type="text" placeholder="页面标题"
          class="w-full p-3 bg-background border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          @keydown.enter="createPage" />
        <input v-model="newPageFolder" type="text" placeholder="文件夹（可选，如 工作/项目A）"
          class="w-full p-3 bg-background border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500" />
        <div class="flex justify-end gap-2">
          <button @click="showCreateModal = false" class="px-4 py-2 text-gray-400 hover:text-white">取消</button>
          <button @click="createPage" :disabled="!newPageTitle.trim() || creating"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '../../utils/markdown';

interface FolderNode {
  name: string
  path: string
  count: number
  children: FolderNode[]
}

const { user, fetchProfile } = useAuth()
const { pages, loading, fetchPages, createPage: createPageApi, updatePage, deletePage: deletePageApi } = usePages()
const api = useApi()

const showCreateModal = ref(false)
const newPageTitle = ref('')
const newPageFolder = ref('')
const creating = ref(false)
const fileInput = ref<HTMLInputElement>()
const activeFolder = ref('')
const folderTree = ref<FolderNode[]>([])

// 从 pages 获取总数（未筛选时的总数）
const totalCount = ref(0)

// 所有文件夹路径（平铺，给下拉框用）
const allFolderPaths = computed(() => {
  const paths: string[] = []
  function walk(nodes: FolderNode[]) {
    for (const n of nodes) {
      paths.push(n.path)
      walk(n.children)
    }
  }
  walk(folderTree.value)
  return paths
})

const previewMarkdown = (content: string): string => {
  if (!content) return '<span class="text-gray-500">暂无内容</span>';
  const html = renderMarkdown(content);
  const match = html.match(/<(h[1-6]|p)\b[^>]*>.*?<\/\1>/);
  return match ? match[0] : html.slice(0, 200);
}

const loadPages = async () => {
  loading.value = true
  try {
    await fetchPages({ folder: activeFolder.value || undefined })
  } finally {
    loading.value = false
  }
}

const loadFolders = async () => {
  try {
    const data = await api('/api/v1/folders?type=pages')
    folderTree.value = data || []
  } catch (_) {
    folderTree.value = []
  }
}

const loadTotalCount = async () => {
  try {
    // 获取未筛选的总数
    const data = await api('/api/v1/pages?pageSize=1')
    // 没法直接从 API 拿 total，用一个大 pageSize 估算
    const all = await api('/api/v1/pages?pageSize=1000')
    totalCount.value = Array.isArray(all) ? all.length : 0
  } catch (_) {
    totalCount.value = 0
  }
}

const onFolderSelect = (path: string) => {
  activeFolder.value = path
  loadPages()
}

// 移动到文件夹（包括新建）
const moveToFolder = async (pageId: number, folder: string) => {
  if (folder === '__new__') {
    const name = prompt('输入新文件夹路径（如 工作/项目A）：')
    if (!name) return
    folder = name.trim()
  }
  try {
    await updatePage(pageId, { folder: folder || null } as any)
    await Promise.all([loadPages(), loadFolders()])
  } catch (e: any) {
    alert(e.data?.error || '移动失败')
  }
}

const importFiles = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  let count = 0
  for (const file of files) {
    try {
      const content = await file.text()
      const title = file.name.replace(/\.(md|txt)$/i, '')
      await createPageApi(title, content)
      count++
    } catch (err: any) {
      alert(`导入 ${file.name} 失败: ${err.data?.error || err.message}`)
    }
  }
  alert(`成功导入 ${count} 个文件`)
  if (fileInput.value) fileInput.value.value = ''
  await Promise.all([loadPages(), loadFolders(), loadTotalCount()])
}

const createPage = async () => {
  if (!newPageTitle.value.trim()) return
  creating.value = true
  try {
    const page = await createPageApi(newPageTitle.value.trim(), '')
    // 如果指定了文件夹，更新
    if (newPageFolder.value.trim()) {
      await updatePage(page.id, { folder: newPageFolder.value.trim() } as any)
    }
    newPageTitle.value = ''
    newPageFolder.value = ''
    showCreateModal.value = false
    navigateTo(`/pages/${page.id}`)
  } catch (e: any) {
    alert(e.data?.error || '创建失败')
  } finally {
    creating.value = false
  }
}

const editPage = (page: { id: number }) => {
  navigateTo(`/pages/${page.id}`)
}

const deletePage = async (id: number) => {
  if (!confirm('确定删除这个页面？')) return
  try {
    await deletePageApi(id)
    await Promise.all([loadPages(), loadFolders(), loadTotalCount()])
  } catch (e: any) {
    alert(e.data?.error || '删除失败')
  }
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}

onMounted(async () => {
  await fetchProfile()
  if (!user.value) {
    navigateTo('/login')
    return
  }
  await Promise.all([loadPages(), loadFolders(), loadTotalCount()])
})
</script>
