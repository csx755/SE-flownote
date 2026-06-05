<template>
  <div class="min-h-screen bg-background">
    <AppNav />

    <div class="flex flex-col items-center justify-center min-h-[calc(100vh-57px)]">
      <h1 class="text-4xl font-bold text-green-500">FlowNote</h1>
      <p class="mt-4 text-lg text-gray-400">一体化知识与任务协作平台</p>
      <p class="mt-2 text-sm text-gray-500">碎片便签捕获 → 知识页面结构化 → 任务看板执行</p>
      <div v-if="!user" class="mt-8 flex gap-4">
        <NuxtLink to="/login" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          开始使用
        </NuxtLink>
      </div>
      <div v-else class="mt-8 flex gap-4">
        <NuxtLink to="/notes" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          进入便签
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const { user, fetchProfile } = useAuth()

onMounted(() => {
  fetchProfile()
})
</script>
