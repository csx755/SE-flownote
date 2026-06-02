<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-4xl font-bold text-green-500">FlowNote</h1>
    <p class="mt-4 text-lg text-gray-400">一体化知识与任务协作平台</p>
    <div class="mt-8 flex gap-4">
      <NuxtLink to="/login" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        登录
      </NuxtLink>
      <NuxtLink to="/register" class="px-6 py-2 border border-green-600 text-green-500 rounded-lg hover:bg-green-600/10">
        注册
      </NuxtLink>
    </div>
  </div>
</template>
