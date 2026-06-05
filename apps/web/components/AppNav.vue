<template>
  <nav class="border-b px-6 py-3 flex items-center justify-between">
    <NuxtLink to="/" class="text-xl font-bold text-green-500">FlowNote</NuxtLink>
    <div class="flex items-center gap-4">
      <template v-if="user">
        <NuxtLink
          to="/notes"
          class="text-sm hover:text-white transition-colors"
          :class="$route.path.startsWith('/notes') ? 'text-green-400 font-medium' : 'text-gray-400'"
        >
          便签
        </NuxtLink>
        <NuxtLink
          to="/pages"
          class="text-sm hover:text-white transition-colors"
          :class="$route.path.startsWith('/pages') ? 'text-green-400 font-medium' : 'text-gray-400'"
        >
          知识页面
        </NuxtLink>
        <NuxtLink
          to="/tasks"
          class="text-sm hover:text-white transition-colors"
          :class="$route.path.startsWith('/tasks') ? 'text-green-400 font-medium' : 'text-gray-400'"
        >
          任务
        </NuxtLink>
        <span class="text-sm text-gray-400">{{ user.username }}</span>
        <button @click="logout" class="text-sm text-gray-400 hover:text-white">退出</button>
      </template>
      <template v-else>
        <NuxtLink to="/login" class="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">
          登录
        </NuxtLink>
        <NuxtLink to="/register" class="px-4 py-1 border border-green-600 text-green-500 rounded-lg hover:bg-green-600/10">
          注册
        </NuxtLink>
      </template>
    </div>
  </nav>
</template>

<script setup>
const { user, logout } = useAuth()
</script>