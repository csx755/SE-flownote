<template>
  <div class="min-h-screen bg-background">
    <AppNav />
    <div class="flex items-center justify-center min-h-[calc(100vh-57px)]">
      <div class="w-full max-w-md p-8 bg-card rounded-lg border">
        <h1 class="text-2xl font-bold text-center mb-6">登录</h1>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm mb-1">邮箱</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入邮箱" />
          </div>
          <div>
            <label class="block text-sm mb-1">密码</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入密码" />
          </div>
          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
          <button type="submit" :disabled="loading" class="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        <p class="text-center mt-4 text-sm text-gray-400">
          还没有账号？<NuxtLink to="/register" class="text-green-500 hover:underline">注册</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { login } = useAuth()
const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await login(form.email, form.password)
    navigateTo('/')
  } catch (e) {
    if (e.data?.details) {
      error.value = e.data.details.map(d => d.message).join('；')
    } else {
      error.value = e.data?.error || '登录失败'
    }
  } finally {
    loading.value = false
  }
}
</script>
