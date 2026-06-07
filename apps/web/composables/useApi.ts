export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie('auth-token')

  const api = $fetch.create({
    baseURL: config.public.apiBase || 'http://localhost:3000',
    // 每次请求读取最新 token，避免 composable 创建时 token 未就绪
    onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        }
      }
    },
    // 401 → 清除登录态，跳转登录页
    onResponseError({ response }) {
      if (response.status === 401) {
        token.value = null
        const user = useState('auth-user', () => null)
        user.value = null
        navigateTo('/login')
      }
    },
  })

  return api
}
