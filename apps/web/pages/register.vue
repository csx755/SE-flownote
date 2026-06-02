<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="w-full max-w-md p-8 bg-card rounded-lg border">
      <h1 class="text-2xl font-bold text-center mb-6">注册</h1>
      <form class="space-y-4">
        <div>
          <label class="block text-sm mb-1">用户名</label>
          <input type="text" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入用户名" />
        </div>
        <div>
          <label class="block text-sm mb-1">邮箱</label>
          <input type="email" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入邮箱" />
        </div>
        <div>
          <label class="block text-sm mb-1">密码</label>
          <input type="password" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入密码" />
        </div>
        <div>
          <label class="block text-sm mb-1">确认密码</label>
          <input type="password" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请再次输入密码" />
        </div>
        <button type="submit" class="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          注册
        </button>
      </form>
      <p class="text-center mt-4 text-sm text-gray-400">
        已有账号？<NuxtLink to="/login" class="text-green-500 hover:underline">登录</NuxtLink>
      </p>
    </div>
  </div>
</template>
