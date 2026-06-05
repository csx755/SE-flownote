export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie('auth-token')

  const api = $fetch.create({
    baseURL: config.public.apiBase || 'http://localhost:3000',
    headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
  })

  return api
}
