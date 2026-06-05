<template>
  <div class="min-h-screen bg-background">
    <AppNav />
    <div class="flex items-center justify-center min-h-[calc(100vh-57px)]">
      <div class="w-full max-w-md p-8 bg-card rounded-lg border">
        <h1 class="text-2xl font-bold text-center mb-6">注册</h1>
        <form class="space-y-4" @submit.prevent="handleRegister">
          <div>
            <label class="block text-sm mb-1">用户名</label>
            <input v-model="form.username" type="text" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入用户名" />
          </div>
          <div>
            <label class="block text-sm mb-1">邮箱</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入邮箱" />
          </div>
          <div>
            <label class="block text-sm mb-1">密码</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请输入密码" />
          </div>
          <div>
            <label class="block text-sm mb-1">确认密码</label>
            <input v-model="form.confirmPassword" type="password" class="w-full px-3 py-2 bg-background border rounded-lg" placeholder="请再次输入密码" />
          </div>
          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
          <button type="submit" :disabled="loading" class="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
        <p class="text-center mt-4 text-sm text-gray-400">
          已有账号？<NuxtLink to="/login" class="text-green-500 hover:underline">登录</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { register } = useAuth()
const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  if (form.password !== form.confirmPassword) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  try {
    await register(form.username, form.email, form.password)
    navigateTo('/')
  } catch (e) {
    if (e.data?.details) {
      error.value = e.data.details.map(d => d.message).join('；')
    } else {
      error.value = e.data?.error || '注册失败'
    }
  } finally {
    loading.value = false
  }
}
</script>
